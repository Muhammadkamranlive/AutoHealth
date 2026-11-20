-- Sample Physician Profile Form for demo / onboarding

INSERT INTO public.profile_form_templates (
  title,
  slug,
  description,
  target_roles,
  schema,
  is_active
)
VALUES (
  'Physician Profile Form',
  'physician-profile-form',
  'Complete your professional profile including credentials, specialty, and photo.',
  ARRAY['physician']::user_role[],
  '{
    "fields": [
      { "id": "sec-1", "type": "section", "label": "Personal information", "width": "full" },
      { "id": "photo", "type": "image", "label": "Professional photo", "helpText": "Upload a headshot (JPG or PNG, max 5MB)", "required": true, "width": "full" },
      { "id": "first-name", "type": "text", "label": "Legal first name", "required": true, "width": "half" },
      { "id": "last-name", "type": "text", "label": "Legal last name", "required": true, "width": "half" },
      { "id": "email", "type": "email", "label": "Work email", "required": true, "width": "half" },
      { "id": "phone", "type": "phone", "label": "Direct phone", "required": true, "width": "half" },
      { "id": "sec-2", "type": "section", "label": "Credentials & specialty", "width": "full" },
      { "id": "npi", "type": "text", "label": "NPI number", "placeholder": "10-digit NPI", "required": true, "width": "half" },
      { "id": "license", "type": "text", "label": "Medical license number", "required": true, "width": "half" },
      { "id": "specialty", "type": "select", "label": "Primary specialty", "required": true, "width": "full", "options": ["Family Medicine", "Internal Medicine", "Pediatrics", "Cardiology", "Dermatology", "Other"] },
      { "id": "bio", "type": "textarea", "label": "Professional bio", "placeholder": "Brief background for patients and staff", "required": true, "width": "full" },
      { "id": "sec-3", "type": "section", "label": "Agreements", "width": "full" },
      { "id": "terms", "type": "checkbox", "label": "I confirm the information provided is accurate", "required": true, "width": "full" }
    ]
  }'::jsonb,
  true
)
ON CONFLICT (slug) DO NOTHING;
