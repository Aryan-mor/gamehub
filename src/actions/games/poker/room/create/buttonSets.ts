

/**
 * Button sets for room creation form
 */

// Form step buttons
export const formStepButtons = {
  // Step 1: Room name input
  nameInput: [
    ['backToMenu']
  ],
  
  // Step 2: Privacy selection
  privacySelection: [
    ['private', 'public'],
    ['back']
  ],
  
  // Step 3: Max players selection
  maxPlayersSelection: [
    ['maxPlayers2', 'maxPlayers4'],
    ['maxPlayers6', 'maxPlayers8'],
    ['back']
  ],
  
  // Step 4: Small blind selection
  smallBlindSelection: [
    ['smallBlind50', 'smallBlind100'],
    ['smallBlind200', 'smallBlind500'],
    ['back']
  ],
  
  // Step 5: Turn timeout selection
  turnTimeoutSelection: [
    ['timeout60', 'timeout120'],
    ['timeout300', 'timeout600'],
    ['back']
  ],
  
  // Step 6: Confirmation
  confirmation: [
    ['confirmCreate', 'editForm'],
    ['back']
  ]
};

// Form field options
export const formOptions = {
  privacy: {
    private: { text: ctx.t('poker.room.info.type.private'), value: true },
    public: { text: ctx.t('poker.room.info.type.public'), value: false }
  },
  
  maxPlayers: {
    maxPlayers2: { text: '👥 ۲ نفر', value: 2 },
    maxPlayers4: { text: '👥 ۴ نفر', value: 4 },
    maxPlayers6: { text: '👥 ۶ نفر', value: 6 },
    maxPlayers8: { text: '👥 ۸ نفر', value: 8 }
  },
  
  smallBlind: {
    smallBlind50: { text: '💰 ۵۰', value: 50 },
    smallBlind100: { text: '💰 ۱۰۰', value: 100 },
    smallBlind200: { text: '💰 ۲۰۰', value: 200 },
    smallBlind500: { text: '💰 ۵۰۰', value: 500 }
  },
  
  turnTimeout: {
    timeout60: { text: '⏱️ ۶۰ ثانیه', value: 60 },
    timeout120: { text: '⏱️ ۲ دقیقه', value: 120 },
    timeout300: { text: '⏱️ ۵ دقیقه', value: 300 },
    timeout600: { text: '⏱️ ۱۰ دقیقه', value: 600 }
  }
};

// Action buttons
export const actionButtons = {
  confirmCreate: { text: '✅ ساخت روم', action: 'confirmCreate' },
  editForm: { text: '✏️ ویرایش', action: 'editForm' },
  back: { text: '🔙 بازگشت', action: 'back' },
  backToMenu: { text: ctx.t('poker.room.buttons.backToMenu'), action: 'backToMenu' }
}; 