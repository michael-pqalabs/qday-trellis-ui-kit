import type { ComponentType } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { WalletPreviewProvider } from "@/components/wallet-preview-provider";
import { PASSKEY_CONFIRM_MS } from "@/components/create-session-dialog";
import { Route } from "@/routes/shop";

beforeEach(() => window.sessionStorage.clear());

async function renderShop() {
  const Page = Route.options.component as ComponentType;
  const root = createRootRoute({
    component: () => (
      <WalletPreviewProvider>
        <Page />
      </WalletPreviewProvider>
    ),
  });
  const router = createRouter({
    routeTree: root.addChildren(
      ["/shop", "/wallet", "/agentic"].map((path) =>
        createRoute({ getParentRoute: () => root, path }),
      ),
    ),
    history: createMemoryHistory({ initialEntries: ["/shop"] }),
  });
  await router.load();
  render(<RouterProvider router={router} />);
  await screen.findByRole("tab", { name: "Browse" });
}

const products = () =>
  within(screen.getByRole("list", { name: "Products" })).getAllByRole("listitem");
const productNames = () =>
  products().map((li) =>
    within(li)
      .getByRole("button", { name: /^View / })
      .getAttribute("aria-label"),
  );
const search = (value: string) =>
  fireEvent.change(screen.getByLabelText("Search products"), { target: { value } });
// Radix tabs switch on mouse down, not on click.
const openTab = (name: RegExp | string) => fireEvent.mouseDown(screen.getByRole("tab", { name }));
const add = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name: `Add ${name} to cart` }));

