export type UserRole =
  | "patient"
  | "physician"
  | "care_team"
  | "admin"
  | "partner"
  | "partner_staff";

export type OrderStatus =
  | "pending_review"
  | "approved"
  | "denied"
  | "shipped"
  | "delivered";

export type TreatmentPlanStatus = "active" | "paused" | "completed" | "cancelled";

export type ThreadStatus = "open" | "closed";

export type ThreadChannel = "in_app" | "email";

export type DocumentType = "lab_result" | "id" | "other";

export type ReferralStatus = "referred" | "enrolled" | "active" | "inactive";

export type PayoutStatus = "pending" | "paid";

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "trialing"
  | "incomplete";

export type BillingInterval = "month" | "quarter" | "year";

export type BillingPlan = {
  id: string;
  name: string;
  description: string | null;
  amount_cents: number;
  currency: string;
  interval: BillingInterval;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type MenuAssignmentMode = "role" | "custom";

export type Profile = {
  id: string;
  role: UserRole;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  menu_mode: MenuAssignmentMode;
  workspace_label: string | null;
  profile_completion_percent: number;
  profile_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PlatformMenu = {
  id: string;
  menu_key: string;
  label: string;
  href: string;
  icon: string;
  parent_key: string | null;
  permission: string;
  sort_order: number;
  widgets: string[];
  is_active: boolean;
  created_at: string;
};

export type RoleMenuGrant = {
  role: UserRole;
  menu_key: string;
  allowed_actions: string[];
};

export type UserMenuGrant = {
  user_id: string;
  menu_key: string;
  granted_by: string | null;
  created_at: string;
  allowed_actions: string[];
};

export type ProfileFormTemplate = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  target_roles: UserRole[];
  schema: Record<string, unknown>;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileFormAssignment = {
  id: string;
  form_id: string;
  assignment_type: "role" | "user";
  role: UserRole | null;
  user_id: string | null;
  created_at: string;
};

export type ProfileFormSubmission = {
  id: string;
  form_id: string;
  user_id: string;
  responses: Record<string, unknown>;
  status: "draft" | "submitted";
  completion_percent: number;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NotificationType = "login" | "task_assigned";

export type AppNotification = {
  id: string;
  user_id: string;
  type: NotificationType | string;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type Patient = {
  id: string;
  user_id: string;
  date_of_birth: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  assigned_physician_id: string | null;
  created_at: string;
  updated_at: string;
}

export type TreatmentPlan = {
  id: string;
  patient_id: string;
  physician_id: string;
  medication: string;
  protocol: string | null;
  status: TreatmentPlanStatus;
  billing_plan_id: string | null;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export type Order = {
  id: string;
  patient_id: string;
  treatment_plan_id: string;
  status: OrderStatus;
  is_refill: boolean;
  denial_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  stripe_invoice_id: string | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
}

export type MessageThread = {
  id: string;
  patient_id: string;
  assigned_staff_id: string | null;
  status: ThreadStatus;
  channel: ThreadChannel;
  subject: string | null;
  created_at: string;
  updated_at: string;
}

export type Message = {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_role: UserRole;
  body: string;
  attachments: string[];
  read_at: string | null;
  created_at: string;
}

export type Document = {
  id: string;
  patient_id: string;
  type: DocumentType;
  storage_path: string;
  file_name: string;
  uploaded_by: string;
  created_at: string;
}

export type Subscription = {
  id: string;
  patient_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  billing_plan_id: string | null;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export type Invoice = {
  id: string;
  patient_id: string;
  stripe_invoice_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export type Partner = {
  id: string;
  org_name: string;
  contact_email: string;
  contact_phone: string | null;
  payout_method: string | null;
  created_at: string;
  updated_at: string;
}

export type PartnerReferral = {
  id: string;
  partner_id: string;
  patient_id: string | null;
  referred_name: string;
  referred_email: string;
  referred_phone: string | null;
  status: ReferralStatus;
  enrolled_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PartnerPayout = {
  id: string;
  partner_id: string;
  period_start: string;
  period_end: string;
  amount_cents: number;
  status: PayoutStatus;
  referral_breakdown: Record<string, unknown>;
  paid_at: string | null;
  created_at: string;
}

export type AuditLogEntry = {
  id: string;
  actor_id: string;
  actor_role: UserRole;
  action: string;
  target_table: string;
  target_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

type TableDef<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<
        Profile,
        Omit<Profile, "created_at" | "updated_at"> & { created_at?: string; updated_at?: string },
        Partial<Profile>
      >;
      patients: TableDef<
        Patient,
        Omit<Patient, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string },
        Partial<Patient>
      >;
      treatment_plans: TableDef<
        TreatmentPlan,
        Omit<TreatmentPlan, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string },
        Partial<TreatmentPlan>
      >;
      orders: TableDef<
        Order,
        Omit<Order, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string },
        Partial<Order>
      >;
      message_threads: TableDef<
        MessageThread,
        Omit<MessageThread, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string },
        Partial<MessageThread>
      >;
      messages: TableDef<
        Message,
        Omit<Message, "id" | "created_at"> & { id?: string; created_at?: string },
        Partial<Message>
      >;
      documents: TableDef<
        Document,
        Omit<Document, "id" | "created_at"> & { id?: string; created_at?: string },
        Partial<Document>
      >;
      billing_plans: TableDef<
        BillingPlan,
        Omit<BillingPlan, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string },
        Partial<BillingPlan>
      >;
      subscriptions: TableDef<
        Subscription,
        Omit<Subscription, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string },
        Partial<Subscription>
      >;
      invoices: TableDef<
        Invoice,
        Omit<Invoice, "id" | "created_at"> & { id?: string; created_at?: string },
        Partial<Invoice>
      >;
      partners: TableDef<
        Partner,
        Omit<Partner, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string },
        Partial<Partner>
      >;
      partner_referrals: TableDef<
        PartnerReferral,
        Omit<PartnerReferral, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string },
        Partial<PartnerReferral>
      >;
      partner_payouts: TableDef<
        PartnerPayout,
        Omit<PartnerPayout, "id" | "created_at"> & { id?: string; created_at?: string },
        Partial<PartnerPayout>
      >;
      audit_log: TableDef<
        AuditLogEntry,
        Omit<AuditLogEntry, "id" | "created_at"> & { id?: string; created_at?: string },
        Partial<AuditLogEntry>
      >;
      partner_users: TableDef<
        { id: string; partner_id: string; user_id: string; created_at: string },
        { id?: string; partner_id: string; user_id: string; created_at?: string },
        Partial<{ partner_id: string; user_id: string }>
      >;
      platform_menus: TableDef<
        PlatformMenu,
        Omit<PlatformMenu, "id" | "created_at"> & { id?: string; created_at?: string },
        Partial<PlatformMenu>
      >;
      role_menu_grants: TableDef<RoleMenuGrant, RoleMenuGrant, Partial<RoleMenuGrant>>;
      user_menu_grants: TableDef<
        UserMenuGrant,
        Omit<UserMenuGrant, "created_at"> & { created_at?: string },
        Partial<UserMenuGrant>
      >;
      profile_form_templates: TableDef<
        ProfileFormTemplate,
        Omit<ProfileFormTemplate, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string },
        Partial<ProfileFormTemplate>
      >;
      profile_form_assignments: TableDef<
        ProfileFormAssignment,
        Omit<ProfileFormAssignment, "id" | "created_at"> & { id?: string; created_at?: string },
        Partial<ProfileFormAssignment>
      >;
      profile_form_submissions: TableDef<
        ProfileFormSubmission,
        Omit<ProfileFormSubmission, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string },
        Partial<ProfileFormSubmission>
      >;
      notifications: TableDef<
        AppNotification,
        Omit<AppNotification, "id" | "created_at" | "read_at" | "metadata"> & {
          id?: string;
          created_at?: string;
          read_at?: string | null;
          metadata?: Record<string, unknown>;
          body?: string | null;
          href?: string | null;
        },
        Partial<AppNotification>
      >;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      write_audit_log: {
        Args: {
          p_action: string;
          p_target_table: string;
          p_target_id: string;
          p_metadata?: Record<string, unknown> | null;
        };
        Returns: void;
      };
      get_user_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
    };
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      treatment_plan_status: TreatmentPlanStatus;
      thread_status: ThreadStatus;
      thread_channel: ThreadChannel;
      document_type: DocumentType;
      billing_interval: BillingInterval;
      referral_status: ReferralStatus;
      payout_status: PayoutStatus;
      subscription_status: SubscriptionStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
