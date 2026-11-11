import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronDown,
  PackageCheck,
  RotateCcw,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/bottom-nav";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { NetworkSummary } from "@/components/network-picker";
import { ScreenHeader, headerActionClass } from "@/components/screen-header";
import { ShopFiltersDialog } from "@/components/shop-filters-dialog";
import {
  ProductCard,
  ProductDialog,
  ProductThumb,
  QuantityStepper,
} from "@/components/shop-product";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStableToken, useWalletPreview } from "@/components/wallet-preview-provider";
import { cn } from "@/lib/utils";
import { loadQPassState, type QPass } from "@/lib/qpass";
import {
  SHOP_PAGE_SIZE,
  SHOP_SORT_LABELS,
  activeFilterCount,
  addToCart,
  cartCount,
  cartTotal,
  countryName,
  emptyFilters,
  emptyShopState,
  formatAtomic,
  filtersToQuery,
  formatPrice,
  loadShopState,
  maxQuantity,
  placeOrder,
  pricedCart,
  removeFromCart,
  resetShopState,
  saveShopState,
  searchProducts,
  searchWords,
  setQuantity,
  shipOrder,
  shopMerchants,
  type PayAccount,
  type ShopFilters,
  type ShopProduct,
  type ShopSort,
  type ShopState,
} from "@/lib/shop-preview";
import { chainForNetwork } from "@/lib/wallet-preview";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shopping — Trellis Wallet" },
      {
        name: "description",
        content: "Search products and pay for them from Trellis in the wallet preview.",
      },
      { property: "og:title", content: "Shopping — Trellis Wallet" },
      {
        property: "og:description",
        content: "Search and buy from Trellis, without a terminal or an agent.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShopPage,
});

const tabClass =
  "h-full min-w-fit flex-1 rounded-full px-4 text-[11px] font-semibold border border-transparent data-[state=active]:border-primary/50 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-none";

