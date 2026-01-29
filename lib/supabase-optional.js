// Mock Supabase client for development/demo mode
// Use this when environment variables are not configured

export const mockSupabaseClient = {
  from: () => ({
    select: () => ({ data: null, error: null }),
    insert: () => ({ data: null, error: null }),
    update: () => ({ data: null, error: null }),
    delete: () => ({ data: null, error: null }),
    eq: () => ({ data: null, error: null }),
    order: () => ({ data: null, error: null }),
    single: () => ({ data: null, error: null }),
  }),
  storage: {
    from: () => ({
      upload: () => ({ data: null, error: null }),
      download: () => ({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
};

export function createOptionalClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key || url.includes('your_') || key.includes('your_')) {
    console.log('Supabase not configured - using demo mode');
    return mockSupabaseClient;
  }
  
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createClient } = require('@supabase/supabase-js');
  return createClient(url, key);
}

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key && !url.includes('your_') && !key.includes('your_');
}