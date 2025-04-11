-- Crear una vista para acceder a los correos electrónicos de los usuarios
CREATE VIEW public.auth_user_emails AS
SELECT 
  profiles.id as profile_id,
  profiles.user_id,
  au.email
FROM profiles
JOIN auth.users au ON au.id = profiles.user_id;

-- Otorgar acceso de lectura a la vista para los usuarios autenticados
GRANT SELECT ON public.auth_user_emails TO authenticated;

-- Habilitar RLS para la vista
ALTER VIEW public.auth_user_emails ENABLE ROW LEVEL SECURITY;

-- Crear la política para permitir que los usuarios autenticados vean los correos electrónicos
CREATE POLICY "Users can view emails"
  ON public.auth_user_emails
  FOR SELECT
  TO authenticated
  USING (true);
