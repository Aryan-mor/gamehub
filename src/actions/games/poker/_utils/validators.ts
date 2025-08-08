import { GameHubContext } from '@/plugins';
import { RoomId, PlayerId } from '../types';
import {
  createPokerError,
  createUserFriendlyError,
  validateRoomIdWithError,
  validatePlayerIdWithError,
  validateAmountWithError,
  PokerGameError,
} from './errorHandler';

export interface ValidatedQuery {
  roomId?: RoomId;
  playerId?: PlayerId;
  amount?: number;
}

export function validateQueryParams(
  query: Record<string, string>,
  context: { requireRoomId?: boolean; requireAmount?: boolean; includePlayerIdFrom?: PlayerId | string }
): ValidatedQuery {
  const result: ValidatedQuery = {};

  const rawRoomId = query.roomId || query.r;
  if (context.requireRoomId) {
    if (!rawRoomId) throw createPokerError('MISSING_PARAMETER', 'roomId');
    result.roomId = validateRoomIdWithError(rawRoomId);
  } else if (rawRoomId) {
    result.roomId = validateRoomIdWithError(rawRoomId);
  }

  if (context.requireAmount) {
    const rawAmount = query.amount || query.a;
    if (!rawAmount) throw createPokerError('MISSING_PARAMETER', 'amount');
    result.amount = validateAmountWithError(rawAmount);
  } else if (query.amount) {
    result.amount = validateAmountWithError(query.amount);
  }

  if (context.includePlayerIdFrom) {
    const rawPlayerId = String(context.includePlayerIdFrom);
    result.playerId = validatePlayerIdWithError(rawPlayerId);
  }

  return result;
}

export function translatePokerError(
  ctx: GameHubContext,
  error: unknown,
  fallbackKey: string
): string {
  if (error instanceof PokerGameError) {
    switch (error.code) {
      case 'INVALID_ROOM_ID':
        return ctx.t('poker.validation.invalidRoomId');
      case 'INVALID_PLAYER_ID':
        return ctx.t('poker.validation.invalidPlayerId');
      case 'INVALID_AMOUNT':
        return ctx.t('poker.validation.invalidAmount');
      case 'MISSING_PARAMETER':
        // error.message may contain the parameter name
        return ctx.t('poker.validation.missingParam', { param: (error.message || 'param') as string });
      default:
        return ctx.t(fallbackKey, { error: error.userFriendlyMessage ?? error.message ?? 'Unknown error' });
    }
  }
  const friendly = createUserFriendlyError((error as Error) ?? new Error('Unknown error'));
  return ctx.t(fallbackKey, { error: friendly });
}


