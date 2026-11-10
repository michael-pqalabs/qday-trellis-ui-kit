import { feeTokenFor } from "@/lib/wallet-preview";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Ban, Bot, Clock, Copy, KeyRound, Plus, Terminal, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { QDayEntry } from "@/components/qday-entry";
import { RevocationNotice, RevokeAgentDialog } from "@/components/revoke-agent-dialog";
import { useRevocationWatcher } from "@/hooks/use-revocation-watcher";
import {
  canRequestSession,
  createSpendingSession,
  loadQPassState,
  pendingRequestFor,
  revokeSession,
  type ApprovalLimits,
  type QPassState,
} from "@/lib/qpass";
import { CreateSessionDialog } from "@/components/create-session-dialog";

export const Route = createFileRoute("/agentic_/agent/$agentId")({
  head: () => ({
    meta: [
      { title: "Agent & Spending Session — Trellis Wallet" },
      {
        name: "description",
        content:
          "Review an agent linked to your SignetPass: budget used, per-payment limit, session expiry, and end-session or revoke controls.",
      },
      { property: "og:title", content: "Agent & Spending Session — Trellis Wallet" },
      {
        property: "og:description",
        content: "Budget, limits and revoke controls for an agent on your SignetPass.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <QDayEntry>
      <AgentDetail />
    </QDayEntry>
  ),
});

const short = (v: string) => (v.length > 14 ? `${v.slice(0, 8)}…${v.slice(-4)}` : v);
function remaining(ms: number) {
  if (ms <= 0) return "Expired";
  const d = Math.floor(ms / 86400000),
    h = Math.floor((ms % 86400000) / 3600000),
    m = Math.floor((ms % 3600000) / 60000);
  return d > 0 ? `${d}d ${h}h left` : h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}
type Confirm = "session" | null;

function AgentDetail() {
  const { agentId } = Route.useParams();
  const [state, setState] = useState<QPassState | null>(null);
  const [now, setNow] = useState(0);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  useEffect(() => {
    setState(loadQPassState());
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useRevocationWatcher(state, setState);
  if (!state) return <main className="mx-auto min-h-dvh max-w-md px-5 pt-6" />;
  const agent = state.agents.find((a) => a.id === agentId);
  const pass = state.passes.find((p) => p.id === agent?.passId);
  // Amounts use the stablecoin of the blockchain this agent's SignetPass lives on.
  const stable = feeTokenFor(pass?.chainId ?? "base");
  if (!agent)
    return (
      <main className="mx-auto min-h-dvh max-w-md px-5 pt-6">
        <BackLink />
        <p className="mt-10 text-center text-sm text-muted-foreground">
          This agent no longer exists.
        </p>
      </main>
    );

  const s = agent.session;
  const expired = !!s && s.expiresAt <= now;
  const sessionLabel = !s
    ? "No session"
    : s.status === "revoked"
      ? "Revoked"
      : expired
        ? "Expired"
        : "Active";
  const pct = s ? Math.min(100, (s.spent / s.totalBudget) * 100) : 0;
  const canControl = agent.status === "linked" && !!s && s.status !== "revoked" && !expired;
  const copy = (v: string) => {
    void navigator.clipboard?.writeText(v);
    toast.success("Copied");
  };
  const createSession = (limits: ApprovalLimits, taskSummary: string) => {
    setState(createSpendingSession(agent.id, limits, Date.now(), taskSummary));
    setCreateOpen(false);
    toast.success("Spending session created", {
      description: `${agent.name} can now pay up to ${limits.totalBudget} ${stable}. It is listed in Spending Sessions History. Preview only: nothing was sent.`,
    });
  };
  const requested = !!pendingRequestFor(state, agent, now);
  const doConfirm = () => {
    if (confirm === "session") {
      setState(revokeSession(agent.id));
      toast.success("Spending session revoked");
    }
    setConfirm(null);
  };
  const tone =
    sessionLabel === "Active"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : "text-muted-foreground";
  const sample = s
    ? [0.62, 0.23, 0.15]
        .map((f, i) => ({
          id: i,
          amount: +(s.spent * f).toFixed(2),
          at: s.startedAt + (i + 1) * 3600000 * 5,
        }))
        .filter((x) => x.amount > 0)
    : [];

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 pb-12 pt-6">
      <BackLink />
      <section className="mt-5 flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Bot className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-semibold">View Spending Session</h1>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Terminal className="h-3 w-3" />
            {agent.name} · {agent.client}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`rounded-full ${agent.status === "linked" ? "text-primary" : agent.status === "revoking" ? "border-amber-500/30 text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
        >
          {agent.status === "linked"
            ? "Linked"
            : agent.status === "revoking"
              ? "Revoking"
              : "Revoked"}
        </Badge>
      </section>

      <section className="mt-6 rounded-2xl bg-card p-5 shadow-card" aria-label="Budget">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Session budget</p>
          <Badge variant="outline" className={`rounded-full ${tone}`}>
            {sessionLabel}
          </Badge>
        </div>
        {s ? (
          <>
            <p className="mt-3 font-display text-3xl font-semibold tabular-nums">
              {s.spent.toFixed(2)}{" "}
              <span className="text-base font-medium text-muted-foreground">
                / {s.totalBudget} {stable}
              </span>
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full ${pct >= 100 ? "bg-destructive" : "bg-primary"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {pct >= 100
                ? "Budget fully used — new payments will be declined."
                : `${(s.totalBudget - s.spent).toFixed(2)} ${stable} remaining`}
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No spending session has been granted.
          </p>
        )}
        {canRequestSession(agent, now) &&
          (requested ? (
            <p className="mt-4 rounded-xl bg-primary/5 px-3 py-2 text-xs text-primary">
              Session requested. Review it in the Spending Sessions tab.
            </p>
          ) : (
            <Button className="mt-4 h-11 w-full" onClick={() => setCreateOpen(true)}>
              <Plus />
              Create spending session
            </Button>
          ))}
      </section>

      {s && (
        <section
          className="mt-4 rounded-2xl bg-card px-5 py-1 shadow-card"
          aria-label="Permission scope"
        >
          <Row label="Per-payment limit" value={`${s.perPaymentLimit} ${stable}`} />
          <Row
            label="Session expiry"
            value={
              <span className={`flex items-center gap-1 ${expired ? "text-destructive" : ""}`}>
                <Clock className="h-3 w-3" />
                {s.status === "revoked" ? "—" : remaining(s.expiresAt - now)}
              </span>
            }
          />
          <Row label="Task" value={s.taskSummary ?? "No summary provided"} />
          <Row label="Started" value={new Date(s.startedAt).toLocaleDateString()} />
          <Row
            label="Session key"
            value={<CopyVal v={s.id} onCopy={copy} icon={<KeyRound className="h-3 w-3" />} />}
          />
          {agent.vendor && <Row label="Agent" value={agent.vendor} />}
          <Row label="Agent ID" value={<CopyVal v={agent.id} onCopy={copy} />} />
          <Row
            label="Paid from"
            value={
              <span className="flex items-center gap-1">
                <Wallet className="h-3 w-3" />
                {pass?.name ?? "SignetPass"}
              </span>
            }
            last
          />
        </section>
      )}

      {canControl && (
        <div className="mt-5">
          <Button
            variant="secondary"
            className="h-11 w-full text-destructive hover:text-destructive"
            onClick={() => setConfirm("session")}
          >
            <Ban />
            End session
          </Button>
        </div>
      )}

      {s && (
        <section className="mt-7" aria-label="Payments">
          <h2 className="mb-1 text-sm font-semibold">Payments in this session</h2>
          <p className="mb-2 text-[11px] text-muted-foreground">
            Sample rows for layout review, not on-chain records.
          </p>
          {sample.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No payments yet</p>
          ) : (
            sample.map((x) => (
              <div
                key={x.id}
                className="flex items-center justify-between border-b border-divider py-3 text-xs last:border-0"
              >
                <span className="text-muted-foreground">
                  {new Date(x.at).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="font-medium tabular-nums">
                  −{x.amount.toFixed(2)} {stable}
                </span>
              </div>
            ))
          )}
        </section>
      )}

      {agent.status !== "revoked" && (
        <section className="mt-8 border-t border-divider pt-5">
          <RevocationNotice agent={agent} />
          <Button
            variant="destructive"
            className="mt-3 h-11 w-full"
            disabled={agent.status === "revoking"}
            onClick={() => setRevokeOpen(true)}
          >
            <Ban />
            {agent.status === "revoking"
              ? "Revoking…"
              : agent.revokeFailedAt
                ? "Try revoking again"
                : "Revoke agent access"}
          </Button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Unlinks the agent and stops its session. CLI logins are not affected.
          </p>
        </section>
      )}

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End spending session?</AlertDialogTitle>
            <AlertDialogDescription>
              {`${agent.name} stays linked but can't pay until a new session is created here or approved from the terminal.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={doConfirm}
            >
              End session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <CreateSessionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        agentName={agent.name}
        agentVendor={agent.vendor}
        passName={pass?.name ?? "this SignetPass"}
        chainId={pass?.chainId}
        passActive={pass?.status === "active"}
        onCreate={createSession}
      />
      <RevokeAgentDialog
        agent={agent}
        passName={pass?.name ?? "this SignetPass"}
        open={revokeOpen}
        onOpenChange={setRevokeOpen}
        onSubmitted={setState}
      />
    </main>
  );
}
function BackLink() {
  return (
    <Link
      to="/agentic"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      SignetPass
    </Link>
  );
}
function Row({ label, value, last }: { label: string; value: React.ReactNode; last?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 py-3 text-xs ${last ? "" : "border-b border-divider"}`}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate font-medium">{value}</span>
    </div>
  );
}
function CopyVal({
  v,
  onCopy,
  icon,
}: {
  v: string;
  onCopy: (v: string) => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onCopy(v)}
      className="flex items-center gap-1 font-mono hover:text-primary"
      aria-label={`Copy ${v}`}
    >
      {icon}
      {short(v)}
      <Copy className="h-3 w-3" />
    </button>
  );
}
