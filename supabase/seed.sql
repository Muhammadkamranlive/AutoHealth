-- HealthBridge local demo seed (never use real patient data)
-- Applied automatically by `supabase db reset` after migrations.
--
-- Password for every demo account: Demo@1234
--
--   muhammadkamranntu@gmail.com   Administrator
--   admin2@healthbridge.demo      Administrator
--   physician@healthbridge.demo   Physician (plus physician02–08)
--   care@healthbridge.demo        Care team (plus care02–06)
--   patient@healthbridge.demo     Patient (plus patient02–32)
--   partner@healthbridge.demo     Partner org owner (plus partner02–03)
--   staff@healthbridge.demo       Partner staff (plus staff02–03)
--
-- Target: 30+ rows behind every list menu (admin, physician, care team, patient, partner).

CREATE OR REPLACE FUNCTION public.seed_uuid(p_prefix text, p_n integer)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ('00000000-0000-4000-8000-' || p_prefix || lpad(p_n::text, 8, '0'))::uuid;
$$;

CREATE OR REPLACE FUNCTION public.seed_demo_user(
  p_id uuid,
  p_email text,
  p_password text,
  p_first text,
  p_last text,
  p_role user_role,
  p_phone text DEFAULT NULL,
  p_workspace text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    p_id,
    'authenticated',
    'authenticated',
    p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('first_name', p_first, 'last_name', p_last),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    p_id,
    jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
    'email',
    p_id::text,
    now(),
    now(),
    now()
  );

  UPDATE public.profiles
  SET
    role = p_role,
    first_name = p_first,
    last_name = p_last,
    phone = p_phone,
    email = p_email,
    workspace_label = p_workspace,
    profile_completion_percent = CASE
      WHEN p_role IN ('physician', 'care_team', 'admin') THEN 80 + (abs(hashtext(p_email)) % 21)
      ELSE 40 + (abs(hashtext(p_email)) % 50)
    END
  WHERE id = p_id;

  IF p_role <> 'patient' THEN
    DELETE FROM public.patients WHERE user_id = p_id;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Role menu grants — every internal role × every allowed menu
-- Administrator: all menus, full actions
-- Physician / care team: every clinical, billing, reports, and tasks menu
-- User Management, Role Menus, Permissions Matrix, and Form Builder stay Administrator-only.
-- ---------------------------------------------------------------------------
INSERT INTO public.role_menu_grants (role, menu_key, allowed_actions)
SELECT
  'admin'::user_role,
  pm.menu_key,
  ARRAY['read', 'create', 'update', 'delete', 'approve']::text[]
FROM public.platform_menus pm
ON CONFLICT (role, menu_key) DO UPDATE
SET allowed_actions = EXCLUDED.allowed_actions;

INSERT INTO public.role_menu_grants (role, menu_key, allowed_actions)
SELECT
  'physician'::user_role,
  pm.menu_key,
  CASE
    WHEN pm.menu_key LIKE 'orders%' THEN ARRAY['read', 'approve']
    WHEN pm.menu_key LIKE 'patients%' THEN ARRAY['read', 'create', 'update']
    WHEN pm.menu_key = 'billing_plans' THEN ARRAY['read', 'create', 'update']
    WHEN pm.menu_key LIKE 'inbox%' THEN ARRAY['read', 'update']
    WHEN pm.menu_key = 'profile_tasks' THEN ARRAY['read', 'update']
    ELSE ARRAY['read']
  END
FROM public.platform_menus pm
WHERE pm.menu_key NOT IN (
  'users', 'users_list', 'users_create',
  'roles',
  'access', 'access_matrix',
  'form_builder', 'form_builder_list', 'form_builder_new'
)
ON CONFLICT (role, menu_key) DO UPDATE
SET allowed_actions = EXCLUDED.allowed_actions;

INSERT INTO public.role_menu_grants (role, menu_key, allowed_actions)
SELECT
  'care_team'::user_role,
  pm.menu_key,
  CASE
    WHEN pm.menu_key LIKE 'patients%' THEN ARRAY['read', 'create', 'update']
    WHEN pm.menu_key LIKE 'orders%' THEN ARRAY['read']
    WHEN pm.menu_key LIKE 'inbox%' THEN ARRAY['read', 'update']
    WHEN pm.menu_key = 'profile_tasks' THEN ARRAY['read', 'update']
    WHEN pm.menu_key = 'billing_plans' THEN ARRAY['read']
    ELSE ARRAY['read']
  END
FROM public.platform_menus pm
WHERE pm.menu_key NOT IN (
  'users', 'users_list', 'users_create',
  'roles',
  'access', 'access_matrix',
  'form_builder', 'form_builder_list', 'form_builder_new'
)
ON CONFLICT (role, menu_key) DO UPDATE
SET allowed_actions = EXCLUDED.allowed_actions;

-- Extra billing plans so the Billing Plans menu has 15+ rows
INSERT INTO public.billing_plans (name, description, amount_cents, interval, features, is_active, sort_order)
VALUES
  ('TRT Quarterly Care', 'Three-month testosterone supply with scheduled labs and physician review.', 54900, 'quarter', ARRAY['90-day medication supply', 'Included lab coordination', 'Physician protocol review', 'Priority messaging'], true, 40),
  ('Weight Management Plus', 'GLP-1 program with monthly coaching check-ins and refill management.', 19900, 'month', ARRAY['Monthly program fee', 'Care-team coaching', 'Physician-approved orders', 'Progress tracking'], true, 50),
  ('Peptide Quarterly Protocol', 'Quarterly peptide therapy with compounding coordination.', 69900, 'quarter', ARRAY['Protocol management', 'Quarterly physician review', 'Fulfillment coordination'], true, 60),
  ('Annual Longevity Membership', 'Year of physician-guided hormone and metabolic care.', 199900, 'year', ARRAY['Annual membership', 'Unlimited messaging', 'Priority refill review', 'Two physician visits equivalent'], true, 70),
  ('Women''s Hormone Support', 'Clinician-supervised HRT with labs and follow-up messaging.', 17900, 'month', ARRAY['Monthly medication coordination', 'Symptom check-ins', 'Secure inbox access'], true, 80),
  ('Metabolic Reset 12-Week', 'Time-bounded metabolic protocol billed quarterly.', 39900, 'quarter', ARRAY['12-week protocol', 'Weekly care-team touchpoint', 'Lab review included'], true, 90),
  ('Sleep & Recovery Protocol', 'Peptide and sleep-support protocol with physician oversight.', 22900, 'month', ARRAY['Protocol management', 'Refill review', 'Care-team messaging'], true, 100),
  ('Sports Performance Panel', 'Performance-oriented hormone support for referred athletes.', 26900, 'month', ARRAY['Physician review', 'Partner referral tracking', 'Priority inbox'], true, 110),
  ('Foundation Labs Only', 'Membership for lab review without ongoing medication.', 7900, 'month', ARRAY['Lab interpretation', 'Secure messaging', 'No medication fulfillment'], true, 120),
  ('Family Care Add-on', 'Additional household member on an existing plan.', 9900, 'month', ARRAY['Shared inbox thread', 'Separate treatment plan', 'Refill management'], false, 130),
  ('Concierge Same-Week Review', 'Expedited physician review of pending orders.', 34900, 'month', ARRAY['Same-week order review', 'Priority messaging', 'Dedicated care coordinator'], true, 140),
  ('Maintenance After Goal', 'Lower-intensity follow-up after weight or TRT titration.', 8900, 'month', ARRAY['Quarterly-equivalent monthly check', 'Refill requests', 'Care-team inbox'], true, 150);

