import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeStats {
  activeUsers: number;
  moodEntries: number;
  counsellors: number;
}

export function useRealtimeStats() {
  const [stats, setStats] = useState<RealtimeStats>({
    activeUsers: 0,
    moodEntries: 0,
    counsellors: 12 // Base number of counsellors
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch unique users (profiles count)
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch mood entries count
        const { count: moodCount } = await supabase
          .from('mood_entries')
          .select('*', { count: 'exact', head: true });

        // Fetch unique counsellor bookings (as proxy for counsellors)
        const { data: bookingsData } = await supabase
          .from('counsellor_bookings')
          .select('counsellor_name');
        
        const uniqueCounsellors = new Set(bookingsData?.map(b => b.counsellor_name) || []);

        setStats({
          activeUsers: usersCount || 0,
          moodEntries: moodCount || 0,
          counsellors: Math.max(12, uniqueCounsellors.size) // At least 12 counsellors
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Subscribe to realtime changes for profiles
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchStats()
      )
      .subscribe();

    // Subscribe to realtime changes for mood_entries
    const moodChannel = supabase
      .channel('mood-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mood_entries' },
        () => fetchStats()
      )
      .subscribe();

    // Subscribe to realtime changes for counsellor_bookings
    const bookingsChannel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'counsellor_bookings' },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(moodChannel);
      supabase.removeChannel(bookingsChannel);
    };
  }, []);

  return { stats, loading };
}
