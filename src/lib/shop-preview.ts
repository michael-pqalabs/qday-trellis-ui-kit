// Client-only preview of shopping from Trellis. Nothing is sent, charged or shipped.
// The catalogue and the search follow the Bazaar (`qday-bazaar-discovery-service`): products are
// `ecommerce` listings with merchant, accepted blockchains, stock snapshot and a decimal price; a
// search matches ANY word as the start of a word, ranks by match, and pages by 5.
import type { QPass } from "@/lib/qpass";
import {
  chainForNetwork,
  feeTokenFor,
  previewSampleBalances,
  type PreviewWallet,
} from "@/lib/wallet-preview";

export interface ShopProduct {
  id: string;
  /** The merchant's own SKU. */
  sku: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  /** Face value as a decimal string, in the stablecoin of the blockchain it is paid on. */
  price: string;
  /** Units in stock at the merchant's last upload. Null = unlimited. */
  quantity: number | null;
  /** Blockchains the merchant accepts payment on (`base` pays USDC, `qday` pays USD8). */
  chains: string[];
  merchant: { id: string; name: string };
  fulfillment: string;
  /** Countries (ISO 3166-1 alpha-2) the merchant sells to. Empty = no restriction. */
  acceptedLocations: string[];
  /** Countries the merchant does not sell to. */
  bannedLocations: string[];
}

/** A listing as written below: the country lists may be left out. */
type ShopListing = Omit<ShopProduct, "acceptedLocations" | "bannedLocations"> &
  Partial<Pick<ShopProduct, "acceptedLocations" | "bannedLocations">>;

const EVERYDAY = { id: "m-everyday", name: "Everyday Goods" };
const DESK = { id: "m-desk", name: "Desk & Paper Co." };
const CABLE = { id: "m-cable", name: "Cable Corner" };
const BOTH = ["base", "qday"];

