import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  Bot,
  Check,
  Copy,
  Eye,
  EyeOff,
  Plus,
  ShieldCheck,
  Terminal,
  Pencil,
  WalletCards,
  Clock,
  Ban,
  LogOut,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  ScreenHeader,
  ScreenTitle,
  headerActionClass,
  titleActionClass,
} from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { QDayEntry } from "@/components/qday-entry";
import { useQDayPreview } from "@/components/qday-preview-provider";
import { BottomNav } from "@/components/bottom-nav";
import { AgentCard, RevokedAgentCard } from "@/components/agent-list";
import { CountUp } from "@/components/count-up";
import { RevokeAgentDialog } from "@/components/revoke-agent-dialog";
import { SpendingLimitsEditor } from "@/components/spending-limits-editor";
import { useRevocationWatcher } from "@/hooks/use-revocation-watcher";
import { NetworkSummary } from "@/components/network-picker";
import { useWalletPreview } from "@/components/wallet-preview-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { chainForNetwork, signetPassFee } from "@/lib/wallet-preview";
import {
  activateQPass,
  endCliSession,
  loadQPassState,
  renameQPass,
  isAwaitingCli,
  resolveApproval,
  updateApprovalLimits,
  type ApprovalLimits,
  type QPassState,
  type ApprovalRequest,
  type ActivityKind,
} from "@/lib/qpass";
export const Route = createFileRoute("/agentic")({
  head: () => ({
    meta: [
      { title: "SignetPass Accounts — Trellis Wallet" },
      {
        name: "description",
        content:
          "Manage separate SignetPass accounts, review terminal approvals, linked agents and Signet CLI logins in the Trellis preview.",
      },
      { property: "og:title", content: "SignetPass Accounts — Trellis Wallet" },
      {
        property: "og:description",
        content: "Your SignetPass accounts, agent permissions and terminal sessions in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { pass?: string } =>
    typeof s["pass"] === "string" ? { pass: s["pass"] } : {},
  component: AgenticPage,
});
function AgenticPage() {
  return (
    <QDayEntry>
      <AgenticPayment />
    </QDayEntry>
  );
}
const formatDate = (at: number) =>
  new Date(at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
type Action = "rename" | "activate" | "fund" | "receive" | "logout";
function AgenticPayment() {
  const { update } = useQDayPreview();
  const [state, setState] = useState<QPassState | null>(null);
  const search = Route.useSearch();
  // A SignetPass that was just created arrives as ?pass=<id> and starts selected.
  const [selectedId, setSelectedId] = useState(search.pass ?? "");
  const { networkId } = useWalletPreview();
  const chain = chainForNetwork(networkId);
  const [now, setNow] = useState(0);
  const [visible, setVisible] = useState(true);
  const [action, setAction] = useState<Action | null>(null);
  const [targetId, setTargetId] = useState("");
  const [revokeId, setRevokeId] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [request, setRequest] = useState<ApprovalRequest | null>(null);
  useEffect(() => {
    const loaded = loadQPassState();
    setState(loaded);
    setSelectedId(search.pass ?? loaded.passes[0]?.id ?? "");
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [search.pass]);
  const pass = state?.passes.find((p) => p.id === selectedId) ?? state?.passes[0];
  const approvals = state?.approvals.filter((r) => r.passId === pass?.id) ?? [];
  const pending = approvals.filter((r) => r.status === "pending" && r.expiresAt > now);
  const passAgents = state?.agents.filter((a) => a.passId === pass?.id) ?? [];
  const agents = passAgents.filter((a) => a.status !== "revoked");
  const revokedAgents = passAgents
    .filter((a) => a.status === "revoked")
    .sort((a, b) => (b.revokedAt ?? 0) - (a.revokedAt ?? 0));
  useRevocationWatcher(state, setState);
  const activity = state?.activity.filter((a) => a.passId === pass?.id) ?? [];
  const currentRequest = state?.approvals.find((r) => r.id === request?.id);
  const openAction = (value: Action, id = "") => {
    setError("");
    setTargetId(id);
    setName(pass?.name ?? "");
    setAction(value);
  };
  const copy = async () => {
    if (!pass) return;
    try {
      await navigator.clipboard.writeText(pass.address);
      toast.success("Address copied");
    } catch {
      toast.error("Unable to copy. Select the identifier manually.");
    }
  };
  const saveLimits = (values: ApprovalLimits) => {
    if (!currentRequest) return;
    setState(updateApprovalLimits(currentRequest.id, values));
    toast.success("Limits saved", {
      description: "Waiting for the terminal to sign the updated request.",
    });
  };
  const decide = (decision: "approved" | "rejected") => {
    if (!currentRequest) return;
    setState(resolveApproval(currentRequest.id, decision));
    setRequest(null);
    toast.success(decision === "approved" ? "Request approved" : "Request rejected");
  };
  const cliLogins = state ? (
    <>
      {state.cliSessions.length === 0 ? (
        <Empty label="No CLI logins" />
      ) : (
        state.cliSessions.map((s) => (
          <div
            key={s.id}
            className="mb-2 flex items-center gap-3 rounded-2xl border bg-card px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{s.label}</p>
              <p className="mt-1 truncate text-[10px] text-muted-foreground">
                {s.client} · {s.host}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {new Date(s.startedAt).toLocaleDateString()} ·{" "}
                {s.status === "active" ? "Signed in" : "Logged out"}
              </p>
            </div>
            {s.status === "active" && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Logout ${s.label}`}
                title="Logout"
                className="shrink-0 text-destructive"
                onClick={() => openAction("logout", s.id)}
              >
                <LogOut />
              </Button>
            )}
          </div>
        ))
      )}
    </>
  ) : null;
  return (
    <div className="flex min-h-dvh justify-center bg-background">
      <main className="flex min-h-dvh w-full max-w-md flex-col px-5 pb-0 pt-3">
        <NetworkSummary networkId={networkId} />
        <ScreenHeader
          action={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out of Signet preview"
              title="Sign out of Signet"
              className={headerActionClass}
              onClick={() => update((s) => ({ ...s, email: null, completed: 0 }))}
            >
              <LogOut />
            </Button>
          }
        />
        <ScreenTitle
          title="My SignetPasses"
          action={
            <Button
              asChild
              variant="outline"
              size="icon"
              aria-label="Create SignetPass"
              title="Create SignetPass"
              className={titleActionClass}
            >
              <Link to="/agentic/new">
                <Plus />
              </Link>
            </Button>
          }
        />
        {!state ? (
          <Skeleton className="h-60 rounded-2xl" />
        ) : (
          <>
            <div className="mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    aria-label="Select SignetPass"
                    className="h-11 w-full min-w-0 justify-start gap-2.5 bg-card px-3.5 text-[13px] shadow-sm"
                  >
                    <WalletCards className="!h-4 !w-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate text-left">{pass?.name}</span>
                    <span className="shrink-0 text-xs font-normal text-muted-foreground">
                      {state.passes.length}{" "}
                      {state.passes.length === 1 ? "SignetPass" : "SignetPasses"}
                    </span>
                    <ChevronDown className="!h-4 !w-4 shrink-0 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto p-1.5"
                  aria-label="SignetPasses"
                >
                  {state.passes.map((p) => {
                    const selected = p.id === pass?.id;
                    return (
                      <DropdownMenuItem
                        key={p.id}
                        aria-current={selected ? "true" : undefined}
                        onSelect={() => setSelectedId(p.id)}
                        className={`gap-2.5 rounded-lg px-2.5 py-2 ${selected ? "bg-primary/10" : ""}`}
                      >
                        <WalletCards className="!h-4 !w-4 shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium">{p.name}</span>
                          <span className="mt-px block truncate font-mono text-[11px] text-muted-foreground">
                            {p.address.slice(0, 6)}…{p.address.slice(-4)}
                            {p.status === "inactive" ? " · Not activated" : ""}
                          </span>
                        </span>
                        {selected && <Check className="!h-4 !w-4 shrink-0 text-primary" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {pass ? (
              <>
                <section
                  aria-label="SignetPass balance"
                  className="rounded-2xl border border-primary/15 bg-card bg-card-hero px-5 py-4 shadow-card"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1 text-sm font-semibold">
                      <WalletCards className="mr-1 h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate">{pass.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Rename SignetPass"
                        title="Rename SignetPass"
                        className="h-7 w-7 shrink-0"
                        onClick={() => openAction("rename")}
                      >
                        <Pencil />
                      </Button>
                    </span>
                    {pass.status === "active" && (
                      <Button
                        size="sm"
                        className="h-7 shrink-0 gap-1 px-3 text-[11px] shadow-sm shadow-primary/25 [&_svg]:size-3.5"
                        onClick={() => openAction("fund")}
                      >
                        <Plus />
                        Add funds
                      </Button>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">SignetPass balance</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={visible ? "Hide SignetPass balance" : "Show SignetPass balance"}
                      className="h-7 w-7"
                      onClick={() => setVisible((v) => !v)}
                    >
                      {visible ? <Eye /> : <EyeOff />}
                    </Button>
                  </div>
                  <p className="mt-1 truncate font-display text-3xl font-semibold tabular-nums">
                    {visible ? <CountUp value={pass.balance} /> : "••••"}{" "}
                    <span className="text-base font-medium text-muted-foreground">USD8</span>
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-2 rounded-full bg-secondary/70 py-1.5 pl-3 pr-1.5">
                    <span className="min-w-0 truncate font-mono text-[11px] text-muted-foreground">
                      {pass.address}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Copy SignetPass address"
                      title="Copy address"
                      className="h-7 w-7 shrink-0"
                      onClick={copy}
                    >
                      <Copy />
                    </Button>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {chain.name} · {signetPassFee(chain.id).token}
                    </span>
                    <Badge
                      variant="outline"
                      className={`gap-1.5 rounded-full ${pass.status === "active" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
                    >
                      {pass.status === "active" ? (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </>
                      ) : (
                        "Not activated"
                      )}
                    </Badge>
                  </div>
                </section>
                {pass.status === "inactive" && (
                  <Button className="mt-3 h-11 w-full" onClick={() => openAction("activate")}>
                    <ShieldCheck />
                    Activate SignetPass
                  </Button>
                )}
                <Tabs defaultValue="approvals" className="mt-7">
                  <TabsList className="flex h-10 w-full justify-start gap-0.5 overflow-x-auto rounded-full bg-secondary/70 p-[3px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <TabsTrigger
                      value="approvals"
                      className="h-full min-w-fit flex-1 rounded-full px-4 text-[11px] font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/25"
                    >
                      Spending Sessions{" "}
                      {pending.length > 0 && (
                        <span className="ml-1 opacity-80">{pending.length}</span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="agents"
                      className="h-full min-w-fit flex-1 rounded-full px-4 text-[11px] font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/25"
                    >
                      Agents
                    </TabsTrigger>
                    <TabsTrigger
                      value="activity"
                      className="h-full min-w-fit flex-1 rounded-full px-4 text-[11px] font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/25"
                    >
                      Activities
                    </TabsTrigger>
                    <TabsTrigger
                      value="cli"
                      className="h-full min-w-fit flex-1 rounded-full px-4 text-[11px] font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/25"
                    >
                      CLI Logins
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="approvals" className="mt-4">
                    <h2 className="mb-3 text-sm font-semibold">Pending approvals</h2>
                    {pending.length === 0 ? (
                      <Empty label="No pending requests" />
                    ) : (
                      pending.map((r) => (
                        <div key={r.id} className="mb-3 rounded-2xl border bg-card p-4">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                              <Bot />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{r.agentName}</p>
                              <p className="truncate text-[11px] text-muted-foreground">
                                {r.client}
                              </p>
                            </div>
                          </div>
                          <div className="my-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="text-muted-foreground">
                              Requested budget{" "}
                              <strong className="font-medium text-foreground">
                                {r.totalBudget} USD8
                              </strong>
                            </span>
                            <span className="flex items-center gap-1 text-primary">
                              <Clock className="h-3 w-3" />
                              {Math.ceil((r.expiresAt - now) / 60000)}m left
                            </span>
                          </div>
                          <Button
                            className="w-full"
                            variant="secondary"
                            onClick={() => setRequest(r)}
                          >
                            Review request
                            <ArrowRight />
                          </Button>
                        </div>
                      ))
                    )}
                    {approvals.some((r) => r.status !== "pending" || r.expiresAt <= now) && (
                      <div className="mt-4 border-t border-divider pt-4">
                        <h3 className="mb-2 text-xs font-medium text-muted-foreground">
                          Spending Sessions History
                        </h3>
                        {approvals
                          .filter((r) => r.status !== "pending" || r.expiresAt <= now)
                          .map((r) => (
                            <div
                              key={r.id}
                              className="flex items-center justify-between gap-2 py-2 text-xs"
                            >
                              <span className="truncate">{r.agentName}</span>
                              <Badge variant="outline" className="capitalize">
                                {r.status === "pending" ? "Expired" : r.status}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="agents" className="mt-4">
                    <h2 className="mb-3 text-sm font-semibold">Registered agents</h2>
                    {agents.length === 0 ? (
                      <Empty label="No registered agents" />
                    ) : (
                      agents.map((a, index) => (
                        <AgentCard
                          key={a.id}
                          index={index}
                          agent={a}
                          now={now}
                          onRevoke={(id) => setRevokeId(id)}
                        />
                      ))
                    )}
                    {revokedAgents.length > 0 && (
                      <div className="mt-5 border-t border-divider pt-4">
                        <h3 className="mb-2 text-sm font-semibold">History</h3>
                        {revokedAgents.map((a) => (
                          <RevokedAgentCard key={a.id} agent={a} />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="activity" className="mt-4">
                    <h2 className="mb-3 text-sm font-semibold">SignetPass activity</h2>
                    {activity.length === 0 ? (
                      <Empty label="No activity yet" />
                    ) : (
                      activity.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center gap-3 border-b border-divider py-3 last:border-0"
                        >
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                            {kindIcon(a.kind)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium">{a.label}</p>
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              {timeAgo(a.at, now)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                  <TabsContent value="cli" className="mt-4">
                    <h2 className="mb-3 text-sm font-semibold">Signet CLI logins</h2>
                    {cliLogins}
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="py-8 text-center">
                <Empty label="No SignetPass accounts" />
                <Button asChild>
                  <Link to="/agentic/new">
                    <Plus />
                    Create SignetPass
                  </Link>
                </Button>
              </div>
            )}
            {!pass && (
              <section className="mt-6 border-t border-divider pt-5" aria-label="Signet CLI logins">
                <h2 className="mb-3 text-sm font-semibold">Signet CLI logins</h2>
                {cliLogins}
              </section>
            )}
          </>
        )}
        <BottomNav />
        <Dialog
          open={action !== null}
          onOpenChange={(open) => {
            if (!open) setAction(null);
          }}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {action === "rename"
                  ? "Rename SignetPass"
                  : action === "activate"
                    ? "Activate SignetPass"
                    : action === "fund"
                      ? "Add funds to SignetPass"
                      : action === "receive"
                        ? "Receive to SignetPass"
                        : "Logout of Signet CLI?"}
              </DialogTitle>
              <DialogDescription>
                {action === "logout"
                  ? "CLI logout does not revoke agent spending permissions."
                  : `${pass?.name ?? "SignetPass"} · ${pass?.address.slice(0, 10)}…${pass?.address.slice(-6)}`}
              </DialogDescription>
            </DialogHeader>
            {action === "rename" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!pass) return;
                  try {
                    setState(renameQPass(pass.id, name));
                    setAction(null);
                  } catch {
                    setError("SignetPass name is required.");
                  }
                }}
              >
                <label htmlFor="rename-name" className="mb-2 block text-xs font-medium">
                  SignetPass name
                </label>
                <Input
                  id="rename-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 rounded-full"
                />
                {error && (
                  <p role="alert" className="mt-2 text-xs text-destructive">
                    {error}
                  </p>
                )}
                <Button className="mt-4 w-full" type="submit">
                  Save name
                </Button>
              </form>
            )}
            {action === "activate" && (
              <>
                <div className="space-y-3 text-sm">
                  <Detail label="Fee paid by" value="Main wallet" />
                  <Detail label="Main wallet balance" value="0.00 QDAY" />
                  <Detail label="Network fee" value="Unavailable in demo" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Activation deploys your SignetPass smart account on QDay. The network fee is paid
                  by your main wallet.
                </p>
                <Button
                  onClick={() => {
                    if (!pass) return;
                    setState(activateQPass(pass.id));
                    setAction(null);
                    toast.success("SignetPass activated");
                  }}
                >
                  Activate SignetPass
                </Button>
              </>
            )}
            {(action === "fund" || action === "receive") && (
              <div className="grid h-10 grid-cols-2 gap-1 rounded-full bg-secondary/70 p-[3px]">
                {(["fund", "receive"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setAction(k)}
                    className={`rounded-full text-xs font-semibold transition-colors ${action === k ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" : "text-muted-foreground"}`}
                  >
                    {k === "fund" ? "From main wallet" : "Receive via QR"}
                  </button>
                ))}
              </div>
            )}
            {action === "fund" && (
              <>
                <div className="space-y-3 text-sm">
                  <Detail label="From" value="Main wallet" />
                  <Detail label="To" value={pass?.name ?? "SignetPass"} />
                  <Detail label="Available balance" value="0.00 USD8" />
                </div>
                <label htmlFor="fund-amount" className="text-xs font-medium">
                  Amount (USD8)
                </label>
                <Input id="fund-amount" placeholder="0.00" disabled className="h-11 rounded-full" />
                <p className="text-xs text-muted-foreground">
                  Funding transfers USD8 from your main wallet to this SignetPass.
                </p>
                <Button disabled>Transfer unavailable</Button>
              </>
            )}
            {action === "receive" && pass && (
              <>
                <div className="mx-auto rounded-xl bg-card p-4 text-foreground">
                  <QRCodeSVG
                    value={`signetpass:${pass.address}`}
                    size={160}
                    fgColor="currentColor"
                    bgColor="transparent"
                    title="SignetPass address QR"
                  />
                </div>
                <p className="break-all text-center font-mono text-xs">{pass.address}</p>
                <p className="text-center text-xs text-muted-foreground">
                  Share this address to receive USD8 on QDay.
                </p>
                <Button variant="secondary" onClick={copy}>
                  <Copy />
                  Copy address
                </Button>
              </>
            )}
            {action === "logout" && (
              <div className="mt-2 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setAction(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    setState(endCliSession(targetId));
                    setAction(null);
                  }}
                >
                  Logout
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <RevokeAgentDialog
          agent={state?.agents.find((a) => a.id === revokeId)}
          passName={pass?.name ?? "this SignetPass"}
          open={revokeId !== ""}
          onOpenChange={(open) => {
            if (!open) setRevokeId("");
          }}
          onSubmitted={setState}
        />
        <ReviewRequestDialog
          request={currentRequest ?? null}
          open={request !== null}
          now={now}
          passName={pass?.name ?? "SignetPass"}
          passActive={pass?.status === "active"}
          onClose={() => setRequest(null)}
          onDecide={decide}
          onSaveLimits={saveLimits}
        />
      </main>
    </div>
  );
}
function Detail({ label, value, was }: { label: string; value: string; was?: string | undefined }) {
  return (
    <div className="flex justify-between gap-4 border-b border-divider pb-2">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-right font-medium">
        {was && (
          <span className="mr-1.5 text-xs font-normal text-muted-foreground line-through">
            {was}
          </span>
        )}
        {value}
      </span>
    </div>
  );
}
function Empty({ label }: { label: string }) {
  return (
    <div role="status" className="flex flex-col items-center py-7 text-center">
      <ShieldCheck className="mb-2 h-6 w-6 text-muted-foreground/50" />
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
function kindIcon(kind: ActivityKind) {
  switch (kind) {
    case "fund":
      return <ArrowDownLeft className="h-4 w-4" />;
    case "approve":
      return <Check className="h-4 w-4" />;
    case "activate":
      return <ShieldCheck className="h-4 w-4" />;
    case "create":
      return <Plus className="h-4 w-4" />;
    case "rename":
      return <Pencil className="h-4 w-4" />;
    case "revoke":
      return <Ban className="h-4 w-4" />;
  }
}
function timeAgo(at: number, now: number): string {
  const diff = Math.max(0, now - at);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  return `${d}d ago`;
}

function ReviewRequestDialog({
  request,
  open,
  now,
  passName,
  passActive,
  onClose,
  onDecide,
  onSaveLimits,
}: {
  request: ApprovalRequest | null;
  open: boolean;
  now: number;
  passName: string;
  passActive: boolean;
  onClose: () => void;
  onDecide: (d: "approved" | "rejected") => void;
  onSaveLimits: (values: ApprovalLimits) => void;
}) {
  const [verifying, setVerifying] = useState(false);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!open) {
      setVerifying(false);
      setEditing(false);
    }
  }, [open]);
  const awaitingCli = request ? isAwaitingCli(request, now) : false;
  const terminal = request?.terminal;
  const left = request ? Math.max(0, request.expiresAt - now) : 0;
  const expired = left <= 0;
  const mm = Math.floor(left / 60000);
  const ss = Math.floor((left % 60000) / 1000)
    .toString()
    .padStart(2, "0");
  const approve = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      onDecide("approved");
    }, 1400);
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !verifying) onClose();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader className="items-center text-center">
          <span className="mb-1 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Bot className="h-7 w-7" />
          </span>
          <DialogTitle>Spending Session Approval</DialogTitle>
          <DialogDescription className="flex items-center justify-center gap-1.5">
            <Terminal className="h-3.5 w-3.5" />
            {request ? `${request.agentName} · ${request.client}` : null}
          </DialogDescription>
        </DialogHeader>
        {request && editing && (
          <SpendingLimitsEditor
            key={`${request.perPaymentLimit}-${request.totalBudget}-${request.durationDays}`}
            current={{
              perPaymentLimit: request.perPaymentLimit,
              totalBudget: request.totalBudget,
              durationDays: request.durationDays,
            }}
            onSave={(values) => {
              onSaveLimits(values);
              setEditing(false);
            }}
            onDiscard={() => setEditing(false)}
          />
        )}
        {request && !editing && (
          <>
            <div className="rounded-2xl bg-primary/5 p-4 text-center">
              <p className="text-xs text-muted-foreground">Requested total budget</p>
              <p className="font-display text-3xl font-semibold">
                {request.totalBudget} <span className="text-base text-muted-foreground">USD8</span>
              </p>
              {terminal && terminal.totalBudget !== request.totalBudget && (
                <p className="text-xs text-muted-foreground line-through">
                  {terminal.totalBudget} USD8
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">from {passName}</p>
            </div>
            <div className="space-y-2.5 text-sm">
              <Detail
                label="Per-payment limit"
                value={`${request.perPaymentLimit} USD8`}
                was={
                  terminal && terminal.perPaymentLimit !== request.perPaymentLimit
                    ? `${terminal.perPaymentLimit} USD8`
                    : undefined
                }
              />
              <Detail
                label="Permission duration"
                value={`${request.durationDays} days`}
                was={
                  terminal && terminal.durationDays !== request.durationDays
                    ? `${terminal.durationDays} days`
                    : undefined
                }
              />
            </div>
            {terminal && (
              <p className="text-center text-[11px] text-muted-foreground">
                Limits lowered from what the terminal requested.
              </p>
            )}
            {!expired && (
              <Button
                variant="outline"
                className="w-full"
                disabled={verifying}
                onClick={() => setEditing(true)}
              >
                <Pencil />
                Edit spending limits
              </Button>
            )}
            {awaitingCli && (
              <p
                role="status"
                className="flex items-center justify-center gap-1.5 text-center text-xs text-primary"
              >
                <Clock className="h-3.5 w-3.5 animate-pulse" />
                Waiting for the terminal to sign the updated request. Keep the CLI running.
              </p>
            )}
            <div
              className={`flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-medium ${expired ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground"}`}
            >
              <Clock className="h-3.5 w-3.5" />
              {expired ? "This request has expired" : `Expires in ${mm}:${ss}`}
            </div>
            {!passActive && !expired && (
              <p role="alert" className="text-center text-xs text-destructive">
                Activate this SignetPass before approving agents.
              </p>
            )}
            <p className="text-center text-[11px] text-muted-foreground">
              Limits start from the terminal request and can only be lowered here. The server checks
              any change before you can approve. This preview cannot move funds.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                disabled={expired || verifying}
                onClick={() => onDecide("rejected")}
              >
                Reject
              </Button>
              <Button
                className="flex-1"
                disabled={expired || !passActive || verifying || awaitingCli}
                onClick={approve}
              >
                {verifying ? (
                  <>
                    <ShieldCheck className="animate-pulse" />
                    Confirming…
                  </>
                ) : (
                  <>
                    <ShieldCheck />
                    Approve
                  </>
                )}
              </Button>
            </div>
            {verifying && (
              <p className="text-center text-xs text-primary animate-fade-up">
                Simulating Passkey confirmation…
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
