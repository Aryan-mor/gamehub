import type { GameHubContext } from '@/plugins';

export async function sendGroupRoomMessage(
  hub: GameHubContext,
  roomId: string,
  isPlaying: boolean,
  defaultMessage: string,
  defaultKeyboard: { text: string; callback_data: string }[][]
): Promise<void> {
  try {
    const roomsApi = await import('@/api/rooms');
    const dbRoom: any = await roomsApi.getById(roomId);
    const lastChatId = Number(dbRoom?.last_chat_id);
    if (Number.isFinite(lastChatId) && hub.telegram?.sendMessage) {
      if (!isPlaying) {
        await hub.telegram.sendMessage(lastChatId, defaultMessage, {
          parseMode: 'HTML',
          replyMarkup: { inline_keyboard: defaultKeyboard },
        });
      }
    }
  } catch {
    hub.log?.debug?.('roomService.broadcastRoomInfo:group-send:skipped', { roomId });
  }
}


