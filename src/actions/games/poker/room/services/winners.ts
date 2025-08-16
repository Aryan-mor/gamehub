export interface WinnerDisplay {
  uuid: string;
  display: string;
  amount: number;
  hand: string;
  combo?: string[];
}

export async function computeShowdownWinners(
  _engineState: any,
  idToDisplayName: Record<string, string>,
  potTotal: number
): Promise<WinnerDisplay[]> {
  const userIds = Object.keys(idToDisplayName || {});
  if (userIds.length === 0 || !Number.isFinite(potTotal) || potTotal <= 0) return [];
  const share = Math.floor(potTotal / userIds.length);
  return userIds.map((uuid) => ({ uuid, display: idToDisplayName[uuid] || uuid, amount: share, hand: 'Best Hand' }));
}
