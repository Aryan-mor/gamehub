import { logger } from '@/modules/core/logger';
import { traceFn, traceFnSync } from '@/utils/traceFn';

// Example 1: Basic logging
export function basicLoggingExample(): void {
  logger.info('Starting basic logging example');
  logger.debug('This is a debug message');
  logger.warn('This is a warning message');
  logger.error('This is an error message');
}

// Example 2: Async function tracing
export const loadUserData = traceFn('loadUserData', async (...args: unknown[]) => {
  const userId = args[0] as string;
  logger.debug(`Loading user data for ID: ${userId}`);
  
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    id: userId,
    name: 'John Doe',
    email: 'john@example.com'
  };
});

// Example 3: Sync function tracing
export const validateUserInput = traceFnSync('validateUserInput', (...args: unknown[]) => {
  const input = args[0] as string;
  if (!input || input.length < 3) {
    throw new Error('Input must be at least 3 characters long');
  }
  
  return input.trim();
});

// Example 4: Class with method tracing
export class UserService {
  async createUser(userData: { name: string; email: string }): Promise<{ id: string; name: string; email: string; createdAt: string }> {
    logger.debug('Creating new user', { userData });
    
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      id: 'user_123',
      ...userData,
      createdAt: new Date().toISOString()
    };
  }
  
  async updateUser(userId: string, updates: Partial<{ name: string; email: string }>): Promise<{ id: string; name?: string; email?: string; updatedAt: string }> {
    logger.debug('Updating user', { userId, updates });
    
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, 150));
    
    return {
      id: userId,
      ...updates,
      updatedAt: new Date().toISOString()
    };
  }
}

// Example 5: Error handling with logging
export const processUserRequest = traceFn('processUserRequest', async (...args: unknown[]) => {
  const request = args[0] as Record<string, unknown>;
  try {
    logger.info('Processing user request', { requestId: request.id });
    
    // Validate input
    const validatedInput = validateUserInput(request.data);
    
    // Load user data
    const userData = await loadUserData(request.userId);
    
    // Create user service and process
    const userService = new UserService();
    const result = await userService.createUser({
      name: validatedInput as string,
      email: (userData as { email: string }).email
    });
    
    logger.info('Request processed successfully', { result });
    return result;
    
  } catch (error) {
    logger.error('Failed to process user request', { 
      error: error instanceof Error ? error.message : String(error),
      requestId: request.id 
    });
    throw error;
  }
});

// Example 6: Performance monitoring
export const measurePerformance = traceFn('measurePerformance', async (...args: unknown[]) => {
  const operation = args[0] as () => Promise<unknown>;
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    logger.info('Operation completed', { duration, success: true });
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Operation failed', { duration, success: false, error });
    throw error;
  }
});

// Usage example
export async function runLoggingDemo(): Promise<void> {
  logger.info('🚀 Starting logging demo');
  
  try {
    // Basic logging
    basicLoggingExample();
    
    // Async function tracing
    const userData = await loadUserData('user_123');
    logger.info('User data loaded', { userData });
    
    // Sync function tracing
    const validatedInput = validateUserInput('John Doe');
    logger.info('Input validated', { validatedInput });
    
    // Class method tracing
    const userService = new UserService();
    const newUser = await userService.createUser({
      name: 'Jane Smith',
      email: 'jane@example.com'
    });
    logger.info('New user created', { newUser });
    
    // Performance monitoring
    await measurePerformance(async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return 'Operation completed';
    });
    
    logger.info('✅ Logging demo completed successfully');
    
  } catch (error) {
    logger.error('❌ Logging demo failed', { error });
  }
} 