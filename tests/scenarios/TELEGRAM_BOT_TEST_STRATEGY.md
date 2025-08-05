# 🧪 Telegram Bot Test Strategy Implementation

## 📋 Overview

This document outlines the comprehensive test strategy for the GameHub Telegram bot, providing a framework for testing complete user interaction scenarios without requiring real Telegram API calls.

## 🎯 Test Strategy Goals

### Core Principles
- **Isolated Scenarios**: Each test simulates a complete user interaction flow
- **Real Logic**: Uses actual bot handlers and middleware when possible
- **Multi-User Simulation**: Tests interactions between 2+ users
- **State Verification**: Validates both bot responses and database state changes
- **Fast Execution**: Runs in milliseconds without external dependencies

## 🏗️ Architecture

### Test Structure
```
tests/scenarios/
├── README.md                           # Strategy overview
├── TELEGRAM_BOT_TEST_STRATEGY.md      # This file
├── utils/                              # Test utilities
│   ├── testBot.ts                     # Bot instance for testing
│   ├── mockUsers.ts                   # Mock user data
│   ├── scenarioRunner.ts              # Scenario execution
│   └── assertions.ts                  # Custom assertions
├── simple-test.test.ts                # Basic framework test
├── basic-framework.test.ts            # Framework validation
├── create-and-leave-room.test.ts      # Scenario 1
├── create-join-start-room.test.ts     # Scenario 2
├── create-join-leave-room.test.ts     # Scenario 3
├── join-without-room.test.ts          # Scenario 4
└── join-new-room-when-already-in-one-room.test.ts # Scenario 5
```

## 🧰 Test Framework Components

### 1. Test Bot (`utils/testBot.ts`)
- **Purpose**: Provides an in-memory bot instance for testing
- **Features**:
  - Mocked Telegram API responses
  - Real bot handlers and middleware
  - Message and response tracking
  - State management for rooms and games

```typescript
// Example usage
const bot = await createTestBot();
const users = createMockUsers();
const userA = users.get('userA')!;

// Send a message
await bot.sendMessage(userA, '/start');

// Send a callback
await bot.sendCallback(userA, 'gprc');

// Get responses
const responses = bot.getResponsesForUser(userA);
```

### 2. Scenario Runner (`utils/scenarioRunner.ts`)
- **Purpose**: Executes user actions in sequence and validates results
- **Features**:
  - Step-by-step scenario execution
  - Response validation
  - State verification
  - Error handling and reporting

```typescript
// Example scenario
const scenario = [
  {
    action: createMessageAction(userA, '/start', 'User starts bot'),
    expectedResponse: expectContains(['Welcome'])
  },
  {
    action: createCallbackAction(userA, 'gprc', undefined, 'Create room'),
    expectedResponse: expectContains(['Create Room'])
  }
];

const results = await runScenario(bot, users, scenario);
```

### 3. Assertions (`utils/assertions.ts`)
- **Purpose**: Custom assertion helpers for bot responses and state
- **Features**:
  - Bot response validation
  - Database state verification
  - User message validation
  - Room and game state checks

```typescript
// Example assertions
assertScenarioSuccess(results);
assertBotResponse(results, { text: 'Welcome to GameHub' });
assertDatabaseState(results, { roomExists: true });
```

## 🎮 Test Scenarios

### Scenario 1: Create and Leave Room
**File**: `create-and-leave-room.test.ts`
**Description**: User creates a room and immediately leaves it
**Test Cases**:
- Basic room creation and leaving
- Room creation with default settings
- Multiple create-leave cycles
- Empty room cleanup

### Scenario 2: Create, Join, and Start Room
**File**: `create-join-start-room.test.ts`
**Description**: Complete game setup and start flow
**Test Cases**:
- Full game setup with 3 players
- Room joining with different user scenarios
- Room joining when room is full
- Game start with insufficient players

### Scenario 3: Create, Join, and Leave Room
**File**: `create-join-leave-room.test.ts`
**Description**: User joins then leaves before game starts
**Test Cases**:
- User joins and leaves before game starts
- Start button behavior when users leave
- Room state management after user leaves

### Scenario 4: Join Invalid Room
**File**: `join-without-room.test.ts`
**Description**: Attempt to join non-existent or expired room
**Test Cases**:
- Join invalid room ID
- Join expired room
- Join room with wrong permissions

