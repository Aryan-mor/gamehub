import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { z } from 'zod';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

// Load environment variables from .env file
dotenv.config();

const EnvSchema = z.object({
  SUPABASE_PROJECT_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_SECRET: z.string().min(10),
});

const env = EnvSchema.parse({
  SUPABASE_PROJECT_URL: process.env.SUPABASE_PROJECT_URL,
  SUPABASE_SERVICE_ROLE_SECRET: process.env.SUPABASE_SERVICE_ROLE_SECRET,
});

const supabaseUrl = env.SUPABASE_PROJECT_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_SECRET;

// Create Supabase client with service role key for server-side operations only
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default supabase; 

/**
 * Perform a fast health check against Supabase to ensure DB is reachable.
 * Fails within timeoutMs to avoid hanging the bot startup.
 */
export async function checkSupabaseConnectivity(timeoutMs = 3000): Promise<void> {
  logFunctionStart('checkSupabaseConnectivity', { timeoutMs, url: supabaseUrl });
  try {
    const pingPromise = supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .limit(1);
    await Promise.race([
      pingPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout:db-healthcheck')), timeoutMs))
    ]);
    logFunctionEnd('checkSupabaseConnectivity', { ok: true });
  } catch (error) {
    logError('checkSupabaseConnectivity', error as Error, { url: supabaseUrl });
    throw error as Error;
  }
}