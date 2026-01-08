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
  const { user, session } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);

  const checkConnection = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Check if user has Google identity linked with calendar scopes
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const googleIdentity = currentUser?.identities?.find(
        (identity) => identity.provider === 'google'
      );
      
      // Check if we have a provider token (indicates active OAuth session with scopes)
      const hasProviderToken = !!session?.provider_token;
      
      setIsConnected(!!googleIdentity && hasProviderToken);
    } catch (error) {
      console.error('Error checking Google Calendar connection:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [user, session]);

  const connectGoogleCalendar = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
          redirectTo: `${window.location.origin}/mood-calendar`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast.error('Failed to connect Google Calendar');
        console.error('Google OAuth error:', error);
      }
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      toast.error('Failed to connect Google Calendar');
    }
  }, []);

  const fetchEvents = useCallback(async (timeMin?: string, timeMax?: string) => {
    if (!user || !session?.provider_token) return [];

    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: { 
          action: 'list_events', 
          timeMin, 
          timeMax,
          providerToken: session.provider_token 
        }
      });

      if (error) throw error;

      if (data.needsAuth) {
        setIsConnected(false);
        return [];
      }

      setEvents(data.events || []);
      return data.events || [];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }, [user, session]);

  const createMoodEvent = useCallback(async (moodData: {
    emoji: string;
    label: string;
    intensity: number;
    note?: string;
    date?: Date;
  }) => {
    if (!user || !session?.provider_token) return null;

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
        body: { 
          action: 'create_event', 
          eventData,
          providerToken: session.provider_token 
        }
      });

      if (error) throw error;
      return data.event;
    } catch (error) {
      console.error('Error creating mood event:', error);
      return null;
    }
  }, [user, session]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    isConnected,
    isLoading,
    events,
    fetchEvents,
    createMoodEvent,
    connectGoogleCalendar,
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