-- Extra billing plans so the Billing Plans menu lists 30+ rows (3 starter + 12 named + 18 here)
INSERT INTO public.billing_plans (name, description, amount_cents, interval, features, is_active, sort_order)
SELECT
  titles.t,
  'Seeded membership used to fill the Billing Plans menu for every internal role.',
  5900 + (n * 700),
  (ARRAY['month', 'quarter', 'year']::billing_interval[])[1 + ((n - 1) % 3)],
  ARRAY['Physician review', 'Care-team messaging', 'Refill coordination', 'Seeded demo plan'],
  n % 9 <> 0,
  200 + n
FROM generate_series(1, 18) AS g(n)
CROSS JOIN LATERAL (
  SELECT (ARRAY[
    'TRT Starter Labs Bundle',
    'TRT Plus Messaging',
    'GLP-1 Monthly Check-in',
    'GLP-1 Quarterly Intensive',
    'Peptide Recovery Month',
    'Peptide Annual Protocol',
    'Women''s HRT Monthly',
    'Women''s HRT Quarterly',
    'Men''s Metabolic Month',
    'Sleep Stack Protocol',
    'NAD+ Clinic Membership',
    'Concierge Physician Panel',
    'Partner Athlete Care',
    'Post-Cycle Support',
    'Lab-Only Follow-up',
    'Family Second Member',
    'Travel Dosing Support',
    'Maintenance Light'
  ])[n] AS t
) titles;

-- ---------------------------------------------------------------------------
-- Demo users (54 accounts across every role)
-- ---------------------------------------------------------------------------
SELECT public.seed_demo_user(public.seed_uuid('a000', 1), 'muhammadkamranntu@gmail.com', 'Demo@1234', 'Muhammad', 'Kamran', 'admin', '555-0101', 'Operations');
SELECT public.seed_demo_user(public.seed_uuid('a000', 2), 'admin2@healthbridge.demo', 'Demo@1234', 'Marcus', 'Webb', 'admin', '555-0102', 'Operations');

DO $$
DECLARE
  phys text[][] := ARRAY[
    ARRAY['Amelia', 'Chen'],
    ARRAY['Noah', 'Patel'],
    ARRAY['Sophia', 'Kim'],
    ARRAY['Liam', 'Brooks'],
    ARRAY['Olivia', 'Grant'],
    ARRAY['Ethan', 'Walsh'],
    ARRAY['Ava', 'Morales'],
    ARRAY['Henry', 'Cole']
  ];
  care text[][] := ARRAY[
    ARRAY['Riley', 'Nguyen'],
    ARRAY['Jordan', 'Blake'],
    ARRAY['Casey', 'Ortiz'],
    ARRAY['Morgan', 'Hale'],
    ARRAY['Quinn', 'Reeves'],
    ARRAY['Avery', 'Stone']
  ];
  firsts text[] := ARRAY[
    'James','Maria','Robert','Patricia','Michael','Jennifer','David','Linda',
    'William','Elizabeth','Richard','Barbara','Joseph','Susan','Thomas','Jessica',
    'Charles','Sarah','Christopher','Karen','Daniel','Nancy','Matthew','Lisa',
    'Anthony','Betty','Mark','Margaret','Donald','Sandra','Steven','Ashley'
  ];
  lasts text[] := ARRAY[
    'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis',
    'Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas',
    'Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White',
    'Harris','Sanchez','Clark','Ramirez','Lewis','Robinson','Walker','Young'
  ];
  partners text[][] := ARRAY[
    ARRAY['Dana', 'Reeves'],
    ARRAY['Chris', 'Lang'],
    ARRAY['Jordan', 'Ellis']
  ];
  staff text[][] := ARRAY[
    ARRAY['Sam', 'Ortiz'],
    ARRAY['Taylor', 'Brooks'],
    ARRAY['Riley', 'Chen']
  ];
  i int;
  email text;
BEGIN
  FOR i IN 1..8 LOOP
    email := CASE WHEN i = 1 THEN 'physician@healthbridge.demo'
                  ELSE 'physician' || lpad(i::text, 2, '0') || '@healthbridge.demo' END;
    PERFORM public.seed_demo_user(
      public.seed_uuid('b000', i),
      email,
      'Demo@1234',
      phys[i][1],
      phys[i][2],
      'physician',
      '555-02' || lpad(i::text, 2, '0'),
      'Clinical'
    );
  END LOOP;

  FOR i IN 1..6 LOOP
    email := CASE WHEN i = 1 THEN 'care@healthbridge.demo'
                  ELSE 'care' || lpad(i::text, 2, '0') || '@healthbridge.demo' END;
    PERFORM public.seed_demo_user(
      public.seed_uuid('c000', i),
      email,
      'Demo@1234',
      care[i][1],
      care[i][2],
      'care_team',
      '555-03' || lpad(i::text, 2, '0'),
      'Care coordination'
    );
  END LOOP;

  FOR i IN 1..32 LOOP
    email := CASE WHEN i = 1 THEN 'patient@healthbridge.demo'
                  ELSE 'patient' || lpad(i::text, 2, '0') || '@healthbridge.demo' END;
    PERFORM public.seed_demo_user(
      public.seed_uuid('d000', i),
      email,
      'Demo@1234',
      firsts[i],
      lasts[i],
      'patient',
      '555-04' || lpad(i::text, 2, '0'),
      NULL
    );
  END LOOP;

  FOR i IN 1..3 LOOP
    email := CASE WHEN i = 1 THEN 'partner@healthbridge.demo'
                  ELSE 'partner' || lpad(i::text, 2, '0') || '@healthbridge.demo' END;
    PERFORM public.seed_demo_user(
      public.seed_uuid('e000', i),
      email,
      'Demo@1234',
      partners[i][1],
      partners[i][2],
      'partner',
      '555-05' || lpad(i::text, 2, '0'),
      NULL
    );
  END LOOP;

  FOR i IN 1..3 LOOP
    email := CASE WHEN i = 1 THEN 'staff@healthbridge.demo'
                  ELSE 'staff' || lpad(i::text, 2, '0') || '@healthbridge.demo' END;
    PERFORM public.seed_demo_user(
      public.seed_uuid('f000', i),
      email,
      'Demo@1234',
      staff[i][1],
      staff[i][2],
      'partner_staff',
      '555-06' || lpad(i::text, 2, '0'),
      NULL
    );
  END LOOP;
