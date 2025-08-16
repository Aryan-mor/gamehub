import type { WinnerDisplay } from './winners';

interface BuildCaptionParams {
  base: string;
  t: (key: string, options?: Record<string, unknown>) => string;
  boardCards?: string[];
  holeCards?: string[];
  extraParts?: string[];
  winners?: WinnerDisplay[];
}

function buildBoardBlock(t: (k: string) => string, boardCards?: string[]): string {
  if (!Array.isArray(boardCards) || boardCards.length === 0) return '';
  const label = t('poker.game.section.communityCards') || 'Community Cards';
  return `\n\n${label}:\n${boardCards.join(' ')}`;
}

function buildHoleBlock(t: (k: string) => string, holeCards?: string[]): string {
  if (!Array.isArray(holeCards) || holeCards.length === 0) return '';
  const label = t('poker.game.section.yourCards') || 'Your Cards';
  return `\n\n${label}:\n${holeCards.join(' ')}`;
}

function buildExtrasBlock(extraParts?: string[]): string {
  if (!extraParts || extraParts.length === 0) return '';
  return `\n\n${extraParts.join(' | ')}`;
}

function buildResultsBlock(winners?: WinnerDisplay[]): string {
  if (!winners || winners.length === 0) return '';
  const lines = winners.map((w) => `• ${w.display}: +${w.amount}${w.hand ? ` (${w.hand})` : ''}${w.combo && w.combo.length ? `\n  ⮑ ${w.combo.join(' ')}` : ''}`);
  return `\n\n🏁 Results:\n${lines.join('\n')}`;
}

function insertBeforeLastUpdate(base: string, t: (k: string) => string, insertion: string): string {
  if (!insertion) return base;
  const lastUpdateLabel = t('poker.room.info.field.lastUpdate') || 'Last update';
  const marker = `\n\n${lastUpdateLabel}:`;
  const parts = base.split(marker);
  return parts.length > 1 ? `${parts[0]}${insertion}${marker}${parts[1]}` : `${base}${insertion}`;
}

export function buildCaption(params: BuildCaptionParams): string {
  const { base, t, boardCards, holeCards, extraParts, winners } = params;
  const boardBlock = buildBoardBlock(t, boardCards);
  const holeBlock = buildHoleBlock(t, holeCards);
  const extrasBlock = buildExtrasBlock(extraParts);
  const resultsBlock = buildResultsBlock(winners);
  const insertion = `${boardBlock}${holeBlock}${extrasBlock}${resultsBlock}`;
  return insertBeforeLastUpdate(base, t, insertion);
}


