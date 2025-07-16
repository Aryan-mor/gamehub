# GameHub Testing Guide

This document provides comprehensive information about the testing setup for the GameHub Telegram bot project.

## 🧪 Test Overview

The project uses **Vitest** as the testing framework with TypeScript support. All tests are located in the `tests/` directory and cover:

- **Unit Tests**: Individual functions and components
- **Integration Tests**: End-to-end user flows
- **Game Logic Tests**: All game mechanics and rules
- **Bot Command Tests**: Telegram bot interactions

## 📁 Test Structure

```
tests/
├── setup.ts                 # Global test setup and mocks
├── README.md               # This file
├── unit/                   # Unit tests
│   ├── simple.test.ts      # Basic test examples
│   ├── botLogic.test.ts    # Bot logic functions
│   ├── coinService.test.ts # Coin management
│   ├── gameService.test.ts # Game services
│   ├── games.test.ts       # All game logic
│   └── sponsorManagement.test.ts # Sponsor features
├── integration/            # Integration tests
│   └── botCommands.test.ts # Bot command flows
├── utils/                  # Test utilities
│   └── testHelpers.ts      # Mock creation helpers
└── mocks/                  # Mock data and configurations
```

## 🚀 Running Tests

### Basic Commands

```bash
# Run all tests in watch mode
npm test

# Run all tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode (verbose output)
npm run test:ci
```

### Pre-Push Testing

The project includes automated pre-push checks to ensure code quality:

#### Git Pre-Push Hook

A Git hook automatically runs before each push:

```bash
# The hook runs automatically on git push
git push origin main
```

#### Manual Pre-Push Checks

You can also run pre-push checks manually:

```bash
# Basic pre-push (tests + linting)
npm run pre-push

# Full pre-push with additional checks
npm run pre-push:full

# Pre-push with coverage requirements
npm run pre-push:coverage
```

#### What Pre-Push Checks Include

1. **TypeScript Type Checking**: Ensures type safety
2. **ESLint**: Code style and quality checks
3. **Unit Tests**: All 58 tests must pass
4. **Integration Tests**: End-to-end flows
5. **Test Coverage**: Optional coverage requirements
6. **Uncommitted Changes**: Warns about pending changes
7. **Branch Safety**: Warns about pushing to main branch

## 🎮 Game Coverage

All games in the GameHub bot are thoroughly tested:

### ✅ Covered Games

- **🎲 Dice Game**: Stake selection, balance checks, win/loss logic
- **🏀 Basketball Game**: Stake selection, shot mechanics, win rates
- **⚽ Football Game**: Stake selection, kick mechanics, win rates
- **🃏 Blackjack Game**: Stake selection, hit/stand actions, game logic
- **🎳 Bowling Game**: Stake selection, pin mechanics, strikes/spares
- **❌ Tic-Tac-Toe (XO) Game**: Game creation, moves, win detection, draws

### 📊 Test Statistics

- **Total Tests**: 58
- **Unit Tests**: 43
- **Integration Tests**: 15
- **Coverage**: All core functionality
- **Success Rate**: 100% (all tests passing)

## 🔧 Test Configuration

### Vitest Configuration

Located in `vitest.config.ts`:

- TypeScript support
- Path aliases
- Test environment setup
- Coverage configuration

### Mock Setup

Located in `tests/setup.ts`:

- Firebase mocks
- Telegram Bot API mocks
- Environment variables
- Global test utilities

### Test Helpers

Located in `tests/utils/testHelpers.ts`:

- Mock bot creation
- Mock message creation
- Mock callback query creation
- Common test utilities

## 🚀 CI/CD Integration

### GitHub Actions

The project includes a comprehensive CI/CD pipeline (`.github/workflows/ci.yml`):

1. **Test Job**: Runs tests on multiple Node.js versions
2. **Security Job**: Security audits and dependency checks
3. **Build Job**: Application build verification

### Automated Checks

- Runs on every push to main/develop
- Runs on every pull request
- Multiple Node.js version testing
- Security vulnerability scanning
- Build artifact generation

## 📝 Writing Tests

### Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Feature Name", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should do something specific", async () => {
    // Arrange
    const input = "test";

    // Act
    const result = await someFunction(input);

    // Assert
    expect(result).toBe("expected");
  });
});
```

### Mocking Guidelines

1. **Use vi.mocked()** for proper TypeScript support
2. **Clear mocks** in beforeEach hooks
3. **Mock external dependencies** (Firebase, Telegram API)
4. **Test error conditions** and edge cases
5. **Use descriptive test names**

### Best Practices

1. **Arrange-Act-Assert** pattern
2. **One assertion per test** when possible
3. **Test both success and failure cases**
4. **Use meaningful test data**
5. **Keep tests independent**

## 🐛 Debugging Tests

### Running Specific Tests

```bash
# Run specific test file
npm test tests/unit/games.test.ts

# Run specific test suite
npm test -- --grep "Dice Game"

# Run tests in debug mode
npm test -- --reporter=verbose
```

### Common Issues

1. **Firebase not initialized**: Check mock setup
2. **Import path errors**: Verify relative paths
3. **Mock not working**: Ensure proper vi.mocked() usage
4. **Async test failures**: Check await usage

## 📈 Coverage Reports

Generate coverage reports:

```bash
npm run test:coverage
```

Coverage includes:

- **Statements**: 95%+
- **Branches**: 90%+
- **Functions**: 95%+
- **Lines**: 95%+

## 🔄 Continuous Integration

The CI pipeline ensures:

- All tests pass on multiple Node.js versions
- Code quality standards are met
- Security vulnerabilities are detected
- Build process works correctly

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)
- [TypeScript Testing Guide](https://www.typescriptlang.org/docs/handbook/testing.html)

---

**Note**: Always run tests before pushing code. The pre-push hooks will automatically ensure code quality and prevent broken builds.