END $$;

-- Patient demographics + assigned physicians
UPDATE public.patients p
SET
  date_of_birth = (DATE '1968-03-12' + (((n * 211) % 14000) * INTERVAL '1 day'))::date,
  address_line1 = (100 + n)::text || ' ' || (ARRAY['Oak','Maple','Cedar','Pine','Elm','Birch','Willow','Harbor'])[1 + ((n - 1) % 8)] || ' St',
  city = (ARRAY['Austin','Dallas','Houston','Denver','Seattle','Miami','Atlanta','Chicago','Phoenix','Portland'])[1 + ((n - 1) % 10)],
  state = (ARRAY['TX','TX','TX','CO','WA','FL','GA','IL','AZ','OR'])[1 + ((n - 1) % 10)],
  zip = lpad((75000 + n)::text, 5, '0'),
  assigned_physician_id = public.seed_uuid('b000', 1 + ((n - 1) % 8)),
  created_at = now() - ((n * 5) || ' days')::interval,
  updated_at = now() - ((n * 2) || ' days')::interval
FROM generate_series(1, 32) AS g(n)
WHERE p.user_id = public.seed_uuid('d000', n);

-- Treatment plans (32 — one per patient)
INSERT INTO public.treatment_plans (
  id, patient_id, physician_id, medication, protocol, status, start_date, end_date, billing_plan_id, created_at
)
SELECT
  public.seed_uuid('9200', n),
  p.id,
  p.assigned_physician_id,
  (ARRAY[
    'Testosterone Cypionate 200 mg',
    'Semaglutide 1 mg',
    'Tirzepatide 5 mg',
    'NAD+ 500 mg',
    'Sermorelin 15 mg',
    'Enclomiphene 25 mg',
    'Anastrozole 0.5 mg',
    'Tesamorelin 2 mg'
  ])[1 + ((n - 1) % 8)],
  (ARRAY[
    'Weekly IM injection; labs at week 6 and 12',
    'Weekly SQ titration per GI tolerance',
    'Weekly SQ; hold if persistent nausea',
    'IV/IM per clinic protocol',
    'Nightly SQ; reassess IGF-1 in 90 days',
    'Daily oral; AM dosing',
    'Twice weekly oral; monitor estradiol',
    'Daily SQ abdomen; cycle 12 weeks'
  ])[1 + ((n - 1) % 8)],
  (ARRAY['active','active','active','active','paused','completed','cancelled','active']::treatment_plan_status[])[1 + ((n - 1) % 8)],
  CURRENT_DATE - (n * 4),
  CASE WHEN (n % 8) IN (6, 7) THEN CURRENT_DATE - n ELSE NULL END,
  bp.id,
  now() - ((n * 5) || ' days')::interval
FROM generate_series(1, 32) AS g(n)
JOIN public.patients p ON p.user_id = public.seed_uuid('d000', n)
JOIN LATERAL (
  SELECT id
  FROM public.billing_plans
  ORDER BY sort_order, name
  OFFSET ((n - 1) % GREATEST((SELECT COUNT(*)::int FROM public.billing_plans), 1))
  LIMIT 1
) bp ON true;

-- Orders (64 — two per patient: initial + refill mix)
INSERT INTO public.orders (
  id, patient_id, treatment_plan_id, status, is_refill, denial_reason, reviewed_by, reviewed_at,
  stripe_invoice_id, tracking_number, created_at
)
SELECT
  public.seed_uuid('9300', n),
  p.id,
  public.seed_uuid('9200', 1 + ((n - 1) % 32)),
  st,
  n > 32,
  CASE WHEN st = 'denied' THEN 'Labs out of protocol range — hold fulfillment pending follow-up.' END,
  CASE WHEN st = 'pending_review' THEN NULL ELSE p.assigned_physician_id END,
  CASE WHEN st = 'pending_review' THEN NULL ELSE now() - ((n * 2 - 1) || ' days')::interval END,
  CASE WHEN st IN ('approved', 'shipped', 'delivered') THEN 'in_seed_' || n END,
  CASE WHEN st IN ('shipped', 'delivered') THEN '1Z999AA' || lpad(n::text, 8, '0') END,
  now() - ((n * 2) || ' days')::interval
FROM generate_series(1, 64) AS g(n)
JOIN public.patients p ON p.user_id = public.seed_uuid('d000', 1 + ((n - 1) % 32))
CROSS JOIN LATERAL (
  SELECT (ARRAY['pending_review','approved','denied','shipped','delivered']::order_status[])[1 + ((n - 1) % 5)] AS st
) s;

-- Extra pending-review orders so Review Queue shows 30+ rows for every clinical role
INSERT INTO public.orders (
  id, patient_id, treatment_plan_id, status, is_refill, denial_reason, reviewed_by, reviewed_at,
  stripe_invoice_id, tracking_number, created_at
)
SELECT
  public.seed_uuid('9310', n),
  p.id,
  public.seed_uuid('9200', n),
  'pending_review'::order_status,
  true,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  now() - ((n) || ' hours')::interval
FROM generate_series(1, 32) AS g(n)
JOIN public.patients p ON p.user_id = public.seed_uuid('d000', n);

-- Inbox threads (32) + messages (64)
INSERT INTO public.message_threads (
  id, patient_id, assigned_staff_id, status, channel, subject, created_at, updated_at
)
SELECT
  public.seed_uuid('9400', n),
  p.id,
  CASE
    WHEN n % 2 = 0 THEN public.seed_uuid('b000', 1 + ((n - 1) % 8))
    ELSE public.seed_uuid('c000', 1 + ((n - 1) % 6))
  END,
  CASE WHEN n > 24 THEN 'closed'::thread_status ELSE 'open'::thread_status END,
  CASE WHEN n % 7 = 0 THEN 'email'::thread_channel ELSE 'in_app'::thread_channel END,
  (ARRAY[
    'Refill timing',
    'Lab results question',
    'Injection site irritation',
    'Billing for last shipment',
    'Travel and dosing schedule',
    'Nausea after last dose',
    'Request to pause protocol',
    'New pharmacy preference',
    'Follow-up after labs',
    'Message from care team'
  ])[1 + ((n - 1) % 10)],
  now() - ((n * 3) || ' days')::interval,
  now() - ((n) || ' days')::interval
