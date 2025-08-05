# 🧪 Telegram Bot Scenario Testing

## 📋 Overview

This directory contains comprehensive integration tests that simulate complete Telegram bot interactions with multiple users. Each test file represents a specific user scenario and verifies the bot's behavior end-to-end.

## 🎯 Test Strategy

### Core Principles
- **Isolated Scenarios**: Each test simulates a complete user interaction flow
- **Real Logic**: Uses actual bot handlers and middleware
- **Multi-User Simulation**: Tests interactions between 2+ users
- **State Verification**: Validates both bot responses and database state changes
- **Fast Execution**: Runs in milliseconds without external dependencies

### Test Structure
```
tests/scenarios/
├── README.md                    # This file
├── utils/                       # Test utilities and helpers
│   ├── testBot.ts              # Bot instance for testing
│   ├── mockUsers.ts            # Mock user data and helpers
│   ├── scenarioRunner.ts       # Scenario execution utilities
│   └── assertions.ts           # Custom assertion helpers
├── create-and-leave-room.test.ts
├── create-join-start-room.test.ts
├── create-join-leave-room.test.ts
├── join-without-room.test.ts
└── join-new-room-when-already-in-one-room.test.ts
```

## 🧰 Test Utilities

### Mock Users
- **User A**: Primary user for room creation and management
- **User B**: Secondary user for joining and interactions
- **User C**: Additional user for complex scenarios

### Bot Instance
- In-memory bot with mocked Telegram API
- Real handlers and middleware
- Database operations mocked or isolated
- Logging controlled via DEBUG environment variable

### Scenario Runner
- Executes user actions in sequence
- Validates bot responses
- Checks database state changes
- Handles timing and async operations

## 🎮 Test Scenarios

### 1. Create and Leave Room
**File**: `create-and-leave-room.test.ts`
**Description**: User creates a room and immediately leaves it
**Verifications**:
- Room is created successfully
- Room is deleted when user leaves
- Bot sends appropriate messages

### 2. Create, Join, and Start Room
**File**: `create-join-start-room.test.ts`
**Description**: Complete game setup and start flow
**Verifications**:
- Room creation with proper settings
- User joining via shared link
- Game state transitions correctly
- All users receive notifications

### 3. Create, Join, and Leave Room
**File**: `create-join-leave-room.test.ts`
**Description**: User joins then leaves before game starts
**Verifications**:
- Start button behavior when users leave
- Room state management
- Error handling for insufficient players

### 4. Join Invalid Room
**File**: `join-without-room.test.ts`
**Description**: Attempt to join non-existent or expired room
**Verifications**:
- Proper error messages
- No database state changes
- User experience handling

### 5. Room Conflict Resolution
**File**: `join-new-room-when-already-in-one-room.test.ts`
**Description**: User tries to join new room while already in one
**Verifications**:
- Conflict resolution UI
- Room switching logic
- State cleanup

## 🚀 Running Tests

### Development
```bash
# Run all scenario tests
pnpm test:scenarios

# Run specific scenario
pnpm test:scenarios create-and-leave-room

# Run with debug logging
DEBUG=true pnpm test:scenarios

# Run with coverage
pnpm test:scenarios:coverage
```

### CI/CD
```bash
# Run in CI mode (no UI, verbose output)
pnpm test:scenarios:ci

# Pre-push validation
pnpm pre-push:scenarios
```

## 📊 Test Coverage

### Required Coverage Areas
- [ ] Room creation and management
- [ ] User joining and leaving
- [ ] Game state transitions
- [ ] Error handling and edge cases
- [ ] Multi-user interactions
- [ ] Database state consistency
- [ ] Bot response validation

### Coverage Goals
- **Line Coverage**: >90%
- **Branch Coverage**: >85%
- **Function Coverage**: >95%

## 🔧 Configuration

### Environment Variables
```bash
# Test Configuration
DEBUG=false                    # Enable/disable debug logging
TEST_DATABASE_URL=memory://   # Use in-memory database for tests
TEST_TIMEOUT=5000             # Test timeout in milliseconds
TEST_RETRIES=3                # Number of retries for flaky tests
```

### Test Data
- Mock users with realistic data
- Room configurations for different scenarios
- Game states for various test cases
- Error conditions and edge cases

## 📝 Writing New Tests

### Template Structure
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestBot, createMockUsers } from './utils/testBot';
import { runScenario } from './utils/scenarioRunner';
import { assertBotResponse, assertDatabaseState } from './utils/assertions';

describe('Scenario: [Scenario Name]', () => {
  let bot: TestBot;
  let users: MockUsers;

  beforeEach(async () => {
    bot = await createTestBot();
    users = createMockUsers();
  });

  afterEach(async () => {
    await bot.cleanup();
  });

  it('should handle [specific behavior]', async () => {
    const scenario = [
      // Define user actions here
    ];

    const results = await runScenario(bot, users, scenario);

    // Assert expected outcomes
    assertBotResponse(results, expectedResponse);
    assertDatabaseState(results, expectedState);
  });
});
```

### Best Practices
1. **Descriptive Names**: Use clear, descriptive test names
2. **Isolation**: Each test should be independent
3. **Realistic Data**: Use realistic user data and room configurations
4. **Edge Cases**: Test error conditions and boundary cases
5. **Performance**: Keep tests fast and efficient
6. **Documentation**: Document complex scenarios and business logic

## 🐛 Debugging Tests

### Common Issues
- **Timing Issues**: Use proper async/await and timeouts
- **State Pollution**: Clean up between tests
- **Mock Data**: Ensure mock data is realistic and complete
- **Database State**: Verify database operations are properly mocked

### Debug Tools
- **DEBUG=true**: Enable detailed logging
- **Test UI**: Use `pnpm test:scenarios:ui` for interactive debugging
- **Coverage Reports**: Analyze coverage to identify gaps
- **Slow Tests**: Identify and optimize slow-running tests

## 📈 Continuous Improvement

### Metrics to Track
- Test execution time
- Coverage percentages
- Flaky test frequency
- Bug detection rate

### Regular Reviews
- Monthly test strategy review
- Quarterly coverage analysis
- Continuous integration feedback
- User feedback integration

## 🔗 Related Documentation
- [Bot Architecture](../src/README.md)
- [Router System](../src/modules/core/smart-router.ts)
- [Handler Pattern](../src/modules/core/handler.ts)
- [Poker Game Logic](../src/actions/games/poker/README.md) 