function ShopPage() {
  const { networkId } = useWalletPreview();
  const chain = chainForNetwork(networkId);
  const { stable, chainName } = useStableToken();

  const [shop, setShop] = useState<ShopState | null>(null);
  const [passes, setPasses] = useState<QPass[]>([]);
  const [tab, setTab] = useState("browse");
  const [viewing, setViewing] = useState<ShopProduct | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ShopFilters>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [shown, setShown] = useState(SHOP_PAGE_SIZE);

  useEffect(() => {
    setShop(loadShopState());
    setPasses(loadQPassState().passes);
  }, []);

  const update = (change: (state: ShopState) => ShopState) => {
    const next = change(shop ?? emptyShopState());
    saveShopState(next);
    setShop(next);
    return next;
  };

  const searching = searchWords(search).length > 0;
  const activeSort: ShopSort =
    filters.sort === "relevance" && !searching
      ? "newest"
      : (filters.sort ?? (searching ? "relevance" : "newest"));
  const page = useMemo(
    () => searchProducts(filtersToQuery(search, filters, chain.id, shown)),
    [search, filters, chain.id, shown],
  );
  const filterCount = activeFilterCount(filters);
  const filtered = searching || filterCount > 0;
  const merchantNames = useMemo(
    () => new Map(shopMerchants(chain.id).map((m) => [m.id, m.name])),
    [chain.id],
  );
  // One removable chip per filter in force, so none hides inside the popup.
  const chips: { key: string; label: string; remove: () => void }[] = [
    ...(filters.category
      ? [
          {
            key: "category",
            label: filters.category,
            remove: () => setFilters((f) => ({ ...f, category: undefined })),
          },
        ]
      : []),
    ...filters.tags.map((tag) => ({
      key: `tag-${tag}`,
      label: tag,
      remove: () => setFilters((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) })),
    })),
    ...(filters.maxPrice.trim()
      ? [
          {
            key: "price",
            label: `Up to ${filters.maxPrice.trim()} ${stable}`,
            remove: () => setFilters((f) => ({ ...f, maxPrice: "" })),
          },
        ]
      : []),
    ...filters.merchantIds.map((id) => ({
      key: `shop-${id}`,
      label: merchantNames.get(id) ?? id,
      remove: () =>
        setFilters((f) => ({ ...f, merchantIds: f.merchantIds.filter((m) => m !== id) })),
    })),
    ...(filters.location
      ? [
          {
            key: "location",
            label: `Ships to ${countryName(filters.location)}`,
            remove: () => setFilters((f) => ({ ...f, location: undefined })),
          },
        ]
      : []),
  ];

  const state = shop ?? emptyShopState();
  const count = cartCount(state);
  const lines = pricedCart(state, chain.id);
  const total = cartTotal(lines);
  const hasUnpayable = lines.some((line) => !line.payable);
  const quantityOf = (id: string) => state.cart.find((l) => l.productId === id)?.quantity ?? 0;

  const add = (product: ShopProduct) => update((s) => addToCart(s, product.id));

  const clearFilters = () => {
    setSearch("");
    setFilters(emptyFilters());
    setShown(SHOP_PAGE_SIZE);
  };

  const paid = (account: PayAccount) => {
    const result = placeOrder(state, { chainId: chain.id, account });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    saveShopState(result.state);
    setShop(result.state);
    setCheckingOut(false);
    setTab("orders");
    toast.success(`Order ${result.order.id} paid`);
  };

  return (
    <div className="flex min-h-dvh justify-center bg-background">
      <main className="flex min-h-dvh w-full max-w-md flex-col px-5 pb-0 pt-3">
        <NetworkSummary networkId={networkId} />
        <ScreenHeader
          action={
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
              className={headerActionClass}
              onClick={() => setTab("cart")}
            >
              <ShoppingCart />
              {count > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
                >
                  {count}
                </span>
              )}
            </Button>
          }
        />
        <h1 className="sr-only">Shopping</h1>

        {!shop ? (
          <Skeleton className="mt-6 h-60 rounded-2xl" />
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="mt-6">
            <TabsList className="flex h-10 w-full justify-start gap-0.5 overflow-x-auto rounded-full bg-secondary/70 p-[3px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <TabsTrigger value="browse" className={tabClass}>
                Browse
              </TabsTrigger>
              <TabsTrigger value="cart" className={tabClass}>
                Cart{count > 0 && <span className="ml-1 opacity-80">{count}</span>}
              </TabsTrigger>
              <TabsTrigger value="orders" className={tabClass}>
                Orders
                {state.orders.length > 0 && (
                  <span className="ml-1 opacity-80">{state.orders.length}</span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="mt-4">
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type="search"
                  aria-label="Search products"
                  placeholder="Search products"
                  value={search}
                  maxLength={200}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShown(SHOP_PAGE_SIZE);
                  }}
                  className="pl-9 pr-9"
                />
                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setSearch("");
                      setShown(SHOP_PAGE_SIZE);
                    }}
                    className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={filterCount > 0 ? `Filters, ${filterCount} applied` : "Filters"}
                  className="h-8 gap-1.5 bg-card"
                  onClick={() => setFiltersOpen(true)}
                >
                  <SlidersHorizontal className="!h-3.5 !w-3.5" />
                  Filters
                  {filterCount > 0 && (
                    <span
                      aria-hidden="true"
                      className="grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
                    >
                      {filterCount}
                    </span>
                  )}
                </Button>
                <div className="relative">
                  <select
                    aria-label="Sort products"
                    value={activeSort}
                    onChange={(e) => {
                      setFilters((f) => ({ ...f, sort: e.target.value as ShopSort }));
                      setShown(SHOP_PAGE_SIZE);
                    }}
                    className="h-8 appearance-none rounded-full border border-border/60 bg-card pl-8 pr-8 text-xs font-medium text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {(Object.keys(SHOP_SORT_LABELS) as ShopSort[]).map((value) => (
                      <option
                        key={value}
                        value={value}
                        disabled={value === "relevance" && !searching}
                      >
                        {SHOP_SORT_LABELS[value]}
                      </option>
                    ))}
                  </select>
                  <ArrowUpDown
                    aria-hidden="true"
                    className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                  />
                  <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
              </div>
              {chips.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Applied filters">
                  {chips.map((chip) => (
                    <li key={chip.key}>
                      <button
                        type="button"
                        aria-label={`Remove filter ${chip.label}`}
                        onClick={() => {
                          chip.remove();
                          setShown(SHOP_PAGE_SIZE);
                        }}
                        className="flex h-7 items-center gap-1 rounded-full border border-primary/40 bg-primary/15 pl-3 pr-2 text-[11px] font-medium text-primary"
                      >
                        {chip.label}
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3" />

              {page.items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center">
                  <p className="text-sm font-medium">No products found</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try other words, or fewer filters.
                  </p>
                  {filtered && (
                    <Button variant="outline" size="sm" className="mt-3" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <ul className="grid grid-cols-2 gap-3" aria-label="Products">
                    {page.items.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        stable={stable}
                        inCart={quantityOf(product.id)}
                        max={maxQuantity(product)}
                        onOpen={() => setViewing(product)}
                        onAdd={() => add(product)}
                        onQuantity={(n) => update((s) => setQuantity(s, product.id, n))}
                      />
                    ))}
                  </ul>
                  <p role="status" className="mt-3 text-center text-[11px] text-muted-foreground">
                    Showing {page.items.length} of {page.total}
                  </p>
                  {page.hasMore && (
                    <Button
                      variant="outline"
                      className="mt-2 w-full"
                      onClick={() => setShown((n) => n + SHOP_PAGE_SIZE)}
                    >
                      Show {SHOP_PAGE_SIZE} more
                    </Button>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="cart" className="mt-4">
              {lines.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center">
                  <p className="text-sm font-medium">Your cart is empty</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add products from Browse, then pay from here.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setTab("browse")}
                  >
                    Browse products
                  </Button>
                </div>
              ) : (
                <>
                  <ul className="space-y-2" aria-label="Cart">
                    {lines.map(({ product, quantity, total: lineTotal, payable }) => (
                      <li
                        key={product.id}
                        className="flex gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm"
                      >
                        <ProductThumb
                          product={product}
                          className="h-20 w-20 rounded-xl"
                          iconClassName="h-8 w-8"
                        />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{product.name}</p>
                              <p className="truncate text-[11px] text-muted-foreground">
                                {product.merchant.name}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Remove ${product.name}`}
                              className="-mr-1 -mt-1 h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => update((s) => removeFromCart(s, product.id))}
                            >
                              <Trash2 className="!h-4 !w-4" />
                            </Button>
                          </div>
                          {!payable && (
                            <p className="text-[11px] font-medium text-destructive">
                              Not accepted on {chainName}
                            </p>
                          )}
                          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                            <QuantityStepper
                              name={product.name}
                              quantity={quantity}
                              max={maxQuantity(product)}
                              onChange={(n) => update((s) => setQuantity(s, product.id, n))}
                              className="w-28"
                            />
                            <div className="text-right">
                              <p className="text-sm font-semibold">
                                {formatAtomic(lineTotal)} {stable}
                              </p>
                              {quantity > 1 && (
                                <p className="text-[11px] text-muted-foreground">
                                  {formatPrice(product.price)} each
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-primary/5 px-3 py-3">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-base font-semibold">
                      {formatAtomic(total)} {stable}
                    </span>
                  </div>
                  {hasUnpayable && (
                    <p role="alert" className="mt-2 text-center text-xs text-destructive">
                      Some items cannot be paid on {chainName}. Remove them, or switch the
                      blockchain on the wallet screen.
                    </p>
                  )}
                  <Button
                    className="mt-3 h-12 w-full"
                    disabled={hasUnpayable}
                    onClick={() => setCheckingOut(true)}
                  >
                    Checkout · {formatAtomic(total)} {stable}
                  </Button>
                </>
              )}
            </TabsContent>

            <TabsContent value="orders" className="mt-4">
              {state.orders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center">
                  <p className="text-sm font-medium">No orders yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Orders you pay for here appear in this list.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2" aria-label="Orders">
                  {state.orders.map((order) => (
                    <li
                      key={order.id}
                      className="rounded-2xl border border-border/60 bg-card p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">{order.id}</span>
                        <Badge
                          variant={order.status === "shipped" ? "default" : "outline"}
                          className="gap-1"
                        >
                          {order.status === "shipped" ? (
                            <Truck className="h-3 w-3" />
                          ) : (
                            <PackageCheck className="h-3 w-3" />
                          )}
                          {order.status === "shipped" ? "Shipped" : "Paid"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString(undefined, {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                      <div className="mt-3 flex gap-1" aria-hidden="true">
                        <span className="h-1 flex-1 rounded-full bg-primary" />
                        <span
                          className={cn(
                            "h-1 flex-1 rounded-full",
                            order.status === "shipped" ? "bg-primary" : "bg-border",
                          )}
                        />
                      </div>
                      <ul className="mt-3 space-y-1 text-xs">
                        {order.lines.map((line) => (
                          <li key={line.productId} className="flex justify-between gap-3">
                            <span className="truncate">
                              {line.quantity} × {line.name}
                            </span>
                            <span className="shrink-0 text-muted-foreground">
                              {formatPrice(line.price)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <dl className="mt-2 space-y-1 border-t border-border/60 pt-2 text-xs">
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Paid from</dt>
                          <dd className="truncate text-right">{order.paidFrom.name}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Ship to</dt>
                          <dd className="text-right">{order.shipTo}</dd>
                        </div>
                        <div className="flex justify-between gap-3 text-sm">
                          <dt className="font-medium">Total</dt>
                          <dd className="font-semibold">
                            {order.total} {stable}
                          </dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 rounded-xl border border-dashed border-border px-3 py-2.5">
                <p className="text-[11px] leading-snug text-muted-foreground">
                  <span className="font-medium text-foreground">Preview only.</span> Nothing is
                  sent, charged or shipped. In the real flow the merchant ships after payment.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full border-dashed text-xs"
                  disabled={!state.orders.some((o) => o.status === "paid")}
                  onClick={() => {
                    const oldest = [...state.orders].reverse().find((o) => o.status === "paid");
                    if (oldest) update((s) => shipOrder(s, oldest.id));
                  }}
                >
                  <Truck />
                  Preview: merchant ships the oldest paid order
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 w-full text-xs text-muted-foreground"
                  onClick={() => {
                    setShop(resetShopState());
                    toast.success("Cart and orders cleared");
                  }}
                >
                  <RotateCcw />
                  Preview: clear cart and orders
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <BottomNav />
        <ProductDialog
          product={viewing}
          stable={stable}
          chainName={chainName}
          inCart={viewing ? quantityOf(viewing.id) : 0}
          onClose={() => setViewing(null)}
          onAdd={() => {
            if (!viewing) return;
            add(viewing);
            toast.success(`${viewing.name} added to cart`);
            setViewing(null);
          }}
        />
        <ShopFiltersDialog
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          applied={filters}
          search={search}
          chainId={chain.id}
          stable={stable}
          chainName={chainName}
          onApply={(next) => {
            setFilters(next);
            setShown(SHOP_PAGE_SIZE);
          }}
        />
        <CheckoutDialog
          open={checkingOut}
          onOpenChange={setCheckingOut}
          shop={state}
          chainId={chain.id}
          passes={passes}
          onPaid={paid}
        />
      </main>
    </div>
  );
}
