-- Backfill profiles + patients for users created before the signup trigger existed
INSERT INTO public.profiles (id, email, role)
SELECT u.id, u.email, 'patient'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

INSERT INTO public.patients (user_id)
SELECT u.id
FROM auth.users u
LEFT JOIN public.patients pt ON pt.user_id = u.id
WHERE pt.id IS NULL;

-- Make yourself admin (change email if needed)
UPDATE public.profiles SET role = 'admin'
WHERE email = 'muhammadkami999@gmail.com';
