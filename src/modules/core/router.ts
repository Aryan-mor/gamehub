import { parseMessageKey, ParsedKey } from './utils/parseMessageKey';
import { HandlerContext } from './handler';

type Handler = (context: HandlerContext, query: Record<string, string>) => Promise<void> | void;

class Router {
  private handlers: Map<string, Handler> = new Map();
  private wildcardHandlers: Map<string, Handler> = new Map();
  private moduleHandlers: Map<string, (messageKey: string, context: HandlerContext) => Promise<void>> = new Map();

  /**
   * Register a handler for a specific route
   */
  register(route: string, handler: Handler): void {
    if (route.includes('*')) {
      this.wildcardHandlers.set(route, handler);
    } else {
      this.handlers.set(route, handler);
    }
  }

  /**
   * Register a module handler (for hierarchical routing)
   */
  registerModule(modulePath: string, handler: (messageKey: string, context: HandlerContext) => Promise<void>): void {
    this.moduleHandlers.set(modulePath, handler);
  }

  /**
   * Dispatch a message to the appropriate handler
   */
  async dispatch(messageKey: string, context: HandlerContext): Promise<void> {
    const parsed = parseMessageKey(messageKey);
    const pathString = parsed.path.join('.');
    
    // First check for module handlers (hierarchical routing)
    for (const [modulePath, handler] of this.moduleHandlers) {
      if (pathString.startsWith(modulePath)) {
        await handler(messageKey, context);
        return;
      }
    }
    
    // Then try exact match
    const exactHandler = this.handlers.get(pathString);
    if (exactHandler) {
      await exactHandler(context, parsed.query);
      return;
    }
    
    // Then try wildcard match
    for (const [wildcardPattern, handler] of this.wildcardHandlers) {
      if (this.matchesWildcard(pathString, wildcardPattern)) {
        await handler(context, parsed.query);
        return;
      }
    }
    
    // No handler found
    throw new Error(`No handler found for route: ${messageKey}`);
  }

  /**
   * Check if a path matches a wildcard pattern
   */
  private matchesWildcard(path: string, pattern: string): boolean {
    const pathParts = path.split('.');
    const patternParts = pattern.split('.');
    
    if (patternParts.length !== pathParts.length) {
      return false;
    }
    
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] !== '*' && patternParts[i] !== pathParts[i]) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get all registered routes (for debugging)
   */
  getRoutes(): string[] {
    return [
      ...this.handlers.keys(),
      ...this.wildcardHandlers.keys(),
      ...this.moduleHandlers.keys()
    ];
  }
}

// Create singleton instance
const router = new Router();

export { router };
export const register = (route: string, handler: Handler) => router.register(route, handler);
export const registerModule = (modulePath: string, handler: (messageKey: string, context: HandlerContext) => Promise<void>) => router.registerModule(modulePath, handler);
export const dispatch = (messageKey: string, context: HandlerContext) => router.dispatch(messageKey, context); 