/** Illustrative listings, newest first. Prices and stock are sample data, not a real shop. */
const listings: ShopListing[] = [
  {
    id: "p-earbuds",
    sku: "earbuds",
    name: "Wireless earbuds",
    description: "Bluetooth earbuds with a charging case and about 20 hours of playback.",
    category: "Electronics",
    tags: ["audio", "wireless"],
    price: "39",
    quantity: 12,
    chains: BOTH,
    merchant: CABLE,
    fulfillment: "Ships in 2 to 3 days",
  },
  {
    id: "p-sticker-pack",
    sku: "sticker-pack",
    name: "Sticker pack",
    description: "Twelve waterproof vinyl stickers for laptops and bottles.",
    category: "Stationery",
    tags: ["stickers", "gift"],
    price: "4.5",
    quantity: null,
    chains: BOTH,
    merchant: DESK,
    fulfillment: "Ships in 1 to 2 days",
  },
  {
    id: "p-hoodie",
    sku: "hoodie",
    name: "Fleece hoodie",
    description: "A warm, heavyweight fleece hoodie in charcoal.",
    category: "Apparel",
    tags: ["clothing", "winter"],
    price: "59",
    quantity: 0,
    chains: BOTH,
    merchant: EVERYDAY,
    fulfillment: "Ships in 3 to 5 days",
  },
  {
    id: "p-tote-bag",
    sku: "tote-bag",
    name: "Canvas tote bag",
    description: "A sturdy cotton canvas tote with an inside pocket.",
    category: "Apparel",
    tags: ["bag", "gift"],
    price: "15",
    quantity: 30,
    chains: BOTH,
    merchant: EVERYDAY,
    fulfillment: "Ships in 2 to 3 days",
  },
  {
    id: "p-desk-mat",
    sku: "desk-mat",
    acceptedLocations: ["VN", "SG", "US"],
    name: "Felt desk mat",
    description: "A large felt desk mat that keeps a keyboard and mouse in place.",
    category: "Home",
    tags: ["desk"],
    price: "29",
    quantity: 8,
    chains: BOTH,
    merchant: DESK,
    fulfillment: "Ships in 3 to 5 days",
  },
  {
    id: "p-pen-set",
    sku: "pen-set",
    name: "Gel pen set (4)",
    description: "Four smooth gel pens in black, blue, red and green.",
    category: "Stationery",
    tags: ["pens", "desk"],
    price: "7.2",
    quantity: 80,
    chains: ["qday"],
    merchant: DESK,
    fulfillment: "Ships in 1 to 2 days",
  },
  {
    id: "p-notebook",
    sku: "notebook",
    name: "Dot-grid notebook",
    description: "A5 notebook with 160 dot-grid pages and a lay-flat spine.",
    category: "Stationery",
    tags: ["paper", "desk"],
    price: "9.5",
    quantity: 60,
    chains: BOTH,
    merchant: DESK,
    fulfillment: "Ships in 1 to 2 days",
  },
  {
    id: "p-wireless-charger",
    sku: "wireless-charger",
    acceptedLocations: ["US", "GB", "DE", "FR", "SG"],
    name: "Wireless charger",
    description: "A 15 W wireless charging pad for phones and earbuds.",
    category: "Electronics",
    tags: ["charging", "wireless"],
    price: "24.9",
    quantity: 15,
    chains: ["base"],
    merchant: CABLE,
    fulfillment: "Ships in 2 to 3 days",
  },
  {
    id: "p-phone-stand",
    sku: "phone-stand",
    name: "Aluminium phone stand",
    description: "A foldable aluminium stand that holds a phone at a comfortable angle.",
    category: "Electronics",
    tags: ["desk", "phone"],
    price: "14",
    quantity: 3,
    chains: BOTH,
    merchant: CABLE,
    fulfillment: "Ships in 2 to 3 days",
  },
  {
    id: "p-usb-c-cable",
    sku: "usb-c-cable",
    name: "USB-C cable, 1 m",
    description: "A braided USB-C charging and data cable, one metre long.",
    category: "Electronics",
    tags: ["charging", "cable"],
    price: "6.9",
    quantity: 120,
    chains: BOTH,
    merchant: CABLE,
    fulfillment: "Ships in 1 to 2 days",
  },
  {
    id: "p-steel-bottle",
    sku: "steel-bottle",
    bannedLocations: ["AU"],
    name: "Steel water bottle",
    description: "A 500 ml insulated stainless steel bottle that keeps drinks cold for a day.",
    category: "Home",
    tags: ["kitchen", "outdoor"],
    price: "18.5",
    quantity: 40,
    chains: BOTH,
    merchant: EVERYDAY,
    fulfillment: "Ships in 2 to 3 days",
  },
  {
    id: "p-ceramic-mug",
    sku: "ceramic-mug",
    name: "Ceramic mug",
    description: "A 350 ml stoneware mug, dishwasher safe.",
    category: "Home",
    tags: ["kitchen", "gift"],
    price: "12",
    quantity: 24,
    chains: BOTH,
    merchant: EVERYDAY,
    fulfillment: "Ships in 2 to 3 days",
  },
];

export const shopCatalog: ShopProduct[] = listings.map((listing) => ({
  acceptedLocations: [],
  bannedLocations: [],
  ...listing,
}));

export const getShopProduct = (id: string) => shopCatalog.find((product) => product.id === id);

// ---------------------------------------------------------------------------------- money
// Prices are decimal strings with up to 6 decimals; sums are done in integer units (as the
// merchant SDK does) so they never go through floating point.
const UNIT = 1_000_000n;

export function toAtomic(price: string): bigint {
  const [whole = "0", fraction = ""] = price.split(".");
  return BigInt(whole) * UNIT + BigInt(fraction.padEnd(6, "0").slice(0, 6));
}

/** `12000000n` -> "12.00", `4500000n` -> "4.50", `1234500n` -> "1.2345". */
export function formatAtomic(value: bigint): string {
  const whole = value / UNIT;
  const fraction = (value % UNIT).toString().padStart(6, "0").replace(/0+$/, "").padEnd(2, "0");
  return `${whole}.${fraction}`;
}

