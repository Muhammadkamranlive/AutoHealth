import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";
import { Card, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { PatientShell } from "@/components/patient-shell";

export default async function SettingsPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  return (
    <PatientShell user={user}>
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Card title="Profile">
          <div className="space-y-4">
            <Input label="First name" defaultValue={user.firstName ?? ""} readOnly />
            <Input label="Last name" defaultValue={user.lastName ?? ""} readOnly />
            <Input label="Email" defaultValue={user.email} readOnly />
          </div>
        </Card>
      </div>
    </PatientShell>
  );
}
