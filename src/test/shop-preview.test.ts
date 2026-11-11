import { beforeEach, describe, expect, it } from "vitest";
import {
  MAX_CART_QUANTITY,
  activeFilterCount,
  countryName,
  emptyFilters,
  filtersToQuery,
  sellsTo,
  shopMerchants,
  shopTags,
  validateMaxPrice,
  SHOP_PAGE_SIZE,
  addToCart,
  cartCount,
  cartTotal,
  checkoutProblem,
  emptyShopState,
  formatAtomic,
  formatPrice,
  getShopProduct,
  loadShopState,
  payAccounts,
  placeOrder,
  pricedCart,
  removeFromCart,
  resetShopState,
  saveShopState,
  searchProducts,
  searchWords,
  setQuantity,
  shipOrder,
  shopCategories,
  shopCatalog,
  toAtomic,
  type PayAccount,
  type ShopState,
} from "@/lib/shop-preview";

beforeEach(() => window.sessionStorage.clear());

const names = (page: { items: { sku: string }[] }) => page.items.map((p) => p.sku);
const rich: PayAccount = { id: "w", name: "Wallet 1", kind: "wallet", balance: 120 };
const stateWith = (...ids: string[]): ShopState =>
  ids.reduce((s, id) => addToCart(s, id), emptyShopState());

describe("money", () => {
  it("converts decimals to integer units without floating point error", () => {
    expect(toAtomic("0.1") + toAtomic("0.2")).toBe(toAtomic("0.3"));
    expect(toAtomic("12")).toBe(12_000_000n);
    expect(toAtomic("0.000001")).toBe(1n);
  });

  it("shows at least two decimals and trims the rest", () => {
    expect(formatAtomic(12_000_000n)).toBe("12.00");
    expect(formatAtomic(4_500_000n)).toBe("4.50");
    expect(formatAtomic(1_234_500n)).toBe("1.2345");
    expect(formatPrice("7.2")).toBe("7.20");
  });
});

describe("search (follows the Bazaar)", () => {
  it("reads words as letters and digits only", () => {
    expect(searchWords("  Protein-bars!! & mint ")).toEqual(["protein", "bars", "mint"]);
    expect(searchWords("???")).toEqual([]);
  });

  it("lists newest first without a search, five at a time", () => {
    const page = searchProducts({ chainId: "base" });
    expect(page.items).toHaveLength(SHOP_PAGE_SIZE);
    expect(SHOP_PAGE_SIZE).toBe(5);
    expect(page.items[0]).toBe(shopCatalog[0]);
    expect(page.hasMore).toBe(true);
  });

  it("pages with offset and says when there is no more", () => {
    const first = searchProducts({ chainId: "base" });
    const last = searchProducts({ chainId: "base", offset: first.total - 1 });
    expect(last.items).toHaveLength(1);
    expect(last.hasMore).toBe(false);
    expect(first.total).toBe(11); // 12 listings, one payable only on QDay
  });

  it("only offers products the merchant accepts on the chosen blockchain", () => {
    const base = names(searchProducts({ chainId: "base", limit: 50 }));
    const qday = names(searchProducts({ chainId: "qday", limit: 50 }));
    expect(base).toContain("wireless-charger");
    expect(base).not.toContain("pen-set");
    expect(qday).toContain("pen-set");
    expect(qday).not.toContain("wireless-charger");
  });

  it("matches the start of a word and forgives a plural", () => {
    expect(names(searchProducts({ chainId: "base", search: "ear" }))).toEqual(["earbuds"]);
    expect(names(searchProducts({ chainId: "base", search: "cables" }))).toContain("usb-c-cable");
  });

  it("matches ANY word, and ranks a name match above a description match", () => {
    const sku = names(searchProducts({ chainId: "base", search: "bottle charger" }));
    expect(sku).toEqual(expect.arrayContaining(["steel-bottle", "wireless-charger"]));
    const ranked = names(searchProducts({ chainId: "base", search: "wireless" }));
    // name hit (earbuds, charger) before nothing else; both are tagged and named "wireless"
    expect(ranked.slice(0, 2).sort()).toEqual(["earbuds", "wireless-charger"]);
  });

  it("returns nothing for words that match nothing", () => {
    const page = searchProducts({ chainId: "base", search: "zeppelin" });
    expect(page.items).toEqual([]);
    expect(page.total).toBe(0);
    expect(page.hasMore).toBe(false);
  });

  it("treats a search with no words like no search", () => {
    expect(searchProducts({ chainId: "base", search: "!!!" }).total).toBe(
      searchProducts({ chainId: "base" }).total,
    );
  });

  it("filters by category regardless of case and combines it with a search", () => {
    const stationery = searchProducts({ chainId: "qday", category: "stationery", limit: 50 });
    expect(stationery.items.every((p) => p.category === "Stationery")).toBe(true);
    expect(
      names(searchProducts({ chainId: "qday", category: "stationery", search: "desk" })),
    ).toEqual(expect.arrayContaining(["notebook", "pen-set"]));
  });

  it("sorts by price both ways, and falls back to newest for relevance without a search", () => {
    const up = searchProducts({ chainId: "base", sort: "price_asc", limit: 50 }).items;
    const prices = up.map((p) => toAtomic(p.price));
    expect(prices).toEqual([...prices].sort((a, b) => Number(a - b)));
    const down = searchProducts({ chainId: "base", sort: "price_desc", limit: 50 }).items;
    expect(down[0]?.sku).toBe("hoodie");
    expect(searchProducts({ chainId: "base", sort: "relevance" }).items[0]).toBe(shopCatalog[0]);
  });

  it("lists the categories payable on a blockchain", () => {
    expect(shopCategories("base")).toEqual(["Apparel", "Electronics", "Home", "Stationery"]);
  });
});

