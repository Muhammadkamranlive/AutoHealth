-- Bump thread updated_at when a new message is posted
CREATE OR REPLACE FUNCTION public.touch_message_thread()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.message_threads
  SET updated_at = now()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER messages_touch_thread
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_message_thread();

-- Reports menu for admin leadership metrics
INSERT INTO public.platform_menus (menu_key, label, href, icon, parent_key, permission, sort_order, widgets) VALUES
  ('reports', 'Reports', '/admin/reports', 'chart', NULL, 'dashboard:read', 35, ARRAY[]::text[])
ON CONFLICT (menu_key) DO NOTHING;

INSERT INTO public.role_menu_grants (role, menu_key, allowed_actions)
SELECT r.role, 'reports', ARRAY['read']::text[]
FROM (VALUES ('admin'::user_role), ('physician'::user_role)) AS r(role)
ON CONFLICT (role, menu_key) DO NOTHING;
