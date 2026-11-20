-- In-app notifications + guarantee Administrator has every menu

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  href text,
  read_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX notifications_user_unread_idx
  ON public.notifications (user_id)
  WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR get_user_role() = 'admin');

CREATE POLICY "Users insert own or admin inserts any"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id OR get_user_role() = 'admin');

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id OR get_user_role() = 'admin');

CREATE POLICY "Admin deletes notifications"
  ON public.notifications FOR DELETE
  USING (get_user_role() = 'admin');

-- Administrator always has every platform menu with full actions
INSERT INTO public.role_menu_grants (role, menu_key, allowed_actions)
SELECT
  'admin'::user_role,
  pm.menu_key,
  ARRAY['read', 'create', 'update', 'delete', 'approve']::text[]
FROM public.platform_menus pm
ON CONFLICT (role, menu_key) DO UPDATE
SET allowed_actions = ARRAY['read', 'create', 'update', 'delete', 'approve']::text[];
