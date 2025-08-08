import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { z } from 'zod';

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