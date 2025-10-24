-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  avatar_seed TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Add user_id and image_url to secrets
ALTER TABLE public.secrets
  ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN image_url TEXT,
  ADD COLUMN encrypted_content TEXT;

-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  secret_id UUID NOT NULL REFERENCES public.secrets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  encrypted_content TEXT,
  image_url TEXT,
  reactions JSONB NOT NULL DEFAULT '{"turbio": 0, "impresionante": 0, "noMeGusta": 0}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Anyone can view comments"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can update comment reactions"
  ON public.comments FOR UPDATE
  USING (true);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('secret-images', 'secret-images', true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('comment-images', 'comment-images', true);

-- Storage policies for secret images
CREATE POLICY "Anyone can view secret images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'secret-images');

CREATE POLICY "Authenticated users can upload secret images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'secret-images' AND (auth.uid() IS NOT NULL OR auth.uid() IS NULL));

CREATE POLICY "Users can update their own secret images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'secret-images');

-- Storage policies for comment images
CREATE POLICY "Anyone can view comment images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'comment-images');

CREATE POLICY "Authenticated users can upload comment images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'comment-images' AND (auth.uid() IS NOT NULL OR auth.uid() IS NULL));

-- Function to generate random username
CREATE OR REPLACE FUNCTION public.generate_random_username()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  adjectives TEXT[] := ARRAY['Cool', 'Happy', 'Silent', 'Mystic', 'Swift', 'Bold', 'Clever', 'Bright', 'Dark', 'Wild'];
  nouns TEXT[] := ARRAY['Tiger', 'Eagle', 'Wolf', 'Dragon', 'Phoenix', 'Raven', 'Shark', 'Bear', 'Fox', 'Hawk'];
  username TEXT;
  counter INTEGER := 0;
BEGIN
  LOOP
    username := adjectives[1 + floor(random() * array_length(adjectives, 1))] || 
                nouns[1 + floor(random() * array_length(nouns, 1))] || 
                floor(random() * 9999)::TEXT;
    
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.username = username) THEN
      RETURN username;
    END IF;
    
    counter := counter + 1;
    IF counter > 100 THEN
      RAISE EXCEPTION 'Could not generate unique username';
    END IF;
  END LOOP;
END;
$$;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_seed)
  VALUES (
    NEW.id,
    public.generate_random_username(),
    gen_random_uuid()::TEXT
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

-- Update trigger for profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();