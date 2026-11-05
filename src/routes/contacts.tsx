import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Pencil, Plus, Send, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { shortAddress } from "@/lib/wallet-preview";

type Contact = { id: string; name: string; address: string };
const MAX_CONTACTS = 10;
const NAME_MAX = 24;
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const ZERO = /^0x0{40}$/;
const sample: Contact[] = [
  { id: "c1", name: "Alice", address: "0x91cE4a7B2d3F80e5C6a1b9D04f7E2c3A8b5D6e10" },
  { id: "c2", name: "Coffee shop", address: "0x4F2a9C1e7B3d6A80f5E2c9B1d4A7e3F6c0B8a215" },
];

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "Address book — Trellis Wallet" },
      { name: "description", content: "Saved recipients in the Trellis Wallet preview." },
      { property: "og:title", content: "Address book — Trellis Wallet" },
      { property: "og:description", content: "Saved recipients in the Trellis Wallet preview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactsPage,
});

function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(sample);
  const [editing, setEditing] = useState<Contact | "new" | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<{ name?: string; address?: string }>({});
  const [removing, setRemoving] = useState<Contact | null>(null);
  const open = (c: Contact | "new") => {
    setEditing(c);
    setName(c === "new" ? "" : c.name);
    setAddress(c === "new" ? "" : c.address);
    setError({});
  };
  const save = () => {
    const found: typeof error = {};
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > NAME_MAX || /\p{C}/u.test(trimmed))
      found.name = "Use a name of 1–24 characters, without hidden control characters.";
    const addr = address.trim();
    const self = editing !== "new" ? editing : null;
    if (!ADDRESS.test(addr) || ZERO.test(addr))
      found.address = "Enter a valid, non-zero address. Check capitalization.";
    else if (
      contacts.some((c) => c.id !== self?.id && c.address.toLowerCase() === addr.toLowerCase())
    )
      found.address = "This address is already in your address book.";
    else if (!self && contacts.length >= MAX_CONTACTS)
      found.address = "This version supports up to 10 contacts.";
    setError(found);
    if (Object.keys(found).length) return;
    setContacts((list) =>
      self
        ? list.map((c) => (c.id === self.id ? { ...c, name: trimmed, address: addr } : c))
        : [...list, { id: crypto.randomUUID(), name: trimmed, address: addr }],
    );
    setEditing(null);
    toast.success(self ? "Contact updated" : "Contact saved");
  };
  return (
    <div className="flex min-h-screen justify-center bg-background">
      <main className="flex min-h-screen w-full max-w-md flex-col px-5 pb-8 pt-6">
        <header className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Back to settings">
            <Link to="/settings">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="font-display text-xl font-semibold">Address book</h1>
          <span className="ml-auto text-xs text-muted-foreground">
            {contacts.length}/{MAX_CONTACTS}
          </span>
        </header>
        <p className="mt-4 text-xs text-muted-foreground">
          Saved on this device. Check the full address before sending.
        </p>
        {editing ? (
          <section
            className="mt-5 space-y-3 rounded-2xl border bg-card p-4"
            aria-label="Contact form"
          >
            <div>
              <Label htmlFor="c-name" className="mb-2 block">
                Contact name
              </Label>
              <Input
                id="c-name"
                value={name}
                maxLength={NAME_MAX + 8}
                aria-invalid={error.name ? true : undefined}
                onChange={(e) => setName(e.target.value)}
              />
              {error.name && (
                <p role="alert" className="mt-1 text-[11px] text-destructive">
                  {error.name}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="c-address" className="mb-2 block">
                Contact address
              </Label>
              <Input
                id="c-address"
                placeholder="0x…"
                value={address}
                aria-invalid={error.address ? true : undefined}
                onChange={(e) => setAddress(e.target.value)}
              />
              {error.address && (
                <p role="alert" className="mt-1 text-[11px] text-destructive">
                  {error.address}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={save}>
                Save contact
              </Button>
            </div>
          </section>
        ) : (
          <>
            {contacts.length === 0 ? (
              <div role="status" className="flex flex-col items-center py-14 text-center">
                <UserRound className="mb-2 h-7 w-7 text-muted-foreground/50" />
                <p className="text-sm font-medium">No saved recipients yet.</p>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-divider">
                {contacts.map((c, index) => (
                  <li
                    key={c.id}
                    style={{ "--i": index } as React.CSSProperties}
                    className="animate-stagger flex items-center gap-3 py-3"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{c.name}</span>
                      <span className="block truncate font-mono text-[11px] text-muted-foreground">
                        {shortAddress(c.address)}
                      </span>
                    </span>
                    <Button asChild variant="ghost" size="icon" aria-label={`Send to ${c.name}`}>
                      <Link to="/send">
                        <Send />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${c.name}`}
                      onClick={() => open(c)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      aria-label={`Delete ${c.name}`}
                      onClick={() => setRemoving(c)}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Button
              className="mt-4 w-full"
              disabled={contacts.length >= MAX_CONTACTS}
              onClick={() => open("new")}
            >
              <Plus />
              Add contact
            </Button>
            {contacts.length >= MAX_CONTACTS && (
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                This version supports up to 10 contacts.
              </p>
            )}
          </>
        )}
        <p className="mt-8 text-center text-[10px] text-muted-foreground">
          Preview only · contacts reset when you reload. Selected recipients are simulated.
        </p>
        <AlertDialog open={removing !== null} onOpenChange={(o) => !o && setRemoving(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete contact?</AlertDialogTitle>
              <AlertDialogDescription>
                {removing?.name} will be removed from your address book on this device.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setContacts((l) => l.filter((c) => c.id !== removing?.id));
                  setRemoving(null);
                  toast.success("Contact removed");
                }}
              >
                Remove contact
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
