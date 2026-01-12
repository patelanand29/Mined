-- Fix community posts visibility: Allow all authenticated users to view all posts
CREATE POLICY "Authenticated users can view all posts"
  ON public.community_posts FOR SELECT
  TO authenticated
  USING (true);

-- Make capsule-media bucket public for reading (uploads still require auth)
UPDATE storage.buckets SET public = true WHERE id = 'capsule-media';