import { cn } from "@/lib/utils";

/** Ethereum diamond, drawn from the official mark. Kept as inline SVG so it needs no asset file. */
function EthLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="372 0 1186 1932" aria-hidden="true" className={className}>
      <polygon points="965,0 372,983 965,713" fill="#8C8C8C" />
      <polygon points="965,0 1558,983 965,713" fill="#343434" />
      <polygon points="372,983 965,1333 965,713" fill="#393939" />
      <polygon points="1558,983 965,1333 965,713" fill="#141414" />
      <polygon points="372,1095 965,1445 965,1932" fill="#8C8C8C" />
      <polygon points="1558,1095 965,1445 965,1932" fill="#3C3C3B" />
    </svg>
  );
}

/** Logos shipped as images. The USD8 shield is not round, so it is shown whole instead of cropped. */
const tokenImages: Record<string, { src: string; round: boolean }> = {
  qday: { src: "/tokens/qday.png", round: true },
  usd8: { src: "/tokens/usd8.png", round: false },
  usdc: { src: "/tokens/usdc.png", round: true },
};

/**
 * Round token badge: the real logo where there is one (all four default tokens), otherwise the token's letter mark.
 * `className` sets size and the letter badge's colours; the logo always sits on white so it reads in both themes.
 */
export function TokenMark({
  id,
  mark,
  className,
}: {
  id: string;
  mark: string;
  className?: string;
}) {
  if (id === "eth")
    return (
      <span
        aria-hidden="true"
        className={cn(
          "grid shrink-0 place-items-center rounded-full bg-white ring-1 ring-border",
          className,
          "bg-white text-transparent",
        )}
      >
        <EthLogo className="h-[55%]" />
      </span>
    );
  const image = tokenImages[id];
  if (image)
    return (
      <img
        src={image.src}
        alt=""
        aria-hidden="true"
        className={cn(
          "shrink-0",
          image.round ? "rounded-full object-cover" : "object-contain",
          className,
          "bg-transparent",
        )}
      />
    );
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-display font-semibold",
        className,
      )}
    >
      {mark}
    </span>
  );
}
