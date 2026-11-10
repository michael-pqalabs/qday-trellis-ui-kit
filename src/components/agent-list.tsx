import { useStableToken } from "@/components/wallet-preview-provider";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Plus, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RevocationNotice } from "@/components/revoke-agent-dialog";
import { canRequestSession, type RegisteredAgent } from "@/lib/qpass";

const formatDate = (at: number) =>
  new Date(at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

/**
 * A registered (linked) agent. It has at most one spending session, and may have none yet: only an
 * agent with a session offers View Spending Session. Revoke unregisters the agent. An agent with no
 * usable session gets a session in one of two ways: the owner creates it here (`onCreateSession`),
 * or the agent asks from its terminal and the owner approves it in the Spending Sessions tab
 * (`requested` says such a request is waiting). `onSimulateSession` (preview only) stands in for the
 * terminal.
 */
export function AgentCard({
  agent,
  now,
  onRevoke,
  onCreateSession,
  onSimulateSession,
  requested = false,
  index = 0,
  chainId,
}: {
  agent: RegisteredAgent;
  now: number;
  onRevoke: (id: string) => void;
  /** Create a session for this agent here, without waiting for a terminal request. */
  onCreateSession?: (id: string) => void;
  /** Preview only: pretend the agent's terminal asks for a session. */
  onSimulateSession?: (id: string) => void;
  /** A session request from this agent is waiting for approval. */
  requested?: boolean;
  index?: number;
  /** Blockchain of the agent's SignetPass; the active one when omitted. */
  chainId?: string;
}) {
  const { stable } = useStableToken(chainId);
  const { session } = agent;
  const revoking = agent.status === "revoking";
  return (
    <div
      style={{ "--i": index } as React.CSSProperties}
      className="animate-stagger mb-3 rounded-2xl border bg-card p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-semibold">{agent.name}</p>
        {revoking ? (
          <Badge
            variant="outline"
            className="shrink-0 border-amber-500/30 text-amber-600 dark:text-amber-400"
          >
            Revoking
          </Badge>
        ) : (
          <Badge variant="outline" className="text-primary">
            Linked
          </Badge>
        )}
      </div>
      <p className="mt-2 break-all font-mono text-[10px] text-muted-foreground">
        Agent ID · {agent.id}
      </p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{agent.client}</p>
      {agent.vendor && (
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{agent.vendor}</p>
      )}
      {session && (
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>
              Spent {session.spent} / {session.totalBudget} {stable}
            </span>
            <span className="capitalize">
              {session.status === "active" && session.expiresAt <= now ? "Expired" : session.status}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="animate-bar-grow h-full rounded-full bg-primary"
              style={{ width: `${Math.min(100, (session.spent / session.totalBudget) * 100)}%` }}
            />
          </div>
        </div>
      )}
      <RevocationNotice agent={agent} />
      {canRequestSession(agent, now) &&
        (requested ? (
          <p
            role="status"
            className="mt-3 flex items-center gap-1.5 rounded-xl bg-primary/5 px-3 py-2 text-[11px] text-primary"
          >
            <Clock className="h-3.5 w-3.5 shrink-0" />
            Session requested. Review it in the Spending Sessions tab.
          </p>
        ) : (
          <>
            {!session && (
              <p className="mt-3 text-[11px] text-muted-foreground">
                No spending session yet. Create one here, or the agent can ask for one from its
                terminal.
              </p>
            )}
            {onCreateSession && (
              <Button className="mt-2 h-10 w-full" onClick={() => onCreateSession(agent.id)}>
                <Plus />
                Create spending session
              </Button>
            )}
            {onSimulateSession && (
              <Button
                variant="outline"
                className="mt-2 h-9 w-full border-dashed text-xs"
                onClick={() => onSimulateSession(agent.id)}
              >
                <Terminal />
                Preview: agent requests a session
              </Button>
            )}
          </>
        ))}
      <div className="mt-3 flex items-center gap-2 rounded-full bg-secondary/70 p-1">
        {session && (
          <Button
            asChild
            variant="ghost"
            className="h-9 min-w-0 flex-1 rounded-full px-3 text-xs hover:bg-card"
          >
            <Link to="/agentic/agent/$agentId" params={{ agentId: agent.id }}>
              View Spending Session
              <ArrowRight />
            </Link>
          </Button>
        )}
        <Button
          variant="outline"
          className={`h-9 shrink-0 rounded-full border-destructive/40 bg-card px-4 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive ${session ? "" : "w-full"}`}
          aria-label={`Revoke ${agent.name}`}
          disabled={revoking}
          onClick={() => onRevoke(agent.id)}
        >
          {revoking ? "Revoking…" : agent.revokeFailedAt ? "Try again" : "Revoke"}
        </Button>
      </div>
    </div>
  );
}

/** A previously revoked agent, listed under History with the date it was revoked. */
export function RevokedAgentCard({ agent }: { agent: RegisteredAgent }) {
  return (
    <div className="mb-3 rounded-2xl border bg-card/60 p-4 opacity-80">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-semibold text-muted-foreground">{agent.name}</p>
        <Badge variant="outline" className="shrink-0 text-muted-foreground">
          Revoked
        </Badge>
      </div>
      <p className="mt-2 break-all font-mono text-[10px] text-muted-foreground">
        Agent ID · {agent.id}
      </p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{agent.client}</p>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Revoked{agent.revokedAt ? ` on ${formatDate(agent.revokedAt)}` : ""}
      </p>
    </div>
  );
}
