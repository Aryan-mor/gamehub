import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

export type ActionType = 'CHECK' | 'CALL' | 'FOLD' | 'RAISE' | 'ALL_IN' | 'POST_SB' | 'POST_BB' | 'DEAL' | 'REVEAL' | 'AWARD' | 'STREET';

export interface CreateActionParams {
  handId: string;
  seq: number;
  actorPos: number;
  type: ActionType;
  amount?: number;
  resultingVersion: number;
}

export async function createAction(params: CreateActionParams): Promise<void> {
  logFunctionStart('actionsRepo.createAction', { handId: params.handId, type: params.type, seq: params.seq });
  try {
    const { supabaseFor } = await import('@/lib/supabase');
    const poker = supabaseFor('poker');
    const { error } = await poker
      .from('actions')
      .insert({
        hand_id: params.handId,
        seq: params.seq,
        actor_pos: params.actorPos,
        type: params.type,
        amount: params.amount,
        resulting_version: params.resultingVersion,
      });
    if (error) throw error;
    logFunctionEnd('actionsRepo.createAction', { ok: true });
  } catch (err) {
    logError('actionsRepo.createAction', err as Error, { handId: params.handId });
    throw err;
  }
}


