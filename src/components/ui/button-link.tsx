import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  icon?: IconName;
};

const base =
  "group inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-sm font-medium tracking-tight whitespace-nowrap";

const variants: Record<NonNullable<ButtonLinkProps["variant"]>, string> = {
  primary: "bg-accent text-accent-ink hover:bg-fg hover:text-bg",
  ghost: "border border-line-strong text-fg hover:border-fg",
};

/**
 * It navigates, so it is an <a>, styled like a button. (A <button> that
 * changes location breaks middle-click, "open in new tab" and link semantics.)
 */
export function ButtonLink({ href, children, variant = "primary", icon = "arrow-right" }: ButtonLinkProps) {
  return (
    <a href={href} className={`${base} ${variants[variant]}`}>
      {children}
      <Icon
        name={icon}
        className="size-4 transition-transform duration-500 ease-out-expo group-hover:translate-x-1"
      />
    </a>
  );
}
