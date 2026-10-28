import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowLeft, ShieldCheck, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createQPass, validateQPassInput } from '@/lib/qpass';
import { QDayEntry } from '@/components/qday-entry';
export const Route = createFileRoute('/agentic_/new')({
  head: () => ({ meta: [
    { title: 'Create QPass — Trellis Wallet' }, { name: 'description', content: 'Name a separate QPass spending account in the Trellis Wallet preview.' },
    { property: 'og:title', content: 'Create QPass — Trellis Wallet' }, { property: 'og:description', content: 'Create a named QPass account; spending permissions are requested from the terminal.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }), component: CreateQPassPage,
});
function CreateQPassPage() { return <QDayEntry><CreateQPass /></QDayEntry>; }
function CreateQPass() {
  const navigate = useNavigate(); const [name, setName] = useState(''); const [error, setError] = useState<string | null>(null);
  return <div className="flex min-h-screen justify-center bg-background"><main className="flex min-h-screen w-full max-w-md flex-col px-6 pb-8 pt-6">
    <header className="flex items-center gap-3"><Button asChild variant="ghost" size="icon" aria-label="Back to Agentic Payment" className="border bg-card"><Link to="/agentic"><ArrowLeft /></Link></Button><h1 className="font-display text-xl font-semibold">Create QPass</h1></header>
    <div className="pb-8 pt-12"><span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"><WalletCards className="h-8 w-8" /></span><h2 className="mt-5 font-display text-2xl font-semibold">A new spending account</h2><p className="mt-2 text-sm text-muted-foreground">Separate from your main wallet. Owned by you.</p></div>
    <form onSubmit={event => { event.preventDefault(); const invalid = validateQPassInput({ name }); if (invalid) { setError(invalid); return; } createQPass({ name }); navigate({ to: '/agentic' }); }}>
      <label htmlFor="qpass-name" className="mb-2 block text-sm font-medium">QPass name</label><Input id="qpass-name" value={name} onChange={event => { setName(event.target.value); setError(null); }} placeholder="e.g. Shopping QPass" autoComplete="off" className="h-12 rounded-full bg-card px-4" aria-invalid={!!error} aria-describedby={error ? 'name-error' : undefined} />
      {error && <p id="name-error" role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
      <div className="mt-6 flex items-center justify-between border-y py-4 text-sm"><span className="text-muted-foreground">Initial balance</span><span className="font-semibold">0.00 USD8</span></div>
      <Button type="submit" className="mt-6 h-12 w-full">Create QPass</Button>
    </form><p className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" />Owned by your main wallet · USD8 on Qday</p>
  </main></div>;
}
