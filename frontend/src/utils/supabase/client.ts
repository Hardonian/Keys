import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    // Never fall back to an external placeholder domain.
    // If env vars are missing, return a safe "disabled" client that performs no network calls.
    const disabledError = new Error('Supabase is not configured (missing NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY)');

    const disabledQueryResult = Promise.resolve({ data: null, error: disabledError });
    const disabledQuery: any = {
      select: () => disabledQuery,
      insert: () => disabledQuery,
      update: () => disabledQuery,
      delete: () => disabledQuery,
      upsert: () => disabledQuery,
      eq: () => disabledQuery,
      order: () => disabledQuery,
      limit: () => disabledQuery,
      range: () => disabledQuery,
      single: () => disabledQueryResult,
      maybeSingle: () => disabledQueryResult,
      then: disabledQueryResult.then.bind(disabledQueryResult),
      catch: disabledQueryResult.catch.bind(disabledQueryResult),
    };

    const noopSub = { unsubscribe: () => {} };
    const disabledClient: any = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: disabledError }),
        getUser: async () => ({ data: { user: null }, error: disabledError }),
        onAuthStateChange: () => ({ data: { subscription: noopSub } }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: disabledError }),
        signUp: async () => ({ data: { user: null, session: null }, error: disabledError }),
        signOut: async () => ({ error: null }),
        refreshSession: async () => ({ data: { session: null }, error: disabledError }),
      },
      from: () => disabledQuery,
      channel: () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) }),
      removeChannel: () => {},
    };

    return disabledClient;
  }
  
  return createBrowserClient(url, key);
}
