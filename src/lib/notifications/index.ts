import { brand } from "@/lib/brand";
import { getPortalForRole, type UserRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppNotification } from "@/lib/db";

export type CreateNotificationInput = {
  userId: string;
  type: "login" | "task_assigned";
  title: string;
  body?: string;
  href?: string | null;
  metadata?: Record<string, unknown>;
};

export function taskHrefForRole(role: UserRole): string {
  const portal = getPortalForRole(role);
  if (portal === "patient") return "/profile/tasks";
  if (portal === "partner") return "/partner/tasks";
  return "/admin/tasks";
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    href: input.href ?? null,
    metadata: input.metadata ?? {},
  });
  if (error) {
    console.error("[notifications] insert failed:", error.message);
  }
}

export async function createNotifications(inputs: CreateNotificationInput[]): Promise<void> {
  if (inputs.length === 0) return;
  const admin = createAdminClient();
  const { error } = await admin.from("notifications").insert(
    inputs.map((input) => ({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? null,
      metadata: input.metadata ?? {},
    }))
  );
  if (error) {
    console.error("[notifications] bulk insert failed:", error.message);
  }
}

export function loginNotification(userId: string): CreateNotificationInput {
  return {
    userId,
    type: "login",
    title: `Signed in to ${brand.name}`,
    body: "A new session started on your account.",
    href: null,
  };
}

export function taskAssignedNotification(
  userId: string,
  role: UserRole,
  formTitle: string,
  formId: string
): CreateNotificationInput {
  return {
    userId,
    type: "task_assigned",
    title: "New profile task assigned",
    body: formTitle,
    href: taskHrefForRole(role),
    metadata: { formId },
  };
}

export type { AppNotification };
