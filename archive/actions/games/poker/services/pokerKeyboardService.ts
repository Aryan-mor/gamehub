import { GameHubContext } from '@/plugins';
import { RoomId } from '@/utils/types';
import { PokerRoom, PokerPlayer, PlayerId } from '../types';
// Build callback_data via smart-router JSON using keyboard plugin

export interface InlineKeyboard {
  inline_keyboard: Array<Array<{ text: string; callback_data: string } | { text: string; switch_inline_query: string }>>;
}

export class PokerKeyboardService {
  static waitingRoom(roomId: RoomId, canStart: boolean, ctx: GameHubContext): InlineKeyboard {
    const buttons: InlineKeyboard['inline_keyboard'] = [];
    if (canStart) {
      buttons.push([{ text: ctx.t('poker.room.buttons.startGame'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.start', { roomId }) }]);
    }
    buttons.push([
      { text: ctx.t('poker.room.buttons.share'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.share', { roomId }) },
      { text: ctx.t('poker.room.buttons.backToRoomInfo'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.info', { roomId }) }
    ]);
    buttons.push([{ text: ctx.t('poker.room.buttons.leave'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.leave', { roomId }) }]);
    return { inline_keyboard: buttons };
  }

  static gameAction(room: PokerRoom, playerId: PlayerId, isCurrentPlayer: boolean, ctx: GameHubContext): InlineKeyboard {
    if (!isCurrentPlayer) {
      return {
        inline_keyboard: [[{ text: ctx.t('poker.room.buttons.refresh'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.refresh', { roomId: room.id }) }], [{ text: ctx.t('poker.room.buttons.leave'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.leave', { roomId: room.id }) }]]
      };
    }
    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      return { inline_keyboard: [[{ text: ctx.t('poker.room.buttons.backToMenu'), callback_data: ctx.keyboard.buildCallbackData('games.poker.back', {}) }]] };
    }
    const buttons: InlineKeyboard['inline_keyboard'] = [];
    const canCall = player.betAmount < room.currentBet;
    const callAmount = room.currentBet - player.betAmount;
    if (canCall) {
      buttons.push([{ text: ctx.t('poker.actions.callWithAmount', { amount: String(callAmount) }), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.call', { roomId: room.id }) }]);
    } else {
      buttons.push([{ text: ctx.t('poker.actions.check'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.check', { roomId: room.id }) }]);
    }
    buttons.push([{ text: ctx.t('poker.actions.fold'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.fold', { roomId: room.id }) }]);
    const canRaise = (player.chips || 0) > room.currentBet;
    if (canRaise) {
      const raiseOptions = this.raiseOptions(room, player, ctx);
      buttons.push(raiseOptions);
    }
    if ((player.chips || 0) > 0) {
      buttons.push([{ text: ctx.t('poker.actions.allIn'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.allin', { roomId: room.id }) }]);
    }
    buttons.push([{ text: ctx.t('poker.room.buttons.leave'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.leave', { roomId: room.id }) }]);
    return { inline_keyboard: buttons };
  }

  static raiseOptions(room: PokerRoom, player: PokerPlayer, ctx: GameHubContext): Array<{ text: string; callback_data: string }> {
    const minRaise = room.minRaise;
    const playerChips = player.chips || 0;
    const currentBet = room.currentBet;
    const raiseAmounts = [minRaise, minRaise * 2, minRaise * 3, playerChips].filter(amount => amount <= playerChips && amount > currentBet);
    return raiseAmounts.slice(0, 3).map(amount => ({
      text: ctx.t('poker.actions.raisePlus', { amount: String(amount) }),
      callback_data: ctx.keyboard.buildCallbackData('games.poker.room.raise', { roomId: room.id, amount: String(amount) })
    }));
  }
}

export default PokerKeyboardService;

