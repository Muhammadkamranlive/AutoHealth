/** Product brand — use these constants instead of hardcoding the name. */
export const brand = {
  name: "HealthBridge",
  legalName: "HealthBridge, Inc.",
  tagline: "Care that connects",
  shortTagline: "Patients · Clinicians · Partners",
  description:
    "HealthBridge is a virtual clinic that keeps patients, licensed clinicians, and referring partners on one record — treatment plans, orders, messages, and payouts in a single HIPAA-compliant home.",
  initials: "HB",
  supportEmail: "support@healthbridge.com",
  emailFromFallback: "HealthBridge <noreply@healthbridge.local>",
} as const;

export const brandTitle = `${brand.name} — Care that connects`;
