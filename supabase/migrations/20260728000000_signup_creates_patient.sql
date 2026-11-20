-- Auto-create patient record when a new user signs up (default role: patient)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'patient');

  INSERT INTO public.patients (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;
