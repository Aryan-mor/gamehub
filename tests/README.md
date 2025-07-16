# GameHub Bot Testing Framework

This directory contains comprehensive tests for the GameHub Telegram bot functionality.

## 🏗️ Test Structure

```
tests/
├── setup.ts                 # Global test configuration and mocks
├── utils/
│   └── testHelpers.ts       # Common test utilities and mock factories
├── unit/                    # Unit tests for individual functions
│   ├── coinService.test.ts  # Coin management functionality
│   ├── gameService.test.ts  # Game and sponsor management
│   └── sponsorManagement.test.ts # Sponsor verification logic
├── integration/             # Integration tests for bot commands
│   └── botCommands.test.ts  # Bot command handling
└── mocks/                   # Mock data and fixtures
```

## 🚀 Getting Started

### Running Tests

```bash
# Run tests in watch mode (development)
yarn test

# Run tests with UI
yarn test:ui

# Run tests once
yarn test:run

# Run tests with coverage report
yarn test:coverage
```

### Test Scripts

- `yarn test` - Start Vitest in watch mode
- `yarn test:ui` - Open Vitest UI for interactive testing
- `yarn test:run` - Run all tests once
- `yarn test:coverage` - Generate coverage report

## 📋 Test Categories

### 1. Unit Tests (`tests/unit/`)

**Purpose**: Test individual functions and modules in isolation.

**Coverage**:

- ✅ Coin service operations (add, deduct, check balance)
- ✅ Game service functions (sponsor management)
- ✅ User statistics and data management
- ✅ Firebase database operations

**Example**:

```typescript
describe("Coin Service", () => {
  it("should add coins to user balance", async () => {
    // Test coin addition logic
  });
});
```

### 2. Integration Tests (`tests/integration/`)

**Purpose**: Test how different modules work together.

**Coverage**:

- ✅ Bot command handling
- ✅ Callback query processing
- ✅ Sponsor join verification flow
- ✅ Admin command functionality

**Example**:

```typescript
describe("Bot Commands Integration", () => {
  it("should handle /start command", async () => {
    // Test complete command flow
  });
});
```

### 3. Mock Utilities (`tests/utils/`)

**Purpose**: Provide reusable test helpers and mock data.

**Features**:

- Mock Telegram bot instances
- Mock message and callback query factories
- Firebase data mocks
- Test data generators

## 🧪 Testing Best Practices

### 1. Test Structure (AAA Pattern)

```typescript
describe("Feature Name", () => {
  it("should do something specific", async () => {
    // Arrange - Set up test data and mocks
    const mockData = createMockData();

    // Act - Execute the function being tested
    const result = await functionUnderTest(mockData);

    // Assert - Verify the expected outcome
    expect(result).toBe(expectedValue);
  });
});
```

### 2. Mocking External Dependencies

```typescript
// Mock Firebase
vi.mock("firebase/database", () => ({
  ref: vi.fn(),
  set: vi.fn(),
  get: vi.fn(),
}));

// Mock Telegram Bot
vi.mock("node-telegram-bot-api", () => ({
  default: vi.fn().mockImplementation(() => ({
    sendMessage: vi.fn(),
    answerCallbackQuery: vi.fn(),
  })),
}));
```

### 3. Test Data Management

```typescript
// Use factory functions for consistent test data
const createMockMessage = (overrides = {}) => ({
  message_id: 1,
  from: { id: 123456789, first_name: "Test User" },
  chat: { id: 123456789, type: "private" },
  text: "/start",
  ...overrides,
});
```

## 🔧 Configuration

### Vitest Configuration (`vitest.config.ts`)

- **Environment**: Node.js
- **Coverage**: V8 provider with HTML, JSON, and text reports
- **Setup**: Global test configuration in `tests/setup.ts`
- **Aliases**: `@` points to `src/` directory

### Global Setup (`tests/setup.ts`)

- Environment variable mocking
- Firebase mocking
- Telegram Bot mocking
- Console output configuration

## 📊 Coverage Goals

**Target Coverage**: 80%+

**Key Areas**:

- ✅ Core business logic (coin management, game logic)
- ✅ Bot command handling
- ✅ Sponsor verification system
- ✅ Admin functionality
- ✅ Error handling and edge cases

## 🐛 Debugging Tests

### Common Issues

1. **Mock Not Working**

   ```typescript
   // Ensure mocks are cleared between tests
   beforeEach(() => {
     vi.clearAllMocks();
   });
   ```

2. **Async Test Failures**

   ```typescript
   // Use proper async/await
   it("should handle async operation", async () => {
     const result = await asyncFunction();
     expect(result).toBe(expected);
   });
   ```

3. **Firebase Mock Issues**
   ```typescript
   // Mock Firebase functions properly
   vi.mocked(ref).mockReturnValue(mockRef as unknown as ReturnType<typeof ref>);
   ```

### Debug Mode

```bash
# Run specific test file
yarn test coinService.test.ts

# Run tests with verbose output
yarn test --reporter=verbose

# Debug specific test
yarn test --run --reporter=verbose coinService.test.ts
```

## 📝 Adding New Tests

### 1. Create Test File

```bash
# For unit tests
touch tests/unit/newFeature.test.ts

# For integration tests
touch tests/integration/newFeature.test.ts
```

### 2. Follow Naming Convention

- Test files: `*.test.ts` or `*.spec.ts`
- Test suites: `describe('Feature Name', () => {})`
- Test cases: `it('should do something', () => {})`

### 3. Import Required Dependencies

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockBot } from "../utils/testHelpers";
```

### 4. Mock External Dependencies

```typescript
vi.mock("../../src/lib/externalModule", () => ({
  functionName: vi.fn(),
}));
```

## 🚀 Continuous Integration

Tests are automatically run:

- On every pull request
- Before deployment
- During development with watch mode

### CI Pipeline

```yaml
# Example GitHub Actions
- name: Run Tests
  run: yarn test:run

- name: Generate Coverage
  run: yarn test:coverage
```

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://vitest.dev/guide/best-practices.html)
- [Mocking Strategies](https://vitest.dev/guide/mocking.html)

---

**Note**: Always run tests before committing changes to ensure code quality and prevent regressions.
