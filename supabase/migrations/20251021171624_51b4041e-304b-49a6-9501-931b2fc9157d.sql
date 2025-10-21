-- Create secrets table for global storage
CREATE TABLE public.secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 500),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reactions JSONB NOT NULL DEFAULT '{"turbio": 0, "impresionante": 0, "noMeGusta": 0}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (anonymous secrets)
-- Everyone can read secrets
CREATE POLICY "Anyone can view secrets"
  ON public.secrets
  FOR SELECT
  USING (true);

-- Everyone can insert secrets
CREATE POLICY "Anyone can create secrets"
  ON public.secrets
  FOR INSERT
  WITH CHECK (true);

-- Everyone can update reactions
CREATE POLICY "Anyone can update reactions"
  ON public.secrets
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_secrets_created_at ON public.secrets(created_at DESC);

-- Enable realtime for secrets table
ALTER TABLE public.secrets REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.secrets;