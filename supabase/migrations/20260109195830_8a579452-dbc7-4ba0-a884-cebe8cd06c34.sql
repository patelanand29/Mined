-- Fix: Anonymous Posts Expose User IDs
-- The issue is that direct table access exposes user_id even for anonymous posts
-- Solution: Remove the permissive "Anyone can view" policies and replace with
-- policies that only allow viewing through the secure RPC functions

-- Drop existing permissive SELECT policies
DROP POLICY IF EXISTS "Anyone can view posts" ON public.community_posts;
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;

-- Create new restrictive SELECT policies that only allow:
-- 1. Users to see their own posts/comments (for editing/deletion)
-- 2. The RPC functions (SECURITY DEFINER) to access all data
CREATE POLICY "Users can view their own posts"
ON public.community_posts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own comments"
ON public.comments
FOR SELECT
USING (auth.uid() = user_id);

-- Update the RPC functions to use SECURITY DEFINER so they can access all posts
-- This allows the secure functions to return data to any authenticated user
-- while hiding user_id for anonymous content

CREATE OR REPLACE FUNCTION public.get_community_posts_secure()
RETURNS TABLE(
  id uuid,
  content text,
  created_at timestamp with time zone,
  helpful_count integer,
  relate_count integer,
  support_count integer,
  tags text[],
  is_anonymous boolean,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
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

CREATE OR REPLACE FUNCTION public.get_comments_secure(p_post_id uuid)
RETURNS TABLE(
  id uuid,
  content text,
  created_at timestamp with time zone,
  is_anonymous boolean,
  post_id uuid,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
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