describe("cart", () => {
  it("adds, counts and raises the quantity of the same product", () => {
    const state = stateWith("p-mug-missing", "p-ceramic-mug", "p-ceramic-mug", "p-notebook");
    expect(state.cart).toEqual([
      { productId: "p-ceramic-mug", quantity: 2 },
      { productId: "p-notebook", quantity: 1 },
    ]);
    expect(cartCount(state)).toBe(3);
  });

  it("does not add a sold-out product", () => {
    expect(getShopProduct("p-hoodie")?.quantity).toBe(0);
    expect(stateWith("p-hoodie").cart).toEqual([]);
  });

  it("holds the quantity at the stock, and at the cap", () => {
    expect(setQuantity(stateWith("p-phone-stand"), "p-phone-stand", 9).cart[0]?.quantity).toBe(3);
    expect(setQuantity(stateWith("p-notebook"), "p-notebook", 99).cart[0]?.quantity).toBe(
      MAX_CART_QUANTITY,
    );
    let state = stateWith("p-phone-stand");
    for (let i = 0; i < 6; i++) state = addToCart(state, "p-phone-stand");
    expect(state.cart[0]?.quantity).toBe(3);
  });

  it("removes a line at zero or on request", () => {
    const state = stateWith("p-notebook", "p-ceramic-mug");
    expect(setQuantity(state, "p-notebook", 0).cart).toHaveLength(1);
    expect(removeFromCart(state, "p-ceramic-mug").cart.map((l) => l.productId)).toEqual([
      "p-notebook",
    ]);
  });

  it("prices lines exactly and flags those the chain cannot pay", () => {
    const state = setQuantity(stateWith("p-notebook", "p-pen-set"), "p-notebook", 3);
    const lines = pricedCart(state, "base");
    expect(lines.find((l) => l.product.sku === "notebook")?.total).toBe(toAtomic("28.5"));
    expect(lines.find((l) => l.product.sku === "pen-set")?.payable).toBe(false);
    expect(cartTotal(pricedCart(state, "qday"))).toBe(toAtomic("28.5") + toAtomic("7.2"));
  });
});

