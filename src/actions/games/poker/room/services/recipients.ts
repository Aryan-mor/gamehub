import type { GameHubContext } from '@/plugins';

export interface RecipientInfo {
  recipientChatIds: number[];
  adminTelegramId: number | null;
  adminRecipients: number[];
  nonAdminRecipients: number[];
  idToDisplayName: Record<string, string>;
  telegramIdToUuid: Record<number, string>;
}

export async function resolveRecipients(
  hub: GameHubContext,
  roomId: string,
  room: { players: string[]; createdBy: string },
  targetUserIds?: string[]
): Promise<RecipientInfo> {
  const usersApi = await import('@/api/users');
  const getByIds = usersApi.getByIds;
  const adminUuid = String(room.createdBy);
  const allUuids = room.players;
  const idToDisplayName: Record<string, string> = {};
  const telegramIdToUuid: Record<number, string> = {};

  // Load all users for mapping UUID → telegram_id
  const users = await getByIds(allUuids);
  const idToTelegramId: Record<string, number> = {};
  for (const u of users as any[]) {
    const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
    const display = fullName || u.first_name || u.username || String(u.telegram_id) || 'Unknown';
    idToDisplayName[String(u.id)] = display;
    const tid = Number(u.telegram_id ?? u.id ?? NaN);
    if (Number.isFinite(tid)) {
      idToTelegramId[String(u.id)] = tid;
      telegramIdToUuid[tid] = String(u.id);
    }
  }

  // Compute recipients using telegram ids from DB mapping
  let recipientChatIds: number[] = [];
  if (Array.isArray(targetUserIds) && targetUserIds.length > 0) {
    const numericTargets = targetUserIds.filter((id) => /^\d+$/.test(id)).map((id) => Number(id));
    if (numericTargets.length === targetUserIds.length) {
      recipientChatIds = numericTargets;
    } else {
      // Treat as UUIDs
      recipientChatIds = targetUserIds
        .map((uuid) => idToTelegramId[String(uuid)])
        .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
    }
  } else {
    recipientChatIds = allUuids
      .map((uuid) => idToTelegramId[String(uuid)])
      .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
  }

  const adminUser = (users as any[]).find((u) => String(u.id) === adminUuid);
  const adminTelegramId = Number(adminUser?.telegram_id ?? adminUser?.id ?? NaN);

  const adminRecipients = Number.isFinite(adminTelegramId) ? recipientChatIds.filter((id) => id === adminTelegramId) : [];
  const nonAdminRecipients = Number.isFinite(adminTelegramId) ? recipientChatIds.filter((id) => id !== adminTelegramId) : recipientChatIds;

  hub.log?.debug?.('roomService.recipients', { roomId, targetUserIds, recipientChatIds });
  hub.log?.debug?.('roomService.recipientGroups', { roomId, adminTelegramId, adminRecipients, nonAdminRecipients });

  return { recipientChatIds, adminTelegramId: Number.isFinite(adminTelegramId) ? adminTelegramId : null, adminRecipients, nonAdminRecipients, idToDisplayName, telegramIdToUuid };
}


