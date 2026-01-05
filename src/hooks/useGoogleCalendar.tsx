import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  colorId?: string;
}

export function useGoogleCalendar() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: { action: 'check_connection' }
      });

      if (error) throw error;

      if (data.needsAuth) {
        setIsConnected(false);
        setAuthUrl(data.authUrl);
      } else {
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error checking Google Calendar connection:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const getAuthUrl = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: { action: 'get_auth_url' }
      });

      if (error) throw error;
      return data.authUrl;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      return null;
    }
  }, []);

  const exchangeCode = useCallback(async (code: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: { action: 'exchange_code', code }
      });

      if (error) throw error;

      if (data.success) {
        setIsConnected(true);
        toast.success('Google Calendar connected successfully!');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error exchanging code:', error);
      toast.error('Failed to connect Google Calendar');
      return false;
    }
  }, []);

  const fetchEvents = useCallback(async (timeMin?: string, timeMax?: string) => {
    if (!user || !isConnected) return [];

    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: { action: 'list_events', timeMin, timeMax }
      });

      if (error) throw error;

      if (data.needsAuth) {
        setIsConnected(false);
        setAuthUrl(data.authUrl);
        return [];
      }

      setEvents(data.events || []);
      return data.events || [];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }, [user, isConnected]);

  const createMoodEvent = useCallback(async (moodData: {
    emoji: string;
    label: string;
    intensity: number;
    note?: string;
    date?: Date;
  }) => {
    if (!user || !isConnected) return null;

    const eventDate = moodData.date || new Date();
    const eventData = {
      summary: `${moodData.emoji} Mood: ${moodData.label}`,
      description: `Mood: ${moodData.label}\nIntensity: ${moodData.intensity}/5${moodData.note ? `\n\nNote: ${moodData.note}` : ''}`,
      start: {
        date: eventDate.toISOString().split('T')[0],
      },
      end: {
        date: eventDate.toISOString().split('T')[0],
      },
      colorId: getMoodColorId(moodData.label),
    };

    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: { action: 'create_event', eventData }
      });

      if (error) throw error;
      return data.event;
    } catch (error) {
      console.error('Error creating mood event:', error);
      return null;
    }
  }, [user, isConnected]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code && user) {
      exchangeCode(code).then((success) => {
        if (success) {
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      });
    }
  }, [user, exchangeCode]);

  return {
    isConnected,
    isLoading,
    events,
    authUrl,
    fetchEvents,
    createMoodEvent,
    getAuthUrl,
    checkConnection,
  };
}

function getMoodColorId(moodLabel: string): string {
  // Google Calendar color IDs
  const colorMap: Record<string, string> = {
    'Happy': '2', // Green
    'Good': '10', // Light green
    'Neutral': '5', // Yellow
    'Sad': '9', // Blue
    'Angry': '11', // Red
    'Anxious': '3', // Purple
    'Crying': '7', // Cyan
  };
  return colorMap[moodLabel] || '1';
}
