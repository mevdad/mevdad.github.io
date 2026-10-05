import type { CSSProperties } from "react";

type RevealProps = {
  "data-reveal": "";
  style: CSSProperties;
};

/**
 * Spread onto any server-rendered element to opt it into reveal-on-scroll.
 * `index` staggers siblings (80ms each, see globals.css).
 */
export function revealProps(index = 0): RevealProps {
  return { "data-reveal": "", style: { "--reveal-i": index } };
}