describe("paying", () => {
  const wallets = [{ id: "main", name: "Wallet 1 (Main)" }];
  const passes = [
    { id: "a", name: "Active pass", status: "active", chainId: "base", balance: 40 },
    { id: "b", name: "Inactive pass", status: "inactive", chainId: "base", balance: 40 },
    { id: "c", name: "QDay pass", status: "active", chainId: "qday", balance: 40 },
  ] as const;

  it("offers Main Wallets and the active SignetPasses of that blockchain", () => {
    const accounts = payAccounts({ wallets, passes, chainId: "base", sampleBalances: false });
    expect(accounts.map((a) => a.name)).toEqual(["Wallet 1 (Main)", "Active pass"]);
    expect(accounts[0]?.balance).toBe(0);
    expect(accounts[1]?.balance).toBe(40);
  });

  it("gives wallets a sample balance when the preview switch is on", () => {
    expect(
      payAccounts({ wallets, passes, chainId: "qday", sampleBalances: true })[0]?.balance,
    ).toBe(120);
  });

  it("explains why a cart cannot be paid", () => {
    expect(checkoutProblem(emptyShopState(), "base", rich)).toBe("Your cart is empty.");
    expect(checkoutProblem(stateWith("p-pen-set"), "base", rich)).toMatch(/cannot be paid on this/);
    expect(checkoutProblem(stateWith("p-notebook"), "base", undefined)).toMatch(
      /Choose an account/,
    );
    const poor = { ...rich, balance: 5 };
    expect(checkoutProblem(stateWith("p-notebook"), "base", poor)).toBe(
      "Not enough USDC in Wallet 1. Balance 5.00, needed 9.50.",
    );
    expect(checkoutProblem(stateWith("p-notebook"), "qday", poor)).toMatch(/Not enough USD8/);
    expect(checkoutProblem(stateWith("p-notebook"), "base", rich)).toBeNull();
  });

  it("places an order, empties the cart and keeps the prices it was bought at", () => {
    const state = setQuantity(stateWith("p-notebook", "p-sticker-pack"), "p-notebook", 2);
    const result = placeOrder(state, { chainId: "base", account: rich, now: 1_000 });
    if ("error" in result) throw new Error(result.error);
    expect(result.state.cart).toEqual([]);
    expect(result.order).toMatchObject({
      status: "paid",
      total: "23.50",
      chainId: "base",
      createdAt: 1_000,
      paidFrom: { id: "w", name: "Wallet 1", kind: "wallet" },
    });
    expect(result.order.id).toMatch(/^ORD-[0-9A-F]{6}$/);
    expect(result.order.lines).toEqual([
      { productId: "p-notebook", name: "Dot-grid notebook", price: "9.5", quantity: 2 },
      { productId: "p-sticker-pack", name: "Sticker pack", price: "4.5", quantity: 1 },
    ]);
    expect(result.state.orders[0]).toBe(result.order);
  });

  it("refuses to place an order that cannot be paid, leaving the cart alone", () => {
    const state = stateWith("p-notebook");
    const result = placeOrder(state, { chainId: "base", account: { ...rich, balance: 1 } });
    expect(result).toEqual({ error: expect.stringMatching(/Not enough USDC/) });
    expect(state.cart).toHaveLength(1);
  });

  it("ships a paid order, once", () => {
    const placed = placeOrder(stateWith("p-notebook"), { chainId: "base", account: rich });
    if ("error" in placed) throw new Error(placed.error);
    const shipped = shipOrder(placed.state, placed.order.id);
    expect(shipped.orders[0]?.status).toBe("shipped");
    expect(shipOrder(shipped, "ORD-NONE").orders[0]?.status).toBe("shipped");
  });
});

describe("storage", () => {
  it("starts empty, round-trips and resets", () => {
    expect(loadShopState()).toEqual({ cart: [], orders: [] });
    saveShopState(stateWith("p-notebook"));
    expect(loadShopState().cart).toHaveLength(1);
    expect(resetShopState()).toEqual({ cart: [], orders: [] });
    expect(loadShopState().cart).toEqual([]);
  });

  it("ignores stored data of the wrong shape", () => {
    window.sessionStorage.setItem("trellis-shop-v1", JSON.stringify({ cart: 1 }));
    expect(loadShopState()).toEqual({ cart: [], orders: [] });
  });
});

