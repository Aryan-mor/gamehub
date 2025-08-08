/**
 * Button sets for room management - different room control options
 */
export const roomControls = {
  // Main menu buttons (2 buttons per row)
  mainMenu: [['createRoom', 'joinRoom'], ['listRooms', 'help'], ['backToMenu']],
  
  // Room management buttons (3 buttons per row)
  roomManagement: [['startGame', 'ready', 'notReady'], ['share', 'leaveRoom'], ['back']],
  
  // Room creation options (2 buttons per row)
  creation: [['createRoom', 'backToMenu']],
  
  // Room joining options (2 buttons per row)
  joining: [['joinRoom', 'listRooms'], ['backToMenu']],
  
  // Room control buttons (3 buttons per row)
  control: [['startGame', 'ready', 'notReady']],
  
  // Room exit options (2 buttons per row)
  exit: [['leaveRoom', 'back']]
}; 