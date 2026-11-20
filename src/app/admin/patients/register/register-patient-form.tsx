"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Button, FormActions, FormCard, FormGrid, Input, LoadingOverlay, Select } from "@/components/ui";
import { registerPatient } from "../actions";

type PhysicianOption = { id: string; name: string };

export function RegisterPatientForm({
  physicians,
  canCreate,
}: {
  physicians: PhysicianOption[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zip: "",
    assignedPhysicianId: "",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate) return;
    setError("");
    startTransition(async () => {
      try {
        const patientId = await registerPatient({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          addressLine1: form.addressLine1 || undefined,
          addressLine2: form.addressLine2 || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          zip: form.zip || undefined,
          assignedPhysicianId: form.assignedPhysicianId || undefined,
        });
        router.push(`/admin/patients/${patientId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Registration failed");
      }
    });
  }

  return (
    <>
      <LoadingOverlay active={pending} message="saving" />
      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
        <FormCard title="Account credentials">
          <fieldset disabled={!canCreate} className="mt-4 space-y-4 disabled:opacity-60">
            <p className="text-sm text-slate-500">
              Creates a login for the patient. Share the temporary password securely — they can change it after first sign-in.
            </p>
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Temporary password"
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required
              minLength={6}
              hint="Minimum 6 characters"
              autoComplete="new-password"
            />
          </fieldset>
        </FormCard>

        <FormCard title="Personal information">
          <fieldset disabled={!canCreate} className="mt-4 space-y-4 disabled:opacity-60">
            <FormGrid>
              <Input
                label="First name"
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                required
              />
              <Input
                label="Last name"
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                required
              />
            </FormGrid>
            <FormGrid>
              <Input
                label="Phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="(555) 123-4567"
              />
              <Input
                label="Date of birth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => set("dateOfBirth", e.target.value)}
              />
            </FormGrid>
            <Select
              label="Assigned physician"
              value={form.assignedPhysicianId}
              onChange={(e) => set("assignedPhysicianId", e.target.value)}
            >
              <option value="">Unassigned</option>
              {physicians.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </fieldset>
        </FormCard>

        <FormCard title="Address (optional)">
          <fieldset disabled={!canCreate} className="mt-4 space-y-4 disabled:opacity-60">
            <Input
              label="Street address"
              value={form.addressLine1}
              onChange={(e) => set("addressLine1", e.target.value)}
            />
            <Input
              label="Apt / suite"
              value={form.addressLine2}
              onChange={(e) => set("addressLine2", e.target.value)}
            />
            <FormGrid>
              <Input label="City" value={form.city} onChange={(e) => set("city", e.target.value)} />
              <Input label="State" value={form.state} onChange={(e) => set("state", e.target.value)} />
            </FormGrid>
            <Input label="ZIP code" value={form.zip} onChange={(e) => set("zip", e.target.value)} />
          </fieldset>
        </FormCard>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        <FormActions>
          {canCreate && (
            <Button type="submit" disabled={pending}>
              Register patient
            </Button>
          )}
          <Link
            href="/admin/patients"
            className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </Link>
        </FormActions>
      </form>
    </>
  );
}
