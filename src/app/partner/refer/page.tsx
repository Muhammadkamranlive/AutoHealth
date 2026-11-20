import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { ReferClientForm } from "./refer-form";

export default async function ReferPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");
  return <ReferClientForm user={user} />;
}
