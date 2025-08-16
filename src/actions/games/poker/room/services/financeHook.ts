import type { GameHubContext } from '@/plugins';

export async function tryInvokeEarlyOnHandEnd(hub: GameHubContext, roomId: string): Promise<void> {
	try {
		const { supabaseFor } = await import('@/lib/supabase');
		const poker = supabaseFor('poker');
		const { data: handsEarly } = await poker
			.from('hands')
			.select('*')
			.eq('room_id', roomId)
			.order('created_at', { ascending: false })
			.limit(1);
		const h = handsEarly && (handsEarly[0] as any);
		if (h && String(h.street) === 'showdown') {
			try {
				const { financePluginInstance } = await import('@/plugins/finance');
				await financePluginInstance.onHandEnd(hub, {
					roomId,
					handId: String(h.id || ''),
					version: Number(h.version || 0),
					winners: [],
				});
			} catch {}
		}
	} catch {}
}

interface ShowdownParams {
	roomId: string;
	handId?: string;
	engineState?: any;
	boardCards?: string[];
	winners: Array<{ uuid: string; amount: number; hand: string; combo?: string[] }>;
}

export async function invokeOnShowdown(hub: GameHubContext, p: ShowdownParams): Promise<void> {
	const isShowdownLike = (p.engineState?.street === 'showdown' || (Array.isArray(p.boardCards) && p.boardCards.length === 5));
	if (!isShowdownLike) return;
	try {
		const { financePluginInstance } = await import('@/plugins/finance');
		await financePluginInstance.onHandEnd(hub, {
			roomId: p.roomId,
			handId: String(p.handId || ''),
			version: Number((p.engineState as any)?.version ?? 0),
			winners: (p.winners || []).map((w) => ({ uuid: w.uuid, amount: w.amount, hand: w.hand, combo: w.combo })),
		});
	} catch (e) {
		hub.log?.warn?.('roomService.finance.onHandEnd.failed', { roomId: p.roomId, handId: p.handId, err: (e as Error)?.message });
	}
}


