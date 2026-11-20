-- User management: dynamic menus, role grants, per-user custom menus

CREATE TYPE menu_assignment_mode AS ENUM ('role', 'custom');

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS menu_mode menu_assignment_mode NOT NULL DEFAULT 'role',
  ADD COLUMN IF NOT EXISTS workspace_label text;

CREATE TABLE public.platform_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_key text UNIQUE NOT NULL,
  label text NOT NULL,
  href text NOT NULL,
  icon text NOT NULL DEFAULT 'dashboard',
  parent_key text,
  permission text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  widgets text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_menus
  ADD CONSTRAINT platform_menus_parent_fkey
  FOREIGN KEY (parent_key) REFERENCES public.platform_menus(menu_key) ON DELETE SET NULL;

CREATE TABLE public.role_menu_grants (
  role user_role NOT NULL,
  menu_key text NOT NULL REFERENCES public.platform_menus(menu_key) ON DELETE CASCADE,
  PRIMARY KEY (role, menu_key)
);

CREATE TABLE public.user_menu_grants (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  menu_key text NOT NULL REFERENCES public.platform_menus(menu_key) ON DELETE CASCADE,
  granted_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, menu_key)
);

-- Seed platform menus (parent rows first)
INSERT INTO public.platform_menus (menu_key, label, href, icon, parent_key, permission, sort_order, widgets) VALUES
  ('dashboard', 'Dashboard', '/admin', 'dashboard', NULL, 'dashboard:read', 10, ARRAY['stat_patients','stat_pending_orders','stat_open_threads','stat_approved_orders','chart_patients','chart_order_status','chart_activity']),
  ('dashboard_overview', 'Overview', '/admin', 'dashboard', 'dashboard', 'dashboard:read', 11, ARRAY[]::text[]),
  ('dashboard_analytics', 'Analytics', '/admin#analytics', 'dashboard', 'dashboard', 'dashboard:read', 12, ARRAY['chart_activity']),
  ('patients', 'Patients', '/admin/patients', 'patients', NULL, 'patients:read', 20, ARRAY['stat_patients','chart_patients']),
  ('patients_all', 'All patients', '/admin/patients', 'patients', 'patients', 'patients:read', 21, ARRAY[]::text[]),
  ('patients_search', 'Search records', '/admin/patients?q=', 'patients', 'patients', 'patients:read', 22, ARRAY[]::text[]),
  ('orders', 'Review Queue', '/admin/review-queue', 'orders', NULL, 'orders:read', 30, ARRAY['stat_pending_orders','stat_approved_orders','chart_order_status']),
  ('orders_pending', 'Pending review', '/admin/review-queue', 'orders', 'orders', 'orders:read', 31, ARRAY[]::text[]),
  ('inbox', 'Inbox', '/admin/inbox', 'inbox', NULL, 'inbox:read', 40, ARRAY['stat_open_threads','chart_activity']),
  ('inbox_open', 'Open threads', '/admin/inbox', 'inbox', 'inbox', 'inbox:read', 41, ARRAY[]::text[]),
  ('users', 'User Management', '/admin/users', 'users', NULL, 'users:read', 50, ARRAY[]::text[]),
  ('users_list', 'All users', '/admin/users', 'users', 'users', 'users:read', 51, ARRAY[]::text[]),
  ('users_create', 'Create user', '/admin/users/new', 'users', 'users', 'users:create', 52, ARRAY[]::text[]),
  ('roles', 'Role Menus', '/admin/roles', 'roles', NULL, 'users:read', 60, ARRAY[]::text[]),
  ('access', 'Permissions Matrix', '/admin/access', 'access', NULL, 'users:read', 70, ARRAY[]::text[]),
  ('access_matrix', 'Roles matrix', '/admin/access', 'access', 'access', 'users:read', 71, ARRAY[]::text[]);

-- Default role menu grants (top-level + common submenus)
INSERT INTO public.role_menu_grants (role, menu_key)
SELECT r.role, m.menu_key
FROM (
  VALUES
    ('admin'::user_role),
    ('physician'::user_role),
    ('care_team'::user_role)
) AS r(role)
CROSS JOIN (
  VALUES
    ('dashboard'), ('dashboard_overview'), ('dashboard_analytics'),
    ('patients'), ('patients_all'), ('patients_search'),
    ('orders'), ('orders_pending'),
    ('inbox'), ('inbox_open')
) AS m(menu_key)
WHERE r.role = 'admin'
   OR (r.role = 'physician' AND m.menu_key NOT IN ('users','users_list','users_create','roles','access','access_matrix'))
   OR (r.role = 'care_team' AND m.menu_key NOT IN ('users','users_list','users_create','roles','access','access_matrix'));

-- Admin-only management menus
INSERT INTO public.role_menu_grants (role, menu_key)
SELECT 'admin'::user_role, menu_key
FROM (VALUES ('users'),('users_list'),('users_create'),('roles'),('access'),('access_matrix')) AS t(menu_key)
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE public.platform_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_menu_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_menu_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal staff can read menus"
  ON public.platform_menus FOR SELECT
  USING (get_user_role() IN ('physician', 'care_team', 'admin'));

CREATE POLICY "Admin manages menus"
  ON public.platform_menus FOR ALL
  USING (get_user_role() = 'admin');

CREATE POLICY "Internal staff can read role menu grants"
  ON public.role_menu_grants FOR SELECT
  USING (get_user_role() IN ('physician', 'care_team', 'admin'));

CREATE POLICY "Admin manages role menu grants"
  ON public.role_menu_grants FOR ALL
  USING (get_user_role() = 'admin');

CREATE POLICY "Users read own menu grants"
  ON public.user_menu_grants FOR SELECT
  USING (auth.uid() = user_id OR get_user_role() = 'admin');

CREATE POLICY "Admin manages user menu grants"
  ON public.user_menu_grants FOR ALL
  USING (get_user_role() = 'admin');
