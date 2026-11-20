-- Per-menu CRUD action grants on role and user menu assignments

ALTER TABLE public.role_menu_grants
  ADD COLUMN IF NOT EXISTS allowed_actions text[] NOT NULL DEFAULT ARRAY['read']::text[];

ALTER TABLE public.user_menu_grants
  ADD COLUMN IF NOT EXISTS allowed_actions text[] NOT NULL DEFAULT ARRAY['read']::text[];

-- Backfill admin role grants with full actions
UPDATE public.role_menu_grants
SET allowed_actions = ARRAY['read', 'create', 'update', 'delete', 'approve']::text[]
WHERE role = 'admin';

-- Backfill physician grants to preserve prior role-matrix behavior
UPDATE public.role_menu_grants rg
SET allowed_actions = CASE
  WHEN rg.role = 'physician' AND pm.menu_key LIKE 'orders%' THEN ARRAY['read', 'approve']::text[]
  WHEN rg.role = 'physician' AND pm.menu_key LIKE 'patients%' THEN ARRAY['read', 'update']::text[]
  WHEN rg.role = 'physician' AND (pm.menu_key LIKE 'inbox%' OR pm.menu_key LIKE 'dashboard%') THEN ARRAY['read', 'update']::text[]
  WHEN rg.role = 'physician' THEN ARRAY['read']::text[]
  WHEN rg.role = 'care_team' THEN ARRAY['read']::text[]
  ELSE rg.allowed_actions
END
FROM public.platform_menus pm
WHERE pm.menu_key = rg.menu_key
  AND rg.role IN ('physician', 'care_team');
