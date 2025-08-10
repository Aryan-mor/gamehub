import { HandlerContext } from './handler';
import { logFunctionStart, logFunctionEnd, logError } from './logger';
import { parseMessageKey } from './utils/parseMessageKey';

type Handler = (context: HandlerContext, query: Record<string, string>, params?: Record<string, string>) => Promise<void> | void;

interface RoutePattern {
  pattern: string;
  regex: RegExp;
  paramNames: string[];
  handler: Handler;
}

class SmartRouter {
  private exactHandlers: Map<string, Handler> = new Map();
  private patternHandlers: RoutePattern[] = [];
  private moduleHandlers: Map<string, (messageKey: string, context: HandlerContext) => Promise<void>> = new Map();

  /**
   * Register a handler for a specific route
   */
  register(route: string, handler: Handler): void {
    if (this.hasWildcards(route)) {
      this.registerPattern(route, handler);
    } else {
      this.exactHandlers.set(route, handler);
    }
  }

  /**
   * Register a pattern-based handler (with wildcards)
   */
  private registerPattern(pattern: string, handler: Handler): void {
    const { regex, paramNames } = this.parsePattern(pattern);
    
    this.patternHandlers.push({
      pattern,
      regex,
      paramNames,
      handler
    });
    
    // Sort by specificity (more specific patterns first)
    this.patternHandlers.sort((a, b) => {
      const aSpecificity = this.getPatternSpecificity(a.pattern);
      const bSpecificity = this.getPatternSpecificity(b.pattern);
      return bSpecificity - aSpecificity;
    });
  }

  /**
   * Parse a pattern into regex and parameter names
   */
  private parsePattern(pattern: string): { regex: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];
    
    // Convert pattern to regex
    // games.:game.room.:action -> games\.([^\.]+)\.room\.([^\.]+)
    const regexString = pattern
      .replace(/\./g, '\\.') // Escape dots
      .replace(/\*/g, '[^.]*') // Convert * to regex
      .replace(/:([a-zA-Z][a-zA-Z0-9]*)/g, (_match, paramName) => {
        paramNames.push(paramName);
        return '([^.]*)'; // Capture group for parameter
      });
    
    const regex = new RegExp(`^${regexString}$`);
    