### Scenario 5: Room Conflict Resolution
**File**: `join-new-room-when-already-in-one-room.test.ts`
**Description**: User tries to join new room while already in one
**Test Cases**:
- Conflict resolution UI
- Room switching logic
- State cleanup

## 🚀 Running Tests

### Development Commands
```bash
# Run all scenario tests
pnpm test:scenarios

# Run specific scenario
pnpm test:scenarios create-and-leave-room

# Run with debug logging
DEBUG=true pnpm test:scenarios

# Run with coverage
pnpm test:scenarios:coverage

# Run with UI
pnpm test:scenarios:ui
```

### CI/CD Commands
```bash
# Run in CI mode
pnpm test:scenarios:ci

# Pre-push validation
pnpm pre-push:scenarios
```

## 📝 Writing New Tests

### Template Structure
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestBot, createMockUsers } from './utils/testBot';
import { runScenario, createMessageAction, createCallbackAction } from './utils/scenarioRunner';
import { assertScenarioSuccess } from './utils/assertions';

describe('Scenario: [Scenario Name]', () => {
  let bot: any;
  let users: Map<string, MockUser>;
  let userA: MockUser;
  let userB: MockUser;

  beforeEach(async () => {
    bot = await createTestBot();
    users = createMockUsers();
    userA = users.get('userA')!;
    userB = users.get('userB')!;
  });

  afterEach(async () => {
    await bot.cleanup();
  });

  it('should handle [specific behavior]', async () => {
    const scenario = [
      {
        action: createMessageAction(userA, '/start', 'User starts bot'),
        expectedResponse: expectContains(['Welcome'])
      },
      {
        action: createCallbackAction(userA, 'gprc', undefined, 'Create room'),
        expectedResponse: expectContains(['Create Room'])
      }
    ];

    const results = await runScenario(bot, users, scenario);
    assertScenarioSuccess(results);
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

## 🔧 Configuration

### Environment Variables
```bash
# Test Configuration
DEBUG=false                    # Enable/disable debug logging
TEST_DATABASE_URL=memory://   # Use in-memory database for tests
TEST_TIMEOUT=5000             # Test timeout in milliseconds
TEST_RETRIES=3                # Number of retries for flaky tests
```

### Mock Data
- **Users**: Predefined mock users (Alice, Bob, Charlie, etc.)
- **Rooms**: Various room configurations for different scenarios
- **Games**: Game states for various test cases
- **Error Conditions**: Edge cases and error scenarios

## 📊 Test Coverage

### Required Coverage Areas
- [x] Room creation and management
- [x] User joining and leaving
- [x] Game state transitions
- [x] Error handling and edge cases
- [x] Multi-user interactions
- [x] Database state consistency
- [x] Bot response validation

### Coverage Goals
- **Line Coverage**: >90%
- **Branch Coverage**: >85%
- **Function Coverage**: >95%

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

## 🔄 Integration with Existing Tests

### Current Test Structure
```
src/actions/games/poker/__tests__/
├── compact-codes.test.ts     # Unit tests for compact codes
```

### Integration Points
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test complete workflows and scenarios
- **End-to-End Tests**: Test full user journeys

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

## 🎯 Next Steps

### Immediate Actions
1. **Fix Framework Issues**: Resolve current test framework problems
2. **Add Real Bot Logic**: Integrate actual bot handlers
3. **Database Mocking**: Implement proper database state management
4. **Response Validation**: Add real response validation logic

### Future Enhancements
1. **WebSocket Testing**: Add real-time communication testing
2. **Performance Testing**: Add load and stress testing
3. **Security Testing**: Add security vulnerability testing
4. **Accessibility Testing**: Add accessibility compliance testing

## 🔗 Related Documentation
- [Bot Architecture](../src/README.md)
- [Router System](../src/modules/core/smart-router.ts)
- [Handler Pattern](../src/modules/core/handler.ts)
- [Poker Game Logic](../src/actions/games/poker/README.md)
- [Test Summary](../../TEST_SUMMARY.md)

## 📞 Support

For questions or issues with the test framework:
1. Check the test logs for detailed error information
2. Review the test documentation and examples
3. Consult the bot architecture documentation
4. Create an issue with detailed reproduction steps 