FROM generate_series(1, 32) AS g(n)
JOIN public.patients p ON p.user_id = public.seed_uuid('d000', n);

INSERT INTO public.messages (id, thread_id, sender_id, sender_role, body, read_at, created_at)
SELECT
  public.seed_uuid('9500', n),
  public.seed_uuid('9400', n),
  public.seed_uuid('d000', n),
  'patient'::user_role,
  'Hi — I wanted to check in about my latest ' ||
    (ARRAY['refill','labs','dosing','shipment','side effects'])[1 + ((n - 1) % 5)] ||
    '. Please let me know if you need anything from me.',
  now() - ((n) || ' days')::interval,
  now() - ((n * 3) || ' days')::interval
FROM generate_series(1, 32) AS g(n);

INSERT INTO public.messages (id, thread_id, sender_id, sender_role, body, read_at, created_at)
SELECT
  public.seed_uuid('9510', n),
  public.seed_uuid('9400', n),
  CASE
    WHEN n % 2 = 0 THEN public.seed_uuid('b000', 1 + ((n - 1) % 8))
    ELSE public.seed_uuid('c000', 1 + ((n - 1) % 6))
  END,
  CASE WHEN n % 2 = 0 THEN 'physician'::user_role ELSE 'care_team'::user_role END,
  'Thanks for reaching out. Your care team reviewed this thread and will follow the current protocol. Reply here if symptoms change.',
  CASE WHEN n <= 20 THEN NULL ELSE now() - ((n / 2) || ' hours')::interval END,
  now() - ((n * 3 - 1) || ' days')::interval
FROM generate_series(1, 32) AS g(n);

-- Extra inbox threads so Open threads stays at 30+ even after closing older ones
INSERT INTO public.message_threads (
  id, patient_id, assigned_staff_id, status, channel, subject, created_at, updated_at
)
SELECT
  public.seed_uuid('9410', n),
  p.id,
  CASE
    WHEN n % 2 = 0 THEN public.seed_uuid('b000', 1 + ((n - 1) % 8))
    ELSE public.seed_uuid('c000', 1 + ((n - 1) % 6))
  END,
  'open'::thread_status,
  'in_app'::thread_channel,
  (ARRAY[
    'Dose timing this week',
    'Pharmacy substitution question',
    'Prior-auth paperwork',
    'Side-effect check-in',
    'Upcoming lab draw',
    'Shipping address change',
    'Insurance card update',
    'Partner gym question'
  ])[1 + ((n - 1) % 8)],
  now() - ((n) || ' hours')::interval,
  now() - ((n) || ' hours')::interval
FROM generate_series(1, 16) AS g(n)
JOIN public.patients p ON p.user_id = public.seed_uuid('d000', n);

INSERT INTO public.messages (id, thread_id, sender_id, sender_role, body, read_at, created_at)
SELECT
  public.seed_uuid('9520', n),
  public.seed_uuid('9410', n),
  public.seed_uuid('d000', n),
  'patient'::user_role,
  'Following up on my care this week — please advise on next steps.',
  NULL,
  now() - ((n) || ' hours')::interval
FROM generate_series(1, 16) AS g(n);

-- Documents (32)
INSERT INTO public.documents (id, patient_id, type, storage_path, file_name, uploaded_by, created_at)
SELECT
  public.seed_uuid('9600', n),
  p.id,
  (ARRAY['lab_result','id','other']::document_type[])[1 + ((n - 1) % 3)],
  'seed/' || p.user_id::text || '/' ||
    (ARRAY['cbc-panel-','id-front-','intake-'])[1 + ((n - 1) % 3)] || n ||
    (ARRAY['.pdf','.jpg','.pdf'])[1 + ((n - 1) % 3)],
  (ARRAY['CBC panel ','Photo ID ','Intake packet '])[1 + ((n - 1) % 3)] || n ||
    (ARRAY['.pdf','.jpg','.pdf'])[1 + ((n - 1) % 3)],
  CASE WHEN n % 4 = 0 THEN p.assigned_physician_id ELSE p.user_id END,
  now() - ((n * 4) || ' days')::interval
FROM generate_series(1, 32) AS g(n)
JOIN public.patients p ON p.user_id = public.seed_uuid('d000', n);

-- Second document per patient so charts stay populated
INSERT INTO public.documents (id, patient_id, type, storage_path, file_name, uploaded_by, created_at)
SELECT
  public.seed_uuid('9610', n),
  p.id,
  (ARRAY['lab_result','other']::document_type[])[1 + ((n - 1) % 2)],
  'seed/' || p.user_id::text || '/followup-' || n || '.pdf',
  'Follow-up labs ' || n || '.pdf',
  CASE WHEN n % 3 = 0 THEN p.assigned_physician_id ELSE p.user_id END,
  now() - ((n * 2) || ' days')::interval
FROM generate_series(1, 32) AS g(n)
JOIN public.patients p ON p.user_id = public.seed_uuid('d000', n);

-- Subscriptions (32) + invoices (48)
INSERT INTO public.subscriptions (
  id, patient_id, stripe_subscription_id, stripe_customer_id, status,
  current_period_start, current_period_end, cancel_at_period_end, billing_plan_id, created_at
)
SELECT
  public.seed_uuid('9700', n),
  p.id,
  'sub_seed_' || lpad(n::text, 3, '0'),
  'cus_seed_' || lpad(n::text, 3, '0'),
  (ARRAY['active','active','active','trialing','past_due','canceled','incomplete','active']::subscription_status[])[1 + ((n - 1) % 8)],
  now() - interval '20 days',
  now() + interval '10 days',
  (n % 8) = 6,
  tp.billing_plan_id,
  now() - ((n * 5) || ' days')::interval
FROM generate_series(1, 32) AS g(n)
JOIN public.patients p ON p.user_id = public.seed_uuid('d000', n)
JOIN public.treatment_plans tp ON tp.id = public.seed_uuid('9200', n);

