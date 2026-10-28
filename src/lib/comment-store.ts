import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  createComment,
  deleteComment,
  listComments,
  setCommentResolved,
  type PinComment,
} from "@/lib/comments-api";

const STORAGE_KEY = "trellis-comments-v1";

export type NewComment = Pick<PinComment, "route" | "selector" | "x" | "y" | "text">;
/** "remote": stored as GitHub Issues. "local": no server token, so this browser only. */
export type StoreMode = "loading" | "remote" | "local";

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadLocal(): PinComment[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c): c is PinComment =>
        !!c &&
        typeof c.id === "string" &&
        typeof c.route === "string" &&
        typeof c.selector === "string" &&
        typeof c.text === "string",
    );
  } catch {
    return [];
  }
}

function saveLocal(list: PinComment[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* Persistence is optional. */
  }
}

export function useCommentStore(enabled: boolean) {
  const [comments, setComments] = useState<PinComment[]>([]);
  const [mode, setMode] = useState<StoreMode>("loading");
  const modeRef = useRef<StoreMode>("loading");
  const failedLoad = useRef(false);

  const applyMode = (next: StoreMode) => {
    modeRef.current = next;
    setMode(next);
  };

  const refresh = useCallback(async () => {
    try {
      const result = await listComments();
      failedLoad.current = false;
      if (result.configured) {
        applyMode("remote");
        setComments(result.comments);
      } else {
        applyMode("local");
        setComments(loadLocal());
      }
    } catch {
      // Keep whatever is on screen; only tell the user once per outage.
      if (!failedLoad.current) toast.error("Could not load comments from GitHub");
      failedLoad.current = true;
      if (modeRef.current === "loading") applyMode("local");
    }
  }, []);

  // Comments are read after hydration only, and again whenever the tab regains focus
  // so changes made on another machine show up without a manual reload.
  useEffect(() => {
    if (!enabled) return;
    void refresh();
    const onVisible = () => document.visibilityState === "visible" && void refresh();
    const onStorage = (e: StorageEvent) =>
      e.key === STORAGE_KEY && modeRef.current === "local" && setComments(loadLocal());
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("storage", onStorage);
    };
  }, [enabled, refresh]);

  const mutateLocal = (next: (list: PinComment[]) => PinComment[]) =>
    setComments((list) => {
      const result = next(list);
      saveLocal(result);
      return result;
    });

  /** Resolves with the saved comment, or null if it could not be saved. */
  const add = async (input: NewComment): Promise<PinComment | null> => {
    if (modeRef.current !== "remote") {
      const comment: PinComment = { id: newId(), ...input, resolved: false, createdAt: Date.now() };
      mutateLocal((list) => [...list, comment]);
      return comment;
    }
    try {
      const comment = await createComment({ data: input });
      setComments((list) => [...list, comment]);
      return comment;
    } catch {
      toast.error("Could not save the comment to GitHub");
      return null;
    }
  };

  // Resolve and delete update the screen first and roll back if GitHub rejects the change.
  const optimistic = async (
    next: (list: PinComment[]) => PinComment[],
    remote: () => Promise<unknown>,
    failure: string,
  ) => {
    if (modeRef.current !== "remote") return mutateLocal(next);
    let previous: PinComment[] = [];
    setComments((list) => {
      previous = list;
      return next(list);
    });
    try {
      await remote();
    } catch {
      setComments(previous);
      toast.error(failure);
    }
  };

  const setResolved = (id: string, resolved: boolean) =>
    optimistic(
      (list) => list.map((c) => (c.id === id ? { ...c, resolved } : c)),
      () => setCommentResolved({ data: { id, resolved } }),
      "Could not update the comment on GitHub",
    );

  const remove = (id: string) =>
    optimistic(
      (list) => list.filter((c) => c.id !== id),
      () => deleteComment({ data: { id } }),
      "Could not delete the comment on GitHub",
    );

  return { comments, mode, add, setResolved, remove };
}
