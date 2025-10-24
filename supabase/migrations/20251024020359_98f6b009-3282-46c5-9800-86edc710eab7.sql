-- Fix security warnings by setting search_path on functions

-- Fix generate_random_username function
CREATE OR REPLACE FUNCTION public.generate_random_username()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;