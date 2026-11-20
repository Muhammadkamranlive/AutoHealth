import { createServerClient } from "@supabase/ssr";
import type { Database, Profile } from "@/lib/db";
import { PermissionDeniedError, UnauthorizedError } from "./errors";
import { resolveUserPermissions } from "@/lib/menus/permissions";
import type { Permission } from "./permissions";
import type { SessionUser, UserRole } from "./roles";

type ProfileSummary = Pick<Profile, "role" | "first_name" | "last_name">;

export async function getSessionUser(
  supabase: ReturnType<typeof createServerClient<Database>>
): Promise<SessionUser | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("role, first_name, last_name")
    .eq("id", user.id)
    .single();

  const profile = data as ProfileSummary | null;
  if (!profile) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    role: profile.role,
    firstName: profile.first_name,
    lastName: profile.last_name,
  };
}

export async function requireRole(
  supabase: ReturnType<typeof createServerClient<Database>>,
  allowedRoles: UserRole[]
): Promise<SessionUser> {
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) {
    throw new UnauthorizedError();
  }
  if (!allowedRoles.includes(sessionUser.role)) {
    throw new PermissionDeniedError("settings:read");
  }
  return sessionUser;
}

export async function requirePermission(
  supabase: ReturnType<typeof createServerClient<Database>>,
  permission: Permission
): Promise<SessionUser> {
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) {
    throw new UnauthorizedError();
  }

  const effective = await resolveUserPermissions(supabase, sessionUser);
  if (!effective.includes(permission)) {
    throw new PermissionDeniedError(permission);
  }

  return sessionUser;
}

export async function requireAnyPermission(
  supabase: ReturnType<typeof createServerClient<Database>>,
  permissions: Permission[]
): Promise<SessionUser> {
  const sessionUser = await getSessionUser(supabase);
  if (!sessionUser) {
    throw new UnauthorizedError();
  }

  const effective = await resolveUserPermissions(supabase, sessionUser);
  if (!permissions.some((p) => effective.includes(p))) {
    throw new PermissionDeniedError(permissions[0]);
  }

  return sessionUser;
}

export async function getEffectivePermissions(
  supabase: ReturnType<typeof createServerClient<Database>>,
  user: SessionUser
): Promise<Permission[]> {
  return resolveUserPermissions(supabase, user);
}
