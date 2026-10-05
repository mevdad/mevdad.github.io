type MarqueeProps = {
  items: readonly string[];
  label: string;
  direction?: "forward" | "reverse";
  /** Seconds per loop. */
  duration?: number;
};

/**
 * CSS-only infinite marquee (Server Component, zero JS).
 * The track holds the list twice and slides by -50%, so the loop is
 * seamless. The second copy is aria-hidden — screen readers hear the list once —
 * and with reduced motion it is removed and the first copy wraps statically.
 */
export function Marquee({ items, label, direction = "forward", duration = 45 }: MarqueeProps) {
  const list = (hidden: boolean) => (
    <ul
      aria-label={hidden ? undefined : label}
      aria-hidden={hidden ? true : undefined}
      className="flex shrink-0 items-center"
    >
      {items.map((item) => (
        <li
          key={item}
          className="flex items-center gap-6 px-3 font-display text-3xl font-semibold tracking-[-0.02em] whitespace-nowrap text-fg sm:text-5xl"
        >
          {item}
          <span aria-hidden="true" className="text-accent-text">
            ✦
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="marquee overflow-hidden py-3" data-direction={direction}>
      <div className="marquee-track" style={{ "--marquee-duration": `${duration}s` }}>
        {list(false)}
        {list(true)}
      </div>
    </div>
  );
}
