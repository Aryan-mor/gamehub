import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

export interface SeatRecord {
  hand_id: string;
  seat_pos: number;
  user_id: string;
  stack: number;
  bet: number;
  in_hand: boolean;
  is_all_in: boolean;
  hole: string[] | null;
}

export interface CreateSeatParams {
  handId: string;
  seatPos: number;
  userId: string;
  stack: number;
}

export async function bulkCreateSeats(params: CreateSeatParams[]): Promise<SeatRecord[]> {
  logFunctionStart('seatsRepo.bulkCreateSeats', { count: params.length, handId: params[0]?.handId });
  try {
    const { supabaseFor } = await import('@/lib/supabase');
    const rows = params.map((p) => ({
      hand_id: p.handId,
      seat_pos: p.seatPos,
      user_id: p.userId,
      stack: p.stack,
      bet: 0,
      in_hand: true,
      is_all_in: false,
      hole: null,
    }));
    const poker = supabaseFor('poker');
    const { data, error } = await poker
      .from('seats')
      .insert(rows)
      .select();
    if (error) throw error;
    logFunctionEnd('seatsRepo.bulkCreateSeats', { ok: true, inserted: data?.length ?? 0 });
    return (data ?? []) as unknown as SeatRecord[];
  } catch (err) {
    logError('seatsRepo.bulkCreateSeats', err as Error, { count: params.length });
    throw err;
  }
}

export async function postBlind(handId: string, seatPos: number, amount: number): Promise<void> {
  logFunctionStart('seatsRepo.postBlind', { handId, seatPos, amount });
  try {
    const { supabaseFor } = await import('@/lib/supabase');
    const poker = supabaseFor('poker');
    const { data, error } = await poker
      .from('seats')
      .update({
        bet: amount,
        stack: (undefined as unknown as number),
      })
      .eq('hand_id', handId)
      .eq('seat_pos', seatPos)
      .select('*')
      .single();
    if (error) throw error;
    // If stack provided, compute new stack = old - amount
    // Supabase lacks arithmetic update in a portable way here; refetch and adjust
    const current = data as unknown as SeatRecord;
    const newStack = Math.max(0, (current.stack ?? 0) - amount);
    const { error: e2 } = await poker
      .from('seats')
      .update({ stack: newStack })
      .eq('hand_id', handId)
      .eq('seat_pos', seatPos);
    if (e2) throw e2;
    logFunctionEnd('seatsRepo.postBlind', { ok: true });
  } catch (err) {
    logError('seatsRepo.postBlind', err as Error, { handId, seatPos, amount });
    throw err;
  }
}

export async function listSeatsByHand(handId: string): Promise<SeatRecord[]> {
  logFunctionStart('seatsRepo.listSeatsByHand', { handId });
  try {
    const { supabaseFor } = await import('@/lib/supabase');
    const poker = supabaseFor('poker');
    const { data, error } = await poker
      .from('seats')
      .select('*')
      .eq('hand_id', handId)
      .order('seat_pos', { ascending: true });
    if (error) throw error;
    logFunctionEnd('seatsRepo.listSeatsByHand', { ok: true, count: data?.length ?? 0 });
    return (data ?? []) as unknown as SeatRecord[];
  } catch (err) {
    logError('seatsRepo.listSeatsByHand', err as Error, { handId });
    throw err;
  }
}


