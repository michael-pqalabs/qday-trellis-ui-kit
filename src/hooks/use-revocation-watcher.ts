import { useEffect } from "react";
import { toast } from "sonner";
import { loadQPassState, type QPassState } from "@/lib/qpass";

/**
 * While any agent is revoking, re-reads the store so the pending state settles on screen, and
 * announces how each revocation ended.
 */
export function useRevocationWatcher(
  state: QPassState | null,
  setState: (state: QPassState) => void,
) {
  const revoking =
    state?.agents
      .filter((a) => a.status === "revoking")
      .map((a) => a.id)
      .join(",") ?? "";
  useEffect(() => {
    if (!revoking) return;
    const ids = revoking.split(",");
    const timer = setInterval(() => {
      const next = loadQPassState();
      for (const id of ids) {
        const agent = next.agents.find((a) => a.id === id);
        if (agent?.status === "revoked") toast.success(`${agent.name} · access revoked`);
        else if (agent?.status === "linked")
          toast.error(`${agent.name} · revocation not confirmed`, {
            description: "Access is still active. Try again, or end its spending session.",
          });
      }
      setState(next);
    }, 500);
    return () => clearInterval(timer);
  }, [revoking, setState]);
}