export const formatPrice = (price: string) => formatAtomic(toAtomic(price));

// ---------------------------------------------------------------------------------- search
export const SHOP_PAGE_SIZE = 5;
const MAX_SEARCH_TERMS = 8;
const MIN_PREFIX_LENGTH = 3;

export type ShopSort = "relevance" | "newest" | "price_asc" | "price_desc";

export const SHOP_SORT_LABELS: Record<ShopSort, string> = {
  relevance: "Best match",
  newest: "Newest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
};

/** The words of a search: letters and digits only, as the Bazaar reads them. */
export function searchWords(search: string): string[] {
  return (search.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).slice(0, MAX_SEARCH_TERMS);
}

/** A word matches as the start of a word ("ear" finds "earbuds"), and a trailing "s" is dropped ("bars" finds "bar"). */
function termMatches(term: string, tokens: string[]) {
  const stem = term.length > MIN_PREFIX_LENGTH && term.endsWith("s") ? term.slice(0, -1) : term;
  return tokens.some((token) =>
    stem.length >= MIN_PREFIX_LENGTH ? token.startsWith(stem) : token === stem,
  );
}

/** Any word counts; a match in the name beats category or tags, which beat the description. */
export function relevance(product: ShopProduct, words: string[]): number {
  const tokens = (text: string) => searchWords(text);
  const name = tokens(product.name);
  const labels = tokens([product.category, ...product.tags].join(" "));
  const description = tokens(product.description);
  let score = 0;
  for (const word of words) {
    if (termMatches(word, name)) score += 4;
    else if (termMatches(word, labels)) score += 2;
    else if (termMatches(word, description)) score += 1;
  }
  return score;
}

export const MAX_TAGS = 5;
export const MAX_MERCHANT_FILTER = 50;

export interface ShopQuery {
  search?: string | undefined;
  sort?: ShopSort | undefined;
  category?: string | undefined;
  /** Tags a product must ALL have. */
  tags?: string[] | undefined;
  /** The most a product may cost, inclusive, as a decimal string. */
  maxPrice?: string | undefined;
  /** Only these merchants (by id). Empty or left out = every merchant. */
  merchantIds?: string[] | undefined;
  /** The buyer's country: kept when not banned and, if the product lists countries, one of them. */
  location?: string | undefined;
  /** Only products that accept payment on this blockchain. */
  chainId: string;
  offset?: number;
  limit?: number;
}

export interface ShopPage {
  items: ShopProduct[];
  total: number;
  hasMore: boolean;
}

export function searchProducts(query: ShopQuery): ShopPage {
  const words = searchWords(query.search ?? "");
  const searching = words.length > 0;
  const sort =
    query.sort === "relevance" && !searching
      ? "newest"
      : (query.sort ?? (searching ? "relevance" : "newest"));
  const category = query.category?.toLowerCase();
  const tags = (query.tags ?? []).map((tag) => tag.toLowerCase());
  const maxPrice =
    query.maxPrice && validateMaxPrice(query.maxPrice) === null
      ? toAtomic(query.maxPrice)
      : undefined;
  const merchants = query.merchantIds ?? [];
  const location = query.location?.toUpperCase();

  const matches = shopCatalog
    .map((product, listed) => ({
      product,
      listed,
      score: searching ? relevance(product, words) : 0,
    }))
    .filter(({ product, score }) => {
      if (!product.chains.includes(query.chainId)) return false;
      if (category && product.category.toLowerCase() !== category) return false;
      if (tags.some((tag) => !product.tags.some((t) => t.toLowerCase() === tag))) return false;
      if (maxPrice !== undefined && toAtomic(product.price) > maxPrice) return false;
      if (merchants.length > 0 && !merchants.includes(product.merchant.id)) return false;
      if (location && !sellsTo(product, location)) return false;
      return !searching || score > 0;
    });

  matches.sort((a, b) => {
    if (sort === "price_asc" || sort === "price_desc") {
      const diff = Number(toAtomic(a.product.price) - toAtomic(b.product.price));
      if (diff !== 0) return sort === "price_asc" ? diff : -diff;
    } else if (sort === "relevance" && b.score !== a.score) {
      return b.score - a.score;
    }
    return a.listed - b.listed; // newest listing first, and a stable tie-break
  });

  const offset = query.offset ?? 0;
  const limit = query.limit ?? SHOP_PAGE_SIZE;
  return {
    items: matches.slice(offset, offset + limit).map(({ product }) => product),
    total: matches.length,
    hasMore: offset + limit < matches.length,
  };
}

