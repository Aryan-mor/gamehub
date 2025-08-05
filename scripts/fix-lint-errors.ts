import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Function to recursively find all TypeScript files
function findTsFiles(dir: string): string[] {
  const files: string[] = [];
  const items = readdirSync(dir);
  
  for (const item of items) {
    const path = join(dir, item);
    const stat = statSync(path);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findTsFiles(path));
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(path);
    }
  }
  
  return files;
}

// Function to fix common lint errors
function fixLintErrors(filePath: string): void {
  let content = readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix unused imports
  const unusedImports = [
    { pattern: /import\s+\{[^}]*PlayerId[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/PlayerId,?\s*/, '').replace(/,\s*PlayerId/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*RoomId[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/RoomId,?\s*/, '').replace(/,\s*RoomId/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*ButtonTemplate[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/ButtonTemplate,?\s*/, '').replace(/,\s*ButtonTemplate/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*getCardDisplay[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/getCardDisplay,?\s*/, '').replace(/,\s*getCardDisplay/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*getHandHistory[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/getHandHistory,?\s*/, '').replace(/,\s*getHandHistory/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*getGameSummary[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/getGameSummary,?\s*/, '').replace(/,\s*getGameSummary/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*getGameStateDisplay[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/getGameStateDisplay,?\s*/, '').replace(/,\s*getGameStateDisplay/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*getPokerRoom[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/getPokerRoom,?\s*/, '').replace(/,\s*getPokerRoom/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*updatePokerRoom[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/updatePokerRoom,?\s*/, '').replace(/,\s*updatePokerRoom/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*getHandDisplay[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/getHandDisplay,?\s*/, '').replace(/,\s*getHandDisplay/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*getHandTypeDisplay[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/getHandTypeDisplay,?\s*/, '').replace(/,\s*getHandTypeDisplay/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*logFunctionStart[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/logFunctionStart,?\s*/, '').replace(/,\s*logFunctionStart/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*logFunctionEnd[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/logFunctionEnd,?\s*/, '').replace(/,\s*logFunctionEnd/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*logError[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/logError,?\s*/, '').replace(/,\s*logError/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*PlayerNotification[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/PlayerNotification,?\s*/, '').replace(/,\s*PlayerNotification/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*PokerPlayer[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/PokerPlayer,?\s*/, '').replace(/,\s*PokerPlayer/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*BettingRound[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/BettingRound,?\s*/, '').replace(/,\s*BettingRound/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*HandEvaluation[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/HandEvaluation,?\s*/, '').replace(/,\s*HandEvaluation/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*GameAction[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/GameAction,?\s*/, '').replace(/,\s*GameAction/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*PokerGameResult[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/PokerGameResult,?\s*/, '').replace(/,\s*PokerGameResult/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*generateConfirmationKeyboard[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/generateConfirmationKeyboard,?\s*/, '').replace(/,\s*generateConfirmationKeyboard/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*generateRoomManagementKeyboard[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/generateRoomManagementKeyboard,?\s*/, '').replace(/,\s*generateRoomManagementKeyboard/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*parseFormCallbackData[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/parseFormCallbackData,?\s*/, '').replace(/,\s*parseFormCallbackData/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*updateFormState[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/updateFormState,?\s*/, '').replace(/,\s*updateFormState/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*getAllRoomMessages[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/getAllRoomMessages,?\s*/, '').replace(/,\s*getAllRoomMessages/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*handlePokerActiveUser[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/handlePokerActiveUser,?\s*/, '').replace(/,\s*handlePokerActiveUser/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*updateAllPlayersInRoom[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/updateAllPlayersInRoom,?\s*/, '').replace(/,\s*updateAllPlayersInRoom/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*notifyRoomFull[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/notifyRoomFull,?\s*/, '').replace(/,\s*notifyRoomFull/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
    { pattern: /import\s+\{[^}]*generateCallbackData[^}]*\}\s+from\s+['"][^'"]+['"];?\s*\n/g, replacement: (match: string) => {
      const newMatch = match.replace(/generateCallbackData,?\s*/, '').replace(/,\s*generateCallbackData/, '');
      return newMatch.includes('{') && newMatch.match(/\{[^}]*\}/)?.[0] === '{}' ? '' : newMatch;
    }},
  ];
  
  for (const fix of unusedImports) {
    const newContent = content.replace(fix.pattern, fix.replacement);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  }
  
  // Fix unused variables by commenting them out
  const unusedVariables = [
    { pattern: /(\s+)(const|let|var)\s+(\w+)\s*=\s*[^;]+;\s*\/\/\s*TODO:\s*Remove\s+if\s+unused/g, replacement: '$1// $2 $3 = ...; // TODO: Remove if unused' },
    { pattern: /(\s+)(const|let|var)\s+(\w+)\s*=\s*[^;]+;\s*\/\/\s*unused/g, replacement: '$1// $2 $3 = ...; // unused' },
  ];
  
  for (const fix of unusedVariables) {
    const newContent = content.replace(fix.pattern, fix.replacement);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  }
  
  // Fix function parameters that are unused
  const unusedParams = [
    { pattern: /function\s+\w+\s*\([^)]*_\w+[^)]*\)/g, replacement: (match: string) => {
      return match.replace(/_\w+/g, (param) => `_${param.slice(1)}`); // Keep underscore prefix
    }},
  ];
  
  for (const fix of unusedParams) {
    const newContent = content.replace(fix.pattern, fix.replacement);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  }
  
  if (modified) {
    writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  }
}

// Main execution
const srcDir = join(process.cwd(), 'src');
const tsFiles = findTsFiles(srcDir);

console.log(`Found ${tsFiles.length} TypeScript files`);
console.log('Fixing lint errors...');

for (const file of tsFiles) {
  try {
    fixLintErrors(file);
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
}

console.log('Done!'); 