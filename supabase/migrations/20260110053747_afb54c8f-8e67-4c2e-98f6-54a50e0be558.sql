-- Fix: Add missing DELETE policy for counsellor_bookings
-- This allows users to cancel their own appointments

CREATE POLICY "Users can delete their own bookings"
ON public.counsellor_bookings
FOR DELETE
USING (auth.uid() = user_id);