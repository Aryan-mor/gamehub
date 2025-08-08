## GameHub Architecture (Short Guide)

### Folder Structure
```
src/
├── actions/                # Actions & business logic
│   ├── games/
│   │   ├── index.ts       # Main games module
│   │   └── poker/         # Example game
│   │       └── room/
│   │           └── call/  # Each action is a folder with index.ts (export default)
│   │               └── index.ts
│   └── financial/
├── modules/
│   └── core/              # Router, handler, logging, i18n
├── plugins/               # Context plugins (i18n, logging, keyboard, smart-reply, form-state)
└── utils/                 # Shared utilities & type guards
```

### Action Pattern (Auto-Discovery Router)
- Message keys map to paths: `games.{game}.{module}.{action}` → `src/actions/games/{game}/{module}/{action}/index.ts`
- Every handler file exports default and is wrapped by `createHandler` for standardized logging/error handling.

Minimal handler template:
```ts
// src/actions/games/poker/room/call/index.ts
import { createHandler, HandlerContext } from '@/modules/core/handler';

async function handleCall(context: HandlerContext, query: Record<string, string>) {
  // use ctx.keyboard.buildCallbackData, ctx.replySmart, ctx.t, ctx.log
}

export const key = 'games.poker.room.call';
export default createHandler(handleCall);
```

### Router & Callback Data
- Router: `modules/core/smart-router.ts` auto-discovers actions and dispatches using message keys.
- Callback data: always use `ctx.keyboard.buildCallbackData('games.poker.room.call', { roomId })` and parse with `ctx.keyboard.parseCallbackData(data)`.

### Internationalization (i18n)
- All user-facing strings must use `ctx.t('namespace.key', params)`.
- Namespaces for poker: `poker.actions.*`, `poker.room.buttons.*`, `poker.game.*`, `poker.validation.*`, `poker.error.*`.
- Add new keys under `locales/{en,fa}/translation.json`.

### Logging
- Use centralized logger utilities: `logFunctionStart`, `logFunctionEnd`, `logError` via `createHandler` wrapper.
- Inside handlers prefer `ctx.log.info/error/debug` with structured context.

### Smart Reply
- Always reply via `ctx.replySmart(text, options)` which tries to edit the current message before sending a new one.
- Combine with i18n for the first argument: `ctx.replySmart(ctx.t('poker.help.message'), opts)`.

### Form State
- Use `ctx.formState` (namespaced) for multi-step forms: `ctx.formState.get('poker.room.create', userId)`.
- Clear with `ctx.formState.delete(namespace, userId)` when done.

### Validation & Type Safety
- Custom ID types (never raw strings) live in `src/utils/types`.
- Use validators/type-guards for input: `validateQueryParams`, `validateRoomIdWithError`, etc.
- Translate errors to i18n with `translatePokerError(ctx, error, 'poker.error.*')`.

### Conventions
- No `any`, no `as` casting; use type guards.
- Handlers must be `export default` and live in `index.ts` under their action folder.
- All callback_data generated via keyboard utility; never handcraft strings.

### Quick Checklist
- [ ] Route key matches folder: `games.poker.room.call`
- [ ] Default export wrapped with `createHandler`
- [ ] All replies use `ctx.replySmart(ctx.t(...))`
- [ ] Keyboard uses `ctx.keyboard.buildCallbackData`
- [ ] Inputs validated; errors translated with i18n