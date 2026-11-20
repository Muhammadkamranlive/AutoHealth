-- HealthBridge Phase 1: Core schema + RLS foundation

-- Enums
CREATE TYPE user_role AS ENUM (
  'patient', 'physician', 'care_team', 'admin', 'partner', 'partner_staff'
);

CREATE TYPE order_status AS ENUM (
  'pending_review', 'approved', 'denied', 'shipped', 'delivered'
);

CREATE TYPE treatment_plan_status AS ENUM (
  'active', 'paused', 'completed', 'cancelled'
);

CREATE TYPE thread_status AS ENUM ('open', 'closed');

CREATE TYPE thread_channel AS ENUM ('in_app', 'email');

CREATE TYPE document_type AS ENUM ('lab_result', 'id', 'other');

CREATE TYPE referral_status AS ENUM (
  'referred', 'enrolled', 'active', 'inactive'
);

CREATE TYPE payout_status AS ENUM ('pending', 'paid');

CREATE TYPE subscription_status AS ENUM (
  'active', 'past_due', 'canceled', 'trialing', 'incomplete'
);

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'patient',
  email text NOT NULL,
  first_name text,
  last_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Patients
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  date_of_birth date,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip text,
  assigned_physician_id uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Treatment plans
CREATE TABLE public.treatment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  physician_id uuid NOT NULL REFERENCES public.profiles(id),
  medication text NOT NULL,
  protocol text,
  status treatment_plan_status NOT NULL DEFAULT 'active',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  treatment_plan_id uuid NOT NULL REFERENCES public.treatment_plans(id),
  status order_status NOT NULL DEFAULT 'pending_review',
  is_refill boolean NOT NULL DEFAULT false,
  denial_reason text,
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamptz,
  stripe_invoice_id text,
  tracking_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Message threads
CREATE TABLE public.message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  assigned_staff_id uuid REFERENCES public.profiles(id),
  status thread_status NOT NULL DEFAULT 'open',
  channel thread_channel NOT NULL DEFAULT 'in_app',
  subject text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  sender_role user_role NOT NULL,
  body text NOT NULL,
  attachments text[] NOT NULL DEFAULT '{}',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Documents
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  type document_type NOT NULL DEFAULT 'other',
  storage_path text NOT NULL,
  file_name text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Subscriptions (Stripe mirror)
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Invoices (Stripe mirror)
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  stripe_invoice_id text NOT NULL UNIQUE,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Partners
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  payout_method text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Partner users (links auth users to partner orgs)
CREATE TABLE public.partner_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Partner referrals
CREATE TABLE public.partner_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients(id),
  referred_name text NOT NULL,
  referred_email text NOT NULL,
  referred_phone text,
  status referral_status NOT NULL DEFAULT 'referred',
  enrolled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Partner payouts
CREATE TABLE public.partner_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  amount_cents integer NOT NULL,
  status payout_status NOT NULL DEFAULT 'pending',
  referral_breakdown jsonb NOT NULL DEFAULT '{}',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Audit log
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  actor_role user_role NOT NULL,
  action text NOT NULL,
  target_table text NOT NULL,
  target_id uuid NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_patients_user_id ON public.patients(user_id);
CREATE INDEX idx_patients_physician ON public.patients(assigned_physician_id);
CREATE INDEX idx_orders_patient_id ON public.orders(patient_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_pending ON public.orders(status) WHERE status = 'pending_review';
CREATE INDEX idx_treatment_plans_patient ON public.treatment_plans(patient_id);
CREATE INDEX idx_message_threads_patient ON public.message_threads(patient_id);
CREATE INDEX idx_message_threads_staff ON public.message_threads(assigned_staff_id);
CREATE INDEX idx_messages_thread ON public.messages(thread_id);
CREATE INDEX idx_documents_patient ON public.documents(patient_id);
CREATE INDEX idx_partner_referrals_partner ON public.partner_referrals(partner_id);
CREATE INDEX idx_partner_users_user ON public.partner_users(user_id);
CREATE INDEX idx_audit_log_target ON public.audit_log(target_table, target_id);
CREATE INDEX idx_audit_log_actor ON public.audit_log(actor_id);

-- Helper functions (must come after tables exist)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_internal_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT get_user_role() IN ('physician', 'care_team', 'admin');
$$;

CREATE OR REPLACE FUNCTION public.can_approve_orders()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT get_user_role() IN ('physician', 'admin');
$$;

CREATE OR REPLACE FUNCTION public.get_partner_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT partner_id FROM public.partner_users WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_patient_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.patients WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'patient');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER patients_updated_at BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER treatment_plans_updated_at BEFORE UPDATE ON public.treatment_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER message_threads_updated_at BEFORE UPDATE ON public.message_threads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER partners_updated_at BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER partner_referrals_updated_at BEFORE UPDATE ON public.partner_referrals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Audit log helper
CREATE OR REPLACE FUNCTION public.write_audit_log(
  p_action text,
  p_target_table text,
  p_target_id uuid,
  p_metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log (actor_id, actor_role, action, target_table, target_id, metadata)
  VALUES (
    auth.uid(),
    get_user_role(),
    p_action,
    p_target_table,
    p_target_id,
    p_metadata
  );
END;
$$;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- =====================
-- RLS POLICIES
-- =====================

-- Profiles
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR is_internal_staff());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admin can manage all profiles"
  ON public.profiles FOR ALL
  USING (get_user_role() = 'admin');

-- Patients
CREATE POLICY "Patients read own record"
  ON public.patients FOR SELECT
  USING (user_id = auth.uid() OR is_internal_staff());

