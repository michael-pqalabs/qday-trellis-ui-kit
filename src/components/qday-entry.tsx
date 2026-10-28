import { useEffect, useState, type ReactNode, type FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Check, Copy, Fingerprint, LoaderCircle, LockKeyhole, LogOut, Mail, ShieldCheck, Trash2, Wallet, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import logo from '@/assets/trellis-icon-blue.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomNav } from '@/components/bottom-nav';
import { useQDayPreview } from '@/components/qday-preview-provider';
import { canEnterQPass, completePreviewStep, PREVIEW_ACCOUNT_ADDRESS, PREVIEW_OTP, PREVIEW_OWNER_ADDRESS, revokePreviewPasskey, setupSteps, validPreviewOTP } from '@/lib/qday-preview';

export function QDayEntry({ children }: { children: ReactNode }) {
  const { state, ready } = useQDayPreview();
  if (!ready) return <div className="flex min-h-screen justify-center bg-background"><main className="w-full max-w-md px-6 pt-10"><Skeleton className="h-12 w-2/3" /><Skeleton className="mt-8 h-64 w-full" /></main></div>;
  if (canEnterQPass(state)) return children;
  return <QDayOnboarding />;
}

function QDayOnboarding() {
  const { state, update } = useQDayPreview();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [manualBusy, setManualBusy] = useState(false);
  const [setupError, setSetupError] = useState(false);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  useEffect(() => {
    if (!state.email || state.completed >= 5 || setupError) return;
    const current = setupSteps[state.completed];
    if (current?.manual && !manualBusy) return;
    const index = state.completed;
    const timer = setTimeout(() => {
      update(s => completePreviewStep(s, index));
      setManualBusy(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [state.email, state.completed, manualBusy, setupError, update]);
  const signOut = () => { update(s => ({ ...s, email: null, completed: 0 })); setSent(false); setCode(''); setError(''); setManualBusy(false); };
  const verify = (event: FormEvent) => {
    event.preventDefault();
    if (!validPreviewOTP(code)) { setError('Use the 8-digit preview code shown below.'); return; }
    update(s => ({ ...s, email: email.trim(), completed: 0 }));
    setError('');
  };
  return <div className="flex min-h-screen justify-center bg-background"><main className="flex min-h-screen w-full max-w-md flex-col px-6 pt-6">
    <header className="flex items-center justify-between"><div className="flex items-center gap-2.5"><img src={logo} alt="Trellis" className="h-8 w-8 rounded-lg" /><span className="font-display text-lg font-semibold">Trellis</span></div>{state.email && <Button variant="ghost" size="icon" aria-label="Sign out of QDay preview" title="Sign out" onClick={signOut}><LogOut /></Button>}</header>
    <div className="mt-9 flex items-center gap-2 text-xs font-semibold text-primary"><ShieldCheck className="h-4 w-4" />QDAY ACCOUNT<span className="ml-auto rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px]">UI preview</span></div>
    {!state.walletReady ? <section className="my-auto py-12"><span className="mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><Wallet className="h-7 w-7" /></span><h1 className="font-display text-3xl font-semibold">Your wallet comes first</h1><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Create your Trellis wallet before setting up your QDay account.</p><Button asChild className="mt-7 h-12 w-full"><Link to="/">Create wallet<ArrowRight /></Link></Button></section> : !state.email ? <section className="pb-10 pt-6">
      <span className="mb-6 grid h-14 w-14 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">{sent ? <LockKeyhole className="h-6 w-6" /> : <Mail className="h-6 w-6" />}</span>
      <h1 className="font-display text-3xl font-semibold">{sent ? 'Check your email' : 'Sign in to QDay'}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{sent ? <>Enter the 8-digit code for <span className="break-all font-medium text-foreground">{email}</span>.</> : 'One account for your QPasses and connected agents.'}</p>
      {!sent ? <form className="mt-8" onSubmit={event => { event.preventDefault(); setBusy(true); setError(''); setTimeout(() => { setSent(true); setBusy(false); setCooldown(30); }, 600); }}><label htmlFor="qday-email" className="mb-2 block text-xs font-semibold">Email address</label><Input id="qday-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" className="h-12 rounded-full bg-card px-4" /><Button type="submit" disabled={busy} className="mt-5 h-12 w-full">{busy ? <LoaderCircle className="animate-spin" /> : <Mail />}Continue with email<ArrowRight /></Button></form> : <form className="mt-8" onSubmit={verify}>
        <label htmlFor="qday-otp" className="mb-3 block text-xs font-semibold">Verification code</label>
        <InputOTP id="qday-otp" aria-label="8-digit verification code" maxLength={8} pattern={REGEXP_ONLY_DIGITS} value={code} onChange={value => { setCode(value); setError(''); }} containerClassName="w-full"><InputOTPGroup className="grid w-full grid-cols-8 gap-1.5">{Array.from({ length: 8 }, (_, index) => <InputOTPSlot key={index} index={index} className="h-12 w-full rounded-lg border border-input bg-card font-display text-lg first:rounded-lg last:rounded-lg" />)}</InputOTPGroup></InputOTP>
        {error && <p role="alert" className="mt-3 text-xs text-destructive">{error}</p>}
        <Button type="submit" disabled={code.length !== 8} className="mt-5 h-12 w-full">Verify code<ArrowRight /></Button>
        <div className="mt-4 flex items-center justify-between gap-2"><Button variant="link" size="sm" onClick={() => { setSent(false); setCode(''); setError(''); }}>Change email</Button><Button variant="ghost" size="sm" disabled={cooldown > 0} onClick={() => { setCooldown(30); setCode(''); setError(''); }}>{cooldown ? `Resend in ${cooldown}s` : 'Resend code'}</Button></div>
      </form>}
      <p className="mt-7 border-t border-divider pt-4 text-xs leading-relaxed text-muted-foreground">Email delivery is not connected.{sent && <> Preview code: <strong className="font-mono text-foreground">{PREVIEW_OTP}</strong>.</>}</p>
    </section> : <section className="pb-8 pt-6">
      <h1 className="font-display text-3xl font-semibold">Set up your account</h1><p className="mt-3 text-sm text-muted-foreground">A few steps to get your QPass ready.</p>
      <div className="mt-5 flex items-center justify-between gap-3 text-xs"><span className="truncate text-muted-foreground">{state.email}</span><span className="shrink-0 font-semibold text-primary">{state.completed} / 5 complete</span></div>
      <div className="mt-3 grid grid-cols-5 gap-1.5" aria-label={`${state.completed} of 5 steps complete`}>{setupSteps.map((_, index) => <span key={index} className={`h-1 rounded-full ${index < state.completed ? 'bg-primary' : 'bg-border'}`} />)}</div>
      <ol className="mt-8">{setupSteps.map((step, index) => {
        const done = index < state.completed; const current = index === state.completed; const loading = current && (!step.manual || manualBusy) && !setupError;
        return <li key={step.title} className="relative flex gap-4 pb-7 last:pb-0">{index < 4 && <span aria-hidden="true" className={`absolute left-[17px] top-9 h-[calc(100%-36px)] w-px ${done ? 'bg-primary/40' : 'bg-divider'}`} />}
          <span className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-full border text-xs font-semibold ${done ? 'border-primary/20 bg-primary/10 text-primary' : current ? 'border-primary bg-primary text-primary-foreground shadow-primary' : 'border-border bg-background text-muted-foreground'}`}>{done ? <Check className="h-4 w-4" /> : loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : index + 1}</span>
          <div className="min-w-0 flex-1 pt-1"><h2 className={`text-sm font-semibold ${!done && !current ? 'text-muted-foreground' : ''}`}>{step.title}</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{done ? 'Complete' : loading ? 'Processing preview…' : step.detail}</p>
          {index === 0 && done && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Signed in as <span className="font-medium text-foreground">{state.email}</span></p>}
          {index === 2 && done && <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs leading-relaxed text-muted-foreground"><span>Wallet linked ·</span><span className="font-mono text-foreground">{shortAddress(PREVIEW_OWNER_ADDRESS)}</span><MiniCopy value={PREVIEW_OWNER_ADDRESS} label="Linked owner address" /></div>}
          {index === 3 && done && <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-relaxed text-muted-foreground"><p>Passkey registered on this device · used to approve QPass actions</p><Button variant="link" size="sm" className="h-auto gap-1 p-0 text-xs text-destructive" onClick={() => { update(revokePreviewPasskey); setManualBusy(false); toast('Passkey revoked'); }}><Trash2 className="h-3 w-3" />Revoke</Button></div>}
          {index === 4 && current && <p className="mt-1 text-xs text-muted-foreground">The platform covers the deployment fee — no QDAY or USD8 needed.</p>}
          {index === 4 && done && <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs leading-relaxed text-muted-foreground"><span>Smart account</span><span className="font-mono text-foreground">{shortAddress(PREVIEW_ACCOUNT_ADDRESS)}</span><MiniCopy value={PREVIEW_ACCOUNT_ADDRESS} label="Smart account address" /></div>}
          {current && step.manual && !manualBusy && !setupError && <Button className="mt-4 h-10 w-full" onClick={() => setManualBusy(true)}>{index === 3 ? <Fingerprint /> : <ShieldCheck />}{index === 3 ? 'Preview Passkey setup' : 'Preview wallet activation'}</Button>}
          {current && setupError && <div className="mt-3"><p role="alert" className="text-xs text-destructive">Preview paused. Try again to continue.</p><Button variant="outline" size="sm" className="mt-2" onClick={() => { setSetupError(false); if (step.manual) setManualBusy(true); }}><RotateCcw />Try again</Button></div>}
          {loading && <Button variant="link" size="sm" className="mt-1 h-6 px-0 text-xs" onClick={() => { setSetupError(true); setManualBusy(false); }}>Pause</Button>}
          </div></li>;
      })}</ol>
      <p className="mt-7 border-t border-divider pt-4 text-xs leading-relaxed text-muted-foreground">Not connected to QDay. These steps do not create a Passkey, link an account or activate a wallet.</p>
    </section>}
    <BottomNav />
  </main></div>;
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function MiniCopy({ value, label }: { value: string; label: string }) {
  return <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 rounded-full text-muted-foreground hover:text-foreground" aria-label={`Copy ${label}`} onClick={() => { navigator.clipboard?.writeText(value).catch(() => {}); toast('Address copied'); }}><Copy className="h-3 w-3" /></Button>;
}