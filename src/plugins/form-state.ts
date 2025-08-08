import { Context } from 'grammy';
import { GameHubContext, GameHubPlugin } from './context';
import { FormStateService } from '@/modules/core/formStateService';

const instance = new FormStateService({ defaultTtlMs: 15 * 60 * 1000, enableAutoCleanup: true, cleanupIntervalMs: 5 * 60 * 1000 });

export class FormStatePlugin implements GameHubPlugin {
  name = 'form-state';
  version = '1.0.0';

  buildContext(_: Context): Partial<GameHubContext> {
    return {
      formState: instance,
    } as Partial<GameHubContext>;
  }

  async middleware(_: GameHubContext, next: () => Promise<void>): Promise<void> {
    await next();
  }
}

export const formStatePluginInstance = new FormStatePlugin();
export default FormStatePlugin;

