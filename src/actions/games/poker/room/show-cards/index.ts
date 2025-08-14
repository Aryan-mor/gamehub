import { HandlerContext, createHandler } from '@/modules/core/handler';
import { getActiveRoomId } from '@/modules/core/userRoomState';

export const key = 'games.poker.room.show-cards';

async function handleShowCards(context: HandlerContext): Promise<void> {
  const { ctx, user } = context;
  
  // Get active room ID
  const roomId = getActiveRoomId(String(user.id));
  if (!roomId) {
    await ctx.replySmart(ctx.t('poker.room.error.notFound'));
    return;
  }

  // Example: Show a poker hand with card images
  const cardImageUrl = 'https://example.com/poker-cards.jpg'; // In real app, this would be generated
  const handDescription = 'Your hand: Ace of Spades, King of Hearts, Queen of Diamonds, Jack of Clubs, 10 of Spades';
  
  const ROUTES = (await import('@/modules/core/routes.generated')).ROUTES;
  
  await (ctx as any).api.sendPhoto(String(ctx.chat?.id ?? ctx.from?.id), cardImageUrl, {
    caption: handDescription,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: ctx.t('poker.actions.fold'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.room.fold) },
          { text: ctx.t('poker.actions.call'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.room.call) },
          { text: ctx.t('poker.actions.check'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.room.check) }
        ],
        [
          { text: ctx.t('poker.room.buttons.backToRoomInfo'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.room.info) }
        ]
      ]
    }
  });
}

export default createHandler(handleShowCards);
