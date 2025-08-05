# Logging System Documentation

## Overview
This project uses Pino for structured logging with DEBUG support and comprehensive function tracing capabilities.

## Features

### 🎯 Core Features
- **Pino-based structured logging** with pretty formatting
- **DEBUG mode support** via `DEBUG=true` environment variable
- **Function tracing** for async and sync functions
- **Class method decorators** for automatic tracing
- **Performance monitoring** with timing information
- **Telegram bot middleware** for request logging

### 🔧 Configuration

#### Environment Variables
```bash
# Enable debug mode (shows all debug logs)
DEBUG=true

# Set log level (when DEBUG is not set)
LOG_LEVEL=info|debug|warn|error|silent
```

#### Default Behavior
- When `DEBUG=true`: Shows all debug logs with detailed information
- When `DEBUG=false`: Shows info level and above
- When `LOG_LEVEL=silent`: Disables all logging

## Usage Examples

### 1. Basic Logging
```typescript
import { logger } from '@/modules/core/logger';

logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');
```

### 2. Function Tracing
```typescript
import { traceFn } from '@/utils/traceFn';

// Async function tracing
const loadUser = traceFn('loadUser', async (id: number) => {
  return await db.users.find(id);
});

// Sync function tracing
const validateInput = traceFnSync('validateInput', (input: string) => {
  return input.length > 0;
});
```

### 3. Class Method Tracing
```typescript
import { traceMethod } from '@/utils/traceFn';

class UserService {
  @traceMethod
  async getUser(id: string) {
    return await db.users.find(id);
  }
  
  @traceMethod
  async createUser(data: any) {
    return await db.users.create(data);
  }
}
```

### 4. Error Handling
```typescript
import { logger } from '@/modules/core/logger';

try {
  // Your code here
} catch (error) {
  logger.error('Operation failed', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context: { userId, operation }
  });
  throw error;
}
```

### 5. Performance Monitoring
```typescript
import { traceFn } from '@/utils/traceFn';

const measurePerformance = traceFn('measurePerformance', async (operation: () => Promise<any>) => {
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
```

## Bot Integration

### Automatic Request Logging
The bot automatically logs all incoming requests through the `loggingMiddleware`:

```typescript
// In src/bot.ts
import { loggingMiddleware } from '@/modules/core/logger';

const bot = new Bot(token);
bot.use(loggingMiddleware);
```

This middleware provides:
- Request timing information
- User and chat ID logging
- Error tracking
- Performance metrics

### Log Output Example
```
🔍 loadUser called {"args":["123"]}
📱 Telegram update: message {"userId":"123","chatId":"456"}
✅ loadUser returned {"result":{"id":"123","name":"John"}}
✅ Request completed in 150ms {"userId":"123","chatId":"456","duration":150}
```

## Best Practices

### 1. Use Structured Logging
```typescript
// ✅ Good
logger.info('User created', { userId: '123', name: 'John' });

// ❌ Bad
logger.info(`User created: ${userId} - ${name}`);
```

### 2. Include Context
```typescript
// ✅ Good
logger.error('Database connection failed', {
  error: error.message,
  userId: context.userId,
  operation: 'createUser'
});

// ❌ Bad
logger.error('Database connection failed');
```

### 3. Use traceFn for Complex Operations
```typescript
// ✅ Good
const processUser = traceFn('processUser', async (userData) => {
  // Complex logic here
});

// ❌ Bad
const processUser = async (userData) => {
  // Complex logic without tracing
};
```

### 4. Handle Errors Properly
```typescript
// ✅ Good
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  });
  throw error; // Re-throw to maintain error flow
}
```

## Debug Mode

### Enabling Debug Mode
```bash
# Set environment variable
export DEBUG=true

# Or in .env file
DEBUG=true
```

### Debug Output Features
- All debug logs are shown
- Function entry/exit logging
- Argument and return value logging
- Performance timing
- Detailed error information

### Debug vs Production
```typescript
// Debug mode shows detailed information
logger.debug({ args, context }, 'Function called');

// Production mode shows only essential info
logger.info('Function completed', { result });
```

## Migration Guide

### From console.log
```typescript
// Old way
console.log('User created:', userId);

// New way
logger.info('User created', { userId });
```

### From console.error
```typescript
// Old way
console.error('Error:', error);

// New way
logger.error('Operation failed', {
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined
});
```

## Testing

### Running the Demo
```typescript
import { runLoggingDemo } from '@/utils/demos/logging-demo';

// Run with debug mode
DEBUG=true npm run bot

// Then call the demo function
await runLoggingDemo();
```

### Expected Output
```
🚀 Starting logging demo
🔍 loadUserData called {"args":["user_123"]}
✅ loadUserData returned {"result":{"id":"user_123","name":"John Doe"}}
🔍 validateUserInput called {"args":["John Doe"]}
✅ validateUserInput returned {"result":"John Doe"}
🔍 UserService.createUser called {"args":[{"name":"Jane Smith","email":"jane@example.com"}]}
✅ UserService.createUser returned {"result":{"id":"user_123","name":"Jane Smith","email":"jane@example.com","createdAt":"2024-01-01T00:00:00.000Z"}}
✅ Logging demo completed successfully
```

## Troubleshooting

### Common Issues

1. **No logs appearing**
   - Check if `DEBUG=true` is set
   - Verify `LOG_LEVEL` is not set to 'silent'
   - Ensure logger is properly imported

2. **Performance impact**
   - Debug mode has minimal overhead
   - Production mode is very fast
   - Use `LOG_LEVEL=silent` to disable completely

3. **Missing context**
   - Always include relevant context in log calls
   - Use structured logging with objects
   - Include user IDs and operation names

4. **Error logging issues**
   - Always check if error is Error instance
   - Include stack traces in debug mode
   - Re-throw errors to maintain flow 