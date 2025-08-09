
      (async () => {
        const { dispatch } = require("/home/aryan/Projects/gamehub/dist/modules/core/smart-router.js");
        const { initializeRoutes } = require("/home/aryan/Projects/gamehub/dist/main-router.js");
        const { default: logger } = require("/home/aryan/Projects/gamehub/dist/modules/core/logger.js");
        const { decodeAction } = require("/home/aryan/Projects/gamehub/dist/modules/core/route-alias.js");
        initializeRoutes();
        const context = {
          ctx: {
            t: (k) => k,
            replySmart: async () => {},
            keyboard: { buildCallbackData: () => 'noop' },
            log: logger,
          },
          user: { id: '123', username: 'test' }
        };
         await dispatch('games.poker.room.list', context);
        await dispatch(decodeAction('g.pk.st'), context); // encoded route decoded to full path (games.poker.start)
        await dispatch('games.join', { ...context, _query: { roomId: 'room_x' } });
        console.log('OK');
      })().catch((e) => { console.error('ERR', e && e.message || e); process.exit(1); });
    