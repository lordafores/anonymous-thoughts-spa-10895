-- Fix ambiguous column reference in generate_random_username function
CREATE OR REPLACE FUNCTION public.generate_random_username()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  adjectives TEXT[] := ARRAY['Cool', 'Happy', 'Silent', 'Mystic', 'Swift', 'Bold', 'Clever', 'Bright', 'Dark', 'Wild'];
  nouns TEXT[] := ARRAY['Tiger', 'Eagle', 'Wolf', 'Dragon', 'Phoenix', 'Raven', 'Shark', 'Bear', 'Fox', 'Hawk'];
  _username TEXT;
  counter INTEGER := 0;
BEGIN
  LOOP
    _username := adjectives[1 + floor(random() * array_length(adjectives, 1))] || 
                nouns[1 + floor(random() * array_length(nouns, 1))] || 
                floor(random() * 9999)::TEXT;
    
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = _username) THEN
      RETURN _username;
    END IF;
    
    counter := counter + 1;
    IF counter > 100 THEN
      RAISE EXCEPTION 'Could not generate unique username';
    END IF;
  END LOOP;
END;
$function$;