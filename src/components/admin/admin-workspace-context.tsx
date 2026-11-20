"use client";

import { createContext, useContext } from "react";
import type { Permission } from "@/lib/auth/permissions";
import type { AdminWorkspace } from "@/lib/menus/types";
import { ThemeProvider } from "@/components/theme-provider";

type AdminWorkspaceContextValue = {
  workspace: AdminWorkspace;
  can: (permission: Permission) => boolean;
};

const AdminWorkspaceContext = createContext<AdminWorkspaceContextValue | null>(null);

export function AdminWorkspaceProvider({
  workspace,
  children,
}: {
  workspace: AdminWorkspace;
  children: React.ReactNode;
}) {
  function can(permission: Permission) {
    return (workspace.permissions as Permission[]).includes(permission);
  }

  return (
    <ThemeProvider>
      <AdminWorkspaceContext.Provider value={{ workspace, can }}>
        {children}
      </AdminWorkspaceContext.Provider>
    </ThemeProvider>
  );
}

export function useAdminWorkspace() {
  const ctx = useContext(AdminWorkspaceContext);
  if (!ctx) throw new Error("useAdminWorkspace must be used within AdminWorkspaceProvider");
  return ctx;
}
