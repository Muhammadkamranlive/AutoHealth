import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type { Database };
export * from "./database.types";

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function createSupabaseServerClient(
  cookieStore: {
    get: (name: string) => { value: string } | undefined;
    set: (name: string, value: string, options?: Record<string, unknown>) => void;
    remove: (name: string, options?: Record<string, unknown>) => void;
  }
) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.remove(name, options);
        },
      },
    }
  );
}

export function createSupabaseServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
