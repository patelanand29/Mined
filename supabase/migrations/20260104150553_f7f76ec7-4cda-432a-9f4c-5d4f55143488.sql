-- Create table to store meditation session records
CREATE TABLE public.meditation_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  technique_name TEXT NOT NULL,
  cycles_completed INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meditation_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own meditation sessions"
ON public.meditation_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meditation sessions"
ON public.meditation_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meditation sessions"
ON public.meditation_sessions FOR DELETE USING (auth.uid() = user_id);

-- Create table to store CBT tool records
CREATE TABLE public.cbt_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  situation TEXT NOT NULL,
  automatic_thought TEXT NOT NULL,
  emotion TEXT,
  distortions TEXT[],
  reframed_thought TEXT,
  new_emotion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cbt_records ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own CBT records"
ON public.cbt_records FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own CBT records"
ON public.cbt_records FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own CBT records"
ON public.cbt_records FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own CBT records"
ON public.cbt_records FOR UPDATE USING (auth.uid() = user_id);