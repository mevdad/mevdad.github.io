import "react";

/**
 * Allow CSS custom properties in `style={{ "--i": 2 }}`.
 *
 * React's CSSProperties only knows standard properties, so without this the
 * usual "fix" is `as React.CSSProperties`, which would also silence real typos
 * like `opactiy`. Widening the type for `--*` keys only keeps the rest checked.
 */
declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}