INSERT INTO public.invoices (id, patient_id, stripe_invoice_id, amount_cents, currency, status, paid_at, created_at)
SELECT
  public.seed_uuid('9800', n),
  p.id,
  'in_seed_' || lpad(n::text, 3, '0'),
  COALESCE((SELECT amount_cents FROM public.billing_plans bp WHERE bp.id = tp.billing_plan_id), 19900),
  'usd',
  CASE
    WHEN n % 8 = 5 THEN 'open'
    WHEN n % 8 = 6 THEN 'void'
    ELSE 'paid'
  END,
  CASE WHEN n % 8 IN (5, 6) THEN NULL ELSE now() - ((n * 4) || ' days')::interval END,
  now() - ((n * 4) || ' days')::interval
FROM generate_series(1, 32) AS g(n)
JOIN public.patients p ON p.user_id = public.seed_uuid('d000', n)
JOIN public.treatment_plans tp ON tp.id = public.seed_uuid('9200', n);

INSERT INTO public.invoices (id, patient_id, stripe_invoice_id, amount_cents, currency, status, paid_at, created_at)
SELECT
  public.seed_uuid('9810', n),
  p.id,
  'in_seed_b_' || lpad(n::text, 3, '0'),
  4900,
  'usd',
  'paid',
  now() - ((n * 6) || ' days')::interval,
  now() - ((n * 6) || ' days')::interval
FROM generate_series(1, 16) AS g(n)
JOIN public.patients p ON p.user_id = public.seed_uuid('d000', n);

-- Partners, partner users, 32 referrals, 12 payouts
INSERT INTO public.partners (id, org_name, contact_email, contact_phone, payout_method)
VALUES
  (public.seed_uuid('8000', 1), 'FitLife Gym', 'contact@fitlifegym.com', '555-0100', 'ach'),
  (public.seed_uuid('8000', 2), 'Summit Wellness Club', 'hello@summitwellness.example', '555-0108', 'ach'),
  (public.seed_uuid('8000', 3), 'Harbor Physical Therapy', 'billing@harborpt.example', '555-0109', 'check');

INSERT INTO public.partner_users (partner_id, user_id)
VALUES
  (public.seed_uuid('8000', 1), public.seed_uuid('e000', 1)),
  (public.seed_uuid('8000', 2), public.seed_uuid('e000', 2)),
  (public.seed_uuid('8000', 3), public.seed_uuid('e000', 3)),
  (public.seed_uuid('8000', 1), public.seed_uuid('f000', 1)),
  (public.seed_uuid('8000', 2), public.seed_uuid('f000', 2)),
  (public.seed_uuid('8000', 3), public.seed_uuid('f000', 3));

INSERT INTO public.partner_referrals (
  id, partner_id, patient_id, referred_name, referred_email, referred_phone, status, enrolled_at, created_at
)
SELECT
  public.seed_uuid('9900', n),
  public.seed_uuid('8000', 1 + ((n - 1) % 3)),
  CASE WHEN n <= 24 THEN p.id END,
  (ARRAY[
    'Alex Rivera','Sam Patel','Jamie Cole','Riley Fox','Cameron Diaz',
    'Drew Nguyen','Harper Quinn','Logan Brooks','Casey Park','Morgan Lee',
    'Avery Shah','Quinn Torres','Reese Kim','Parker Bell','Rowan Hale',
    'Skyler Ortiz','Finley Grant','Hayden Walsh','Emerson Clark','Dakota Ruiz',
    'Phoenix Ward','Sage Bennett','Blake Hogan','Jordan Nash','Reese Patel',
    'Cameron Young','Alexis Ford','Taylor Nguyen','Jamie Brooks','Riley Chen',
    'Morgan Ellis','Avery Lang'
  ])[n],
  'referred' || lpad(n::text, 2, '0') || '@healthbridge.demo',
  '555-07' || lpad(n::text, 2, '0'),
  (ARRAY['referred','enrolled','active','inactive']::referral_status[])[1 + ((n - 1) % 4)],
  CASE WHEN n <= 24 AND (n % 4) IN (2, 3) THEN now() - ((n * 3) || ' days')::interval END,
  now() - ((n * 3) || ' days')::interval
FROM generate_series(1, 32) AS g(n)
LEFT JOIN public.patients p ON p.user_id = public.seed_uuid('d000', n);

-- Extra referrals so the primary partner login sees 30+ rows
INSERT INTO public.partner_referrals (
  id, partner_id, patient_id, referred_name, referred_email, referred_phone, status, enrolled_at, created_at
)
SELECT
  public.seed_uuid('9910', n),
  public.seed_uuid('8000', 1),
  NULL,
  'Demo referral ' || n,
  'extra-referred' || lpad(n::text, 2, '0') || '@healthbridge.demo',
  '555-08' || lpad(n::text, 2, '0'),
  (ARRAY['referred','enrolled','active','inactive']::referral_status[])[1 + ((n - 1) % 4)],
  CASE WHEN (n % 4) IN (2, 3) THEN now() - ((n * 2) || ' days')::interval END,
  now() - ((n * 2) || ' days')::interval
FROM generate_series(1, 24) AS g(n);

INSERT INTO public.partner_payouts (
  id, partner_id, period_start, period_end, amount_cents, status, referral_breakdown, paid_at, created_at
)
SELECT
  public.seed_uuid('9a00', n),
  public.seed_uuid('8000', CASE WHEN n <= 32 THEN 1 ELSE 1 + ((n - 1) % 3) END),
  (DATE '2023-01-01' + ((n - 1) * INTERVAL '1 month'))::date,
  (DATE '2023-01-01' + ((n) * INTERVAL '1 month') - INTERVAL '1 day')::date,
  25000 + (n * 1750),
  CASE WHEN n <= 24 THEN 'paid'::payout_status ELSE 'pending'::payout_status END,
  jsonb_build_object('referrals', 2 + (n % 5), 'enrolled', 1 + (n % 3)),
  CASE WHEN n <= 24 THEN now() - ((n * 10) || ' days')::interval END,
  now() - ((n * 10) || ' days')::interval
FROM generate_series(1, 36) AS g(n);

-- Extra payouts for partner orgs 2 and 3 so every partner login has 30+ rows
INSERT INTO public.partner_payouts (
  id, partner_id, period_start, period_end, amount_cents, status, referral_breakdown, paid_at, created_at
)
SELECT
  public.seed_uuid(CASE WHEN org = 2 THEN '9a10' ELSE '9a20' END, n),
  public.seed_uuid('8000', org),
  (DATE '2023-02-01' + ((n - 1) * INTERVAL '1 month'))::date,
  (DATE '2023-02-01' + ((n) * INTERVAL '1 month') - INTERVAL '1 day')::date,
  18000 + (n * 900) + (org * 500),
  CASE WHEN n <= 20 THEN 'paid'::payout_status ELSE 'pending'::payout_status END,
  jsonb_build_object('referrals', 1 + (n % 4), 'enrolled', 1 + (n % 2)),
  CASE WHEN n <= 20 THEN now() - ((n * 8) || ' days')::interval END,
  now() - ((n * 8) || ' days')::interval
