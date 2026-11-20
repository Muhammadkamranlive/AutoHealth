-- Profile form builder: templates, assignments, submissions

CREATE TYPE form_assignment_type AS ENUM ('role', 'user');
CREATE TYPE form_submission_status AS ENUM ('draft', 'submitted');

CREATE TABLE public.profile_form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  target_roles user_role[] NOT NULL DEFAULT '{}',
  schema jsonb NOT NULL DEFAULT '{"fields":[]}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profile_form_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.profile_form_templates(id) ON DELETE CASCADE,
  assignment_type form_assignment_type NOT NULL,
  role user_role,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assignment_role_or_user CHECK (
    (assignment_type = 'role' AND role IS NOT NULL AND user_id IS NULL)
    OR (assignment_type = 'user' AND user_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX profile_form_assignments_role_unique
  ON public.profile_form_assignments (form_id, role)
  WHERE assignment_type = 'role';

CREATE UNIQUE INDEX profile_form_assignments_user_unique
  ON public.profile_form_assignments (form_id, user_id)
  WHERE assignment_type = 'user';

CREATE TABLE public.profile_form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.profile_form_templates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  status form_submission_status NOT NULL DEFAULT 'draft',
  completion_percent int NOT NULL DEFAULT 0 CHECK (completion_percent >= 0 AND completion_percent <= 100),
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (form_id, user_id)
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_completion_percent int NOT NULL DEFAULT 0
    CHECK (profile_completion_percent >= 0 AND profile_completion_percent <= 100),
  ADD COLUMN IF NOT EXISTS profile_completed_at timestamptz;

-- Storage for profile form images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-forms',
  'profile-forms',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.profile_form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_form_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages form templates"
  ON public.profile_form_templates FOR ALL
  USING (get_user_role() = 'admin');

CREATE POLICY "Users read active form templates assigned to them"
  ON public.profile_form_templates FOR SELECT
  USING (
    is_active = true
    AND (
      get_user_role() = 'admin'
      OR EXISTS (
        SELECT 1 FROM public.profile_form_assignments a
        WHERE a.form_id = profile_form_templates.id
          AND (
            (a.assignment_type = 'role' AND a.role = get_user_role())
            OR (a.assignment_type = 'user' AND a.user_id = auth.uid())
          )
      )
      OR get_user_role() = ANY (target_roles)
    )
  );

CREATE POLICY "Admin manages form assignments"
  ON public.profile_form_assignments FOR ALL
  USING (get_user_role() = 'admin');

CREATE POLICY "Users read own form assignments"
  ON public.profile_form_assignments FOR SELECT
  USING (
    get_user_role() = 'admin'
    OR (assignment_type = 'role' AND role = get_user_role())
    OR (assignment_type = 'user' AND user_id = auth.uid())
  );

CREATE POLICY "Users manage own submissions"
  ON public.profile_form_submissions FOR ALL
  USING (auth.uid() = user_id OR get_user_role() = 'admin')
  WITH CHECK (auth.uid() = user_id OR get_user_role() = 'admin');

CREATE POLICY "Admin read all submissions"
  ON public.profile_form_submissions FOR SELECT
  USING (get_user_role() = 'admin');

-- Storage policies (survive a linked reset the same way buckets do)
DROP POLICY IF EXISTS "Users upload own profile form images" ON storage.objects;
CREATE POLICY "Users upload own profile form images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-forms'
    AND auth.uid()::text = split_part(name, '/', 1)
  );

DROP POLICY IF EXISTS "Users read own profile form images" ON storage.objects;
CREATE POLICY "Users read own profile form images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'profile-forms'
    AND auth.uid()::text = split_part(name, '/', 1)
  );

DROP POLICY IF EXISTS "Admin read all profile form images" ON storage.objects;
CREATE POLICY "Admin read all profile form images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-forms' AND get_user_role() = 'admin');

-- Admin menu entries
INSERT INTO public.platform_menus (menu_key, label, href, icon, parent_key, permission, sort_order, widgets) VALUES
  ('form_builder', 'Form Builder', '/admin/forms', 'forms', NULL, 'users:read', 55, ARRAY[]::text[]),
  ('form_builder_list', 'All forms', '/admin/forms', 'forms', 'form_builder', 'users:read', 56, ARRAY[]::text[]),
  ('form_builder_new', 'Create form', '/admin/forms/new', 'forms', 'form_builder', 'users:create', 57, ARRAY[]::text[]),
  ('profile_tasks', 'Profile Tasks', '/admin/tasks', 'forms', NULL, 'dashboard:read', 15, ARRAY[]::text[])
ON CONFLICT (menu_key) DO NOTHING;

INSERT INTO public.role_menu_grants (role, menu_key, allowed_actions)
SELECT 'admin'::user_role, menu_key, ARRAY['read', 'create', 'update', 'delete']::text[]
FROM (VALUES ('form_builder'), ('form_builder_list'), ('form_builder_new'), ('profile_tasks')) AS t(menu_key)
ON CONFLICT (role, menu_key) DO NOTHING;

INSERT INTO public.role_menu_grants (role, menu_key, allowed_actions)
SELECT r.role, 'profile_tasks', ARRAY['read', 'update']::text[]
FROM (VALUES ('physician'::user_role), ('care_team'::user_role)) AS r(role)
ON CONFLICT (role, menu_key) DO NOTHING;
