import { logger } from '@/modules/core/logger';

export function traceFn<T extends (...args: unknown[]) => Promise<unknown>>(name: string, fn: T): T {
  return (async (...args: unknown[]) => {
    logger.debug({ args }, `🔍 ${name} called`);
    try {
      const result = await fn(...args);
      logger.debug({ result }, `✅ ${name} returned`);
      return result;
    } catch (err) {
      logger.error({ err }, `❌ ${name} error`);
      throw err;
    }
  }) as T;
}

// Synchronous version for non-async functions
export function traceFnSync<T extends (...args: unknown[]) => unknown>(name: string, fn: T): T {
  return ((...args: unknown[]) => {
    logger.debug({ args }, `🔍 ${name} called`);
    try {
      const result = fn(...args);
      logger.debug({ result }, `✅ ${name} returned`);
      return result;
    } catch (err) {
      logger.error({ err }, `❌ ${name} error`);
      throw err;
    }
  }) as T;
}

// Class method decorator
export function traceMethod(_target: unknown, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function (...args: unknown[]): Promise<unknown> {
    const className = this.constructor.name;
    const methodName = `${className}.${propertyKey}`;
    
    logger.debug({ args }, `🔍 ${methodName} called`);
    try {
      const result = await originalMethod.apply(this, args);
      logger.debug({ result }, `✅ ${methodName} returned`);
      return result;
    } catch (err) {
      logger.error({ err }, `❌ ${methodName} error`);
      throw err;
    }
  };
  
  return descriptor;
} 