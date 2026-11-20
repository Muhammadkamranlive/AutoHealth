import type { UserRole } from "@/lib/db";
import type { FormSchema } from "../types";

export type FormTemplateCategory =
  | "provider"
  | "clinical"
  | "patient"
  | "partner"
  | "compliance";

export interface MarketFormTemplate {
  id: string;
  title: string;
  description: string;
  category: FormTemplateCategory;
  /** Industry reference (e.g. HIPAA, CAQH-style) */
  basedOn: string;
  targetRoles: UserRole[];
  accent: "teal" | "blue" | "violet" | "amber" | "rose" | "emerald";
  estimatedMinutes: number;
  fieldCount: number;
  schema: FormSchema;
}

const CATEGORY_LABELS: Record<FormTemplateCategory, string> = {
  provider: "Provider credentialing",
  clinical: "Clinical staff",
  patient: "Patient intake",
  partner: "Partner onboarding",
  compliance: "Compliance & consent",
};

export function getCategoryLabel(category: FormTemplateCategory): string {
  return CATEGORY_LABELS[category];
}

export const MARKET_FORM_TEMPLATES: MarketFormTemplate[] = [
  {
    id: "physician-provider-profile",
    title: "Physician Provider Profile",
    description:
      "CAQH / Doximity-style provider credentialing — NPI, license, specialty, photo, and professional bio.",
    category: "provider",
    basedOn: "CAQH ProView · NPPES",
    targetRoles: ["physician"],
    accent: "blue",
    estimatedMinutes: 8,
    fieldCount: 14,
    schema: {
      fields: [
        { id: "sec-identity", type: "section", label: "Identity & contact", width: "full" },
        {
          id: "photo",
          type: "image",
          label: "Professional headshot",
          helpText: "Square photo, min 400×400px. JPG or PNG, max 5MB.",
          required: true,
          width: "full",
        },
        { id: "first-name", type: "text", label: "Legal first name", required: true, width: "half", validation: { minLength: 2, maxLength: 64 } },
        { id: "last-name", type: "text", label: "Legal last name", required: true, width: "half", validation: { minLength: 2, maxLength: 64 } },
        { id: "email", type: "email", label: "Work email", required: true, width: "half", validation: { pattern: "email" } },
        { id: "phone", type: "phone", label: "Direct phone", placeholder: "(555) 123-4567", required: true, width: "half", validation: { pattern: "phone" } },
        { id: "sec-credentials", type: "section", label: "Credentials & licensure", width: "full" },
        { id: "npi", type: "text", label: "NPI number", placeholder: "10-digit NPI", required: true, width: "half", validation: { pattern: "npi" } },
        { id: "license-state", type: "select", label: "Primary license state", required: true, width: "half", options: ["CA", "NY", "TX", "FL", "IL", "PA", "OH", "Other"] },
        { id: "license-number", type: "text", label: "Medical license number", required: true, width: "half", validation: { minLength: 4, maxLength: 32 } },
        { id: "dea", type: "text", label: "DEA number (optional)", placeholder: "AB1234567", width: "half", validation: { pattern: "dea" } },
        { id: "specialty", type: "select", label: "Primary specialty", required: true, width: "full", options: ["Family Medicine", "Internal Medicine", "Pediatrics", "Cardiology", "Dermatology", "Psychiatry", "Emergency Medicine", "Other"] },
        { id: "board-certified", type: "radio", label: "Board certified?", required: true, width: "full", options: ["Yes", "No", "In progress"] },
        { id: "bio", type: "textarea", label: "Professional bio", placeholder: "Brief background for patients and care team", required: true, width: "full", validation: { minLength: 50, maxLength: 2000 } },
        { id: "sec-agreement", type: "section", label: "Attestation", width: "full" },
        { id: "attest", type: "checkbox", label: "I attest that the information provided is accurate and complete", required: true, width: "full" },
      ],
    },
  },
  {
    id: "nurse-care-team-profile",
    title: "Nurse & Care Team Profile",
    description:
      "Clinical staff onboarding — license type, certifications, department, and emergency contact.",
    category: "clinical",
    basedOn: "HealthStream · MedTrainer",
    targetRoles: ["care_team"],
    accent: "teal",
    estimatedMinutes: 6,
    fieldCount: 12,
    schema: {
      fields: [
        { id: "sec-basic", type: "section", label: "Basic information", width: "full" },
        { id: "photo", type: "image", label: "Profile photo", required: true, width: "full" },
        { id: "full-name", type: "text", label: "Full legal name", required: true, width: "full", validation: { minLength: 3 } },
        { id: "email", type: "email", label: "Work email", required: true, width: "half", validation: { pattern: "email" } },
        { id: "phone", type: "phone", label: "Mobile phone", required: true, width: "half", validation: { pattern: "phone" } },
        { id: "sec-license", type: "section", label: "Licensure & credentials", width: "full" },
        { id: "license-type", type: "select", label: "License type", required: true, width: "half", options: ["RN", "LPN", "NP", "PA", "MA", "Other"] },
        { id: "license-number", type: "text", label: "License number", required: true, width: "half", validation: { minLength: 4 } },
        { id: "license-expiry", type: "date", label: "License expiration", required: true, width: "half" },
        { id: "certifications", type: "textarea", label: "Active certifications", placeholder: "BLS, ACLS, specialty certs…", width: "full" },
        { id: "department", type: "select", label: "Primary department", required: true, width: "half", options: ["Primary Care", "Urgent Care", "Telehealth", "Care Coordination", "Other"] },
        { id: "emergency-contact", type: "text", label: "Emergency contact name & phone", required: true, width: "full" },
        { id: "terms", type: "checkbox", label: "I agree to maintain current credentials on file", required: true, width: "full" },
      ],
    },
  },
  {
    id: "patient-intake-registration",
    title: "Patient Intake & Registration",
    description:
      "Zocdoc / Phreesia-style new patient registration — demographics, insurance, and emergency contact.",
    category: "patient",
    basedOn: "HL7 FHIR Patient · Phreesia",
    targetRoles: ["patient"],
    accent: "emerald",
    estimatedMinutes: 10,
    fieldCount: 16,
    schema: {
      fields: [
        { id: "sec-demo", type: "section", label: "Demographics", width: "full" },
        { id: "first-name", type: "text", label: "First name", required: true, width: "half", validation: { minLength: 2 } },
        { id: "last-name", type: "text", label: "Last name", required: true, width: "half", validation: { minLength: 2 } },
        { id: "dob", type: "date", label: "Date of birth", required: true, width: "half" },
        { id: "gender", type: "select", label: "Gender identity", required: true, width: "half", options: ["Female", "Male", "Non-binary", "Prefer not to say", "Other"] },
        { id: "email", type: "email", label: "Email", required: true, width: "half", validation: { pattern: "email" } },
        { id: "phone", type: "phone", label: "Mobile phone", required: true, width: "half", validation: { pattern: "phone" } },
        { id: "address", type: "textarea", label: "Home address", required: true, width: "full", validation: { minLength: 10 } },
        { id: "zip", type: "text", label: "ZIP code", required: true, width: "half", validation: { pattern: "zip" } },
        { id: "sec-insurance", type: "section", label: "Insurance", width: "full" },
        { id: "insurance-carrier", type: "text", label: "Insurance carrier", required: true, width: "half" },
        { id: "member-id", type: "text", label: "Member / policy ID", required: true, width: "half" },
        { id: "group-number", type: "text", label: "Group number", width: "half" },
        { id: "sec-emergency", type: "section", label: "Emergency contact", width: "full" },
        { id: "ec-name", type: "text", label: "Contact name", required: true, width: "half" },
        { id: "ec-phone", type: "phone", label: "Contact phone", required: true, width: "half", validation: { pattern: "phone" } },
        { id: "ec-relationship", type: "select", label: "Relationship", required: true, width: "half", options: ["Spouse", "Parent", "Child", "Sibling", "Friend", "Other"] },
        { id: "consent-treatment", type: "checkbox", label: "I consent to receive treatment and understand billing policies", required: true, width: "full" },
      ],
    },
  },
  {
    id: "partner-pharmacy-profile",
    title: "Pharmacy Partner Profile",
    description:
      "NCPDP-style pharmacy network onboarding — NCPDP ID, DEA, address, and primary contact.",
    category: "partner",
    basedOn: "NCPDP · Surescripts",
    targetRoles: ["partner", "partner_staff"],
    accent: "violet",
    estimatedMinutes: 7,
    fieldCount: 13,
    schema: {
      fields: [
        { id: "sec-org", type: "section", label: "Organization", width: "full" },
        { id: "pharmacy-name", type: "text", label: "Legal pharmacy name", required: true, width: "full", validation: { minLength: 3 } },
        { id: "dba", type: "text", label: "DBA / trade name", width: "half" },
        { id: "ncpdp", type: "text", label: "NCPDP provider ID", placeholder: "7-digit ID", required: true, width: "half", validation: { minLength: 7, maxLength: 7 } },
        { id: "dea", type: "text", label: "DEA number", required: true, width: "half", validation: { pattern: "dea" } },
        { id: "npi", type: "text", label: "Organization NPI", required: true, width: "half", validation: { pattern: "npi" } },
        { id: "sec-location", type: "section", label: "Location & contact", width: "full" },
        { id: "address", type: "textarea", label: "Street address", required: true, width: "full" },
        { id: "city", type: "text", label: "City", required: true, width: "half" },
        { id: "state", type: "select", label: "State", required: true, width: "half", options: ["CA", "NY", "TX", "FL", "IL", "PA", "OH", "Other"] },
        { id: "zip", type: "text", label: "ZIP", required: true, width: "half", validation: { pattern: "zip" } },
        { id: "contact-name", type: "text", label: "Primary contact name", required: true, width: "half" },
        { id: "contact-email", type: "email", label: "Primary contact email", required: true, width: "half", validation: { pattern: "email" } },
        { id: "contact-phone", type: "phone", label: "Primary contact phone", required: true, width: "half", validation: { pattern: "phone" } },
        { id: "terms", type: "checkbox", label: "I confirm this pharmacy is licensed and in good standing", required: true, width: "full" },
      ],
    },
  },
  {
    id: "hipaa-privacy-acknowledgement",
    title: "HIPAA Privacy Acknowledgement",
    description:
      "Standard Notice of Privacy Practices acknowledgement — required for covered entities and business associates.",
    category: "compliance",
    basedOn: "HIPAA §164.520",
    targetRoles: ["physician", "care_team", "patient", "partner_staff"],
    accent: "rose",
    estimatedMinutes: 3,
    fieldCount: 5,
    schema: {
      fields: [
        { id: "sec-notice", type: "section", label: "Notice of Privacy Practices", width: "full" },
        { id: "ack-read", type: "checkbox", label: "I have received and reviewed the Notice of Privacy Practices", required: true, width: "full" },
        { id: "ack-rights", type: "checkbox", label: "I understand my rights regarding access, amendment, and disclosure of my health information", required: true, width: "full" },
        { id: "ack-contact", type: "checkbox", label: "I know how to contact the Privacy Officer with questions or complaints", required: true, width: "full" },
        { id: "signature-name", type: "text", label: "Full legal name (electronic signature)", required: true, width: "full", validation: { minLength: 3 } },
        { id: "signature-date", type: "date", label: "Date signed", required: true, width: "half" },
      ],
    },
  },
  {
    id: "telehealth-informed-consent",
    title: "Telehealth Informed Consent",
    description:
      "AMA / state telemedicine consent — technology limits, privacy, emergency procedures, and consent.",
    category: "compliance",
    basedOn: "AMA Telehealth Guidelines",
    targetRoles: ["patient", "physician"],
    accent: "amber",
    estimatedMinutes: 4,
    fieldCount: 7,
    schema: {
      fields: [
        { id: "sec-consent", type: "section", label: "Telehealth consent", width: "full" },
        { id: "consent-tech", type: "checkbox", label: "I understand telehealth has limitations and is not for emergencies (call 911)", required: true, width: "full" },
        { id: "consent-privacy", type: "checkbox", label: "I will use a private location and secure internet connection", required: true, width: "full" },
        { id: "consent-recording", type: "radio", label: "Session recording", required: true, width: "full", options: ["I consent to recording for quality purposes", "I do not consent to recording"] },
        { id: "state", type: "select", label: "State where you will receive care", required: true, width: "half", options: ["CA", "NY", "TX", "FL", "IL", "PA", "OH", "Other"] },
        { id: "signature-name", type: "text", label: "Full legal name", required: true, width: "full", validation: { minLength: 3 } },
        { id: "signature-date", type: "date", label: "Date", required: true, width: "half" },
      ],
    },
  },
];

export function getTemplateById(id: string): MarketFormTemplate | undefined {
  return MARKET_FORM_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: FormTemplateCategory): MarketFormTemplate[] {
  return MARKET_FORM_TEMPLATES.filter((t) => t.category === category);
}
