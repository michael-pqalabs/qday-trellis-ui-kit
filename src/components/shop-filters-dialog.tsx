import { useEffect, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  MAX_TAGS,
  filtersToQuery,
  searchProducts,
  shopCategories,
  shopCountries,
  shopMerchants,
  shopTags,
  validateMaxPrice,
  type ShopFilters,
} from "@/lib/shop-preview";

const PRICE_PRESETS = ["10", "25", "50"];

const chip = (active: boolean) =>
  cn(
    "h-9 rounded-full border px-3.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
    active
      ? "border-primary/40 bg-primary/15 text-primary"
      : "border-border/60 bg-card text-muted-foreground hover:text-foreground",
  );

function Section({
  title,
  aside,
  hint,
  children,
}: {
  title: string;
  /** Right of the title: how many are picked. */
  aside?: string | undefined;
  hint?: string | undefined;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-border/50 px-5 py-5 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {aside && <span className="text-[11px] font-medium text-primary">{aside}</span>}
      </div>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * Full-screen filters for Shopping. Every filter is one the Bazaar search offers and a shopper can
 * use: category, maximum price, tags (a product needs all of them), shops, and the country it
 * ships to. Sorting is a quick control on the page itself, not a filter, and the blockchain and
 * currency follow the wallet, so none of those are here. Changes are kept as a draft until "Show N
 * products"; closing drops them.
 */
export function ShopFiltersDialog({
  open,
  onOpenChange,
  applied,
  search,
  chainId,
  stable,
  chainName,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applied: ShopFilters;
  search: string;
  chainId: string;
  stable: string;
  chainName: string;
  onApply: (filters: ShopFilters) => void;
}) {
  const [draft, setDraft] = useState<ShopFilters>(applied);
  useEffect(() => {
    if (open) setDraft(applied);
    // Start each opening from what is applied now.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const priceError = validateMaxPrice(draft.maxPrice);
  const matches = searchProducts(filtersToQuery(search, draft, chainId, 1)).total;
  const categories = shopCategories(chainId);
  const tags = shopTags(chainId);
  const merchants = shopMerchants(chainId);
  const set = (change: Partial<ShopFilters>) => setDraft((d) => ({ ...d, ...change }));
  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-1/2 top-0 flex h-dvh w-full max-w-md -translate-x-1/2 translate-y-0 flex-col gap-0 rounded-none p-0">
        <div className="border-b border-border/50 py-4 pl-5 pr-16">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle>Filters</DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              // Sorting is not a filter: a reset keeps the order the shopper chose.
              onClick={() =>
                setDraft((d) => ({ sort: d.sort, tags: [], maxPrice: "", merchantIds: [] }))
              }
            >
              Reset
            </Button>
          </div>
          <DialogDescription className="mt-0.5 text-[11px]">
            Products payable in {stable} on {chainName}
          </DialogDescription>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <Section title="Category">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Category">
              {[undefined, ...categories].map((c) => (
                <button
                  key={c ?? "all"}
                  type="button"
                  aria-pressed={draft.category === c}
                  onClick={() => set({ category: c })}
                  className={chip(draft.category === c)}
                >
                  {c ?? "All"}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Maximum price">
            <div className="relative">
              <label htmlFor="filter-max-price" className="sr-only">
                Maximum price in {stable}
              </label>
              <Input
                id="filter-max-price"
                inputMode="decimal"
                placeholder="No limit"
                value={draft.maxPrice}
                aria-invalid={priceError ? true : undefined}
                aria-describedby={priceError ? "filter-max-price-error" : undefined}
                onChange={(e) => set({ maxPrice: e.target.value })}
                className={cn(
                  "pr-16",
                  priceError && "border-destructive focus-visible:ring-destructive/20",
                )}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
              >
                {stable}
              </span>
            </div>
            {priceError ? (
              <p
                id="filter-max-price-error"
                role="alert"
                className="mt-1.5 text-[11px] text-destructive"
              >
                {priceError}
              </p>
            ) : (
              <div className="mt-2.5 flex gap-2" role="group" aria-label="Price presets">
                {PRICE_PRESETS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={draft.maxPrice.trim() === value}
                    onClick={() => set({ maxPrice: draft.maxPrice.trim() === value ? "" : value })}
                    className={chip(draft.maxPrice.trim() === value)}
                  >
                    Under {value}
                  </button>
                ))}
              </div>
            )}
          </Section>

          <Section
            title="Tags"
            aside={draft.tags.length > 0 ? `${draft.tags.length} of ${MAX_TAGS}` : undefined}
            hint="A product must have every tag you pick."
          >
            <div className="flex flex-wrap gap-2" role="group" aria-label="Tags">
              {tags.map((tag) => {
                const on = draft.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={on}
                    disabled={!on && draft.tags.length >= MAX_TAGS}
                    onClick={() => set({ tags: toggle(draft.tags, tag) })}
                    className={chip(on)}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section
            title="Shops"
            aside={
              draft.merchantIds.length > 0 ? `${draft.merchantIds.length} selected` : undefined
            }
            hint="Pick none to see every shop."
          >
            <ul className="space-y-1.5" aria-label="Shops">
              {merchants.map((m) => {
                const on = draft.merchantIds.includes(m.id);
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => set({ merchantIds: toggle(draft.merchantIds, m.id) })}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm transition-colors",
                        on
                          ? "border-primary/50 bg-primary/10"
                          : "border-border/60 bg-card hover:bg-secondary/60",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "grid h-5 w-5 shrink-0 place-items-center rounded-md border",
                          on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border",
                        )}
                      >
                        {on && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{m.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {m.count} {m.count === 1 ? "product" : "products"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Section>

          <Section title="Ships to" hint="Hides products the shop does not sell in that country.">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Ships to">
              {[undefined, ...shopCountries].map((c) => (
                <button
                  key={c?.code ?? "anywhere"}
                  type="button"
                  aria-pressed={draft.location === c?.code}
                  onClick={() => set({ location: c?.code })}
                  className={chip(draft.location === c?.code)}
                >
                  {c?.name ?? "Anywhere"}
                </button>
              ))}
            </div>
          </Section>
        </div>

        <div className="space-y-2 border-t border-border/50 bg-dialog px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {!priceError && matches === 0 && (
            <p role="status" className="text-center text-xs text-muted-foreground">
              No products match these filters.
            </p>
          )}
          <Button
            type="button"
            className="h-12 w-full"
            disabled={priceError !== null || matches === 0}
            onClick={() => {
              onApply({ ...draft, maxPrice: draft.maxPrice.trim() });
              onOpenChange(false);
            }}
          >
            Show {matches} {matches === 1 ? "product" : "products"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
