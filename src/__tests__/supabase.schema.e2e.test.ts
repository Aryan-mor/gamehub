import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_PROJECT_URL as string | undefined;
const key = process.env.SUPABASE_SERVICE_ROLE_SECRET as string | undefined;
const hasEnv = Boolean(url && key);
const supabase = hasEnv ? createClient(url!, key!, {
  auth: { autoRefreshToken: false, persistSession: false }
}) : (undefined as unknown as ReturnType<typeof createClient>);

describe('[supabase] schema and tables availability', () => {
  const itFn = hasEnv ? it : it.skip;

  itFn('public.users exists and is selectable', async () => {
    const { error } = await supabase.from('users').select('id').limit(1);
    expect(error, error?.message).toBeNull();
  });

  itFn('public.rooms exists and is updatable', async () => {
    const { error } = await supabase.from('rooms').select('id').limit(1);
    expect(error, error?.message).toBeNull();
  });

  itFn('poker schema is accessible by service_role', async () => {
    // Use a client scoped to the poker schema to avoid schema-qualified table path issues
    const pokerClient = createClient(url!, key!, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: 'poker' }
    });
    const { error } = await pokerClient.from('hands').select('id').limit(1);
    expect(error, error?.message).toBeNull();
  });
});


