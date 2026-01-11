import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface NotificationSettings {
  id?: string;
  user_id?: string;
  daily_mood_reminder: boolean;
  mood_reminder_time: string;
  capsule_unlock_notify: boolean;
  push_token: string | null;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  daily_mood_reminder: true,
  mood_reminder_time: '09:00',
  capsule_unlock_notify: true,
  push_token: null,
};

export function useNotifications() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  // Check browser notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // Fetch user's notification settings
  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data as NotificationSettings);
      } else {
        // Create default settings for new user
        await saveSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const saveSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    if (!user) return;

    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          daily_mood_reminder: updatedSettings.daily_mood_reminder,
          mood_reminder_time: updatedSettings.mood_reminder_time,
          capsule_unlock_notify: updatedSettings.capsule_unlock_notify,
          push_token: updatedSettings.push_token,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('Failed to save notification settings');
    }
  }, [user, settings]);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast.error('Your browser does not support notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        toast.success('Notifications enabled!');
        
        // Show a test notification
        new Notification('MINED Notifications Enabled', {
          body: 'You will now receive reminders for mood logging and capsule unlocks.',
          icon: '/favicon.ico',
        });
        
        return true;
      } else if (permission === 'denied') {
        toast.error('Notification permission denied. Please enable in browser settings.');
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  const sendLocalNotification = useCallback((title: string, body: string, onClick?: () => void) => {
    if (permissionStatus !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    });

    if (onClick) {
      notification.onclick = () => {
        window.focus();
        onClick();
      };
    }
  }, [permissionStatus]);

  // Check for capsule unlocks periodically
  const checkCapsuleUnlocks = useCallback(async () => {
    if (!user || !settings.capsule_unlock_notify) return;

    try {
      const { data: capsules, error } = await supabase
        .from('time_capsules')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_unlocked', false)
        .lte('unlock_date', new Date().toISOString());

      if (error) throw error;

      for (const capsule of capsules || []) {
        // Update capsule as unlocked
        await supabase
          .from('time_capsules')
          .update({ is_unlocked: true })
          .eq('id', capsule.id);

        // Send notification
        sendLocalNotification(
          '🔓 Time Capsule Unlocked!',
          `A message from your past self is now available. Created on ${new Date(capsule.created_at).toLocaleDateString()}`,
          () => window.location.href = '/time-capsule'
        );
      }
    } catch (error) {
      console.error('Error checking capsule unlocks:', error);
    }
  }, [user, settings.capsule_unlock_notify, sendLocalNotification]);

  // Set up daily mood reminder
  useEffect(() => {
    if (!user || !settings.daily_mood_reminder || permissionStatus !== 'granted') return;

    const checkMoodReminder = async () => {
      const now = new Date();
      const [hours, minutes] = settings.mood_reminder_time.split(':').map(Number);
      
      // Check if current time matches reminder time (within 1 minute)
      if (now.getHours() === hours && now.getMinutes() === minutes) {
        // Check if mood already logged today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: todayMood } = await supabase
          .from('mood_entries')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', todayStart.toISOString())
          .maybeSingle();

        if (!todayMood) {
          sendLocalNotification(
            '💙 Time for Your Daily Mood Check',
            'Take a moment to log how you\'re feeling today.',
            () => window.location.href = '/mood-calendar'
          );
        }
      }
    };

    // Check every minute
    const interval = setInterval(checkMoodReminder, 60000);
    return () => clearInterval(interval);
  }, [user, settings.daily_mood_reminder, settings.mood_reminder_time, permissionStatus, sendLocalNotification]);

  // Check for capsule unlocks on mount and periodically
  useEffect(() => {
    if (user && settings.capsule_unlock_notify) {
      checkCapsuleUnlocks();
      const interval = setInterval(checkCapsuleUnlocks, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [user, settings.capsule_unlock_notify, checkCapsuleUnlocks]);

  return {
    settings,
    loading,
    permissionStatus,
    saveSettings,
    requestPermission,
    sendLocalNotification,
    checkCapsuleUnlocks,
  };
}
