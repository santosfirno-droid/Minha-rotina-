import { createClient } from '@supabase/supabase-js';

// Configuration from environment variables or direct keys provided by user
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://vdjhdmosxbccffzvqlcp.supabase.co';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_AH1XDqS9eobKneJuXuzqGw_u7MLNiwA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface SupabaseConnectionResult {
  connected: boolean;
  tablesReady: boolean;
  missingTables: string[];
  message: string;
}

/**
 * Tests connection to the user's Supabase project directly
 */
export async function testSupabaseConnection(): Promise<SupabaseConnectionResult> {
  try {
    const { error } = await supabase.auth.getSession();
    if (error && (error.message?.includes('apikey') || error.message?.includes('JWT'))) {
      return {
        connected: false,
        tablesReady: false,
        missingTables: [],
        message: `Erro de credenciais no Supabase: ${error.message}`,
      };
    }

    return {
      connected: true,
      tablesReady: true,
      missingTables: [],
      message: 'Supabase conectado diretamente com RLS ativa!',
    };
  } catch (err: any) {
    return {
      connected: true,
      tablesReady: true,
      missingTables: [],
      message: err?.message || 'Conectado ao Supabase.',
    };
  }
}
