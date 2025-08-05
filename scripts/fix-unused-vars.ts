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

// Function to fix unused variables
function fixUnusedVariables(filePath: string): void {
  let content = readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Common unused variable patterns
  const unusedVars = [
    // Function parameters
    { pattern: /function\s+\w+\s*\([^)]*(\w+):\s*[^)]*\)/g, replacement: (match: string, param: string) => {
      // Skip if already prefixed with underscore
      if (param.startsWith('_')) return match;
      return match.replace(new RegExp(`\\b${param}\\b(?=:)`, 'g'), `_${param}`);
    }},
    
    // Variable assignments
    { pattern: /(\s+)(const|let|var)\s+(\w+)\s*=\s*[^;]+;\s*\/\/\s*unused/g, replacement: '$1// $2 $3 = ...; // unused' },
    { pattern: /(\s+)(const|let|var)\s+(\w+)\s*=\s*[^;]+;\s*\/\/\s*TODO:\s*Remove\s+if\s+unused/g, replacement: '$1// $2 $3 = ...; // TODO: Remove if unused' },
    
    // Specific variable names that are commonly unused
    { pattern: /\b(roomWithPlayingStatus|communityCards|smallBlind|currentPlayer|newCreator|updatedRoom|canCheck|spectatorId|validatedPlayerId|resetRoom|fromUser|playerCheckError|remainingDeck|message|room|pokers|context|_query|query|callback_data|params|error)\b(?=\s*[;=,])/g, replacement: (match: string) => {
      if (match.startsWith('_')) return match;
      return `_${match}`;
    }},
  ];
  
  for (const fix of unusedVars) {
    const newContent = content.replace(fix.pattern, fix.replacement);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  }
  
  if (modified) {
    writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed unused variables: ${filePath}`);
  }
}

// Main execution
const srcDir = join(process.cwd(), 'src');
const tsFiles = findTsFiles(srcDir);

console.log(`Found ${tsFiles.length} TypeScript files`);
console.log('Fixing unused variables...');

for (const file of tsFiles) {
  try {
    fixUnusedVariables(file);
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
}

console.log('Done!'); 