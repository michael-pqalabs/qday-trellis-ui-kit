import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { ArrowLeft, ArrowUpRight, Check, Copy, ImageOff, LoaderCircle, Search, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/trellis-icon-blue.png";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/design-kit")({
  head: () => ({ meta: [
    { title: "Design Kit — Trellis Wallet" },
    { name: "description", content: "The Trellis Wallet component library in light and dark: buttons, forms, tables, dialogs and loading states." },
    { property: "og:title", content: "Design Kit — Trellis Wallet" },
    { property: "og:description", content: "Explore Trellis Wallet's blue design system and interactive component examples." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: DesignKit,
});

function Section({ title, number, children }: { title: string; number: string; children: ReactNode }) {
  return <section className="border-t border-divider py-7" aria-labelledby={`section-${number}`}>
    <div className="mb-5 flex items-center gap-3"><span className="font-mono text-xs text-primary">{number}</span><h2 id={`section-${number}`} className="font-display text-xl font-semibold">{title}</h2></div>
    {children}
  </section>;
}

function DesignKit() {
  const { theme, setTheme } = useTheme();
  const [saved, setSaved] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [progress, setProgress] = useState(64);
  const [imageVisible, setImageVisible] = useState(true);
  const [query, setQuery] = useState("");
  const form = useForm<{ name: string; email: string }>({ defaultValues: { name: "", email: "" } });
  const assets = [
    { name: "Qday", symbol: "QDAY", balance: "0.00", state: "Native" },
    { name: "sQDAY", symbol: "sQDAY", balance: "0.00", state: "Staked" },
    { name: "USD8", symbol: "USD8", balance: "0.00", state: "Stable" },
  ].filter(asset => asset.name.toLowerCase().includes(query.toLowerCase()));

  return <div className="flex min-h-screen justify-center bg-background"><main className="w-full max-w-md px-6 pb-10 pt-6">
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5"><img src={logo} className="h-9 w-9 rounded-lg" alt="Trellis" /><span className="font-display text-lg font-semibold">Trellis</span></div>
      <Button asChild variant="ghost" size="sm"><Link to="/wallet"><ArrowLeft />Wallet</Link></Button>
    </header>
    <div className="pb-7 pt-8"><Badge variant="outline" className="mb-3 border-primary/30 text-primary">DESIGN SYSTEM · 01</Badge><h1 className="font-display text-4xl font-semibold">Design kit</h1>
      <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg border bg-card p-1" role="group" aria-label="Colour theme">
        <Button variant={theme === "light" ? "default" : "ghost"} aria-pressed={theme === "light"} onClick={() => setTheme("light")}>Light</Button>
        <Button variant={theme === "dark" ? "default" : "ghost"} aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>Dark</Button>
      </div>
    </div>

    <Section number="01" title="Colour & typography">
      <div className="grid grid-cols-3 gap-3">
        {[{ label: "Brand", value: "#2852C5", className: "bg-brand" }, { label: "Primary", value: "#2852C5", className: "bg-primary" }, { label: "Accent", value: theme === "light" ? "Deep cyan" : "Ice cyan", className: "bg-accent" }].map(color => <div key={color.label}><div className={`mb-2 h-16 rounded-lg ${color.className}`} /><p className="text-xs font-semibold">{color.label}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{color.value}</p></div>)}
      </div>
      <div className="mt-6 space-y-2"><p className="font-display text-3xl font-semibold">Your keys. Your crypto.</p><p className="text-sm text-muted-foreground">Manrope · Body / 14</p><p className="font-mono text-xs text-muted-foreground">0x28…C5 · Monospace / 12</p></div>
    </Section>

    <Section number="02" title="Buttons">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => toast.success("Primary action selected")}><ArrowUpRight />Primary</Button>
        <Button variant="secondary" onClick={() => toast("Secondary action selected")}>Secondary</Button>
        <Button variant="outline" onClick={() => toast("Outline action selected")}>Outline</Button>
        <Button variant="ghost" onClick={() => toast("Ghost action selected")}>Ghost</Button>
        <Button variant="destructive" onClick={() => toast.error("Destructive action preview")}>Destructive</Button>
        <Button variant="link" onClick={() => toast("Link action selected")}>Link</Button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2"><Button size="sm" onClick={() => toast("Small button selected")}>Small</Button><Button disabled>Disabled</Button><Button disabled><LoaderCircle className="animate-spin" />Loading</Button>
        <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="icon" variant="outline" aria-label="Copy example" onClick={() => toast("Copy action preview")}><Copy /></Button></TooltipTrigger><TooltipContent>Copy example</TooltipContent></Tooltip></TooltipProvider>
      </div>
    </Section>

    <Section number="03" title="Inputs & selects">
      <div className="space-y-4">
        <div className="space-y-2"><Label htmlFor="kit-name">Wallet name</Label><Input id="kit-name" placeholder="Main wallet" /></div>
        <div className="space-y-2"><Label htmlFor="kit-disabled">Read-only address</Label><Input id="kit-disabled" value="Illustrative address" disabled /></div>
        <div className="space-y-2"><Label htmlFor="kit-network">Network</Label><Select defaultValue="mainnet"><SelectTrigger id="kit-network"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mainnet">Qday Mainnet</SelectItem><SelectItem value="testnet">Qday Testnet</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="kit-note">Note</Label><Textarea id="kit-note" placeholder="Add a note…" /></div>
      </div>
    </Section>

    <Section number="04" title="Form & validation">
      <Form {...form}><form noValidate className="space-y-4" onSubmit={form.handleSubmit(() => setSaved(true))}>
        <FormField control={form.control} name="name" rules={{ required: "Enter a name" }} render={({ field }) => <FormItem><FormLabel>Profile name</FormLabel><FormControl><Input placeholder="Alex" {...field} onChange={event => { field.onChange(event); setSaved(false); }} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="email" rules={{ required: "Enter an email address", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address" } }} render={({ field }) => <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="alex@example.com" {...field} onChange={event => { field.onChange(event); setSaved(false); }} /></FormControl><FormMessage /></FormItem>} />
        <Button type="submit"><Check />Save preview</Button>
        {saved && <p role="status" className="text-sm text-success">Profile preview saved. No data was sent.</p>}
      </form></Form>
    </Section>

    <Section number="05" title="Selection controls">
      <div className="space-y-5">
        <div className="flex items-center justify-between"><Label htmlFor="kit-switch">Balance privacy</Label><Switch id="kit-switch" /></div>
        <div className="flex items-center gap-3"><Checkbox id="kit-check" /><Label htmlFor="kit-check">Recovery phrase backed up</Label></div>
        <RadioGroup defaultValue="standard" className="flex gap-5">{["standard", "priority"].map(value => <div key={value} className="flex items-center gap-2"><RadioGroupItem id={`kit-${value}`} value={value} /><Label htmlFor={`kit-${value}`} className="capitalize">{value}</Label></div>)}</RadioGroup>
        <div><div className="mb-3 flex justify-between text-sm"><Label>Spending limit</Label><span className="tabular-nums">{progress}%</span></div><Slider aria-label="Spending limit" value={[progress]} onValueChange={value => setProgress(value[0] ?? 0)} max={100} step={1} /></div>
      </div>
    </Section>

    <Section number="06" title="Table">
      <div className="relative mb-3"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input aria-label="Search assets" placeholder="Search assets" className="pl-9" value={query} onChange={event => setQuery(event.target.value)} /></div>
      <div className="overflow-hidden rounded-lg border bg-card"><Table><TableHeader><TableRow><TableHead>Asset</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Balance</TableHead></TableRow></TableHeader><TableBody>{assets.map(asset => <TableRow key={asset.name}><TableCell className="font-semibold">{asset.name}</TableCell><TableCell className="text-xs text-muted-foreground">{asset.state}</TableCell><TableCell className="text-right font-mono">{asset.balance}</TableCell></TableRow>)}{assets.length === 0 && <TableRow><TableCell colSpan={3} className="py-6 text-center text-muted-foreground">No assets found</TableCell></TableRow>}</TableBody></Table></div>
      <p className="mt-2 text-[10px] text-muted-foreground">Illustrative assets · Zero balances</p>
    </Section>

    <Section number="07" title="Modal & overlays">
      <div className="flex flex-wrap gap-2">
        <Dialog open={modalOpen} onOpenChange={setModalOpen}><DialogTrigger asChild><Button variant="outline">Open modal</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Wallet preview</DialogTitle><DialogDescription>A sample dialog from the Trellis design kit.</DialogDescription></DialogHeader><div className="flex items-center gap-3 py-3"><Wallet className="text-primary" /><div><p className="font-semibold">Main wallet</p><p className="text-sm text-muted-foreground">Illustrative account · 0.00 QDAY</p></div></div><Button onClick={() => setModalOpen(false)}>Done</Button></DialogContent></Dialog>
        <AlertDialog><AlertDialogTrigger asChild><Button variant="outline">Confirmation</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Reset this preview?</AlertDialogTitle><AlertDialogDescription>This example does not change your wallet or any real data.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => toast("Preview reset confirmed")}>Confirm</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        <Sheet><SheetTrigger asChild><Button variant="outline">Open sheet</Button></SheetTrigger><SheetContent className="w-[85%] max-w-sm"><SheetHeader><SheetTitle>Wallet details</SheetTitle><SheetDescription>Design-kit preview</SheetDescription></SheetHeader><p className="mt-6 text-sm">Main wallet · Qday Mainnet</p></SheetContent></Sheet>
        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline">Menu</Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={() => toast("Copy preview selected")}><Copy />Copy</DropdownMenuItem><DropdownMenuItem onSelect={() => toast("Settings preview selected")}>Settings</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
      </div>
    </Section>

    <Section number="08" title="Skeleton & loading">
      <div className="flex items-center gap-3 rounded-lg border bg-card p-4"><Skeleton className="h-10 w-10 shrink-0 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>
      <div className="my-5 flex items-center gap-2 text-sm text-muted-foreground" role="status"><LoaderCircle className="h-4 w-4 animate-spin text-primary" />Loading balance…</div>
      <Progress value={progress} aria-label="Loading progress" /><p className="mt-2 text-right text-xs text-muted-foreground">{progress}%</p>
    </Section>

    <Section number="09" title="Image & avatar">
      <div className="grid grid-cols-2 gap-4"><div className="grid aspect-square place-items-center rounded-lg border bg-card">{imageVisible ? <img src={logo} alt="Trellis app icon" className="h-24 w-24 rounded-lg" /> : <div className="flex flex-col items-center gap-2 text-muted-foreground"><ImageOff className="h-8 w-8" /><span className="text-xs">Image unavailable</span></div>}</div><div className="flex flex-col justify-center gap-4"><Avatar className="h-12 w-12"><AvatarImage src={logo} alt="Trellis" /><AvatarFallback>TW</AvatarFallback></Avatar><Avatar className="h-12 w-12"><AvatarFallback>AL</AvatarFallback></Avatar></div></div>
      <Button className="mt-3" size="sm" variant="outline" onClick={() => setImageVisible(value => !value)}>{imageVisible ? "Show fallback" : "Show image"}</Button>
    </Section>

    <Section number="10" title="Feedback & navigation">
      <div className="mb-4 flex flex-wrap gap-2"><Badge>Primary</Badge><Badge variant="secondary">Secondary</Badge><Badge variant="outline">Outline</Badge><Badge variant="destructive">Error</Badge></div>
      <Alert><ShieldCheck className="h-4 w-4" /><AlertTitle>Self-custody</AlertTitle><AlertDescription>Keep your recovery phrase offline and private.</AlertDescription></Alert>
      <Button variant="outline" className="my-4" onClick={() => toast.success("Example saved", { description: "This is a design-kit notification." })}>Show notification</Button>
      <Tabs defaultValue="assets"><TabsList className="w-full"><TabsTrigger className="flex-1" value="assets">Assets</TabsTrigger><TabsTrigger className="flex-1" value="activity">Activity</TabsTrigger></TabsList><TabsContent value="assets" className="py-3 text-sm">Qday · sQDAY · USD8</TabsContent><TabsContent value="activity" className="py-3 text-sm text-muted-foreground">No transactions yet</TabsContent></Tabs>
      <Accordion type="single" collapsible><AccordionItem value="security"><AccordionTrigger>Recovery phrase</AccordionTrigger><AccordionContent>A recovery phrase is private. Never share it with anyone.</AccordionContent></AccordionItem><AccordionItem value="network"><AccordionTrigger>Network</AccordionTrigger><AccordionContent>Qday Mainnet and Qday Testnet.</AccordionContent></AccordionItem></Accordion>
    </Section>
    <footer className="border-t border-divider pt-5 text-xs text-muted-foreground">Trellis Wallet · Component library</footer>
  </main></div>;
}