FROM generate_series(2, 3) AS orgs(org)
CROSS JOIN generate_series(1, 32) AS g(n);

-- Audit log (48)
INSERT INTO public.audit_log (id, actor_id, actor_role, action, target_table, target_id, metadata, created_at)
SELECT
  public.seed_uuid('9b00', n),
  CASE
    WHEN n % 3 = 1 THEN public.seed_uuid('a000', 1)
    WHEN n % 3 = 2 THEN public.seed_uuid('b000', 1 + ((n - 1) % 8))
    ELSE public.seed_uuid('c000', 1 + ((n - 1) % 6))
  END,
  CASE
    WHEN n % 3 = 1 THEN 'admin'::user_role
    WHEN n % 3 = 2 THEN 'physician'::user_role
    ELSE 'care_team'::user_role
  END,
  (ARRAY['order.approve','order.deny','patient.update','message.reply','plan.assign','user.login'])[1 + ((n - 1) % 6)],
  (ARRAY['orders','orders','patients','messages','treatment_plans','profiles'])[1 + ((n - 1) % 6)],
  CASE
    WHEN (n % 6) IN (1, 2) THEN public.seed_uuid('9300', n)
    WHEN (n % 6) = 3 THEN (SELECT id FROM public.patients WHERE user_id = public.seed_uuid('d000', 1 + ((n - 1) % 32)))
    WHEN (n % 6) = 4 THEN public.seed_uuid('9500', 1 + ((n - 1) % 32))
    WHEN (n % 6) = 5 THEN public.seed_uuid('9200', 1 + ((n - 1) % 32))
    ELSE public.seed_uuid('d000', 1 + ((n - 1) % 32))
  END,
  jsonb_build_object('seed', true, 'index', n),
  now() - ((n * 2) || ' days')::interval
FROM generate_series(1, 48) AS g(n);

-- 32 notifications for each primary demo login (bell has 30+ rows per role)
INSERT INTO public.notifications (id, user_id, type, title, body, href, read_at, metadata, created_at)
SELECT
  public.seed_uuid('9c00', ((r.ord - 1) * 32) + n),
  r.uid,
  CASE WHEN n % 2 = 0 THEN 'login' ELSE 'task_assigned' END,
  CASE
    WHEN n % 2 = 0 THEN 'Signed in to HealthBridge'
    ELSE 'New profile task assigned'
  END,
  CASE
    WHEN n % 2 = 0 THEN 'A new session started on your account.'
    ELSE (ARRAY['Physician Profile Form','Care Team Intake','Patient Health History','Partner Organization Profile','HIPAA Acknowledgement'])[1 + ((n - 1) % 5)]
  END,
  CASE WHEN n % 2 = 0 THEN NULL ELSE r.task_href END,
  CASE WHEN n % 5 = 0 THEN now() - interval '2 hours' END,
  jsonb_build_object('seed', true, 'role', r.role_key),
  now() - ((((r.ord - 1) * 32) + n) || ' hours')::interval
FROM generate_series(1, 32) AS g(n)
CROSS JOIN (
  VALUES
    (1, public.seed_uuid('a000', 1), '/admin/tasks', 'admin'),
    (2, public.seed_uuid('b000', 1), '/admin/tasks', 'physician'),
    (3, public.seed_uuid('c000', 1), '/admin/tasks', 'care_team'),
    (4, public.seed_uuid('d000', 1), '/profile/tasks', 'patient'),
    (5, public.seed_uuid('e000', 1), '/partner/tasks', 'partner')
) AS r(ord, uid, task_href, role_key);

-- Form templates (8 extra industry forms) + assignments + submissions
INSERT INTO public.profile_form_templates (id, title, slug, description, target_roles, schema, is_active, created_by)
VALUES
  (
    public.seed_uuid('9d00', 1),
    'Care Team Intake',
    'care-team-intake',
    'Coordinator onboarding: shift, languages, and emergency contact.',
    ARRAY['care_team']::user_role[],
    '{"fields":[
      {"id":"sec-1","type":"section","label":"Work details","width":"full"},
      {"id":"shift","type":"select","label":"Primary shift","required":true,"width":"half","options":["Morning","Afternoon","Evening","Weekend"]},
      {"id":"languages","type":"text","label":"Languages spoken","required":true,"width":"half"},
      {"id":"emergency","type":"phone","label":"Emergency contact phone","required":true,"width":"full"}
    ]}'::jsonb,
    true,
    public.seed_uuid('a000', 1)
  ),
  (
    public.seed_uuid('9d00', 2),
    'Patient Health History',
    'patient-health-history',
    'Baseline history for new patient charts.',
    ARRAY['patient']::user_role[],
    '{"fields":[
      {"id":"sec-1","type":"section","label":"History","width":"full"},
      {"id":"conditions","type":"textarea","label":"Current conditions","required":true,"width":"full"},
      {"id":"meds","type":"textarea","label":"Current medications","required":true,"width":"full"},
      {"id":"allergies","type":"text","label":"Allergies","required":true,"width":"full"}
    ]}'::jsonb,
    true,
    public.seed_uuid('a000', 1)
  ),
  (
    public.seed_uuid('9d00', 3),
    'Partner Organization Profile',
    'partner-org-profile',
    'Gym / clinic details used on the partner dashboard.',
    ARRAY['partner','partner_staff']::user_role[],
    '{"fields":[
      {"id":"hours","type":"text","label":"Hours of operation","required":true,"width":"full"},
      {"id":"manager","type":"text","label":"On-site manager","required":true,"width":"half"},
      {"id":"phone","type":"phone","label":"Front desk phone","required":true,"width":"half"}
    ]}'::jsonb,
    true,
    public.seed_uuid('a000', 1)
  ),
  (
    public.seed_uuid('9d00', 4),
    'Administrator Ops Checklist',
    'admin-ops-checklist',
    'Weekly operations attestation for administrators.',
    ARRAY['admin']::user_role[],
    '{"fields":[
      {"id":"queue","type":"checkbox","label":"Review queue is staffed this week","required":true,"width":"full"},
      {"id":"billing","type":"checkbox","label":"Billing plans reviewed","required":true,"width":"full"},
      {"id":"notes","type":"textarea","label":"Ops notes","required":false,"width":"full"}
    ]}'::jsonb,
    true,
    public.seed_uuid('a000', 1)
  ),
  (
    public.seed_uuid('9d00', 5),
    'Annual Wellness Update',
    'annual-wellness-update',
    'Yearly lifestyle and goal update for active patients.',
    ARRAY['patient']::user_role[],
    '{"fields":[
      {"id":"goals","type":"textarea","label":"Goals for the next 12 months","required":true,"width":"full"},
      {"id":"activity","type":"select","label":"Activity level","required":true,"width":"full","options":["Sedentary","Light","Moderate","High"]}
    ]}'::jsonb,
    true,
    public.seed_uuid('a000', 1)
  ),
  (
    public.seed_uuid('9d00', 6),
    'GLP-1 Screening',
    'glp1-screening',
    'GI and contraindication screen before GLP-1 orders.',
    ARRAY['patient']::user_role[],
    '{"fields":[
      {"id":"gi","type":"checkbox","label":"I do not have a history of pancreatitis","required":true,"width":"full"},
      {"id":"thyroid","type":"checkbox","label":"I do not have a personal/family history of MTC","required":true,"width":"full"}
    ]}'::jsonb,
    true,
    public.seed_uuid('a000', 1)
  ),
  (
    public.seed_uuid('9d00', 7),
    'Lab Consent',
    'lab-consent',
    'Consent to share lab results with the assigned physician.',
    ARRAY['patient']::user_role[],
    '{"fields":[
      {"id":"consent","type":"checkbox","label":"I consent to lab sharing with my care team","required":true,"width":"full"}
    ]}'::jsonb,
    true,
    public.seed_uuid('a000', 1)
  ),
  (
    public.seed_uuid('9d00', 8),
    'HIPAA Acknowledgement',
    'hipaa-acknowledgement',
    'Notice of privacy practices acknowledgement.',
    ARRAY['patient','physician','care_team']::user_role[],
    '{"fields":[
      {"id":"ack","type":"checkbox","label":"I have received the notice of privacy practices","required":true,"width":"full"}
    ]}'::jsonb,
    true,
    public.seed_uuid('a000', 1)
  )
