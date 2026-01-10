-- Fix: User Activity Tracking Via Public Reactions Enables Privacy Violations
-- Remove public SELECT policy and restrict to user's own reactions only

-- Drop the overly permissive "Anyone can view reactions" policy
DROP POLICY IF EXISTS "Anyone can view reactions" ON public.post_reactions;

-- Add restricted policy allowing users to see only their own reactions
CREATE POLICY "Users can view their own reactions"
ON public.post_reactions
FOR SELECT
USING (auth.uid() = user_id);