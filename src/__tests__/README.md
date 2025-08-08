# 🧪 GameHub Tests

## 📋 Overview

This directory contains comprehensive tests for the GameHub bot functionality.

## 🎯 Test Categories

### 1. **Router Tests** (`router.test.ts`)
Tests for the smart router and compact router systems:
- Compact router registration and dispatch
- Smart router pattern matching
- Poker action code validation
- Callback data generation and parsing

### 2. **i18n Tests** (`i18n.test.ts`)
Tests for internationalization functionality:
- Translation key validation
- Language switching (English/Persian)
- Variable interpolation
- Pluralization handling
- Flat translation structure validation

### 3. **Type Guards Tests** (`typeGuards.test.ts`)
Tests for type safety and validation:
- Room ID validation
- Player ID validation
- Game ID validation
- Edge case handling

## 🚀 Running Tests

### All Tests
```bash
pnpm test:run
```

### Specific Test File
```bash
pnpm test:run src/__tests__/router.test.ts
```

### With Coverage
```bash
pnpm test:coverage
```

### With UI
```bash
pnpm test:ui
```

### Watch Mode
```bash
pnpm test
```

## 📊 Test Coverage

The tests cover:
- ✅ Router functionality (Compact & Smart)
- ✅ i18n translation system
- ✅ Type guards and validation
- ✅ Error handling
- ✅ Edge cases

## 🧪 Writing New Tests

### Router Test Example
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
// compact-router removed; use smart-router APIs if needed

describe('My Feature Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle my feature', async () => {
    const mockHandler = vi.fn();
    const mockContext = { /* ... */ };

    register('my_action', mockHandler, 'My Action');
    await dispatch('my_action', mockContext, { param: 'value' });

    expect(mockHandler).toHaveBeenCalledWith(mockContext, { param: 'value' });
  });
});
```

### i18n Test Example
```typescript
import { describe, it, expect } from 'vitest';
import { i18n } from '@/modules/core/i18n';

describe('My i18n Tests', () => {
  it('should translate correctly', () => {
    const result = i18n.t('my.translation.key');
    expect(result).toBe('Expected Translation');
  });
});
```

## 🔧 Test Configuration

Tests use **Vitest** with the following configuration:
- **Environment**: Node.js
- **Coverage**: V8 provider
- **Aliases**: `@/` points to `src/`
- **Globals**: Available for convenience

## 📝 Best Practices

1. **Use descriptive test names** that explain what is being tested
2. **Test both success and failure cases**
3. **Mock external dependencies** to isolate unit tests
4. **Use beforeEach/afterEach** for setup and cleanup
5. **Test edge cases** and error conditions
6. **Keep tests focused** on a single piece of functionality

## 🐛 Debugging Tests

### Run with Verbose Output
```bash
pnpm test:ci
```

### Debug Specific Test
```bash
pnpm test:run --reporter=verbose src/__tests__/router.test.ts
```

### Check Coverage
```bash
pnpm test:coverage
```

## 📈 Continuous Integration

Tests are automatically run:
- On every commit (pre-push hook)
- In CI/CD pipeline
- Before deployment

## 🎯 Test Categories

### Unit Tests
- Individual function testing
- Mocked dependencies
- Fast execution

### Integration Tests
- Component interaction testing
- Real dependencies where needed
- Moderate execution time

### E2E Tests
- Full system testing
- Real bot interaction
- Slower execution

## 🔍 Test Utilities

### Mocking
```typescript
import { vi } from 'vitest';

const mockHandler = vi.fn();
vi.mock('@/modules/core/logger');
```

### Async Testing
```typescript
it('should handle async operation', async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});
```

### Error Testing
```typescript
it('should throw error for invalid input', () => {
  expect(() => validateInput('invalid')).toThrow();
});
```

---

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://vitest.dev/guide/best-practices.html)
- [Mocking Guide](https://vitest.dev/guide/mocking.html)
