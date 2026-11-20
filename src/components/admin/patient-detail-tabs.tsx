"use client";

import { useState } from "react";
import Link from "next/link";
import type {
  AuditLogEntry,
  BillingPlan,
  Document,
  Invoice,
  Message,
  MessageThread,
  Order,
  Profile,
  Subscription,
  TreatmentPlan,
} from "@/lib/db";
import { Badge, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, orderStatusBadge } from "@/components/ui";
import { AssignTreatmentForm } from "@/components/admin/assign-treatment-form";
import { formatAuditAction } from "@/lib/admin/audit-trail";
import { getRoleDisplayName } from "@/lib/auth";

type PatientRow = {
  id: string;
  user_id: string;
  date_of_birth: string | null;
  assigned_physician_id: string | null;
  created_at: string;
  updated_at: string;
};

type TabId = "overview" | "treatment" | "orders" | "messages" | "documents" | "billing" | "audit";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "treatment", label: "Treatment" },
  { id: "orders", label: "Orders" },
  { id: "messages", label: "Messages" },
  { id: "documents", label: "Documents" },
  { id: "billing", label: "Billing" },
  { id: "audit", label: "Audit trail" },
];

export function PatientDetailTabs({
  patient,
  profile,
  physicianName,
  treatmentPlans,
  orders,
  threads,
  recentMessages,
  documents,
  subscriptions,
  invoices,
  auditEntries,
  actorNames,
  billingPlans,
  billingPlanNames,
}: {
  patient: PatientRow;
  profile: Pick<Profile, "first_name" | "last_name" | "email" | "phone"> | null;
  physicianName: string | null;
  treatmentPlans: TreatmentPlan[];
  orders: Order[];
  threads: MessageThread[];
  recentMessages: (Message & { thread?: MessageThread })[];
  documents: Document[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  auditEntries: AuditLogEntry[];
  actorNames: Record<string, string>;
  billingPlans: BillingPlan[];
  billingPlanNames: Record<string, string>;
}) {
  const [tab, setTab] = useState<TabId>("overview");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/patients" className="text-sm font-medium text-medical-600 hover:text-medical-700">
          ← Back to patients
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-medical-950 dark:text-white">
          {profile?.first_name} {profile?.last_name}
        </h1>
        <p className="text-slate-500">{profile?.email}</p>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-medical-100 bg-medical-50/50 p-1 dark:border-slate-800 dark:bg-slate-900/50">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-white text-medical-800 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-medical-700 dark:text-slate-400"
            }`}
          >
            {t.label}
            {t.id === "audit" && auditEntries.length > 0 && (
              <span className="ml-1.5 rounded-full bg-medical-100 px-1.5 text-xs dark:bg-slate-700">
                {auditEntries.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Contact">
            <dl className="space-y-2 text-sm">
              <Row label="Email" value={profile?.email ?? "—"} />
              <Row label="Phone" value={profile?.phone ?? "—"} />
              <Row label="Date of birth" value={patient.date_of_birth ?? "—"} />
              <Row label="Assigned physician" value={physicianName ?? "Unassigned"} />
              <Row label="Enrolled" value={new Date(patient.created_at).toLocaleDateString()} />
            </dl>
          </Card>
          <Card title="Summary">
            <dl className="space-y-2 text-sm">
              <Row label="Active plans" value={String(treatmentPlans.filter((p) => p.status === "active").length)} />
              <Row label="Total orders" value={String(orders.length)} />
              <Row label="Open threads" value={String(threads.filter((t) => t.status === "open").length)} />
              <Row label="Documents" value={String(documents.length)} />
            </dl>
          </Card>
        </div>
      )}

      {tab === "treatment" && (
        <Card title="Treatment plans">
          {treatmentPlans.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Membership plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {treatmentPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.medication}</TableCell>
                    <TableCell>
                      {plan.billing_plan_id
                        ? billingPlanNames[plan.billing_plan_id] ?? "Linked"
                        : "— Not linked"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.status === "active" ? "success" : "default"}>{plan.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(plan.start_date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-slate-400">No treatment plans on file.</p>
          )}
          <AssignTreatmentForm patientId={patient.id} billingPlans={billingPlans} />
        </Card>
      )}

      {tab === "orders" && (
        <Card title="Orders">
          {orders.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reviewed</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Badge variant={orderStatusBadge(order.status)}>{order.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>{order.is_refill ? "Refill" : "New order"}</TableCell>
                    <TableCell>
                      {order.reviewed_at
                        ? new Date(order.reviewed_at).toLocaleDateString()
                        : "—"}
                      {order.denial_reason && (
                        <p className="mt-0.5 text-xs text-red-600">{order.denial_reason}</p>
                      )}
                    </TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-slate-400">No orders yet.</p>
          )}
        </Card>
      )}

      {tab === "messages" && (
        <div className="space-y-4">
          <Card title="Message threads">
            {threads.length ? (
              <ul className="divide-y divide-medical-100 dark:divide-slate-800">
                {threads.map((thread) => (
                  <li key={thread.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {thread.subject ?? "General inquiry"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {thread.channel} · Updated {new Date(thread.updated_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={thread.status === "open" ? "info" : "default"}>{thread.status}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">No message threads.</p>
            )}
          </Card>
          {recentMessages.length > 0 && (
            <Card title="Recent messages">
              <ul className="space-y-3">
                {recentMessages.map((msg) => (
                  <li key={msg.id} className="rounded-xl border border-medical-100 p-3 dark:border-slate-800">
                    <p className="text-xs font-medium text-slate-500">
                      {getRoleDisplayName(msg.sender_role)} · {new Date(msg.created_at).toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{msg.body}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Link href="/admin/inbox" className="text-sm font-semibold text-medical-600 hover:text-medical-700">
            Open full inbox →
          </Link>
        </div>
      )}

      {tab === "documents" && (
        <Card title="Documents">
          {documents.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Uploaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.file_name}</TableCell>
                    <TableCell>{doc.type.replace("_", " ")}</TableCell>
                    <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-slate-400">No documents uploaded.</p>
          )}
        </Card>
      )}

      {tab === "billing" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Subscription">
            {subscriptions.length ? (
              <dl className="space-y-2 text-sm">
                <Row
                  label="Plan"
                  value={
                    subscriptions[0].billing_plan_id
                      ? billingPlanNames[subscriptions[0].billing_plan_id] ?? "—"
                      : "—"
                  }
                />
                <Row label="Status" value={subscriptions[0].status} />
                <Row label="Period ends" value={new Date(subscriptions[0].current_period_end).toLocaleDateString()} />
              </dl>
            ) : (
              <p className="text-sm text-slate-400">Patient has not activated membership yet.</p>
            )}
          </Card>
          <Card title="Invoices">
            {invoices.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>${(inv.amount_cents / 100).toFixed(2)}</TableCell>
                      <TableCell>{inv.status}</TableCell>
                      <TableCell>{new Date(inv.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-slate-400">No invoices yet.</p>
            )}
          </Card>
        </div>
      )}

      {tab === "audit" && (
        <Card title="Audit trail">
          {auditEntries.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(entry.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {actorNames[entry.actor_id] ?? entry.actor_id.slice(0, 8)}
                      <span className="block text-xs text-slate-400">{getRoleDisplayName(entry.actor_role)}</span>
                    </TableCell>
                    <TableCell className="font-medium capitalize">{formatAuditAction(entry.action)}</TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {entry.target_table} · {entry.target_id.slice(0, 8)}…
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-slate-400">No audit entries for this patient yet.</p>
          )}
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
  );
}
