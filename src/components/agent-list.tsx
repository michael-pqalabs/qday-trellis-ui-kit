import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RevocationNotice } from "@/components/revoke-agent-dialog";
import type { RegisteredAgent } from "@/lib/qpass";

const formatDate = (at: number) =>
  new Date(at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

/**
 * A registered (linked) agent. It has at most one spending session, and may have none yet: only an
 * agent with a session offers View Spending Session. Revoke unregisters the agent.
 */
export function AgentCard({
  agent,
  now,
  onRevoke,
  index = 0,
}: {
  agent: RegisteredAgent;
  now: number;
  onRevoke: (id: string) => void;
  index?: number;
}) {
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
      {session && (
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>
              Spent {session.spent} / {session.totalBudget} USD8
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