ON CONFLICT (slug) DO NOTHING;

-- 24 more templates so Form Builder lists 30+ forms
INSERT INTO public.profile_form_templates (id, title, slug, description, target_roles, schema, is_active, created_by)
SELECT
  public.seed_uuid('9d10', n),
  titles.t,
  'demo-form-' || lpad(n::text, 2, '0'),
  'Seeded form so Form Builder has 30+ templates for every internal role.',
  CASE
    WHEN n % 4 = 1 THEN ARRAY['patient']::user_role[]
    WHEN n % 4 = 2 THEN ARRAY['physician']::user_role[]
    WHEN n % 4 = 3 THEN ARRAY['care_team']::user_role[]
    ELSE ARRAY['partner']::user_role[]
  END,
  '{"fields":[{"id":"q1","type":"textarea","label":"Notes","required":true,"width":"full"},{"id":"q2","type":"checkbox","label":"I confirm this information is accurate","required":true,"width":"full"}]}'::jsonb,
  true,
  public.seed_uuid('a000', 1)
FROM generate_series(1, 24) AS g(n)
CROSS JOIN LATERAL (
  SELECT (ARRAY[
    'Post-Visit Survey',
    'Injection Technique Attestation',
    'Care Coordination Handoff',
    'Partner Safety Checklist',
    'Travel Dosing Plan',
    'DEA License Renewal',
    'Shift Coverage Attestation',
    'Referral Quality Review',
    'Pharmacy Preference Update',
    'CME Hours Log',
    'Escalation Protocol Quiz',
    'Gym Floor Liability',
    'Side Effect Diary',
    'Protocol Deviation Note',
    'Language Access Survey',
    'Insurance Card Upload Task',
    'Goal Check-in',
    'Peer Chart Review',
    'After-Hours Coverage',
    'Community Event Lead',
    'Refill Timing Preference',
    'NPI Attestation',
    'Supplies Inventory',
    'White-Label Branding Form'
  ])[n] AS t
) titles
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.profile_form_assignments (form_id, assignment_type, role, user_id)
SELECT t.id, 'role'::form_assignment_type, 'physician'::user_role, NULL
FROM public.profile_form_templates t
WHERE t.slug = 'physician-profile-form'
ON CONFLICT DO NOTHING;

INSERT INTO public.profile_form_assignments (form_id, assignment_type, role, user_id)
SELECT id, 'role'::form_assignment_type, 'care_team'::user_role, NULL::uuid FROM public.profile_form_templates WHERE slug = 'care-team-intake'
UNION ALL
SELECT id, 'role'::form_assignment_type, 'patient'::user_role, NULL::uuid FROM public.profile_form_templates WHERE slug = 'patient-health-history'
UNION ALL
SELECT id, 'role'::form_assignment_type, 'partner'::user_role, NULL::uuid FROM public.profile_form_templates WHERE slug = 'partner-org-profile'
UNION ALL
SELECT id, 'role'::form_assignment_type, 'partner_staff'::user_role, NULL::uuid FROM public.profile_form_templates WHERE slug = 'partner-org-profile'
UNION ALL
SELECT id, 'role'::form_assignment_type, 'admin'::user_role, NULL::uuid FROM public.profile_form_templates WHERE slug = 'admin-ops-checklist'
UNION ALL
SELECT id, 'role'::form_assignment_type, 'patient'::user_role, NULL::uuid FROM public.profile_form_templates WHERE slug = 'annual-wellness-update'
UNION ALL
SELECT id, 'role'::form_assignment_type, 'patient'::user_role, NULL::uuid FROM public.profile_form_templates WHERE slug = 'glp1-screening'
UNION ALL
SELECT id, 'role'::form_assignment_type, 'patient'::user_role, NULL::uuid FROM public.profile_form_templates WHERE slug = 'lab-consent'
UNION ALL
SELECT id, 'role'::form_assignment_type, 'patient'::user_role, NULL::uuid FROM public.profile_form_templates WHERE slug = 'hipaa-acknowledgement'
UNION ALL
SELECT id, 'role'::form_assignment_type, 'physician'::user_role, NULL::uuid FROM public.profile_form_templates WHERE slug = 'hipaa-acknowledgement'
UNION ALL
SELECT id, 'role'::form_assignment_type, 'care_team'::user_role, NULL::uuid FROM public.profile_form_templates WHERE slug = 'hipaa-acknowledgement'
ON CONFLICT DO NOTHING;

INSERT INTO public.profile_form_assignments (form_id, assignment_type, role, user_id)
SELECT
  public.seed_uuid('9d10', n),
  'role'::form_assignment_type,
  CASE
    WHEN n % 4 = 1 THEN 'patient'::user_role
    WHEN n % 4 = 2 THEN 'physician'::user_role
    WHEN n % 4 = 3 THEN 'care_team'::user_role
    ELSE 'partner'::user_role
  END,
  NULL
