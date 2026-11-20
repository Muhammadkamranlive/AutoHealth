import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database, Profile } from "@/lib/db";
import type { UserRole } from "./roles";
import { canAccessPath, getRoleHomePath, isAuthRoute, isPublicRoute } from "./routes";

type ProfileRole = Pick<Profile, "role">;

/**
 * Single-app middleware: one login, role-scoped route prefixes.
 *   /admin/*   — staff (physician, care_team, admin)
 *   /partner/* — B2B partners
 *   /dashboard, /orders, … — patients
 */
export function createPlatformMiddleware() {
  return async function platformMiddleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            request.cookies.set({ name, value, ...options });
            supabaseResponse = NextResponse.next({ request });
            supabaseResponse.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: Record<string, unknown>) {
            request.cookies.set({ name, value: "", ...options });
            supabaseResponse = NextResponse.next({ request });
            supabaseResponse.cookies.set({ name, value: "", ...options });
          },
        },
      }
    );

    const { pathname } = request.nextUrl;

    // Refresh auth session for API routes; each route handles its own authorization.
    if (pathname.startsWith("/api/")) {
      await supabase.auth.getUser();
      return supabaseResponse;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !isPublicRoute(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const profile = data as ProfileRole | null;
      const role = profile?.role as UserRole | undefined;

      // Logged in but no profile row — stay on login/signup with a clear state
      if (!role && !isAuthRoute(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("error", "no_profile");
        return NextResponse.redirect(url);
      }

      if (isAuthRoute(pathname) && role) {
        const url = request.nextUrl.clone();
        url.pathname = getRoleHomePath(role);
        return NextResponse.redirect(url);
      }

      if (pathname === "/") {
        const url = request.nextUrl.clone();
        url.pathname = role ? getRoleHomePath(role) : "/login";
        return NextResponse.redirect(url);
      }

      if (!isAuthRoute(pathname) && role && !canAccessPath(role, pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = getRoleHomePath(role);
        url.searchParams.set("error", "unauthorized");
        return NextResponse.redirect(url);
      }
    }

    return supabaseResponse;
  };
}

/** @deprecated Use createPlatformMiddleware for the unified app. */
export function createAuthMiddleware(config: { portal: "admin" | "patient" | "partner"; loginPath?: string }) {
  return createPlatformMiddleware();
}
