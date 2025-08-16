import type { GameHubContext } from '@/plugins';
import type { Btn } from './views';

export async function sendText(
  hub: GameHubContext,
  chatIds: number[],
  text: string,
  keyboard: Btn[][]
): Promise<void> {
  const send = hub.sendOrEditMessageToUsers;
  await send(chatIds, text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: keyboard as Array<Array<{ text: string; callback_data: string }>> } });
}

export async function sendPhoto(
  hub: GameHubContext,
  roomId: string,
  chatIds: number[],
  caption: string,
  keyboard: Btn[][],
  photoCtx: {
    isPlaying: boolean;
    boardCards: string[];
    seatInfoByUser: Record<string, any>;
    actingUuid?: string;
    currentBetGlobal: number;
    isDetailed?: boolean;
    telegramIdToUuid: Record<number, string>;
  }
): Promise<void> {
  const { sendOrEditPhotoToUsers } = await import('./photoMessenger');
  await sendOrEditPhotoToUsers(hub, roomId, chatIds, caption, keyboard as Array<Array<{ text: string; callback_data: string }>>, photoCtx);
}