FROM generate_series(1, 24) AS g(n)
ON CONFLICT DO NOTHING;

-- Direct user assignment examples (shows up on Form Builder assign UI)
INSERT INTO public.profile_form_assignments (form_id, assignment_type, role, user_id)
SELECT t.id, 'user'::form_assignment_type, NULL, public.seed_uuid('b000', 1)
FROM public.profile_form_templates t
WHERE t.slug = 'admin-ops-checklist'
ON CONFLICT DO NOTHING;

-- Submissions (30+ across roles)
INSERT INTO public.profile_form_submissions (form_id, user_id, responses, status, completion_percent, submitted_at)
SELECT t.id, public.seed_uuid('b000', n),
  jsonb_build_object(
    'first-name', (SELECT first_name FROM public.profiles WHERE id = public.seed_uuid('b000', n)),
    'last-name', (SELECT last_name FROM public.profiles WHERE id = public.seed_uuid('b000', n)),
    'email', (SELECT email FROM public.profiles WHERE id = public.seed_uuid('b000', n)),
    'phone', (SELECT phone FROM public.profiles WHERE id = public.seed_uuid('b000', n)),
    'npi', '12345678' || n::text,
    'license', 'TX-MD-' || lpad(n::text, 4, '0'),
    'specialty', (ARRAY['Family Medicine','Internal Medicine','Endocrinology','Other'])[1 + ((n - 1) % 4)],
    'bio', 'Board-certified physician on the HealthBridge clinical panel.',
    'terms', true
  ),
  'submitted',
  100,
  now() - (n || ' days')::interval
FROM generate_series(1, 8) AS g(n)
JOIN public.profile_form_templates t ON t.slug = 'physician-profile-form'
ON CONFLICT (form_id, user_id) DO NOTHING;

INSERT INTO public.profile_form_submissions (form_id, user_id, responses, status, completion_percent, submitted_at)
SELECT t.id, public.seed_uuid('c000', n),
  jsonb_build_object('shift', 'Morning', 'languages', 'English, Spanish', 'emergency', '555-0199'),
  'submitted', 100, now() - (n || ' days')::interval
FROM generate_series(1, 6) AS g(n)
JOIN public.profile_form_templates t ON t.slug = 'care-team-intake'
ON CONFLICT (form_id, user_id) DO NOTHING;

INSERT INTO public.profile_form_submissions (form_id, user_id, responses, status, completion_percent, submitted_at)
SELECT t.id, public.seed_uuid('d000', n),
  jsonb_build_object(
    'conditions', 'Hypertension (controlled)',
    'meds', 'Lisinopril 10 mg daily',
    'allergies', CASE WHEN n % 5 = 0 THEN 'Penicillin' ELSE 'NKDA' END
  ),
  CASE WHEN n <= 12 THEN 'submitted'::form_submission_status ELSE 'draft'::form_submission_status END,
  CASE WHEN n <= 12 THEN 100 ELSE 45 END,
  CASE WHEN n <= 12 THEN now() - (n || ' days')::interval END
FROM generate_series(1, 16) AS g(n)
JOIN public.profile_form_templates t ON t.slug = 'patient-health-history'
ON CONFLICT (form_id, user_id) DO NOTHING;

INSERT INTO public.profile_form_submissions (form_id, user_id, responses, status, completion_percent, submitted_at)
SELECT t.id, public.seed_uuid('e000', n),
  jsonb_build_object('hours', '5am–10pm', 'manager', 'Front desk lead', 'phone', '555-0100'),
  'submitted', 100, now() - (n || ' days')::interval
FROM generate_series(1, 3) AS g(n)
JOIN public.profile_form_templates t ON t.slug = 'partner-org-profile'
ON CONFLICT (form_id, user_id) DO NOTHING;

INSERT INTO public.profile_form_submissions (form_id, user_id, responses, status, completion_percent, submitted_at)
SELECT t.id, public.seed_uuid('a000', n),
  jsonb_build_object('queue', true, 'billing', true, 'notes', 'Seeded weekly checklist.'),
  'submitted', 100, now() - (n || ' days')::interval
FROM generate_series(1, 2) AS g(n)
JOIN public.profile_form_templates t ON t.slug = 'admin-ops-checklist'
ON CONFLICT (form_id, user_id) DO NOTHING;

INSERT INTO public.profile_form_submissions (form_id, user_id, responses, status, completion_percent, submitted_at)
SELECT t.id, public.seed_uuid('d000', n),
  jsonb_build_object('ack', true),
  CASE WHEN n <= 20 THEN 'submitted'::form_submission_status ELSE 'draft'::form_submission_status END,
  CASE WHEN n <= 20 THEN 100 ELSE 50 END,
  CASE WHEN n <= 20 THEN now() - (n || ' days')::interval END
FROM generate_series(1, 32) AS g(n)
JOIN public.profile_form_templates t ON t.slug = 'hipaa-acknowledgement'
ON CONFLICT (form_id, user_id) DO NOTHING;

INSERT INTO public.profile_form_submissions (form_id, user_id, responses, status, completion_percent, submitted_at)
SELECT t.id, public.seed_uuid('d000', n),
  jsonb_build_object('consent', true),
  'submitted', 100, now() - (n || ' days')::interval
FROM generate_series(1, 32) AS g(n)
JOIN public.profile_form_templates t ON t.slug = 'lab-consent'
ON CONFLICT (form_id, user_id) DO NOTHING;

INSERT INTO public.profile_form_submissions (form_id, user_id, responses, status, completion_percent, submitted_at)
SELECT
  public.seed_uuid('9d10', n),
  CASE
    WHEN n % 4 = 1 THEN public.seed_uuid('d000', 1 + (((n - 1) / 4) % 32))
    WHEN n % 4 = 2 THEN public.seed_uuid('b000', 1 + (((n - 1) / 4) % 8))
    WHEN n % 4 = 3 THEN public.seed_uuid('c000', 1 + (((n - 1) / 4) % 6))
    ELSE public.seed_uuid('e000', 1 + (((n - 1) / 4) % 3))
  END,
  jsonb_build_object('q1', 'Seeded demo response ' || n, 'q2', true),
  'submitted',
  100,
  now() - (n || ' days')::interval
FROM generate_series(1, 24) AS g(n)
ON CONFLICT (form_id, user_id) DO NOTHING;

DROP FUNCTION IF EXISTS public.seed_demo_user(uuid, text, text, text, text, user_role, text, text);
DROP FUNCTION IF EXISTS public.seed_uuid(text, integer);
