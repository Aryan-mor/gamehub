import { HandlerContext, createHandler } from '@/modules/core/handler';

async function handlePokerRoomInit(context: HandlerContext): Promise<void> {
  const { ctx } = context;

  // Minimal welcome; E2E focuses on buttons, not text content
  const text = ctx.t('bot.start.welcome');

  const templates: Record<string, { text: string; callback_data: string }> = {
    createRoom: {
      text: ctx.t('poker.room.buttons.createRoom'),
      callback_data: ctx.keyboard.buildCallbackData('games.poker.room.create')
    },
    joinRoom: {
      text: ctx.t('poker.room.buttons.joinRoom'),
      callback_data: ctx.keyboard.buildCallbackData('games.poker.room.join')
    },
    listRooms: {
      text: ctx.t('poker.room.buttons.findRooms'),
      callback_data: ctx.keyboard.buildCallbackData('games.poker.room.list')
    },
    help: {
      text: ctx.t('poker.room.buttons.help'),
      callback_data: ctx.keyboard.buildCallbackData('games.poker.help')
    },
    back: {
      text: ctx.t('poker.room.buttons.backToMenu'),
      callback_data: ctx.keyboard.buildCallbackData('start')
    }
  };

  const layout = [
    ['createRoom', 'joinRoom'],
    ['listRooms'],
    ['help', 'back']
  ];

  const keyboard = ctx.keyboard.createCustomKeyboard(layout, templates);

  await ctx.replySmart(text, {
    parse_mode: 'HTML',
    reply_markup: keyboard
  });
}

export default createHandler(handlePokerRoomInit);


