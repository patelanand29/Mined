-- Phase 1: Add is_motivational column to time_capsules
ALTER TABLE public.time_capsules 
ADD COLUMN IF NOT EXISTS is_motivational BOOLEAN DEFAULT false;

-- Phase 2: Create notification_settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  daily_mood_reminder BOOLEAN DEFAULT true,
  mood_reminder_time TIME DEFAULT '09:00',
  capsule_unlock_notify BOOLEAN DEFAULT true,
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on notification_settings
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_settings
CREATE POLICY "Users can view their own notification settings"
ON public.notification_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
ON public.notification_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
ON public.notification_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Phase 4: Create mental_health_alerts table
CREATE TABLE IF NOT EXISTS public.mental_health_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
  analysis_summary TEXT,
  data_sources JSONB,
  capsule_unlocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on mental_health_alerts
ALTER TABLE public.mental_health_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for mental_health_alerts
CREATE POLICY "Users can view their own mental health alerts"
ON public.mental_health_alerts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mental health alerts"
ON public.mental_health_alerts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Phase 1: Create capsule-media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('capsule-media', 'capsule-media', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for capsule-media bucket
CREATE POLICY "Users can upload their own capsule media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'capsule-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own capsule media"
ON storage.objects FOR SELECT
USING (bucket_id = 'capsule-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own capsule media"
ON storage.objects FOR DELETE
USING (bucket_id = 'capsule-media' AND auth.uid()::text = (storage.foldername(name))[1]);