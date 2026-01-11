import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface MentalHealthAlert {
  id: string;
  user_id: string;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  analysis_summary: string | null;
  data_sources: Record<string, any> | null;
  capsule_unlocked: boolean;
  created_at: string;
}

export interface RiskAnalysisResult {
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  analysis_summary: string;
  recommendations: string[];
  data_analyzed: {
    cbt_entries: number;
    journal_entries: number;
    mood_entries: number;
    alchemist_sessions: number;
  };
}

export function useMentalHealthMonitor() {
  const { user } = useAuth();
  const [latestAlert, setLatestAlert] = useState<MentalHealthAlert | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasMotivationalCapsule, setHasMotivationalCapsule] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for existing motivational capsule
  const checkMotivationalCapsule = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('time_capsules')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_motivational', true)
        .maybeSingle();

      if (error) throw error;
      setHasMotivationalCapsule(!!data);
    } catch (error) {
      console.error('Error checking motivational capsule:', error);
    }
  }, [user]);

  // Fetch latest mental health alert
  const fetchLatestAlert = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('mental_health_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setLatestAlert(data as MentalHealthAlert);
    } catch (error) {
      console.error('Error fetching mental health alert:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchLatestAlert();
      checkMotivationalCapsule();
    }
  }, [user, fetchLatestAlert, checkMotivationalCapsule]);

  // Run mental health analysis
  const runAnalysis = useCallback(async (): Promise<RiskAnalysisResult | null> => {
    if (!user) return null;

    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('detect-mental-health-risk', {
        body: {}
      });

      if (error) throw error;

      const result = data as RiskAnalysisResult;

      // Store the alert
      const { data: alertData, error: alertError } = await supabase
        .from('mental_health_alerts')
        .insert({
          user_id: user.id,
          risk_level: result.risk_level,
          analysis_summary: result.analysis_summary,
          data_sources: result.data_analyzed,
          capsule_unlocked: false,
        })
        .select()
        .single();

      if (alertError) throw alertError;

      setLatestAlert(alertData as MentalHealthAlert);

      // If high or critical, unlock motivational capsule
      if (result.risk_level === 'high' || result.risk_level === 'critical') {
        await unlockMotivationalCapsule();
        
        toast.warning(
          result.risk_level === 'critical' 
            ? "We've noticed you may be struggling. A special message has been unlocked for you."
            : "We're here for you. Check out your motivational capsule.",
          { duration: 10000 }
        );
      }

      return result;
    } catch (error) {
      console.error('Error running mental health analysis:', error);
      toast.error('Unable to analyze mental health data');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [user]);

  // Unlock the motivational capsule
  const unlockMotivationalCapsule = useCallback(async () => {
    if (!user) return;

    try {
      // Find and unlock the motivational capsule
      const { error } = await supabase
        .from('time_capsules')
        .update({ is_unlocked: true })
        .eq('user_id', user.id)
        .eq('is_motivational', true);

      if (error) throw error;

      // Update the alert to mark capsule as unlocked
      if (latestAlert) {
        await supabase
          .from('mental_health_alerts')
          .update({ capsule_unlocked: true })
          .eq('id', latestAlert.id);
      }
    } catch (error) {
      console.error('Error unlocking motivational capsule:', error);
    }
  }, [user, latestAlert]);

  // Create motivational capsule
  const createMotivationalCapsule = useCallback(async (content: string, title: string = 'My Self-Care Message') => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('time_capsules')
        .insert({
          user_id: user.id,
          title,
          content,
          capsule_type: 'text',
          is_motivational: true,
          is_unlocked: false,
          unlock_date: new Date(2099, 11, 31).toISOString(), // Far future date, only unlocked by alert
        })
        .select()
        .single();

      if (error) throw error;

      setHasMotivationalCapsule(true);
      toast.success('Self-care capsule saved! It will be there when you need it most.');
      
      return data;
    } catch (error) {
      console.error('Error creating motivational capsule:', error);
      toast.error('Failed to create self-care capsule');
      return null;
    }
  }, [user]);

  // Get risk level styling
  const getRiskLevelInfo = (level: string) => {
    switch (level) {
      case 'critical':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          borderColor: 'border-red-500',
          label: 'Critical - Please reach out for support',
        };
      case 'high':
        return {
          color: 'text-orange-600',
          bgColor: 'bg-orange-100 dark:bg-orange-900/30',
          borderColor: 'border-orange-500',
          label: 'High - We\'re here for you',
        };
      case 'moderate':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          borderColor: 'border-yellow-500',
          label: 'Moderate - Consider self-care activities',
        };
      default:
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          borderColor: 'border-green-500',
          label: 'Low - You\'re doing well!',
        };
    }
  };

  return {
    latestAlert,
    isAnalyzing,
    hasMotivationalCapsule,
    loading,
    runAnalysis,
    createMotivationalCapsule,
    getRiskLevelInfo,
    fetchLatestAlert,
    checkMotivationalCapsule,
  };
}
