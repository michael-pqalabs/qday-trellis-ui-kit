import { useEffect, useReducer, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouterState } from "@tanstack/react-router";
import {
  Check,
  Copy,
  ExternalLink,
  List,
  MessageSquarePlus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { PinComment } from "@/lib/comments-api";
import { useCommentStore } from "@/lib/comment-store";
import { cn } from "@/lib/utils";

const UI_ATTR = "data-comment-ui";

type Draft = { selector: string; x: number; y: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const isUi = (el: Element | null) => !!el?.closest(`[${UI_ATTR}]`);
const asElement = (target: EventTarget | null) => (target instanceof Element ? target : null);

/** Builds a selector from stable ids where possible, otherwise from tag + nth-of-type. */
function selectorFor(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node !== document.body && node !== document.documentElement) {
    // Generated ids (React useId, Radix) change between renders, so they can't anchor a comment.
    if (
      node.id &&
      !/[:]|^radix-/.test(node.id) &&
      document.querySelectorAll(`#${CSS.escape(node.id)}`).length === 1
    ) {
      parts.unshift(`#${CSS.escape(node.id)}`);
      return parts.join(" > ");
    }
    const current: Element = node;
    const parent: Element | null = current.parentElement;
    const tag = current.tagName.toLowerCase();
    if (!parent) break;
    const index =
      Array.from(parent.children)
        .filter((c) => c.tagName === current.tagName)
        .indexOf(current) + 1;
    parts.unshift(`${tag}:nth-of-type(${index})`);
    node = parent;
  }
  return parts.length ? `body > ${parts.join(" > ")}` : "body";
}

function locate(selector: string, x: number, y: number) {
  let el: Element | null = null;
  try {
    el = document.querySelector(selector);
  } catch {
    return null;
  }
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  return { el, left: rect.left + rect.width * x, top: rect.top + rect.height * y };
}

function Card({ left, top, children }: { left: number; top: number; children: ReactNode }) {
  const width = 288;
  return (
    <div
      role="dialog"
      aria-label="Comment"
      style={{
        left: clamp(left + 14, 8, Math.max(8, window.innerWidth - width - 8)),
        top: clamp(top + 14, 8, Math.max(8, window.innerHeight - 220)),
        width,
      }}
      className="pointer-events-auto fixed z-[100] rounded-2xl border border-border bg-card p-3 text-card-foreground shadow-lg"
    >
      {children}
    </div>
  );
}

function Composer({
  saving,
  onSave,
  onCancel,
}: {
  saving: boolean;
  onSave: (text: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  const submit = () => !saving && text.trim() && onSave(text.trim());
  return (
    <div className="space-y-2">
      <Textarea
        autoFocus
        value={text}
        disabled={saving}
        placeholder="Add a comment…"
        className="min-h-[88px] px-3 py-2"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
        }}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">⌘/Ctrl + Enter</span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" disabled={saving} onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" disabled={saving || !text.trim()} onClick={submit}>
            {saving ? "Saving…" : "Comment"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CommentLayer() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const { comments, mode, add, setResolved, remove } = useCommentStore(mounted);
  const [picking, setPicking] = useState(false);
  const [hoverEl, setHoverEl] = useState<Element | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [, relayout] = useReducer((n: number) => n + 1, 0);

  // Comments are loaded after hydration only.
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setDraft(null);
    setOpenId(null);
    setPicking(false);
    setListOpen(false);
  }, [pathname]);

  // Pins are fixed-positioned, so they are re-measured whenever the page moves or changes.
  useEffect(() => {
    if (!mounted) return;
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(relayout);
    };
    const mutations = new MutationObserver((records) => {
      if (records.some((r) => !isUi(asElement(r.target)))) schedule();
    });
    mutations.observe(document.body, { childList: true, subtree: true });
    const resize = new ResizeObserver(schedule);
    resize.observe(document.body);
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      resize.disconnect();
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, [mounted]);

  // Pick mode: highlight the hovered element and turn the next click into a draft comment.
  useEffect(() => {
    if (!picking) {
      setHoverEl(null);
      return;
    }
    document.documentElement.classList.add("comment-picking");
    const onMove = (e: PointerEvent) => {
      const target = asElement(e.target);
      const root = document.documentElement;
      setHoverEl(target && target !== root && !isUi(target) ? target : null);
    };
    // The page must not react while picking (links, buttons, menus opening on pointerdown…).
    const block = (e: Event) => {
      if (isUi(asElement(e.target))) return;
      e.preventDefault();
      e.stopPropagation();
    };
    const onClick = (e: MouseEvent) => {
      const target = asElement(e.target);
      if (!target || isUi(target)) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = target.getBoundingClientRect();
      setDraft({
        selector: selectorFor(target),
        x: rect.width ? clamp((e.clientX - rect.left) / rect.width, 0, 1) : 0.5,
        y: rect.height ? clamp((e.clientY - rect.top) / rect.height, 0, 1) : 0.5,
      });
      setOpenId(null);
      setListOpen(false);
      setPicking(false);
    };
    const blocked = ["pointerdown", "pointerup", "mousedown", "mouseup"];
    document.addEventListener("pointermove", onMove, true);
    blocked.forEach((type) => document.addEventListener(type, block, true));
    document.addEventListener("click", onClick, true);
    return () => {
      document.documentElement.classList.remove("comment-picking");
      document.removeEventListener("pointermove", onMove, true);
      blocked.forEach((type) => document.removeEventListener(type, block, true));
      document.removeEventListener("click", onClick, true);
    };
  }, [picking]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setPicking(false);
      setDraft(null);
      setOpenId(null);
      setListOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!mounted) return null;

  const pageComments = comments
    .filter((c) => c.route === pathname)
    .sort((a, b) => a.createdAt - b.createdAt);
  const openCount = pageComments.filter((c) => !c.resolved).length;
  const numberOf = (id: string) => pageComments.findIndex((c) => c.id === id) + 1;
  const opened = pageComments.find((c) => c.id === openId) ?? null;
  const openedAt = opened && locate(opened.selector, opened.x, opened.y);
  const draftAt = draft && locate(draft.selector, draft.x, draft.y);
  const hoverRect = hoverEl?.getBoundingClientRect();

  const save = async (text: string) => {
    if (!draft) return;
    setSaving(true);
    const saved = await add({ route: pathname, ...draft, text });
    setSaving(false);
    // On failure the draft stays open so the text isn't lost.
    if (!saved) return;
    setDraft(null);
    setOpenId(saved.id);
  };

  const focusComment = (c: PinComment) => {
    setDraft(null);
    setOpenId(c.id);
    setListOpen(false);
    locate(c.selector, c.x, c.y)?.el.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  const copyOpen = async () => {
    const open = pageComments.filter((c) => !c.resolved);
    const payload = open.map(({ route, selector, x, y, text }) => ({
      route,
      selector,
      x,
      y,
      text,
    }));
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success(`Copied ${open.length} open comment${open.length === 1 ? "" : "s"}`);
    } catch {
      toast.error("Could not copy to the clipboard");
    }
  };

  const pinStyle =
    "pointer-events-auto fixed z-[100] grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-card bg-primary text-[11px] font-semibold text-primary-foreground shadow-md transition-transform hover:scale-110";

  return createPortal(
    <div {...{ [UI_ATTR]: "" }}>
      {picking && hoverRect && (
        <div
          className="pointer-events-none fixed z-[99] rounded-sm border-2 border-primary bg-primary/10"
          style={{
            left: hoverRect.left,
            top: hoverRect.top,
            width: hoverRect.width,
            height: hoverRect.height,
          }}
        />
      )}
      {picking && (
        <div className="pointer-events-none fixed left-1/2 top-3 z-[100] -translate-x-1/2 rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background shadow-lg">
          Click any element to comment · Esc to cancel
        </div>
      )}

      {pageComments.map((c) => {
        const at = locate(c.selector, c.x, c.y);
        if (!at) return null;
        return (
          <button
            key={c.id}
            type="button"
            aria-label={`Comment ${numberOf(c.id)}${c.resolved ? " (resolved)" : ""}`}
            style={{ left: at.left, top: at.top }}
            className={cn(
              pinStyle,
              c.resolved && "bg-muted text-muted-foreground opacity-70",
              openId === c.id && "ring-4 ring-primary/25",
            )}
            onClick={() => {
              setDraft(null);
              setOpenId(openId === c.id ? null : c.id);
            }}
          >
            {c.resolved ? <Check className="size-3.5" /> : numberOf(c.id)}
          </button>
        );
      })}

      {draft && draftAt && (
        <>
          <span
            style={{ left: draftAt.left, top: draftAt.top }}
            className={cn(pinStyle, "pointer-events-none")}
          >
            <MessageSquarePlus className="size-3.5" />
          </span>
          <Card left={draftAt.left} top={draftAt.top}>
            <Composer saving={saving} onSave={save} onCancel={() => setDraft(null)} />
          </Card>
        </>
      )}

      {opened && openedAt && (
        <Card left={openedAt.left} top={openedAt.top}>
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="whitespace-pre-wrap break-words text-sm">{opened.text}</p>
              <Button
                size="icon"
                variant="ghost"
                className="-mr-1 -mt-1 size-7 shrink-0"
                aria-label="Close"
                onClick={() => setOpenId(null)}
              >
                <X />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(opened.createdAt).toLocaleString()}
              {opened.resolved ? " · Resolved" : ""}
              {opened.url && (
                <>
                  {" · "}
                  <a
                    href={opened.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-primary"
                  >
                    GitHub
                    <ExternalLink className="size-3" />
                  </a>
                </>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  void remove(opened.id);
                  setOpenId(null);
                }}
              >
                <Trash2 />
                Delete
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void setResolved(opened.id, !opened.resolved)}
              >
                {opened.resolved ? (
                  <>
                    <RotateCcw />
                    Reopen
                  </>
                ) : (
                  <>
                    <Check />
                    Resolve
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="pointer-events-auto fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2">
        {listOpen && (
          <div className="w-72 rounded-2xl border border-border bg-card p-2 text-card-foreground shadow-lg">
            <div className="flex items-center justify-between px-2 py-1">
              <p className="text-sm font-semibold">This page · {openCount} open</p>
              <Button size="sm" variant="ghost" disabled={!openCount} onClick={copyOpen}>
                <Copy />
                Copy open
              </Button>
            </div>
            <p className="px-2 pb-1 text-xs text-muted-foreground">
              {mode === "remote"
                ? "Synced with GitHub Issues"
                : mode === "local"
                  ? "Saved in this browser only (no GitHub token configured)"
                  : "Loading…"}
            </p>
            {pageComments.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                No comments yet. Use Comment to add one.
              </p>
            ) : (
              <ul className="max-h-64 overflow-y-auto">
                {pageComments.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left hover:bg-secondary"
                      onClick={() => focusComment(c)}
                    >
                      <span
                        className={cn(
                          "grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground",
                          c.resolved && "bg-muted text-muted-foreground",
                        )}
                      >
                        {numberOf(c.id)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "line-clamp-2 text-sm",
                            c.resolved && "text-muted-foreground line-through",
                          )}
                        >
                          {c.text}
                        </span>
                        {!locate(c.selector, c.x, c.y) && (
                          <span className="block text-xs text-destructive">
                            Element not found on this page
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            aria-label="Comments on this page"
            aria-expanded={listOpen}
            onClick={() => setListOpen((v) => !v)}
          >
            <List />
            {openCount > 0 && <span>{openCount}</span>}
          </Button>
          <Button
            variant={picking ? "default" : "outline"}
            aria-pressed={picking}
            onClick={() => {
              setPicking((v) => !v);
              setDraft(null);
              setOpenId(null);
              setListOpen(false);
            }}
          >
            <MessageSquarePlus />
            {picking ? "Cancel" : "Comment"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
