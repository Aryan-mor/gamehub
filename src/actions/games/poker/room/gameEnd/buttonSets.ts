/**
 * Button sets for game end actions - different end game options
 */
export const gameEndOptions = {
  // Game end buttons (2 buttons per row)
  standard: [['playAgain', 'newGame'], ['viewStats', 'back']],
  
  // Play again options (2 buttons per row)
  playAgain: [['playAgain', 'newGame'], ['back']],
  
  // Game analysis options (2 buttons per row)
  analysis: [['viewStats', 'playAgain'], ['back']],
  
  // Quick restart options (2 buttons per row)
  quickRestart: [['playAgain', 'back']],
  
  // Full game options (2 buttons per row)
  full: [['playAgain', 'newGame'], ['viewStats', 'back']]
}; 