import { MockUser } from './testBot';
import { UserId } from '@/utils/types';

// Predefined mock users for consistent testing
export const MOCK_USERS = {
  ALICE: {
    id: '123456789' as UserId,
    username: 'alice_johnson',
    first_name: 'Alice',
    last_name: 'Johnson',
    is_bot: false
  },
  
  BOB: {
    id: '987654321' as UserId,
    username: 'bob_smith',
    first_name: 'Bob',
    last_name: 'Smith',
    is_bot: false
  },
  
  CHARLIE: {
    id: '555666777' as UserId,
    username: 'charlie_brown',
    first_name: 'Charlie',
    last_name: 'Brown',
    is_bot: false
  },
  
  DIANA: {
    id: '111222333' as UserId,
    username: 'diana_prince',
    first_name: 'Diana',
    last_name: 'Prince',
    is_bot: false
  },
  
  EVE: {
    id: '444555666' as UserId,
    username: 'eve_wilson',
    first_name: 'Eve',
    last_name: 'Wilson',
    is_bot: false
  }
};

// Helper function to create a custom mock user
export function createMockUser(
  id: string,
  username: string,
  firstName: string,
  lastName: string
): MockUser {
  return {
    id: id as UserId,
    username,
    first_name: firstName,
    last_name: lastName,
    is_bot: false
  };
}

// Helper function to get user by name
export function getUserByName(name: string): MockUser | undefined {
  const userMap = {
    'alice': MOCK_USERS.ALICE,
    'bob': MOCK_USERS.BOB,
    'charlie': MOCK_USERS.CHARLIE,
    'diana': MOCK_USERS.DIANA,
    'eve': MOCK_USERS.EVE
  };
  
  return userMap[name.toLowerCase()];
}

// Helper function to get multiple users
export function getUsers(...names: string[]): MockUser[] {
  return names.map(name => getUserByName(name)).filter(Boolean) as MockUser[];
}

// Export all mock users for easy access
export { MOCK_USERS as USERS }; 