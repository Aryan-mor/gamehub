

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
    private: { text: 'poker.form.option.private', value: true },
    public: { text: 'poker.form.option.public', value: false }
  },
  
  maxPlayers: {
    maxPlayers2: { text: 'poker.form.option.players2', value: 2 },
    maxPlayers4: { text: 'poker.form.option.players4', value: 4 },
    maxPlayers6: { text: 'poker.form.option.players6', value: 6 },
    maxPlayers8: { text: 'poker.form.option.players8', value: 8 }
  },
  
  smallBlind: {
    smallBlind50: { text: 'poker.form.option.sb50', value: 50 },
    smallBlind100: { text: 'poker.form.option.sb100', value: 100 },
    smallBlind200: { text: 'poker.form.option.sb200', value: 200 },
    smallBlind500: { text: 'poker.form.option.sb500', value: 500 }
  },
  
  turnTimeout: {
    timeout60: { text: 'poker.form.option.t60', value: 60 },
    timeout120: { text: 'poker.form.option.t120', value: 120 },
    timeout300: { text: 'poker.form.option.t300', value: 300 },
    timeout600: { text: 'poker.form.option.t600', value: 600 }
  }
};

// Action buttons
export const actionButtons = {
  confirmCreate: { text: 'poker.form.action.confirm', action: 'confirmCreate' },
  editForm: { text: 'poker.form.action.edit', action: 'editForm' },
  back: { text: 'poker.form.action.back', action: 'back' },
  backToMenu: { text: 'poker.room.buttons.backToMenu', action: 'backToMenu' }
}; 