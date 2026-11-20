"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/server";
import { createNotification, loginNotification } from "@/lib/notifications";

export async function recordLoginNotification() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) return;
  await createNotification(loginNotification(user.id));
}

export async function markNotificationRead(id: string) {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  revalidatePath("/", "layout");
}
