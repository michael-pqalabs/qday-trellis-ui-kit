import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Review comments stored as GitHub Issues. One issue per comment, labelled `ui-comment`:
 *  - open issue            → open comment
 *  - closed as completed   → resolved comment
 *  - closed as not planned → deleted comment (the REST API cannot delete issues)
 * The token stays on the server; the browser only calls these server functions.
 */

export type PinComment = {
  id: string;
  route: string;
  /** CSS selector of the element the comment is attached to. */
  selector: string;
  /** Click position inside that element, as a 0–1 fraction of its width/height. */
  x: number;
  y: number;
  text: string;
  resolved: boolean;
  createdAt: number;
  /** Set for comments stored on GitHub. */
  url?: string;
};

export type CommentList = { configured: boolean; comments: PinComment[] };

const LABEL = "ui-comment";
const MARKER = "trellis-comment";
const MAX_PAGES = 3;

const createSchema = z.object({
  route: z.string().min(1).max(300),
  selector: z.string().min(1).max(600),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  text: z.string().trim().min(1).max(2000),
});

const updateSchema = z.object({ id: z.string().regex(/^\d+$/), resolved: z.boolean() });
const deleteSchema = z.object({ id: z.string().regex(/^\d+$/) });

type GithubIssue = {
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  state_reason?: string | null;
  html_url: string;
  created_at: string;
  labels: Array<string | { name?: string }>;
  pull_request?: unknown;
};

function config() {
  const token = process.env["GITHUB_TOKEN"]?.trim();
  if (!token) return null;
  return {
    token,
    repo: process.env["GITHUB_REPO"]?.trim() || "michael-pqalabs/qday-trellis-ui-kit",
    api: process.env["GITHUB_API_URL"]?.trim() || "https://api.github.com",
  };
}

async function github<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cfg = config();
  if (!cfg) throw new Error("GITHUB_TOKEN is not set");
  const response = await fetch(`${cfg.api}/repos/${cfg.repo}${path}`, {
    ...init,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${cfg.token}`,
      "content-type": "application/json",
      "user-agent": "trellis-ui-kit-comments",
      "x-github-api-version": "2022-11-28",
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub ${response.status} on ${init.method ?? "GET"} ${path}`);
  }
  return (await response.json()) as T;
}

// The metadata rides in an HTML comment so the issue body stays readable on GitHub.
// "<" and ">" are escaped so user text can never close the comment early.
function encodeMeta(meta: Pick<PinComment, "route" | "selector" | "x" | "y" | "text">) {
  const json = JSON.stringify(meta).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
  return `<!-- ${MARKER} ${json} -->`;
}

function decodeMeta(body: string | null) {
  const match = body?.match(new RegExp(`<!-- ${MARKER} (\\{.*\\}) -->`));
  if (!match?.[1]) return null;
  const parsed = createSchema.safeParse(JSON.parse(match[1]));
  return parsed.success ? parsed.data : null;
}

function toComment(issue: GithubIssue): PinComment | null {
  let meta: ReturnType<typeof decodeMeta> = null;
  try {
    meta = decodeMeta(issue.body);
  } catch {
    return null;
  }
  if (!meta || issue.pull_request) return null;
  if (issue.state === "closed" && issue.state_reason === "not_planned") return null;
  return {
    id: String(issue.number),
    ...meta,
    resolved: issue.state === "closed",
    createdAt: Date.parse(issue.created_at),
    url: issue.html_url,
  };
}

function issueBody(meta: z.infer<typeof createSchema>) {
  // Zero-width space after "@" so a comment never pings people on GitHub.
  const text = meta.text.replace(/@/g, "@\u200b");
  return [
    encodeMeta(meta),
    "",
    text,
    "",
    "---",
    `Route: \`${meta.route}\``,
    `Element: \`${meta.selector.replace(/`/g, "'")}\``,
    `Position: ${Math.round(meta.x * 100)}% / ${Math.round(meta.y * 100)}%`,
    "",
    "_Created from the Trellis UI kit comment tool._",
  ].join("\n");
}

async function assertCommentIssue(id: string) {
  const issue = await github<GithubIssue>(`/issues/${id}`);
  const isComment = issue.labels.some((l) => (typeof l === "string" ? l : l.name) === LABEL);
  // These endpoints must never touch unrelated issues or pull requests.
  if (!isComment || issue.pull_request) throw new Error("Not a UI comment");
}

export const listComments = createServerFn({ method: "GET" }).handler(
  async (): Promise<CommentList> => {
    if (!config()) return { configured: false, comments: [] };
    const comments: PinComment[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const issues = await github<GithubIssue[]>(
        `/issues?labels=${LABEL}&state=all&per_page=100&page=${page}`,
      );
      for (const issue of issues) {
        const comment = toComment(issue);
        if (comment) comments.push(comment);
      }
      if (issues.length < 100) break;
    }
    return { configured: true, comments };
  },
);

export const createComment = createServerFn({ method: "POST" })
  .validator(createSchema)
  .handler(async ({ data }): Promise<PinComment> => {
    const title = `UI comment: ${data.text.replace(/\s+/g, " ").slice(0, 70)}`;
    const issue = await github<GithubIssue>("/issues", {
      method: "POST",
      body: JSON.stringify({ title, body: issueBody(data), labels: [LABEL] }),
    });
    const comment = toComment(issue);
    if (!comment) throw new Error("GitHub returned an unreadable issue");
    return comment;
  });

export const setCommentResolved = createServerFn({ method: "POST" })
  .validator(updateSchema)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await assertCommentIssue(data.id);
    await github(`/issues/${data.id}`, {
      method: "PATCH",
      body: JSON.stringify(
        data.resolved
          ? { state: "closed", state_reason: "completed" }
          : { state: "open", state_reason: "reopened" },
      ),
    });
    return { ok: true };
  });

export const deleteComment = createServerFn({ method: "POST" })
  .validator(deleteSchema)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await assertCommentIssue(data.id);
    await github(`/issues/${data.id}`, {
      method: "PATCH",
      body: JSON.stringify({ state: "closed", state_reason: "not_planned" }),
    });
    return { ok: true };
  });
