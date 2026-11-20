-- Admin-defined membership plans (what patients pay for after treatment is assigned)

CREATE TYPE billing_interval AS ENUM ('month', 'quarter', 'year');

CREATE TABLE public.billing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'usd',
  interval billing_interval NOT NULL DEFAULT 'month',
  features text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.treatment_plans
  ADD COLUMN billing_plan_id uuid REFERENCES public.billing_plans(id);

ALTER TABLE public.subscriptions
  ADD COLUMN billing_plan_id uuid REFERENCES public.billing_plans(id);

CREATE INDEX idx_billing_plans_active ON public.billing_plans(is_active, sort_order);
CREATE INDEX idx_treatment_plans_billing ON public.treatment_plans(billing_plan_id);

CREATE TRIGGER billing_plans_updated_at BEFORE UPDATE ON public.billing_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage billing plans"
  ON public.billing_plans FOR ALL
  USING (is_internal_staff());

CREATE POLICY "Patients read active billing plans"
  ON public.billing_plans FOR SELECT
  USING (is_active = true OR is_internal_staff());

-- Starter plans clinics can customize in admin
INSERT INTO public.billing_plans (name, description, amount_cents, interval, features, sort_order) VALUES
  (
    'TRT Monthly Care',
    'Testosterone replacement therapy with physician oversight, labs coordination, and refill management.',
    19900,
    'month',
    ARRAY['Monthly medication supply', 'Physician review of orders', 'Secure messaging with care team', 'Refill requests'],
    10
  ),
  (
    'Weight Management Program',
    'GLP-1 or medically supervised weight program with ongoing clinical support.',
    14900,
    'month',
    ARRAY['Monthly program fee', 'Physician-approved orders', 'Care team messaging', 'Progress check-ins'],
    20
  ),
  (
    'Peptide Therapy Plan',
    'Peptide protocol with prescribing physician and fulfillment coordination.',
    24900,
    'month',
    ARRAY['Protocol management', 'Order physician review', 'Priority messaging', 'Quarterly plan review'],
    30
  );

INSERT INTO public.platform_menus (menu_key, label, href, icon, parent_key, permission, sort_order, widgets) VALUES
  ('billing_plans', 'Billing Plans', '/admin/billing-plans', 'credit-card', NULL, 'billing:read', 36, ARRAY[]::text[])
ON CONFLICT (menu_key) DO NOTHING;

INSERT INTO public.role_menu_grants (role, menu_key, allowed_actions)
SELECT r.role, 'billing_plans', ARRAY['read', 'create', 'update', 'delete']::text[]
FROM (VALUES ('admin'::user_role), ('physician'::user_role)) AS r(role)
ON CONFLICT (role, menu_key) DO NOTHING;
