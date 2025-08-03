import { HandlerContext } from './handler';

type CompactHandler = (context: HandlerContext, query: Record<string, string>) => Promise<void> | void;

interface CompactRoute {
  code: string;
  handler: CompactHandler;
  description?: string;
}

class CompactRouter {
  private routes: Map<string, CompactRoute> = new Map();
  private codeToHandler: Map<string, CompactHandler> = new Map();
  private handlerToCode: Map<CompactHandler, string> = new Map();

  /**
   * Register a handler with a compact code
   */
  register(code: string, handler: CompactHandler, description?: string): void {
    if (this.codeToHandler.has(code)) {
      throw new Error(`Compact code '${code}' is already registered`);
    }

    const route: CompactRoute = {
      code,
      handler,
      description
    };

    this.routes.set(code, route);
    this.codeToHandler.set(code, handler);
    this.handlerToCode.set(handler, code);
  }

  /**
   * Register multiple handlers at once
   */
  registerMultiple(registrations: Array<{ code: string; handler: CompactHandler; description?: string }>): void {
    for (const { code, handler, description } of registrations) {
      this.register(code, handler, description);
    }
  }

  /**
   * Dispatch a compact action
   */
  async dispatch(code: string, context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
    const handler = this.codeToHandler.get(code);
    if (!handler) {
      throw new Error(`No handler found for compact code: ${code}`);
    }

    await handler(context, query);
  }

  /**
   * Get handler for a code
   */
  getHandler(code: string): CompactHandler | undefined {
    return this.codeToHandler.get(code);
  }

  /**
   * Get code for a handler
   */
  getCode(handler: CompactHandler): string | undefined {
    return this.handlerToCode.get(handler);
  }

  /**
   * Check if a code is registered
   */
  hasCode(code: string): boolean {
    return this.codeToHandler.has(code);
  }

  /**
   * Get all registered codes
   */
  getCodes(): string[] {
    return Array.from(this.codeToHandler.keys());
  }

  /**
   * Get all routes with descriptions
   */
  getRoutes(): CompactRoute[] {
    return Array.from(this.routes.values());
  }

  /**
   * Generate compact callback data
   */
  generateCallbackData(code: string, params: Record<string, string> = {}): string {
    if (!this.hasCode(code)) {
      throw new Error(`Unknown compact code: ${code}`);
    }

    // Build compact callback data: code?param1=value1&param2=value2
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    return queryString ? `${code}?${queryString}` : code;
  }

  /**
   * Parse compact callback data
   */
  parseCallbackData(callbackData: string): { code: string; params: Record<string, string> } {
    const [code, queryString] = callbackData.split('?');
    
    // Don't validate code existence here, let the handler decide
    // if (!this.hasCode(code)) {
    //   throw new Error(`Unknown compact code: ${code}`);
    // }

    const params: Record<string, string> = {};
    
    if (queryString) {
      const pairs = queryString.split('&');
      for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key && value) {
          params[key] = decodeURIComponent(value);
        }
      }
    }

    return { code, params };
  }
}

// Create singleton instance
const compactRouter = new CompactRouter();

export { compactRouter, CompactRouter };
export type { CompactHandler, CompactRoute };
export const register = (code: string, handler: CompactHandler, description?: string): void => 
  compactRouter.register(code, handler, description);

export const registerMultiple = (registrations: Array<{ code: string; handler: CompactHandler; description?: string }>): void => 
  compactRouter.registerMultiple(registrations);

export const dispatch = (code: string, context: HandlerContext, query: Record<string, string> = {}): Promise<void> => 
  compactRouter.dispatch(code, context, query);

export const generateCallbackData = (code: string, params: Record<string, string> = {}): string => 
  compactRouter.generateCallbackData(code, params);

export const parseCallbackData = (callbackData: string): { code: string; params: Record<string, string> } => 
  compactRouter.parseCallbackData(callbackData);

export const getCodes = (): string[] => compactRouter.getCodes();
export const getRoutes = (): CompactRoute[] => compactRouter.getRoutes(); 