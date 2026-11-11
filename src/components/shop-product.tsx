import {
  BatteryCharging,
  Cable,
  Coffee,
  Coins,
  CupSoda,
  Headphones,
  Minus,
  NotebookPen,
  Package,
  PenLine,
  Plug,
  Plus,
  RectangleHorizontal,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sticker,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatPrice, inStock, stockNote, type ShopProduct } from "@/lib/shop-preview";

const skuIcons: Record<string, LucideIcon> = {
  earbuds: Headphones,
  "sticker-pack": Sticker,
  hoodie: Shirt,
  "tote-bag": ShoppingBag,
  "desk-mat": RectangleHorizontal,
  "pen-set": PenLine,
  notebook: NotebookPen,
  "wireless-charger": BatteryCharging,
  "phone-stand": Smartphone,
  "usb-c-cable": Cable,
  "steel-bottle": CupSoda,
  "ceramic-mug": Coffee,
};
const categoryIcons: Record<string, LucideIcon> = {
  Electronics: Plug,
  Stationery: PenLine,
  Apparel: Shirt,
  Home: CupSoda,
};

/** Brand-friendly hues; each product keeps one, so a list does not read as twelve identical tiles. */
const HUES = [188, 205, 160, 235, 330, 45];
function productHue(sku: string): number {
  let hash = 0;
  for (const char of sku) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return HUES[hash % HUES.length] ?? 188;
}

/**
 * The sample catalogue has no photos, so a product shows its own icon on a tinted tile. The tint is
 * translucent, so it reads on both the dark and the light theme.
 */
export function ProductThumb({
  product,
  className,
  iconClassName,
}: {
  product: ShopProduct;
  className?: string;
  iconClassName?: string;
}) {
  const Icon = skuIcons[product.sku] ?? categoryIcons[product.category] ?? Package;
  const hue = productHue(product.sku);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden text-primary",
        className,
      )}
      style={{
        backgroundImage: `radial-gradient(circle at 30% 20%, oklch(0.7 0.13 ${hue} / 0.32), transparent 65%), linear-gradient(150deg, oklch(0.55 0.1 ${hue} / 0.28), oklch(0.35 0.07 ${hue} / 0.16))`,
      }}
    >
      <Icon className={cn("h-9 w-9", iconClassName)} strokeWidth={1.6} />
    </span>
  );
}

/** "− 2 +" with the product's name in the labels, so it is clear in a list which one it changes. */
export function QuantityStepper({
  name,
  quantity,
  max,
  onChange,
  className,
}: {
  name: string;
  quantity: number;
  max: number;
  onChange: (quantity: number) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-full border border-primary/30 bg-primary/10 p-0.5",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Decrease quantity of ${name}`}
        className="h-8 w-8 rounded-full text-primary hover:bg-primary/15 hover:text-primary"
        onClick={() => onChange(quantity - 1)}
      >
        <Minus className="!h-4 !w-4" />
      </Button>
      <span
        aria-label={`Quantity of ${name}`}
        className="min-w-8 text-center text-sm font-semibold text-primary"
      >
        {quantity}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Increase quantity of ${name}`}
        disabled={quantity >= max}
        className="h-8 w-8 rounded-full text-primary hover:bg-primary/15 hover:text-primary"
        onClick={() => onChange(quantity + 1)}
      >
        <Plus className="!h-4 !w-4" />
      </Button>
    </div>
  );
}

/** A corner label on a product picture: low stock, or sold out. */
function StockBadge({ product }: { product: ShopProduct }) {
  const note = stockNote(product);
  if (!note) return null;
  return (
    <span
      className={cn(
        "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm",
        inStock(product)
          ? "bg-background/70 text-foreground"
          : "bg-destructive/85 text-destructive-foreground",
      )}
    >
      {note}
    </span>
  );
}

export function ProductCard({
  product,
  stable,
  inCart,
  max,
  onOpen,
  onAdd,
  onQuantity,
}: {
  product: ShopProduct;
  stable: string;
  /** How many are already in the cart. */
  inCart: number;
  /** The most the cart may hold of it. */
  max: number;
  onOpen: () => void;
  onAdd: () => void;
  onQuantity: (quantity: number) => void;
}) {
  const available = inStock(product);
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`View ${product.name}`}
        className="flex flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span className="relative block w-full shrink-0">
          <ProductThumb
            product={product}
            className={cn("aspect-[4/3] w-full", !available && "opacity-40 grayscale")}
          />
          <StockBadge product={product} />
        </span>
        <span className="flex flex-1 flex-col px-3 pt-2.5">
          <span className="line-clamp-2 text-[13px] font-medium leading-[1.15rem]">
            {product.name}
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
            {product.merchant.name}
          </span>
          <span className="mt-auto flex items-baseline gap-1 pt-2">
            <span className="text-[15px] font-semibold">{formatPrice(product.price)}</span>
            <span className="text-[11px] text-muted-foreground">{stable}</span>
          </span>
        </span>
      </button>
      <div className="mt-auto px-3 pb-3 pt-2.5">
        {inCart > 0 ? (
          <QuantityStepper name={product.name} quantity={inCart} max={max} onChange={onQuantity} />
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={`Add ${product.name} to cart`}
            disabled={!available}
            onClick={onAdd}
            className="h-9 w-full border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
          >
            {available ? (
              <>
                <Plus className="!h-4 !w-4" />
                Add
              </>
            ) : (
              "Sold out"
            )}
          </Button>
        )}
      </div>
    </li>
  );
}

export function ProductDialog({
  product,
  stable,
  chainName,
  inCart,
  onClose,
  onAdd,
}: {
  product: ShopProduct | null;
  stable: string;
  chainName: string;
  inCart: number;
  onClose: () => void;
  onAdd: () => void;
}) {
  const available = product ? inStock(product) : false;
  return (
    <Dialog open={product !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm gap-0 overflow-hidden p-0">
        {product && (
          <>
            <div className="relative">
              <ProductThumb
                product={product}
                className={cn("h-48 w-full", !available && "opacity-40 grayscale")}
                iconClassName="h-16 w-16"
              />
              <StockBadge product={product} />
            </div>
            <div className="space-y-4 p-5">
              <div>
                <DialogTitle className="text-xl">{product.name}</DialogTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{product.merchant.name}</span>
                  {" · "}
                  <span>{product.category}</span>
                </p>
              </div>
              <DialogDescription className="text-sm leading-relaxed">
                {product.description}
              </DialogDescription>
              <dl className="space-y-2 rounded-xl bg-primary/5 px-3.5 py-3 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Truck className="h-3.5 w-3.5" />
                    Delivery
                  </dt>
                  <dd className="text-right font-medium">{product.fulfillment}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Coins className="h-3.5 w-3.5" />
                    Paid in
                  </dt>
                  <dd className="text-right font-medium">
                    {stable} on {chainName}
                  </dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-4">
                <div>
                  <p className="text-xl font-semibold leading-none">
                    {formatPrice(product.price)} {stable}
                  </p>
                  {inCart > 0 && <p className="mt-1 text-[11px] text-primary">{inCart} in cart</p>}
                </div>
                <Button type="button" className="shrink-0" disabled={!available} onClick={onAdd}>
                  <Plus />
                  {available ? "Add to cart" : "Sold out"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