describe("Shopping: browse", () => {
  it("shows the active blockchain's products five at a time", async () => {
    await renderShop();
    expect(products()).toHaveLength(5);
    expect(screen.getByRole("status").textContent).toBe("Showing 5 of 11");

    fireEvent.click(screen.getByRole("button", { name: "Show 5 more" }));
    expect(products()).toHaveLength(10);
    fireEvent.click(screen.getByRole("button", { name: "Show 5 more" }));
    expect(products()).toHaveLength(11);
    expect(screen.queryByRole("button", { name: /Show 5 more/ })).toBeNull();
    // The one product only QDay accepts is not offered on Base.
    expect(productNames()).not.toContain("View Gel pen set (4)");
  });

  it("searches by the start of a word and clears", async () => {
    await renderShop();
    search("ear");
    expect(productNames()).toEqual(["View Wireless earbuds"]);
    expect(screen.getByLabelText("Sort products")).toHaveProperty("value", "relevance");

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(products()).toHaveLength(5);
    expect(screen.getByLabelText("Sort products")).toHaveProperty("value", "newest");
  });

  it("says when nothing matches and offers to clear the filters", async () => {
    await renderShop();
    search("zeppelin");
    expect(screen.getByText("No products found")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(products()).toHaveLength(5);
  });

  it("opens a product with its merchant, delivery and payment", async () => {
    await renderShop();
    fireEvent.click(screen.getByRole("button", { name: "View Wireless earbuds" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Cable Corner")).toBeTruthy();
    expect(within(dialog).getByText("USDC on Base")).toBeTruthy();
    expect(within(dialog).getByText("39.00 USDC")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Add to cart" }));
    expect(screen.getByRole("button", { name: "Open cart, 1 item" })).toBeTruthy();
  });

  it("does not let a sold-out product be added", async () => {
    await renderShop();
    search("hoodie");
    expect(screen.getByText("Out of stock")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add Fleece hoodie to cart" })).toHaveProperty(
      "disabled",
      true,
    );
  });
});

const openFilters = async () => {
  fireEvent.click(screen.getByRole("button", { name: /^Filters/ }));
  return screen.findByRole("dialog", { name: "Filters" });
};
const showButton = (dialog: HTMLElement) =>
  within(dialog).getByRole("button", { name: /^Show \d+ product/ });
const pick = (dialog: HTMLElement, group: string, name: string) =>
  fireEvent.click(
    within(within(dialog).getByRole("group", { name: group })).getByRole("button", { name }),
  );

describe("Shopping: filters popup", () => {
  it("opens full screen with every filter the Bazaar offers a shopper", async () => {
    await renderShop();
    const dialog = await openFilters();
    expect(dialog.className).toMatch(/h-dvh/);
    for (const group of ["Category", "Tags", "Ships to", "Price presets"]) {
      expect(within(dialog).getByRole("group", { name: group })).toBeTruthy();
    }
    expect(within(dialog).getByLabelText(/Maximum price in USDC/)).toBeTruthy();
    expect(within(dialog).getByRole("list", { name: "Shops" })).toBeTruthy();
    expect(within(dialog).getByText(/payable in USDC on Base/)).toBeTruthy();
    // Sorting is a quick control on the page, not a filter.
    expect(within(dialog).queryByRole("group", { name: "Sort by" })).toBeNull();
    expect(showButton(dialog).textContent).toBe("Show 11 products");
  });

  it("counts the matches live and refuses a filter nothing matches", async () => {
    await renderShop();
    const dialog = await openFilters();
    pick(dialog, "Category", "Stationery");
    expect(showButton(dialog).textContent).toBe("Show 2 products");

    fireEvent.change(within(dialog).getByLabelText(/Maximum price/), { target: { value: "5" } });
    expect(showButton(dialog).textContent).toBe("Show 1 product");

    fireEvent.change(within(dialog).getByLabelText(/Maximum price/), { target: { value: "1" } });
    expect(showButton(dialog)).toHaveProperty("disabled", true);
    expect(within(dialog).getByRole("status").textContent).toMatch(/No products match/);
  });

  it("applies the filters, shows them as chips and lets each be removed", async () => {
    await renderShop();
    const dialog = await openFilters();
    pick(dialog, "Category", "Stationery");
    fireEvent.change(within(dialog).getByLabelText(/Maximum price/), { target: { value: "5" } });
    fireEvent.click(showButton(dialog));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Filters" })).toBeNull());
    expect(productNames()).toEqual(["View Sticker pack"]);
    expect(screen.getByRole("button", { name: "Filters, 2 applied" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Remove filter Stationery" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Remove filter Up to 5 USDC" }));
    expect(productNames()).toEqual(["View Sticker pack", "View Dot-grid notebook"]);
    fireEvent.click(screen.getByRole("button", { name: "Remove filter Stationery" }));
    expect(products()).toHaveLength(5);
    expect(screen.getByRole("button", { name: "Filters" })).toBeTruthy();
  });

  it("drops the changes when the popup is closed without applying", async () => {
    await renderShop();
    const dialog = await openFilters();
    pick(dialog, "Category", "Home");
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Filters" })).toBeNull());
    expect(screen.queryByRole("list", { name: "Applied filters" })).toBeNull();

    // Reopening starts from what is applied, not from the dropped draft.
    const again = await openFilters();
    expect(showButton(again).textContent).toBe("Show 11 products");
  });

  it("rejects a price that is not valid", async () => {
    await renderShop();
    const dialog = await openFilters();
    fireEvent.change(within(dialog).getByLabelText(/Maximum price/), {
      target: { value: "1.2345678" },
    });
    expect(within(dialog).getByRole("alert").textContent).toMatch(/up to 6 decimals/);
    expect(showButton(dialog)).toHaveProperty("disabled", true);
    fireEvent.change(within(dialog).getByLabelText(/Maximum price/), {
      target: { value: "49.99" },
    });
    expect(within(dialog).queryByRole("alert")).toBeNull();
  });

  it("asks for all the tags, and stops at five", async () => {
    await renderShop();
    const dialog = await openFilters();
    pick(dialog, "Tags", "desk");
    pick(dialog, "Tags", "phone");
    expect(showButton(dialog).textContent).toBe("Show 1 product");

    for (const tag of ["gift", "kitchen", "charging"]) pick(dialog, "Tags", tag);
    const tags = within(dialog).getByRole("group", { name: "Tags" });
    expect(within(tags).getByRole("button", { name: "audio" })).toHaveProperty("disabled", true);
    // A picked tag can still be taken off.
    expect(within(tags).getByRole("button", { name: "desk" })).toHaveProperty("disabled", false);
  });

  it("limits the results to the chosen shops", async () => {
    await renderShop();
    const dialog = await openFilters();
    fireEvent.click(within(dialog).getByRole("checkbox", { name: /Cable Corner/ }));
    expect(showButton(dialog).textContent).toBe("Show 4 products");
    fireEvent.click(showButton(dialog));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Filters" })).toBeNull());
    expect(productNames().every((n) => n && !/mug|notebook|tote/i.test(n))).toBe(true);
    expect(screen.getByRole("button", { name: "Remove filter Cable Corner" })).toBeTruthy();
  });

  it("hides what the shop does not sell in the chosen country", async () => {
    await renderShop();
    search("charger");
    expect(productNames()).toContain("View Wireless charger");
    const dialog = await openFilters();
    pick(dialog, "Ships to", "Vietnam");
    expect(showButton(dialog)).toHaveProperty("disabled", true);
    pick(dialog, "Ships to", "United States");
    fireEvent.click(showButton(dialog));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Filters" })).toBeNull());
    expect(productNames()).toContain("View Wireless charger");
    expect(
      screen.getByRole("button", { name: "Remove filter Ships to United States" }),
    ).toBeTruthy();
  });

  it("sorts from the page in one tap, and a reset in the popup keeps the order", async () => {
    await renderShop();
    fireEvent.change(screen.getByLabelText("Sort products"), { target: { value: "price_desc" } });
    expect(productNames()[0]).toBe("View Fleece hoodie");
    // Sorting is an order, not a filter: no badge, no chip.
    expect(screen.getByRole("button", { name: "Filters" })).toBeTruthy();
    expect(screen.queryByRole("list", { name: "Applied filters" })).toBeNull();

    const dialog = await openFilters();
    pick(dialog, "Category", "Home");
    fireEvent.click(within(dialog).getByRole("button", { name: "Reset" }));
    fireEvent.click(showButton(dialog));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Filters" })).toBeNull());
    expect(screen.getByLabelText("Sort products")).toHaveProperty("value", "price_desc");
  });

  it("offers the price presets and clears them with a second tap", async () => {
    await renderShop();
    const dialog = await openFilters();
    pick(dialog, "Price presets", "Under 10");
    expect(within(dialog).getByLabelText(/Maximum price/)).toHaveProperty("value", "10");
    expect(showButton(dialog).textContent).toBe("Show 3 products");
    pick(dialog, "Price presets", "Under 10");
    expect(within(dialog).getByLabelText(/Maximum price/)).toHaveProperty("value", "");
  });

  it("resets everything in the popup, and clears the filters from the empty state", async () => {
    await renderShop();
    const dialog = await openFilters();
    pick(dialog, "Category", "Apparel");
    pick(dialog, "Tags", "gift");
    fireEvent.click(within(dialog).getByRole("button", { name: "Reset" }));
    expect(showButton(dialog).textContent).toBe("Show 11 products");
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Filters" })).toBeNull());

    search("zeppelin");
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(products()).toHaveLength(5);
  });
});

describe("Shopping: cart, checkout and orders", () => {
  it("changes quantities, holds them at the stock and totals exactly", async () => {
    await renderShop();
    search("notebook");
    add("Dot-grid notebook");
    // Once added, the card's button becomes a stepper.
    expect(screen.queryByRole("button", { name: "Add Dot-grid notebook to cart" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Increase quantity of Dot-grid notebook" }));
    search("stand");
    add("Aluminium phone stand");
    openTab(/^Cart/);

    expect(screen.getByLabelText("Quantity of Dot-grid notebook").textContent).toBe("2");
    fireEvent.click(screen.getByRole("button", { name: "Increase quantity of Dot-grid notebook" }));
    // 3 notebooks (3 × 9.50) and one phone stand (14.00).
    expect(screen.getByText("28.50 USDC")).toBeTruthy();
    expect(screen.getByText("42.50 USDC")).toBeTruthy();

    // Only 3 phone stands exist.
    for (let i = 0; i < 5; i++) {
      const more = screen.getByRole("button", {
        name: "Increase quantity of Aluminium phone stand",
      });
      if (!(more as HTMLButtonElement).disabled) fireEvent.click(more);
    }
    expect(screen.getByLabelText("Quantity of Aluminium phone stand").textContent).toBe("3");
    expect(
      screen.getByRole("button", { name: "Increase quantity of Aluminium phone stand" }),
    ).toHaveProperty("disabled", true);

    fireEvent.click(screen.getByRole("button", { name: "Remove Aluminium phone stand" }));
    expect(screen.queryByLabelText("Quantity of Aluminium phone stand")).toBeNull();
  });

  it("explains an empty cart", async () => {
    await renderShop();
    openTab(/^Cart/);
    expect(screen.getByText("Your cart is empty")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Browse products" }));
    expect(await screen.findByLabelText("Search products")).toBeTruthy();
  });

  it("pays from Trellis with the Passkey, then lists the order and ships it in the preview", async () => {
    await renderShop();
    search("notebook");
    add("Dot-grid notebook");
    fireEvent.click(screen.getByRole("button", { name: "Open cart, 1 item" }));
    fireEvent.click(await screen.findByRole("button", { name: /^Checkout/ }));

    const dialog = await screen.findByRole("dialog", { name: "Checkout" });
    // Wallet balances start at zero, so the payment is refused until the preview switch is on.
    expect(within(dialog).getByRole("alert").textContent).toMatch(/Not enough USDC/);
    const pay = within(dialog).getByRole("button", { name: /^Pay 9.50 USDC/ });
    expect(pay).toHaveProperty("disabled", true);

    fireEvent.click(within(dialog).getByRole("radio", { name: "Sample" }));
    expect(within(dialog).queryByRole("alert")).toBeNull();
    expect(within(dialog).getByText(/Home · 12 Example Street/)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: /^Pay 9.50 USDC/ }));
    expect(within(dialog).getByRole("status").textContent).toMatch(/Passkey/);

    const orders = await screen.findByRole(
      "list",
      { name: "Orders" },
      { timeout: PASSKEY_CONFIRM_MS + 2000 },
    );
    expect(within(orders).getByText("Paid")).toBeTruthy();
    expect(within(orders).getByText(/^ORD-[0-9A-F]{6}$/)).toBeTruthy();
    expect(within(orders).getByText("1 × Dot-grid notebook")).toBeTruthy();
    // The cart was emptied by the order.
    expect(screen.getByRole("button", { name: "Open cart, 0 items" })).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: /Preview: merchant ships the oldest paid order/ }),
    );
    expect(within(screen.getByRole("list", { name: "Orders" })).getByText("Shipped")).toBeTruthy();
  }, 10_000);

  it("keeps the cart and orders for the session, and the preview button clears them", async () => {
    await renderShop();
    search("mug");
    add("Ceramic mug");
    expect(JSON.parse(window.sessionStorage.getItem("trellis-shop-v1") ?? "{}").cart).toHaveLength(
      1,
    );

    openTab(/^Orders/);
    fireEvent.click(screen.getByRole("button", { name: /Preview: clear cart and orders/ }));
    await waitFor(() =>
      expect(JSON.parse(window.sessionStorage.getItem("trellis-shop-v1") ?? "{}").cart).toEqual([]),
    );
  });
});