    return { regex, paramNames };
  }

  /**
   * Check if a pattern has wildcards or parameters
   */
  private hasWildcards(pattern: string): boolean {
    return pattern.includes('*') || pattern.includes(':');
  }

  /**
   * Get pattern specificity (higher = more specific)
   */
  private getPatternSpecificity(pattern: string): number {
    let specificity = 0;
    
    // Exact matches are most specific
    if (!this.hasWildcards(pattern)) {
      specificity += 1000;
    }
    
    // Count non-wildcard parts
    const parts = pattern.split('.');
    for (const part of parts) {
      if (part !== '*' && !part.startsWith(':')) {
        specificity += 100;
      } else if (part.startsWith(':')) {
        specificity += 10; // Parameters are more specific than wildcards
      } else {
        specificity += 1; // Wildcards are least specific
      }
    }
    
    return specificity;
  }

  /**
   * Register a module handler (for hierarchical routing)
   */
  registerModule(modulePath: string, handler: (messageKey: string, context: HandlerContext) => Promise<void>): void {
    this.moduleHandlers.set(modulePath, handler);
  }

  /**
   * Auto-discover handler from folder structure
   */
  private async autoDiscoverHandler(pathString: string): Promise<Handler | null> {
    try {
      // Convert path to file path
      // games.poker.room.call -> actions/games/poker/room/call/index.ts
      const pathParts = pathString.split('.');
      let filePath = 'actions';
      
      for (const part of pathParts) {
        filePath += `/${part}`;
      }
      
      // Try both TS (dev) and JS (built) entry files
      const candidateFiles = ['index.ts', 'index.js'];
      
      logFunctionStart('smartRouter.autoDiscover', { pathString });

      for (const entry of candidateFiles) {
        const fullImportPath = `../../${filePath}/${entry}`;
        try {
          const module = await import(fullImportPath);
          if (module && module.default) {
            console.log('✅ smart-router.autoDiscover: found handler', {
              pathString,
              entry,
              fullImportPath
            });
            logFunctionEnd('smartRouter.autoDiscover', { discovered: true, entry }, { pathString });
            return module.default;
          }
        } catch (importError) {
          console.log('🔍 smart-router.autoDiscover: trying next candidate', {
            pathString,
            entry,
            fullImportPath,
            importError: importError instanceof Error ? importError.message : 'Unknown error'
          });
          // Try next candidate
        }
      }

      console.log('❌ smart-router.autoDiscover: no handler found', {
        pathString,
        candidateFiles
      });
      logFunctionEnd('smartRouter.autoDiscover', { discovered: false }, { pathString });
    } catch (error) {
      console.log('❌ smart-router.autoDiscover: error during discovery', {
        pathString,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      logError('smartRouter.autoDiscover', error as Error, { pathString });
    }
    
    return null;
  }

  /**
   * Dispatch a message to the appropriate handler
   */
  async dispatch(messageKey: string, context: HandlerContext): Promise<void> {
    const parsed = parseMessageKey(messageKey);
    const pathString = parsed.path.join('.');
    // Merge router-parsed query with any query attached by upper layers (e.g., callback_query JSON)
    const extraQuery = context._query || {};
    const mergedQuery: Record<string, string> = { ...parsed.query, ...extraQuery };
    
    // Enhanced logging for debugging follow issues
    console.log('🔍 smart-router.dispatch: called', {
      messageKey,
      pathString,
      extraQuery,
      mergedQuery,
      contextUserId: context.user?.id,
      contextChatId: context.ctx?.chat?.id
    });
    
    // First try exact match
    const exactHandler = this.exactHandlers.get(pathString);
    if (exactHandler) {
      await exactHandler(context, mergedQuery);
      return;
    }
    
    // Then try auto-discovery (before pattern matching)
    const discoveredHandler = await this.autoDiscoverHandler(pathString);
    if (discoveredHandler) {
      console.log('✅ smart-router.dispatch: using auto-discovered handler', {
        pathString,
        contextUserId: context.user?.id,
        contextChatId: context.ctx?.chat?.id
      });
      
      // Cache the discovered handler for future use
      this.exactHandlers.set(pathString, discoveredHandler);
      await discoveredHandler(context, mergedQuery);
      return;
    }
    
    // Then try pattern matching
    for (const routePattern of this.patternHandlers) {
      const match = pathString.match(routePattern.regex);
      if (match) {
        // Extract parameters
        const params: Record<string, string> = {};
        for (let i = 0; i < routePattern.paramNames.length; i++) {
          params[routePattern.paramNames[i]] = match[i + 1];
        }
        
        await routePattern.handler(context, mergedQuery, params);
        return;
      }
    }
    
    // Finally check for module handlers (hierarchical routing) as fallback
    for (const [modulePath, handler] of this.moduleHandlers) {
      if (pathString.startsWith(modulePath)) {
        await handler(messageKey, context);
        return;
      }
    }
    
    // No handler found
    throw new Error(`No handler found for route: ${messageKey}`);
  }

  /**
   * Get all registered routes (for debugging)
   */
  getRoutes(): string[] {
    return [
      ...this.exactHandlers.keys(),
      ...this.patternHandlers.map(p => p.pattern),
      ...this.moduleHandlers.keys()
    ];
  }

  /**
   * Get route information for debugging
   */
  getRouteInfo(): Array<{ route: string; type: string; specificity?: number }> {
    const info = [];
    
    for (const route of this.exactHandlers.keys()) {
      info.push({ route, type: 'exact' });
    }
    
    for (const pattern of this.patternHandlers) {
      info.push({ 
        route: pattern.pattern, 
        type: 'pattern', 
        specificity: this.getPatternSpecificity(pattern.pattern) 
      });
    }
    
    for (const route of this.moduleHandlers.keys()) {
      info.push({ route, type: 'module' });
    }
    
    return info.sort((a, b) => (b.specificity || 0) - (a.specificity || 0));
  }
}

// Create singleton instance
const smartRouter = new SmartRouter();

export { smartRouter };
export const register = (route: string, handler: Handler): void => smartRouter.register(route, handler);
export const registerModule = (modulePath: string, handler: (messageKey: string, context: HandlerContext) => Promise<void>): void => smartRouter.registerModule(modulePath, handler);
export const dispatch = (messageKey: string, context: HandlerContext): Promise<void> => smartRouter.dispatch(messageKey, context);
export const getRoutes = (): string[] => smartRouter.getRoutes();
export const getRouteInfo = (): Array<{ route: string; type: string; specificity?: number }> => smartRouter.getRouteInfo(); 