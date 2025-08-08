/**
 * Button sets for game actions - different game action combinations
 */
export const gameActions = {
  // Standard game actions (2 buttons per row)
  standard: [['call', 'fold'], ['raise', 'check']],
  
  // Game actions with all-in option (2 buttons per row)
  withAllIn: [['call', 'fold'], ['raise', 'allIn'], ['check']],
  
  // Conservative actions (2 buttons per row)
  conservative: [['call', 'fold'], ['check']],
  
  // Aggressive actions (2 buttons per row)
  aggressive: [['call', 'fold'], ['raise', 'allIn']],
  
  // Check or fold only (2 buttons per row)
  checkOrFold: [['check', 'fold']],
  
  // Call or fold only (2 buttons per row)
  callOrFold: [['call', 'fold']]
}; 