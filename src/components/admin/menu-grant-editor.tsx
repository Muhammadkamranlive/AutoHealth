"use client";

import {
  PERMISSION_ACTION_LABELS,
  type PermissionAction,
} from "@/lib/auth/permissions";
import { actionsForMenu } from "@/lib/menus/permissions";

export type MenuGrantState = Record<string, PermissionAction[]>;

export type MenuOption = {
  menu_key: string;
  label: string;
  parent_key: string | null;
  permission: string;
};

export function buildGrantStateFromRows(
  grants: { menu_key: string; allowed_actions?: string[] | null }[]
): MenuGrantState {
  const state: MenuGrantState = {};
  for (const grant of grants) {
    const actions = (grant.allowed_actions ?? ["read"]).filter((a): a is PermissionAction =>
      ["read", "create", "update", "delete", "approve"].includes(a)
    );
    state[grant.menu_key] = actions.length > 0 ? actions : ["read"];
  }
  return state;
}

export function grantStateToPayload(state: MenuGrantState) {
  return Object.entries(state).map(([menu_key, allowed_actions]) => ({
    menu_key,
    allowed_actions: allowed_actions.includes("read")
      ? allowed_actions
      : (["read", ...allowed_actions] as PermissionAction[]),
  }));
}

export function MenuGrantEditor({
  allMenus,
  grantState,
  onChange,
}: {
  allMenus: MenuOption[];
  grantState: MenuGrantState;
  onChange: (next: MenuGrantState) => void;
}) {
  const topMenus = allMenus.filter((m) => !m.parent_key);

  function isEnabled(menuKey: string) {
    return menuKey in grantState;
  }

  function toggleMenu(menu: MenuOption) {
    const next = { ...grantState };
    if (isEnabled(menu.menu_key)) {
      delete next[menu.menu_key];
    } else {
      next[menu.menu_key] = ["read"];
    }
    onChange(next);
  }

  function toggleAction(menuKey: string, action: PermissionAction) {
    if (action === "read") return;
    const current = grantState[menuKey] ?? ["read"];
    const next = { ...grantState };
    if (current.includes(action)) {
      next[menuKey] = current.filter((a) => a !== action);
    } else {
      next[menuKey] = [...current, action];
    }
    if (!next[menuKey].includes("read")) {
      next[menuKey] = ["read", ...next[menuKey]];
    }
    onChange(next);
  }

  function renderActionToggles(menu: MenuOption) {
    if (!isEnabled(menu.menu_key)) return null;

    const available = actionsForMenu(menu.menu_key, menu.permission);
    const selected = grantState[menu.menu_key] ?? ["read"];

    return (
      <div className="ml-7 mt-2 flex flex-wrap gap-2">
        {available.map((action) => (
          <label
            key={action}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
              selected.includes(action)
                ? "border-medical-300 bg-medical-50 text-medical-800 dark:border-medical-700 dark:bg-medical-950/40 dark:text-medical-200"
                : "border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(action)}
              disabled={action === "read"}
              onChange={() => toggleAction(menu.menu_key, action)}
              className="rounded"
            />
            {PERMISSION_ACTION_LABELS[action]}
          </label>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {topMenus.map((menu) => {
        const children = allMenus.filter((m) => m.parent_key === menu.menu_key);
        return (
          <div key={menu.menu_key} className="rounded-xl border border-medical-100 p-4 dark:border-slate-700">
            <label className="flex items-center gap-2 font-medium text-medical-900 dark:text-white">
              <input
                type="checkbox"
                checked={isEnabled(menu.menu_key)}
                onChange={() => toggleMenu(menu)}
              />
              {menu.label}
            </label>
            {renderActionToggles(menu)}

            {children.map((child) => (
              <div key={child.menu_key} className="ml-5 mt-3">
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={isEnabled(child.menu_key)}
                    onChange={() => toggleMenu(child)}
                  />
                  {child.label}
                </label>
                {renderActionToggles(child)}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
