-- Add Register patient to admin sidebar menu
INSERT INTO public.platform_menus (menu_key, label, href, icon, parent_key, permission, sort_order, widgets) VALUES
  ('patients_register', 'Register patient', '/admin/patients/register', 'patients', 'patients', 'patients:create', 23, ARRAY[]::text[])
ON CONFLICT (menu_key) DO NOTHING;

INSERT INTO public.role_menu_grants (role, menu_key, allowed_actions)
SELECT r.role, 'patients_register', ARRAY['read', 'create']::text[]
FROM (VALUES ('admin'::user_role), ('physician'::user_role), ('care_team'::user_role)) AS r(role)
ON CONFLICT (role, menu_key) DO NOTHING;