describe("filters (follow the Bazaar)", () => {
  const skus = (q: Parameters<typeof searchProducts>[0]) =>
    names(searchProducts({ limit: 50, ...q }));

  it("keeps products that have ALL the tags, whatever the case", () => {
    expect(skus({ chainId: "base", tags: ["desk"] })).toEqual(
      expect.arrayContaining(["desk-mat", "notebook", "phone-stand"]),
    );
    expect(skus({ chainId: "base", tags: ["desk", "PHONE"] })).toEqual(["phone-stand"]);
    expect(skus({ chainId: "base", tags: ["desk", "audio"] })).toEqual([]);
  });

  it("keeps products up to the price, the limit itself included", () => {
    expect(skus({ chainId: "base", maxPrice: "7" })).toEqual(["sticker-pack", "usb-c-cable"]);
    expect(skus({ chainId: "base", maxPrice: "6.9" })).toContain("usb-c-cable");
    expect(skus({ chainId: "base", maxPrice: "6.899999" })).not.toContain("usb-c-cable");
    expect(skus({ chainId: "base", maxPrice: "0" })).toEqual([]);
  });

  it("ignores a price that is not valid instead of filtering by it", () => {
    expect(skus({ chainId: "base", maxPrice: "abc" })).toHaveLength(11);
    expect(skus({ chainId: "base", maxPrice: "" })).toHaveLength(11);
  });

  it("keeps only the chosen merchants, and every merchant when none is chosen", () => {
    expect(skus({ chainId: "base", merchantIds: ["m-cable"] }).sort()).toEqual([
      "earbuds",
      "phone-stand",
      "usb-c-cable",
      "wireless-charger",
    ]);
    expect(skus({ chainId: "base", merchantIds: ["m-cable", "m-desk"] })).not.toContain("mug");
    expect(skus({ chainId: "base", merchantIds: [] })).toHaveLength(11);
  });

  it("applies the country rule: not banned, and one of the listed countries if there is a list", () => {
    const charger = shopCatalog.find((p) => p.sku === "wireless-charger")!;
    const bottle = shopCatalog.find((p) => p.sku === "steel-bottle")!;
    const mug = shopCatalog.find((p) => p.sku === "ceramic-mug")!;
    expect(sellsTo(charger, "SG")).toBe(true);
    expect(sellsTo(charger, "vn")).toBe(false); // lists countries, Vietnam is not one
    expect(sellsTo(bottle, "AU")).toBe(false); // banned
    expect(sellsTo(bottle, "VN")).toBe(true);
    expect(sellsTo(mug, "JP")).toBe(true); // no restriction
    expect(skus({ chainId: "base", location: "VN" })).not.toContain("wireless-charger");
    expect(skus({ chainId: "base", location: "AU" })).not.toContain("steel-bottle");
    expect(skus({ chainId: "base", location: "US" })).toContain("wireless-charger");
    expect(skus({ chainId: "base" })).toContain("wireless-charger"); // no country, no filtering
  });

  it("combines every filter with the search", () => {
    expect(
      skus({
        chainId: "base",
        search: "desk",
        category: "home",
        maxPrice: "30",
        merchantIds: ["m-desk"],
        location: "VN",
        tags: ["desk"],
      }),
    ).toEqual(["desk-mat"]);
  });

  it("validates the price like the Bazaar", () => {
    for (const ok of ["", " ", "0", "25", "49.99", "0.000001", "12.5"]) {
      expect(validateMaxPrice(ok)).toBeNull();
    }
    for (const bad of ["-1", "1.0000001", "abc", "1,5", ".5", "5.", "1e3"]) {
      expect(validateMaxPrice(bad)).toMatch(/Enter a price/);
    }
  });

  it("lists the tags, merchants and countries a buyer can pick", () => {
    expect(shopTags("base")[0]).toBe("desk"); // the most common first
    expect(shopTags("base")).not.toContain("pens"); // only on QDay
    expect(shopTags("qday")).toContain("pens");
    expect(shopMerchants("base")).toEqual([
      { id: "m-cable", name: "Cable Corner", count: 4 },
      { id: "m-desk", name: "Desk & Paper Co.", count: 3 },
      { id: "m-everyday", name: "Everyday Goods", count: 4 },
    ]);
    expect(countryName("VN")).toBe("Vietnam");
    expect(countryName("ZZ")).toBe("ZZ");
  });

  it("counts each kind of filter once, and not the sort", () => {
    expect(activeFilterCount(emptyFilters())).toBe(0);
    expect(
      activeFilterCount({
        ...emptyFilters(),
        sort: "price_asc",
        tags: ["a", "b"],
        maxPrice: "10",
        location: "VN",
      }),
    ).toBe(3);
    expect(
      activeFilterCount({
        category: "Home",
        tags: ["x"],
        maxPrice: "5",
        merchantIds: ["m"],
        location: "SG",
      }),
    ).toBe(5);
  });

  it("turns filters into a query", () => {
    const query = filtersToQuery(
      "mug",
      { ...emptyFilters(), maxPrice: " 12 ", category: "Home" },
      "qday",
      3,
    );
    expect(query).toMatchObject({
      search: "mug",
      maxPrice: "12",
      category: "Home",
      chainId: "qday",
      limit: 3,
    });
  });
});
