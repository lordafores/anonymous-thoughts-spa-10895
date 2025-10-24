BEGIN;

-- 1) Revocar selects directos sobre la tabla base
REVOKE SELECT ON public.secrets FROM public;
REVOKE SELECT ON public.secrets FROM anon;
REVOKE SELECT ON public.secrets FROM authenticated;

-- 2) Activar RLS en la tabla base (protege accesos directos)
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;

-- 3) Crear una view pública que anonimiza user_id (devuelve NULL)
CREATE OR REPLACE VIEW public.public_secrets AS
SELECT
  id,
  content,
  created_at,
  NULL::uuid AS user_id
FROM public.secrets;

-- 4) Crear función (SECURITY INVOKER por defecto) para insertar desde la view
CREATE OR REPLACE FUNCTION public.public_secrets_insert()
RETURNS trigger AS $$
BEGIN
  -- Forzar user_id a NULL para preservar anonimato
  INSERT INTO public.secrets (content, created_at, user_id)
  VALUES (NEW.content, COALESCE(NEW.created_at, now()), NULL);
  -- INSTEAD OF trigger: do not return a row to the view
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5) Trigger INSTEAD OF INSERT en la view
DROP TRIGGER IF EXISTS insert_public_secrets_trg ON public.public_secrets;
CREATE TRIGGER insert_public_secrets_trg
INSTEAD OF INSERT ON public.public_secrets
FOR EACH ROW EXECUTE FUNCTION public.public_secrets_insert();

-- 6) Conceder permisos necesarios sobre la view (lectura pública y posibilidad de insertar anónimo)
GRANT SELECT ON public.public_secrets TO anon, authenticated;
GRANT INSERT ON public.public_secrets TO anon, authenticated;

-- 7) Comprobar objetos con SECURITY DEFINER para revisión manual
-- Lista funciones marcadas como SECURITY DEFINER (requiere revisión administrativa)
RAISE NOTICE 'Funciones definidas con SECURITY DEFINER (revise y recree como SECURITY INVOKER si es necesario):';
SELECT n.nspname AS schema, p.proname AS function
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prosecdef = true;

-- Advertencia sobre vistas/funciones Supabase definidas por el sistema:
RAISE NOTICE 'Revise cualquier objeto SUPA_* o SUPA_security_definer_view; recrearlos sin SECURITY DEFINER si se confirma riesgo.';

COMMIT;
