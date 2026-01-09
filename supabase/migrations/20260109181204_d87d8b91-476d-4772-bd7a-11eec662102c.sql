-- Fix handle_new_user trigger with input validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    new.id, 
    LEFT(COALESCE(NULLIF(TRIM(new.raw_user_meta_data ->> 'full_name'), ''), 'User'), 100)
  );
  RETURN new;
END;
$$;

-- Create secure function to get community posts with anonymity protection
CREATE OR REPLACE FUNCTION public.get_community_posts_secure()
RETURNS TABLE (
  id uuid,
  content text,
  created_at timestamptz,
  helpful_count integer,
  relate_count integer,
  support_count integer,
  tags text[],
  is_anonymous boolean,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.content,
    cp.created_at,
    cp.helpful_count,
    cp.relate_count,
    cp.support_count,
    cp.tags,
    cp.is_anonymous,
    CASE 
      WHEN cp.is_anonymous = true THEN NULL::uuid
      ELSE cp.user_id 
    END as user_id
  FROM public.community_posts cp
  ORDER BY cp.created_at DESC;
END;
$$;

-- Create secure function to get comments with anonymity protection
CREATE OR REPLACE FUNCTION public.get_comments_secure(p_post_id uuid)
RETURNS TABLE (
  id uuid,
  content text,
  created_at timestamptz,
  is_anonymous boolean,
  post_id uuid,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.content,
    c.created_at,
    c.is_anonymous,
    c.post_id,
    CASE 
      WHEN c.is_anonymous = true THEN NULL::uuid
      ELSE c.user_id 
    END as user_id
  FROM public.comments c
  WHERE c.post_id = p_post_id
  ORDER BY c.created_at ASC;
END;
$$;