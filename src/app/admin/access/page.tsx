import { redirect } from "next/navigation";
import {
  ALL_ROLES,
  getPermissionsForRole,
  getRoleDisplayName,
  PERMISSION_ACTION_LABELS,
  PERMISSION_ACTIONS,
  PERMISSION_RESOURCE_LABELS,
  PERMISSION_RESOURCES,
  hasPermission,
  type Permission,
} from "@/lib/auth";
import { getSessionUser, requirePermission } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

export default async function AccessControlPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  try {
    await requirePermission(supabase, "users:read");
  } catch {
    redirect("/admin?error=no_permission");
  }

  const staffRoles = ALL_ROLES.filter(
    (r) => r === "admin" || r === "physician" || r === "care_team"
  );

  return (
      <div className="space-y-8">
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-medical-950 sm:text-3xl">Access Control</h1>
          <p className="mt-1 text-slate-600">
            Role-based permissions matrix — read, create, update, delete, and approve access
            per resource.
          </p>
        </div>

        <div className="table-scroll rounded-2xl border border-medical-100 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-medical-100 bg-medical-50 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4 font-medium">Resource</th>
                {staffRoles.map((role) => (
                  <th key={role} className="px-4 py-4 font-medium text-center">
                    {getRoleDisplayName(role)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_RESOURCES.map((resource) => (
                <tr key={resource} className="border-b border-medical-50 hover:bg-medical-50/50">
                  <td className="px-6 py-3 font-medium text-medical-900">
                    {PERMISSION_RESOURCE_LABELS[resource]}
                  </td>
                  {staffRoles.map((role) => (
                    <td key={role} className="px-4 py-3 text-center">
                      <PermissionBadges
                        role={role}
                        resource={resource}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {staffRoles.map((role) => (
            <div key={role} className="rounded-2xl border border-medical-100 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-medical-900">{getRoleDisplayName(role)}</h3>
              <p className="mt-1 text-xs text-slate-500">
                {getPermissionsForRole(role).length} permissions granted
              </p>
              <ul className="mt-3 space-y-1 text-xs text-slate-600">
                {getPermissionsForRole(role).slice(0, 6).map((p) => (
                  <li key={p}>• {p}</li>
                ))}
                {getPermissionsForRole(role).length > 6 && (
                  <li className="text-slate-600">
                    +{getPermissionsForRole(role).length - 6} more
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>
  );
}

function PermissionBadges({
  role,
  resource,
}: {
  role: (typeof ALL_ROLES)[number];
  resource: (typeof PERMISSION_RESOURCES)[number];
}) {
  const granted = PERMISSION_ACTIONS.filter((action) =>
    hasPermission(role, `${resource}:${action}` as Permission)
  );

  if (granted.length === 0) {
    return <span className="text-slate-400">—</span>;
  }

  return (
    <div className="flex flex-wrap justify-center gap-1">
      {granted.map((action) => (
        <span
          key={action}
          className="rounded-md bg-medical-100 px-1.5 py-0.5 text-[10px] font-medium text-medical-700"
          title={PERMISSION_ACTION_LABELS[action]}
        >
          {action[0].toUpperCase()}
        </span>
      ))}
    </div>
  );
}
