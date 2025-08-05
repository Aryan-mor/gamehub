/**
 * Generate keyboard for joining rooms
 */
export function generateJoinRoomKeyboard(): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  return {
    inline_keyboard: [
      [
        { text: '🔍 Find Rooms', callback_data: 'games.poker.room.list' },
        { text: '🏠 Create Room', callback_data: 'games.poker.room.create' }
      ],
      [
        { text: '🔙 Back', callback_data: 'games.poker.start' }
      ]
    ]
  };
}

/**
 * Generate error keyboard
 */
export function generateErrorKeyboard(): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  return {
    inline_keyboard: [
      [
        { text: '🔙 Back to Menu', callback_data: 'games.poker.start' }
      ]
    ]
  };
}

/**
 * Generate leave room keyboard
 */
export function generateLeaveRoomKeyboard(): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  return {
    inline_keyboard: [
      [
        { text: '🚪 Leave Room', callback_data: 'games.poker.room.leave' },
        { text: '🔙 Back', callback_data: 'games.poker.room.info' }
      ]
    ]
  };
} 