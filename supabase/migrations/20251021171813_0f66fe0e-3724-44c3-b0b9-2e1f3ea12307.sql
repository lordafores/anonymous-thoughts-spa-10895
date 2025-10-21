-- Add categories to secrets table
ALTER TABLE public.secrets 
ADD COLUMN category TEXT DEFAULT 'general';

-- Create index for category filtering
CREATE INDEX idx_secrets_category ON public.secrets(category);

-- Create a view for trending secrets (most reacted in last 24 hours)
CREATE OR REPLACE VIEW public.trending_secrets AS
SELECT 
  *,
  (reactions->>'turbio')::int + 
  (reactions->>'impresionante')::int + 
  (reactions->>'noMeGusta')::int as total_reactions
FROM public.secrets
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY total_reactions DESC;

-- Create a view for global statistics
CREATE OR REPLACE VIEW public.secrets_stats AS
SELECT 
  COUNT(*) as total_secrets,
  SUM((reactions->>'turbio')::int) as total_turbio,
  SUM((reactions->>'impresionante')::int) as total_impresionante,
  SUM((reactions->>'noMeGusta')::int) as total_no_me_gusta,
  COUNT(DISTINCT category) as total_categories
FROM public.secrets;