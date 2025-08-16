import type { Context } from 'grammy';
import type { GameHubContext, GameHubPlugin, ContextBuilder } from './context';

export interface HandWinner {
  uuid: string;
  amount: number;
  hand?: string;
  combo?: string[];
}

export interface HandSettlementPayload {
  roomId: string;
  handId: string;
  version: number;
  winners: HandWinner[];
}

export interface FinancePlugin extends GameHubPlugin {
  onHandEnd: (ctx: GameHubContext, payload: HandSettlementPayload) => Promise<void>;
}

export class DefaultFinancePlugin implements FinancePlugin {
  name = 'finance';
  version = '1.0.0';

  buildContext: ContextBuilder = (_ctx: Context): Partial<GameHubContext> => ({ });

  middleware = async (_ctx: GameHubContext, next: () => Promise<void>): Promise<void> => {
    await next();
  };

  // No-op default; actual implementation to be provided later
  async onHandEnd(_ctx: GameHubContext, _payload: HandSettlementPayload): Promise<void> {
    return;
  }
}

export const financePluginInstance: FinancePlugin = new DefaultFinancePlugin();



