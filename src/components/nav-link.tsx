"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

type NavLinkProps = ComponentProps<typeof Link> & {
  /** Shown in the navigation banner while the page loads */
  navLabel?: string;
};

/** Internal link with prefetch + data attribute for navigation banner label. */
export function NavLink({ navLabel, prefetch = true, ...props }: NavLinkProps) {
  return <Link prefetch={prefetch} data-nav-label={navLabel} {...props} />;
}
