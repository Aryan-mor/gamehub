import { TriviaQuestion, TriviaGameData, TriviaGameState, TriviaCategory, TRIVIA_CATEGORIES } from '../../core/types';

export interface TriviaGameConfig {
  roundsPerGame: number;
  questionsPerRound: number;
  questionTimeoutMs: number;
  winReward: number;
  drawReward: number;
  loseReward: number;
}

export const TRIVIA_CONFIG: TriviaGameConfig = {
  roundsPerGame: 6,
  questionsPerRound: 5,
  questionTimeoutMs: 10000, // 10 seconds
  winReward: 20,
  drawReward: 10,
  loseReward: 0
};

export interface TriviaAnswer {
  playerId: string;
  answer: string;
  responseTime: number;
  isCorrect: boolean;
}

export interface TriviaRoundResult {
  roundNumber: number;
  category: string;
  answers: TriviaAnswer[];
  scores: { [playerId: string]: number };
}

export interface TriviaGameResult {
  winner: string | undefined;
  loser: string | undefined;
  isDraw: boolean;
  finalScores: { [playerId: string]: number };
  roundResults: TriviaRoundResult[];
  coinsWon: number;
  coinsLost: number;
}

export type TriviaCallbackAction = 
  | 'join_trivia'
  | 'select_category'
  | 'answer_question'
  | 'play_again'
  | 'leave_game';

export interface TriviaCallbackData {
  action: TriviaCallbackAction;
  gameId?: string;
  category?: string;
  answer?: string;
  questionId?: string;
}

export type { TriviaQuestion, TriviaGameData, TriviaGameState, TriviaCategory };
export { TRIVIA_CATEGORIES }; 