import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';
import type { BackgroundEvent } from '@/types';

export function useBackgroundEvents(userId: string | null) {
  const [events, setEvents] = useState<BackgroundEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    async function fetchEvents() {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('background_events')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (fetchError) throw fetchError;
        setEvents(data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch events'));
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('background_events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'background_events',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setEvents((prev) => [payload.new as BackgroundEvent, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setEvents((prev) =>
              prev.map((e) => (e.id === payload.new.id ? (payload.new as BackgroundEvent) : e))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return {
    events,
    loading,
    error,
  };
}
