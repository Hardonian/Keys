/**
 * Supabase Real-time Subscription Patterns
 * 
 * Example real-time subscription setup and management
 */

import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Subscribe to table changes
 */
export function subscribeToTable(
  table: string,
  callback: (payload: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
      },
      callback
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe with filters
 */
export function subscribeWithFilter(
  table: string,
  filter: string,
  value: any,
  callback: (payload: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`${table}_filtered`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        filter: `${filter}=eq.${value}`,
      },
      callback
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from channel
 */
export function unsubscribe(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}