CREATE POLICY "Patients update own record"
  ON public.patients FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff insert patients"
  ON public.patients FOR INSERT
  WITH CHECK (is_internal_staff());

CREATE POLICY "Staff update patients"
  ON public.patients FOR UPDATE
  USING (is_internal_staff());

-- Treatment plans
CREATE POLICY "Patients read own treatment plans"
  ON public.treatment_plans FOR SELECT
  USING (
    patient_id = get_patient_id()
    OR is_internal_staff()
  );

CREATE POLICY "Staff manage treatment plans"
  ON public.treatment_plans FOR ALL
  USING (is_internal_staff());

-- Orders
CREATE POLICY "Patients read own orders"
  ON public.orders FOR SELECT
  USING (
    patient_id = get_patient_id()
    OR is_internal_staff()
  );

CREATE POLICY "Patients create refill orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    patient_id = get_patient_id()
    AND is_refill = true
    AND status = 'pending_review'
  );

CREATE POLICY "Staff manage orders"
  ON public.orders FOR ALL
  USING (is_internal_staff());

CREATE POLICY "Physicians approve/deny orders"
  ON public.orders FOR UPDATE
  USING (can_approve_orders())
  WITH CHECK (can_approve_orders());

-- Message threads
CREATE POLICY "Patients read own threads"
  ON public.message_threads FOR SELECT
  USING (
    patient_id = get_patient_id()
    OR is_internal_staff()
  );

CREATE POLICY "Patients create threads"
  ON public.message_threads FOR INSERT
  WITH CHECK (patient_id = get_patient_id());

CREATE POLICY "Staff manage threads"
  ON public.message_threads FOR ALL
  USING (is_internal_staff());

-- Messages
CREATE POLICY "Thread participants read messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.message_threads t
      WHERE t.id = thread_id
      AND (t.patient_id = get_patient_id() OR is_internal_staff())
    )
  );

CREATE POLICY "Thread participants send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.message_threads t
      WHERE t.id = thread_id
      AND (t.patient_id = get_patient_id() OR is_internal_staff())
    )
  );

CREATE POLICY "Staff update messages"
  ON public.messages FOR UPDATE
  USING (is_internal_staff());

-- Documents
CREATE POLICY "Patients read own documents"
  ON public.documents FOR SELECT
  USING (
    patient_id = get_patient_id()
    OR is_internal_staff()
  );

CREATE POLICY "Patients upload own documents"
  ON public.documents FOR INSERT
  WITH CHECK (
    patient_id = get_patient_id()
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Staff manage documents"
  ON public.documents FOR ALL
  USING (is_internal_staff());

-- Subscriptions
CREATE POLICY "Patients read own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (
    patient_id = get_patient_id()
    OR is_internal_staff()
  );

CREATE POLICY "Staff manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (is_internal_staff());

-- Invoices
CREATE POLICY "Patients read own invoices"
  ON public.invoices FOR SELECT
  USING (
    patient_id = get_patient_id()
    OR is_internal_staff()
  );

CREATE POLICY "Staff manage invoices"
  ON public.invoices FOR ALL
  USING (is_internal_staff());

-- Partners (internal staff only for full access)
CREATE POLICY "Staff manage partners"
  ON public.partners FOR ALL
  USING (is_internal_staff());

CREATE POLICY "Partner users read own org"
  ON public.partners FOR SELECT
  USING (id = get_partner_id());

CREATE POLICY "Partner users update own org"
  ON public.partners FOR UPDATE
  USING (id = get_partner_id());

-- Partner users
CREATE POLICY "Staff manage partner users"
  ON public.partner_users FOR ALL
  USING (is_internal_staff());

CREATE POLICY "Partner users read own link"
  ON public.partner_users FOR SELECT
  USING (user_id = auth.uid());

-- Partner referrals (strict boundary — status only, no clinical data)
CREATE POLICY "Staff manage referrals"
  ON public.partner_referrals FOR ALL
  USING (is_internal_staff());

CREATE POLICY "Partners read own referrals"
  ON public.partner_referrals FOR SELECT
  USING (partner_id = get_partner_id());

CREATE POLICY "Partners create referrals"
  ON public.partner_referrals FOR INSERT
  WITH CHECK (partner_id = get_partner_id());

-- Partner payouts
CREATE POLICY "Staff manage payouts"
  ON public.partner_payouts FOR ALL
  USING (is_internal_staff());

CREATE POLICY "Partners read own payouts"
  ON public.partner_payouts FOR SELECT
  USING (partner_id = get_partner_id());

-- Audit log (staff read-only, system writes via function)
CREATE POLICY "Staff read audit log"
  ON public.audit_log FOR SELECT
  USING (is_internal_staff());

CREATE POLICY "Authenticated users write audit log"
  ON public.audit_log FOR INSERT
  WITH CHECK (actor_id = auth.uid());

-- Storage bucket for documents (private).
-- Hosted reset does not wipe storage.buckets, so this must be idempotent.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patient-documents',
  'patient-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS (policies on storage.objects also survive a linked reset)
DROP POLICY IF EXISTS "Patients upload own documents" ON storage.objects;
CREATE POLICY "Patients upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'patient-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Patients read own documents" ON storage.objects;
CREATE POLICY "Patients read own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'patient-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR is_internal_staff()
    )
  );

DROP POLICY IF EXISTS "Staff manage all documents" ON storage.objects;
CREATE POLICY "Staff manage all documents"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'patient-documents'
    AND is_internal_staff()
  );
