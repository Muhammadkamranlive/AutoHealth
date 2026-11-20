import type { ResolvedNavItem } from "@/lib/menus/types";

export type NavSearchItem = {
  id: string;
  label: string;
  href: string;
  group?: string;
  keywords: string;
};

/** Flatten sidebar nav into searchable entries (parent + children). */
export function flattenNavForSearch(navItems: ResolvedNavItem[]): NavSearchItem[] {
  const items: NavSearchItem[] = [];
  const seen = new Set<string>();

  function add(item: NavSearchItem) {
    const key = `${item.href}::${item.label}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push(item);
  }

  for (const nav of navItems) {
    add({
      id: nav.id,
      label: nav.label,
      href: nav.href,
      keywords: `${nav.label} ${nav.href} ${nav.id}`.toLowerCase(),
    });

    for (const child of nav.children ?? []) {
      add({
        id: `${nav.id}-${child.label}`,
        label: child.label,
        href: child.href.split("?")[0],
        group: nav.label,
        keywords: `${nav.label} ${child.label} ${child.href}`.toLowerCase(),
      });
    }
  }

  return items;
}

/** Simple nav shape for patient/partner portals. */
export function flattenSimpleNav(
  navItems: { href: string; label: string }[]
): NavSearchItem[] {
  return navItems.map((item) => ({
    id: item.href,
    label: item.label,
    href: item.href,
    keywords: `${item.label} ${item.href}`.toLowerCase(),
  }));
}

export function filterNavSearchItems(items: NavSearchItem[], query: string): NavSearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items.slice(0, 8);
  return items.filter((item) => item.keywords.includes(q)).slice(0, 10);
}
