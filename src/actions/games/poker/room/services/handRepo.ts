import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

export interface CreateHandParams {
  roomId: string;
  buttonPos: number;
  street: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  actingPos: number;
  minRaise: number;
  currentBet: number;
  deckSeed: string;
}

export interface HandRecord {
  id: string;
  room_id: string;
  button_pos: number;
  street: string;
  board: string[];
  acting_pos: number;
  min_raise: number;
  current_bet: number;
  deck_seed: string;
  version: number;
}

export async function createHand(params: CreateHandParams): Promise<HandRecord> {
  logFunctionStart('handRepo.createHand', { roomId: params.roomId });
  try {
    const { supabaseFor } = await import('@/lib/supabase');
    const poker = supabaseFor('poker');
    const { data, error } = await poker
      .from('hands')
      .insert({
        room_id: params.roomId,
        button_pos: params.buttonPos,
        street: params.street,
        acting_pos: params.actingPos,
        min_raise: params.minRaise,
        current_bet: params.currentBet,
        deck_seed: params.deckSeed,
      })
      .select()
      .single();
    if (error) throw error;
    logFunctionEnd('handRepo.createHand', { ok: true, id: String(data.id) });
    return data as unknown as HandRecord;
  } catch (err) {
    logError('handRepo.createHand', err as Error, { roomId: params.roomId });
    throw err;
  }
}


