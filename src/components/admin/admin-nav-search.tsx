"use client";

import { flattenNavForSearch } from "@/lib/nav/search-items";
import { PortalNavSearch } from "@/components/portal-nav-search";
import { useAdminWorkspace } from "./admin-workspace-context";

export function AdminNavSearch({ className }: { className?: string }) {
  const { workspace } = useAdminWorkspace();
  const items = flattenNavForSearch(workspace.navItems);

  return (
    <PortalNavSearch
      items={items}
      placeholder="Search admin menus…"
      className={className}
    />
  );
}
