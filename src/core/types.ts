export interface User {
  id: string;
  username?: string;
  name?: string;
  coins: number;
  lastFreeCoinAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface GameState {
  id: string;
  type: GameType;
  status: GameStatus;
  players: Player[];
  currentPlayerIndex: number;
  stake: number;
  createdAt: number;
  updatedAt: number;
  data: Record<string, unknown>;
  result?: GameResult;
}

export interface Player {
  id: string;
  name: string;
  username: string | undefined;
  coins: number;
}

export enum GameType {
  XO = 'xo',
  DICE = 'dice',
  BLACKJACK = 'blackjack',
  FOOTBALL = 'football',
  BASKETBALL = 'basketball',
  BOWLING = 'bowling',
  TRIVIA = 'trivia'
}

export enum GameStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  FINISHED = 'finished',
  CANCELLED = 'cancelled'
}

export interface GameResult {
  winner: string | undefined;
  loser: string | undefined;
  isDraw: boolean;
  coinsWon: number;
  coinsLost: number;
}

export interface LogContext {
  userId?: string;
  gameId?: string;
  action?: string;
  [key: string]: unknown;
}

export interface BotContext {
  userId: string;
  chatId: number;
  username?: string;
  name?: string;
}

export interface CallbackData {
  action: string;
  gameId?: string;
  stake?: number;
  choice?: string;
  [key: string]: unknown;
} 

// Trivia Game Types
export interface TriviaQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  source: 'DB' | 'AI';
  createdAt: number;
}

export interface TriviaGameData {
  currentRound: number;
  currentPlayerIndex: number;
  scores: { [playerId: string]: number };
  selectedCategories: string[];
  currentQuestion?: TriviaQuestion | null;
  playerAnswers: { [playerId: string]: { answer: string; responseTime: number } };
  roundStartTime?: number | null;
  questionTimeout?: number | null;
  questionsAnsweredInCurrentCategory: number; // Track questions answered in current category
  currentCategoryIndex: number; // Track which category we're in
  
  // Independent question answering system
  playerQuestionProgress: { [playerId: string]: {
    currentQuestionIndex: number; // Which question (0-4) the player is on
    answers: { [questionIndex: number]: { answer: string; responseTime: number; isCorrect: boolean } };
    isFinished: boolean; // Whether player completed all questions in this category
    startTime: number; // When they started this category
  }};
  categoryQuestions: TriviaQuestion[]; // All 5 questions for the current category
  roundStatus: 'waiting_for_answers' | 'calculating_results' | 'category_complete';
}

export interface TriviaGameState extends Omit<GameState, 'data'> {
  type: GameType.TRIVIA;
  data: TriviaGameData;
}

export const TRIVIA_CATEGORIES = [
  '🌍 Geography',
  '📚 Literature',
  '⚽ Sports',
  '🎬 Entertainment',
  '🔬 Science',
  '🎨 Art & Culture',
  '🍔 Food & Drink',
  '🌍 History',
  '🎵 Music',
  '💻 Technology'
] as const;

export type TriviaCategory = typeof TRIVIA_CATEGORIES[number]; 