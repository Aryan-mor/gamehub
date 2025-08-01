import { HandlerContext } from './handler';
import { parseMessageKey } from './utils/parseMessageKey';

type Handler = (context: HandlerContext, query: Record<string, string>) => Promise<void> | void;

interface RouteMatch {
  handler: Handler;
  params: Record<string, string>;
  path: string;
}

class AutoRouter {
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
   * Auto-discover and register handlers from folder structure
   */
  async autoDiscover(basePath: string, routePrefix: string = ''): Promise<void> {
    try {
      // This would typically use Node.js fs module to scan directories
      // For now, we'll implement a simple pattern-based discovery
      console.log(`Auto-discovering handlers for prefix: ${routePrefix}`);
      
      // Example: auto-discover poker room handlers
      if (routePrefix.includes('games.poker.room')) {
        const actions = ['call', 'join', 'leave', 'create', 'fold', 'raise', 'list'];
        
        for (const action of actions) {
          const route = `${routePrefix}.${action}`;
          try {
            // Dynamic import based on route structure
            const handlerModule = await this.dynamicImport(route);
            if (handlerModule && handlerModule.default) {
              this.register(route, handlerModule.default);
              console.log(`✅ Auto-registered: ${route}`);
            }
          } catch (error) {
            console.log(`⚠️  Could not auto-register: ${route} (${error.message})`);
          }
        }
      }
    } catch (error) {
      console.error('Auto-discovery error:', error);
    }
  }

  /**
   * Dynamic import based on route structure
   */
  private async dynamicImport(route: string): Promise<any> {
    const pathParts = route.split('.');
    
    // Convert route to file path
    // games.poker.room.call -> src/games/poker/room/call/index.ts
    let filePath = 'src';
    
    for (const part of pathParts) {
      filePath += `/${part}`;
    }
    
    filePath += '/index.ts';
    
    try {
      // Dynamic import with path resolution
      const module = await import(`@/${filePath}`);
      return module;
    } catch (error) {
      // Try alternative paths or return null
      return null;
    }
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
    
    // Try auto-discovery for this route
    await this.autoDiscover('src', pathString);
    
    // Try exact match again after auto-discovery
    const discoveredHandler = this.handlers.get(pathString);
    if (discoveredHandler) {
      await discoveredHandler(context, parsed.query);
      return;
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
const autoRouter = new AutoRouter();

export { autoRouter };
export const register = (route: string, handler: Handler) => autoRouter.register(route, handler);
export const registerModule = (modulePath: string, handler: (messageKey: string, context: HandlerContext) => Promise<void>) => autoRouter.registerModule(modulePath, handler);
export const dispatch = (messageKey: string, context: HandlerContext) => autoRouter.dispatch(messageKey, context);
export const autoDiscover = (basePath: string, routePrefix: string) => autoRouter.autoDiscover(basePath, routePrefix); 