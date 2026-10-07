/**
 * Domain types for the portfolio content.
 *
 * The goal is "illegal states don't compile": e.g. a contact can't be a phone
 * without a phone number, an experience can't end before it is typed as a
 * real month, and a project link must say what it points to.
 */

/** 1–12. A template-literal union keeps "2023-13" from type-checking. */
type Month = "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10" | "11" | "12";

/** ISO-like year-month, e.g. "2023-05". */
export type YearMonth = `${number}-${Month}`;

export type Period = {
  start: YearMonth;
  /** Open-ended roles are explicit instead of an `undefined` end date. */
  end: YearMonth | "present";
};

export type Profile = {
  name: string;
  /** Short role line shown in the hero. */
  headline: string;
  focus: readonly string[];
  location: string;
  workMode: string;
  /** First paragraph-sized summary (hero lead, meta description). */
  summary: string;
  /** Long-form "About me" paragraphs. */
  about: readonly string[];
  /** Year the professional career started — drives the "years" counter. */
  careerStart: YearMonth;
  portrait: Portrait;
};

/** One pre-sized file served from `public/` (root-relative, so it works on the domain root). */
export type ImageVariant = {
  src: `/${string}`;
  /** Intrinsic pixel width — becomes the `w` descriptor in `srcset`. */
  width: number;
};

/**
 * A responsive image without a runtime optimizer (static export).
 * `variants` is a non-empty tuple: the first entry is the `src` fallback,
 * so "an image with zero files" can't type-check.
 */
export type Portrait = {
  variants: readonly [ImageVariant, ...ImageVariant[]];
  /** Intrinsic size of the first variant; reserves the box (no CLS). */
  width: number;
  height: number;
  alt: string;
};

/**
 * A stat is either numeric (and therefore animatable) or a plain label.
 * Discriminated on `kind`, so the counter component can only receive numbers.
 */
export type Stat =
  | {
      kind: "number";
      value: number;
      prefix?: string;
      suffix?: string;
      label: string;
      note: string;
    }
  | { kind: "text"; value: string; label: string; note: string };

export type Service = {
  id: string;
  title: string;
  summary: string;
  points: readonly string[];
};

export type SkillGroup = {
  id: string;
  title: string;
  items: readonly string[];
};

export type ExperienceItem = {
  role: string;
  company: string;
  location: string;
  period: Period;
  highlights: readonly string[];
};

export type ProjectLink =
  | { kind: "github"; href: `https://github.com/${string}`; label: string }
  | { kind: "website"; href: `https://${string}`; label: string }
  | { kind: "telegram"; href: `https://t.me/${string}`; label: string };

export type Project = {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: readonly string[];
  /** Empty for private / client work — the UI then says so instead of a dead link. */
  links: readonly ProjectLink[];
};

export type Principle = {
  title: string;
  body: string;
};

export type Language = {
  name: string;
  level: string;
  note?: string;
};

export type Contact =
  | { kind: "email"; label: string; value: string }
  | { kind: "phone"; label: string; value: string; e164: `+${number}` }
  | { kind: "freelancehunt"; label: string; value: string; href: `https://${string}` }
  | { kind: "github"; label: string; value: string; href: `https://github.com/${string}` };

/** One flying ball in the hero 3D scene: its caption and brand colours (`#rrggbb`). */
export type BallLabel = {
  text: string;
  background: `#${string}`;
  foreground: `#${string}`;
};

export type HeroScene = {
  /** Root-relative `.glb` path in `public/`. */
  model: `/${string}`;
  /** Static frame of the scene (WebP with alpha): shown until, or instead of, the live canvas. */
  poster: { src: `/${string}`; width: number; height: number };
  labels: readonly [BallLabel, ...BallLabel[]];
  /** Accessible name of the button that starts the scene when auto-start is skipped. */
  playLabel: string;
};