/** A product is kept when the country is not banned and, if it lists countries it sells to, is one of them. */
export function sellsTo(product: ShopProduct, country: string): boolean {
  const code = country.toUpperCase();
  if (product.bannedLocations.includes(code)) return false;
  return product.acceptedLocations.length === 0 || product.acceptedLocations.includes(code);
}

const PRICE_PATTERN = /^\d{1,31}(\.\d{1,6})?$/;

/** The Bazaar's rule for `maxPrice`: a non-negative decimal with at most 6 decimals. Empty is fine. */
export function validateMaxPrice(input: string): string | null {
  const value = input.trim();
  if (value === "" || PRICE_PATTERN.test(value)) return null;
  return 'Enter a price like "25" or "49.99" (up to 6 decimals).';
}

/** Countries a buyer can pick as "ships to": illustrative, the real list is any ISO code. */
export const shopCountries = [
  { code: "VN", name: "Vietnam" },
  { code: "SG", name: "Singapore" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "AU", name: "Australia" },
] as const;

export const countryName = (code: string) =>
  shopCountries.find((c) => c.code === code)?.name ?? code;

/** Tags of the products payable on this blockchain, most common first. */
export function shopTags(chainId: string): string[] {
  const counts = new Map<string, number>();
  for (const product of shopCatalog) {
    if (!product.chains.includes(chainId)) continue;
    for (const tag of product.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([tag]) => tag);
}

/** Merchants with a product payable on this blockchain, with how many. */
export function shopMerchants(chainId: string): { id: string; name: string; count: number }[] {
  const merchants = new Map<string, { id: string; name: string; count: number }>();
  for (const product of shopCatalog) {
    if (!product.chains.includes(chainId)) continue;
    const found = merchants.get(product.merchant.id);
    if (found) found.count += 1;
    else merchants.set(product.merchant.id, { ...product.merchant, count: 1 });
  }
  return [...merchants.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** What the filter popup edits. The blockchain, currency and `ecommerce` type are not filters here. */
export interface ShopFilters {
  sort?: ShopSort | undefined;
  category?: string | undefined;
  tags: string[];
  /** Decimal string; empty = no limit. */
  maxPrice: string;
  merchantIds: string[];
  location?: string | undefined;
}

export const emptyFilters = (): ShopFilters => ({ tags: [], maxPrice: "", merchantIds: [] });

/** How many filters are set (sort is an order, not a filter). Each of the five kinds counts once. */
export function activeFilterCount(filters: ShopFilters): number {
  return [
    filters.category !== undefined,
    filters.tags.length > 0,
    filters.maxPrice.trim() !== "",
    filters.merchantIds.length > 0,
    filters.location !== undefined,
  ].filter(Boolean).length;
}

export function filtersToQuery(
  search: string,
  filters: ShopFilters,
  chainId: string,
  limit?: number,
): ShopQuery {
  return {
    search,
    sort: filters.sort,
    category: filters.category,
    tags: filters.tags,
    maxPrice: filters.maxPrice.trim(),
    merchantIds: filters.merchantIds,
    location: filters.location,
    chainId,
    ...(limit === undefined ? {} : { limit }),
  };
}

/** Categories that have a product payable on this blockchain, in catalogue order. */
export function shopCategories(chainId: string): string[] {
  return [
    ...new Set(
      shopCatalog.filter((p) => p.chains.includes(chainId)).map((product) => product.category),
    ),
  ].sort();
}

// ---------------------------------------------------------------------------------- cart
export const MAX_CART_QUANTITY = 10;

export interface CartLine {
  productId: string;
  quantity: number;
}

export type OrderStatus = "paid" | "shipped";

export interface ShopOrder {
  id: string;
  createdAt: number;
  status: OrderStatus;
  lines: { productId: string; name: string; price: string; quantity: number }[];
  /** Total as a decimal string. */
  total: string;
  chainId: string;
  paidFrom: { id: string; name: string; kind: PayAccount["kind"] };
  shipTo: string;
}

export interface ShopState {
  cart: CartLine[];
  orders: ShopOrder[];
}

/** The most of a product one cart may hold: the stock, and never more than a sensible cap. */
export const maxQuantity = (product: ShopProduct) =>
  Math.min(MAX_CART_QUANTITY, product.quantity ?? MAX_CART_QUANTITY);

export const inStock = (product: ShopProduct) => product.quantity === null || product.quantity > 0;

/** "Only 3 left" for low stock, "Out of stock" at zero, nothing otherwise. */
export function stockNote(product: ShopProduct): string | null {
  if (product.quantity === null) return null;
  if (product.quantity === 0) return "Out of stock";
  return product.quantity <= 5 ? `Only ${product.quantity} left` : null;
}

export const canPayOn = (product: ShopProduct, chainId: string) => product.chains.includes(chainId);

export function addToCart(state: ShopState, productId: string): ShopState {
  const product = getShopProduct(productId);
  if (!product || !inStock(product)) return state;
  const existing = state.cart.find((line) => line.productId === productId);
  if (!existing) return { ...state, cart: [...state.cart, { productId, quantity: 1 }] };
  return setQuantity(state, productId, existing.quantity + 1);
}

/** Zero or less removes the line; more than the stock allows is held at the stock. */
export function setQuantity(state: ShopState, productId: string, quantity: number): ShopState {
  const product = getShopProduct(productId);
  if (!product) return state;
  if (quantity <= 0) return removeFromCart(state, productId);
  const next = Math.min(Math.floor(quantity), maxQuantity(product));
  return {
    ...state,
    cart: state.cart.map((line) =>
      line.productId === productId ? { ...line, quantity: next } : line,
    ),
  };
}

export function removeFromCart(state: ShopState, productId: string): ShopState {
  return { ...state, cart: state.cart.filter((line) => line.productId !== productId) };
}

export const cartCount = (state: ShopState) =>
  state.cart.reduce((sum, line) => sum + line.quantity, 0);

export interface PricedLine {
  product: ShopProduct;
  quantity: number;
  total: bigint;
  /** Whether the merchant accepts payment on the blockchain in use. */
  payable: boolean;
}

export function pricedCart(state: ShopState, chainId: string): PricedLine[] {
  return state.cart.flatMap((line) => {
    const product = getShopProduct(line.productId);
    if (!product) return [];
    return [
      {
        product,
        quantity: line.quantity,
        total: toAtomic(product.price) * BigInt(line.quantity),
        payable: canPayOn(product, chainId),
      },
    ];
  });
}

export const cartTotal = (lines: readonly PricedLine[]) =>
  lines.reduce((sum, line) => sum + line.total, 0n);

// ---------------------------------------------------------------------------------- paying
export interface PayAccount {
  id: string;
  name: string;
  kind: "wallet" | "signetpass";
  balance: number;
}

/**
 * Accounts the user can pay from on a blockchain: the Main Wallets, and the active SignetPasses on
 * that blockchain. Wallet balances are zero unless the preview "Sample" switch is on; SignetPass
 * balances are the ones shown in Agentic Payments.
 */
export function payAccounts(input: {
  wallets: readonly Pick<PreviewWallet, "id" | "name" | "networkId">[];
  passes: readonly Pick<QPass, "id" | "name" | "status" | "chainId" | "balance">[];
  chainId: string;
  sampleBalances: boolean;
}): PayAccount[] {
  const sample = previewSampleBalances[feeTokenFor(input.chainId).toLowerCase()] ?? 0;
  const wallets = input.wallets
    .filter((w) => !w.networkId || chainForNetwork(w.networkId).id === input.chainId)
    .map((w) => ({
      id: w.id,
      name: w.name,
      kind: "wallet" as const,
      balance: input.sampleBalances ? sample : 0,
    }));
  const passes = input.passes
    .filter((p) => p.status === "active" && p.chainId === input.chainId)
    .map((p) => ({ id: p.id, name: p.name, kind: "signetpass" as const, balance: p.balance }));
  return [...wallets, ...passes];
}

/** Illustrative shipping address; the preview has no address book. */
export const SAMPLE_SHIP_TO = "Home · 12 Example Street, Springfield";

const toUnits = (amount: number) => BigInt(Math.round(amount * 1_000_000));

/** Why this cart cannot be paid from this account, or null when it can. */
export function checkoutProblem(
  state: ShopState,
  chainId: string,
  account: PayAccount | undefined,
): string | null {
  const lines = pricedCart(state, chainId);
  if (lines.length === 0) return "Your cart is empty.";
  const unavailable = lines.find((line) => !line.payable);
  if (unavailable) return `${unavailable.product.name} cannot be paid on this blockchain.`;
  const soldOut = lines.find((line) => !inStock(line.product));
  if (soldOut) return `${soldOut.product.name} is out of stock.`;
  const tooMany = lines.find((line) => line.quantity > maxQuantity(line.product));
  if (tooMany) return `Only ${maxQuantity(tooMany.product)} of ${tooMany.product.name} available.`;
  if (!account) return "Choose an account to pay from.";
  const total = cartTotal(lines);
  if (toUnits(account.balance) < total) {
    const token = feeTokenFor(chainId);
    return `Not enough ${token} in ${account.name}. Balance ${formatAtomic(toUnits(account.balance))}, needed ${formatAtomic(total)}.`;
  }
  return null;
}

export function placeOrder(
  state: ShopState,
  input: { chainId: string; account: PayAccount; now?: number },
): { state: ShopState; order: ShopOrder } | { error: string } {
  const error = checkoutProblem(state, input.chainId, input.account);
  if (error) return { error };
  const lines = pricedCart(state, input.chainId);
  const order: ShopOrder = {
    id: `ORD-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
    createdAt: input.now ?? Date.now(),
    status: "paid",
    lines: lines.map(({ product, quantity }) => ({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
    })),
    total: formatAtomic(cartTotal(lines)),
    chainId: input.chainId,
    paidFrom: { id: input.account.id, name: input.account.name, kind: input.account.kind },
    shipTo: SAMPLE_SHIP_TO,
  };
  return { state: { cart: [], orders: [order, ...state.orders] }, order };
}

/** Preview helper: the merchant ships an order. */
export function shipOrder(state: ShopState, orderId: string): ShopState {
  return {
    ...state,
    orders: state.orders.map((o) =>
      o.id === orderId && o.status === "paid" ? { ...o, status: "shipped" } : o,
    ),
  };
}

// ---------------------------------------------------------------------------------- storage
const KEY = "trellis-shop-v1";

export const emptyShopState = (): ShopState => ({ cart: [], orders: [] });

export function loadShopState(): ShopState {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) {
      const state = JSON.parse(raw) as ShopState;
      if (Array.isArray(state.cart) && Array.isArray(state.orders)) return state;
    }
  } catch {
    /* SSR or blocked storage */
  }
  return emptyShopState();
}

export function saveShopState(state: ShopState) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* Preview storage unavailable */
  }
}

/** Preview helper: empties the cart and the orders. */
export function resetShopState(): ShopState {
  const state = emptyShopState();
  saveShopState(state);
  return state;
}
