import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

export interface PotRecord {
  id: string;
  hand_id: string;
  amount: number;
  eligible_seats: number[];
}

export async function createMainPot(handId: string, eligibleSeats: number[]): Promise<PotRecord> {
  logFunctionStart('potsRepo.createMainPot', { handId, eligibleSeats });
  try {
    const { supabaseFor } = await import('@/lib/supabase');
    const poker = supabaseFor('poker');
    const { data, error } = await poker
      .from('pots')
      .insert({ hand_id: handId, amount: 0, eligible_seats: eligibleSeats })
      .select('*')
      .single();
    if (error) throw error;
    logFunctionEnd('potsRepo.createMainPot', { ok: true });
    return data as unknown as PotRecord;
  } catch (err) {
    logError('potsRepo.createMainPot', err as Error, { handId });
    throw err;
  }
}


