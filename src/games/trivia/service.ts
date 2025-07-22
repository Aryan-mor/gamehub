import { logFunctionStart, logFunctionEnd, logError } from '../../core/logger';
import { createGame, getGame, updateGame, finishGame } from '../../core/gameService';
import { addCoins, getUser } from '../../core/userService';
import { 
  TriviaGameState, 
  TriviaGameData, 
  TriviaQuestion, 
  GameType, 
  GameStatus,
  TriviaRoundStatus,
  TRIVIA_CATEGORIES
} from '../../core/types';
import { 
  TRIVIA_CONFIG, 
  TriviaGameResult 
} from './types';

// Global configuration
export const QUESTIONS_PER_CATEGORY = 5;
export const TOTAL_ROUNDS = 6; // 3 categories per player, 2 players

// Helper function to cast GameState to TriviaGameState
const castToTriviaGameState = (game: any): TriviaGameState => {
  return game as TriviaGameState;
};

// Helper function to cast TriviaGameData to Record<string, unknown>
const castTriviaData = (data: TriviaGameData): Record<string, unknown> => {
  return data as unknown as Record<string, unknown>;
};

// Sample questions database (in production, this would be in Firebase)
const SAMPLE_QUESTIONS: TriviaQuestion[] = [
  // Geography Questions
  {
    id: 'geo_1',
    category: '🌍 Geography',
    question: 'What is the capital of Germany?',
    options: ['Berlin', 'Munich', 'Hamburg', 'Cologne'],
    correctAnswer: 'Berlin',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'geo_2',
    category: '🌍 Geography',
    question: 'Which is the largest country in South America?',
    options: ['Brazil', 'Argentina', 'Peru', 'Colombia'],
    correctAnswer: 'Brazil',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'geo_3',
    category: '🌍 Geography',
    question: 'What is the largest ocean on Earth?',
    options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
    correctAnswer: 'Pacific Ocean',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'geo_4',
    category: '🌍 Geography',
    question: 'Which country has the most time zones?',
    options: ['Russia', 'United States', 'France', 'China'],
    correctAnswer: 'France',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'geo_5',
    category: '🌍 Geography',
    question: 'What is the capital of Australia?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
    correctAnswer: 'Canberra',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  
  // Literature Questions
  {
    id: 'lit_1',
    category: '📚 Literature',
    question: 'Who wrote "Romeo and Juliet"?',
    options: ['William Shakespeare', 'Charles Dickens', 'Jane Austen', 'Mark Twain'],
    correctAnswer: 'William Shakespeare',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'lit_2',
    category: '📚 Literature',
    question: 'What is the name of the wizard school in Harry Potter?',
    options: ['Hogwarts', 'Beauxbatons', 'Durmstrang', 'Ilvermorny'],
    correctAnswer: 'Hogwarts',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'lit_3',
    category: '📚 Literature',
    question: 'Who wrote "1984"?',
    options: ['George Orwell', 'Aldous Huxley', 'Ray Bradbury', 'H.G. Wells'],
    correctAnswer: 'George Orwell',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'lit_4',
    category: '📚 Literature',
    question: 'What is the main character\'s name in "The Great Gatsby"?',
    options: ['Jay Gatsby', 'Nick Carraway', 'Tom Buchanan', 'Daisy Buchanan'],
    correctAnswer: 'Jay Gatsby',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'lit_5',
    category: '📚 Literature',
    question: 'Who wrote "Pride and Prejudice"?',
    options: ['Jane Austen', 'Charlotte Brontë', 'Emily Brontë', 'Mary Shelley'],
    correctAnswer: 'Jane Austen',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  },
  
  // Sports Questions
  {
    id: 'sport_1',
    category: '⚽ Sports',
    question: 'Which country has won the most FIFA World Cups?',
    options: ['Brazil', 'Germany', 'Argentina', 'Italy'],
    correctAnswer: 'Brazil',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'sport_2',
    category: '⚽ Sports',
    question: 'Which NBA player has won the most championships?',
    options: ['Michael Jordan', 'Bill Russell', 'Kareem Abdul-Jabbar', 'LeBron James'],
    correctAnswer: 'Bill Russell',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'sport_3',
    category: '⚽ Sports',
    question: 'What is the national sport of Japan?',
    options: ['Sumo', 'Baseball', 'Soccer', 'Tennis'],
    correctAnswer: 'Sumo',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'sport_4',
    category: '⚽ Sports',
    question: 'Which country won the most Olympic medals in 2020?',
    options: ['United States', 'China', 'Japan', 'Great Britain'],
    correctAnswer: 'United States',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'sport_5',
    category: '⚽ Sports',
    question: 'What is the fastest land animal?',
    options: ['Cheetah', 'Lion', 'Gazelle', 'Leopard'],
    correctAnswer: 'Cheetah',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  },
  
  // Entertainment Questions
  {
    id: 'ent_1',
    category: '🎬 Entertainment',
    question: 'Which actor played Iron Man in the Marvel Cinematic Universe?',
    options: ['Robert Downey Jr.', 'Chris Evans', 'Chris Hemsworth', 'Mark Ruffalo'],
    correctAnswer: 'Robert Downey Jr.',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'ent_2',
    category: '🎬 Entertainment',
    question: 'What year did the first Star Wars movie release?',
    options: ['1975', '1977', '1979', '1981'],
    correctAnswer: '1977',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'ent_3',
    category: '🎬 Entertainment',
    question: 'Who directed "Titanic"?',
    options: ['James Cameron', 'Steven Spielberg', 'Christopher Nolan', 'Quentin Tarantino'],
    correctAnswer: 'James Cameron',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'ent_4',
    category: '🎬 Entertainment',
    question: 'What is the highest-grossing movie of all time?',
    options: ['Avatar', 'Avengers: Endgame', 'Titanic', 'Star Wars: The Force Awakens'],
    correctAnswer: 'Avatar',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'ent_5',
    category: '🎬 Entertainment',
    question: 'Which TV show features dragons and is based on George R.R. Martin\'s books?',
    options: ['Game of Thrones', 'The Walking Dead', 'Breaking Bad', 'Stranger Things'],
    correctAnswer: 'Game of Thrones',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  },
  
  // Science Questions
  {
    id: 'sci_1',
    category: '🔬 Science',
    question: 'What is the chemical symbol for gold?',
    options: ['Au', 'Ag', 'Fe', 'Cu'],
    correctAnswer: 'Au',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'sci_2',
    category: '🔬 Science',
    question: 'What is the hardest natural substance on Earth?',
    options: ['Steel', 'Diamond', 'Granite', 'Iron'],
    correctAnswer: 'Diamond',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'sci_3',
    category: '🔬 Science',
    question: 'What is the largest planet in our solar system?',
    options: ['Earth', 'Mars', 'Jupiter', 'Saturn'],
    correctAnswer: 'Jupiter',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'sci_4',
    category: '🔬 Science',
    question: 'What is the speed of light?',
    options: ['299,792 km/s', '199,792 km/s', '399,792 km/s', '499,792 km/s'],
    correctAnswer: '299,792 km/s',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'sci_5',
    category: '🔬 Science',
    question: 'What is the atomic number of carbon?',
    options: ['4', '5', '6', '7'],
    correctAnswer: '6',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  
  // Art & Culture Questions
  {
    id: 'art_1',
    category: '🎨 Art & Culture',
    question: 'Who painted the Mona Lisa?',
    options: ['Vincent van Gogh', 'Leonardo da Vinci', 'Pablo Picasso', 'Michelangelo'],
    correctAnswer: 'Leonardo da Vinci',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'art_2',
    category: '🎨 Art & Culture',
    question: 'What is the national flower of Japan?',
    options: ['Cherry Blossom', 'Rose', 'Lotus', 'Tulip'],
    correctAnswer: 'Cherry Blossom',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'art_3',
    category: '🎨 Art & Culture',
    question: 'Who wrote "The Starry Night"?',
    options: ['Vincent van Gogh', 'Claude Monet', 'Pablo Picasso', 'Salvador Dalí'],
    correctAnswer: 'Vincent van Gogh',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'art_4',
    category: '🎨 Art & Culture',
    question: 'What is the traditional dance of Spain?',
    options: ['Flamenco', 'Tango', 'Salsa', 'Waltz'],
    correctAnswer: 'Flamenco',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'art_5',
    category: '🎨 Art & Culture',
    question: 'Which country is famous for origami?',
    options: ['China', 'Japan', 'Korea', 'Thailand'],
    correctAnswer: 'Japan',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  },
  
  // Food & Drink Questions
  {
    id: 'food_1',
    category: '🍔 Food & Drink',
    question: 'What is the main ingredient in sushi?',
    options: ['Rice', 'Fish', 'Seaweed', 'Vegetables'],
    correctAnswer: 'Rice',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'food_2',
    category: '🍔 Food & Drink',
    question: 'Which country is famous for pizza?',
    options: ['Italy', 'Spain', 'France', 'Greece'],
    correctAnswer: 'Italy',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'food_3',
    category: '🍔 Food & Drink',
    question: 'What is the national dish of Thailand?',
    options: ['Pad Thai', 'Curry', 'Noodles', 'Rice'],
    correctAnswer: 'Pad Thai',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'food_4',
    category: '🍔 Food & Drink',
    question: 'Which fruit is known as the "king of fruits"?',
    options: ['Mango', 'Durian', 'Pineapple', 'Papaya'],
    correctAnswer: 'Durian',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'food_5',
    category: '🍔 Food & Drink',
    question: 'What is the main ingredient in chocolate?',
    options: ['Cocoa', 'Sugar', 'Milk', 'Vanilla'],
    correctAnswer: 'Cocoa',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  },
  
  // History Questions
  {
    id: 'hist_1',
    category: '🌍 History',
    question: 'In which year did World War II end?',
    options: ['1943', '1944', '1945', '1946'],
    correctAnswer: '1945',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'hist_2',
    category: '🌍 History',
    question: 'Who was the first President of the United States?',
    options: ['John Adams', 'Thomas Jefferson', 'George Washington', 'Benjamin Franklin'],
    correctAnswer: 'George Washington',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'hist_3',
    category: '🌍 History',
    question: 'Which empire was ruled by the Aztecs?',
    options: ['Mexican Empire', 'Incan Empire', 'Mayan Empire', 'Aztec Empire'],
    correctAnswer: 'Aztec Empire',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'hist_4',
    category: '🌍 History',
    question: 'What year did the Berlin Wall fall?',
    options: ['1987', '1988', '1989', '1990'],
    correctAnswer: '1989',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'hist_5',
    category: '🌍 History',
    question: 'Who was the first woman to win a Nobel Prize?',
    options: ['Marie Curie', 'Mother Teresa', 'Jane Addams', 'Pearl S. Buck'],
    correctAnswer: 'Marie Curie',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  
  // Music Questions
  {
    id: 'music_1',
    category: '🎵 Music',
    question: 'Who is known as the "King of Pop"?',
    options: ['Elvis Presley', 'Michael Jackson', 'Prince', 'David Bowie'],
    correctAnswer: 'Michael Jackson',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'music_2',
    category: '🎵 Music',
    question: 'Which band released "Bohemian Rhapsody"?',
    options: ['The Beatles', 'Queen', 'Led Zeppelin', 'Pink Floyd'],
    correctAnswer: 'Queen',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'music_3',
    category: '🎵 Music',
    question: 'What instrument is Yo-Yo Ma famous for playing?',
    options: ['Violin', 'Cello', 'Piano', 'Guitar'],
    correctAnswer: 'Cello',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'music_4',
    category: '🎵 Music',
    question: 'Which country is the origin of reggae music?',
    options: ['Cuba', 'Jamaica', 'Trinidad', 'Barbados'],
    correctAnswer: 'Jamaica',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'music_5',
    category: '🎵 Music',
    question: 'Who wrote "The Four Seasons"?',
    options: ['Mozart', 'Beethoven', 'Vivaldi', 'Bach'],
    correctAnswer: 'Vivaldi',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  
  // Technology Questions
  {
    id: 'tech_1',
    category: '💻 Technology',
    question: 'Who founded Apple Inc.?',
    options: ['Bill Gates', 'Steve Jobs', 'Mark Zuckerberg', 'Elon Musk'],
    correctAnswer: 'Steve Jobs',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'tech_2',
    category: '💻 Technology',
    question: 'What does CPU stand for?',
    options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Personal Unit', 'Computer Processing Unit'],
    correctAnswer: 'Central Processing Unit',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'tech_3',
    category: '💻 Technology',
    question: 'What year was the first iPhone released?',
    options: ['2005', '2006', '2007', '2008'],
    correctAnswer: '2007',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'tech_4',
    category: '💻 Technology',
    question: 'What is the most popular programming language?',
    options: ['Python', 'JavaScript', 'Java', 'C++'],
    correctAnswer: 'JavaScript',
    difficulty: 'medium',
    source: 'DB',
    createdAt: Date.now()
  },
  {
    id: 'tech_5',
    category: '💻 Technology',
    question: 'Who created Facebook?',
    options: ['Mark Zuckerberg', 'Bill Gates', 'Steve Jobs', 'Elon Musk'],
    correctAnswer: 'Mark Zuckerberg',
    difficulty: 'easy',
    source: 'DB',
    createdAt: Date.now()
  }
];

export const createTriviaGame = async (creatorId: string): Promise<TriviaGameState> => {
  logFunctionStart('createTriviaGame', { creatorId });
  
  try {
    const creator = await getUser(creatorId);
    
    const player: any = {
      id: creatorId,
      name: creator.name || 'Unknown',
      coins: creator.coins
    };
    
    // Only add username if it exists
    if (creator.username) {
      player.username = creator.username;
    }

    const game = await createGame(GameType.TRIVIA, player, 0);
    
    // Initialize trivia-specific data
    const triviaData: TriviaGameData = {
      currentRound: 1,
      currentPlayerIndex: 0,
      scores: { [creatorId]: 0 },
      selectedCategories: [],
      currentQuestion: null,
      playerAnswers: {},
      roundStartTime: null,
      questionTimeout: null,
      questionsAnsweredInCurrentCategory: 0,
      currentCategoryIndex: 0,
      playerQuestionProgress: {},
      categoryQuestions: [],
      roundStatus: TriviaRoundStatus.WAITING_FOR_ANSWERS,
    };

    // Fire and forget Firebase update for better performance
    updateGame(game.id, {
      data: castTriviaData(triviaData)
    }).catch(error => {
      logError('createTriviaGame_firebase_update', error as Error, { gameId: game.id, creatorId });
    });
    
    logFunctionEnd('createTriviaGame', { gameId: game.id }, { creatorId });
    return castToTriviaGameState(game);
  } catch (error) {
    logError('createTriviaGame', error as Error, { creatorId });
    throw error;
  }
};

export const joinTriviaGame = async (gameId: string, playerId: string): Promise<TriviaGameState> => {
  logFunctionStart('joinTriviaGame', { gameId, playerId });
  
  try {
    const game = await getGame(gameId);
    if (!game) throw new Error('Game not found');
    
    const triviaGame = castToTriviaGameState(game);
    const player = await getUser(playerId);
    
    if (triviaGame.status !== GameStatus.WAITING) {
      throw new Error('Game is not in waiting status');
    }
    
    if (triviaGame.players.length >= 2) {
      throw new Error('Game is full');
    }
    
    if (triviaGame.players.some(p => p.id === playerId)) {
      throw new Error('Player already in game');
    }
    
    // Add player to game
    const newPlayer: any = {
      id: playerId,
      name: player.name || 'Unknown',
      coins: player.coins
    };
    
    // Only add username if it exists
    if (player.username) {
      newPlayer.username = player.username;
    }
    
    triviaGame.players.push(newPlayer);
    
    triviaGame.data.scores[playerId] = 0;
    
    // If we have 2 players, start the game
    if (triviaGame.players.length === 2) {
      triviaGame.status = GameStatus.PLAYING;
      triviaGame.data.roundStartTime = Date.now();
    }
    
    // Fire and forget Firebase update for better performance
    updateGame(gameId, {
      players: triviaGame.players,
      status: triviaGame.status,
      data: castTriviaData(triviaGame.data)
    }).catch(error => {
      logError('joinTriviaGame_firebase_update', error as Error, { gameId, playerId });
    });
    
    logFunctionEnd('joinTriviaGame', { gameId }, { playerId });
    return castToTriviaGameState(triviaGame);
  } catch (error) {
    logError('joinTriviaGame', error as Error, { gameId, playerId });
    throw error;
  }
};

export const selectCategory = async (gameId: string, playerId: string, category: string): Promise<TriviaGameState> => {
  logFunctionStart('selectCategory', { gameId, playerId, category });
  
  try {
    const game = await getGame(gameId);
    if (!game) throw new Error('Game not found');
    
    const triviaGame = castToTriviaGameState(game);
    
    if (triviaGame.status !== GameStatus.PLAYING) {
      throw new Error('Game is not in playing status');
    }
    
    if (triviaGame.players[triviaGame.data.currentPlayerIndex].id !== playerId) {
      throw new Error('Not your turn to select category');
    }
    
    if (!TRIVIA_CATEGORIES.includes(category as any)) {
      throw new Error('Invalid category');
    }
    
    // Initialize selectedCategories if it doesn't exist
    if (!triviaGame.data.selectedCategories) {
      triviaGame.data.selectedCategories = [];
    }
    
    // Add category to selected categories
    triviaGame.data.selectedCategories.push(category);
    triviaGame.data.currentCategoryIndex = triviaGame.data.selectedCategories.length - 1;
    
    // Get 5 random questions for this category
    const allCategoryQuestions = SAMPLE_QUESTIONS.filter(q => q.category === category);
    if (allCategoryQuestions.length === 0) {
      throw new Error('No questions available for this category');
    }
    
    // Shuffle and select 5 questions
    const shuffledQuestions = allCategoryQuestions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffledQuestions.slice(0, QUESTIONS_PER_CATEGORY);
    
    // Initialize the independent question system
    triviaGame.data.categoryQuestions = selectedQuestions;
    triviaGame.data.roundStatus = TriviaRoundStatus.WAITING_FOR_ANSWERS;
    triviaGame.data.roundStartTime = Date.now();
    
    // Initialize player progress for both players
    triviaGame.data.playerQuestionProgress = {};
    for (const player of triviaGame.players) {
      triviaGame.data.playerQuestionProgress[player.id] = {
        currentQuestionIndex: 0,
        answers: {},
        isFinished: false,
        startTime: Date.now()
      };
    }
    
    // Clear old data
    triviaGame.data.currentQuestion = null;
    triviaGame.data.playerAnswers = {};
    triviaGame.data.questionTimeout = null;
    triviaGame.data.questionsAnsweredInCurrentCategory = 0;
    
    // Fire and forget Firebase update for better performance
    updateGame(gameId, {
      data: castTriviaData(triviaGame.data)
    }).catch(error => {
      logError('selectCategory_firebase_update', error as Error, { gameId, playerId, category });
    });
    
    logFunctionEnd('selectCategory', { gameId, category, questionsCount: selectedQuestions.length }, { playerId });
    return castToTriviaGameState(triviaGame);
  } catch (error) {
    logError('selectCategory', error as Error, { gameId, playerId, category });
    throw error;
  }
};

export const answerQuestion = async (gameId: string, playerId: string, answer: string): Promise<TriviaGameState> => {
  logFunctionStart('answerQuestion', { gameId, playerId, answer });
  
  try {
    logFunctionStart('answerQuestion_get_game', { gameId });
    const game = await getGame(gameId);
    if (!game) throw new Error('Game not found');
    logFunctionEnd('answerQuestion_get_game', { gameId });
    
    const triviaGame = castToTriviaGameState(game);
    
    if (triviaGame.status !== GameStatus.PLAYING) {
      throw new Error('Game is not in playing status');
    }
    
    if (!triviaGame.data.currentQuestion) {
      throw new Error('No current question');
    }
    
    logFunctionStart('answerQuestion_record_answer', { 
      gameId, 
      playerId, 
      answer, 
      correctAnswer: triviaGame.data.currentQuestion.correctAnswer,
      questionId: triviaGame.data.currentQuestion.id
    });
    
    // Initialize playerAnswers if it doesn't exist
    if (!triviaGame.data.playerAnswers) {
      triviaGame.data.playerAnswers = {};
    }
    
    if (triviaGame.data.playerAnswers[playerId]) {
      throw new Error('Player already answered');
    }
    
    const responseTime = Date.now() - (triviaGame.data.roundStartTime || Date.now());
    const isCorrect = answer === triviaGame.data.currentQuestion.correctAnswer;
    
    // Record answer
    triviaGame.data.playerAnswers[playerId] = {
      answer,
      responseTime
    };
    
    // Initialize scores if they don't exist
    if (!triviaGame.data.scores) {
      triviaGame.data.scores = {};
    }
    
    // Initialize player score if it doesn't exist
    if (!triviaGame.data.scores[playerId]) {
      triviaGame.data.scores[playerId] = 0;
    }
    
    // Update score
    if (isCorrect) {
      triviaGame.data.scores[playerId] += 1;
    }
    
    logFunctionEnd('answerQuestion_record_answer', { 
      gameId, 
      playerId, 
      isCorrect, 
      newScore: triviaGame.data.scores[playerId],
      responseTime
    });
    
    // Check if both players have answered
    const allPlayersAnswered = triviaGame.players.every(player => triviaGame.data.playerAnswers[player.id]);
    
    logFunctionStart('answerQuestion_check_all_answered', { 
      gameId, 
      allPlayersAnswered, 
      playerCount: triviaGame.players.length,
      answeredCount: Object.keys(triviaGame.data.playerAnswers).length,
      answeredPlayers: Object.keys(triviaGame.data.playerAnswers)
    });
    
    let roundProgress: { hasNextQuestion: boolean; isRoundComplete: boolean } | undefined;
    
    if (allPlayersAnswered) {
      logFunctionStart('answerQuestion_handle_round_progress', { gameId });
      // Move to next question or round
      roundProgress = await handleRoundProgress(triviaGame);
      logFunctionEnd('answerQuestion_handle_round_progress', { gameId, roundProgress });
    }
    
    // Only update game if handleRoundProgress didn't already do it
    if (!roundProgress || !roundProgress.hasNextQuestion) {
      logFunctionStart('answerQuestion_update_game', { gameId, reason: 'no_round_progress_or_no_next_question' });
      const updatedGame = await updateGame(gameId, {
        data: castTriviaData(triviaGame.data)
      });
      logFunctionEnd('answerQuestion_update_game', { gameId });
      
      logFunctionEnd('answerQuestion_check_all_answered', { gameId, allPlayersAnswered });
      logFunctionEnd('answerQuestion', { gameId, isCorrect, roundProgress }, { playerId });
      return castToTriviaGameState(updatedGame);
    } else {
      logFunctionStart('answerQuestion_get_updated_game', { gameId, reason: 'round_progress_updated_game' });
      // Get the updated game after handleRoundProgress
      const updatedGame = await getGame(gameId);
      if (!updatedGame) throw new Error('Game not found after round progress');
      logFunctionEnd('answerQuestion_get_updated_game', { gameId });
      
      logFunctionEnd('answerQuestion_check_all_answered', { gameId, allPlayersAnswered });
      logFunctionEnd('answerQuestion', { gameId, isCorrect, roundProgress }, { playerId });
      return castToTriviaGameState(updatedGame);
    }
  } catch (error) {
    logError('answerQuestion', error as Error, { gameId, playerId, answer });
    throw error;
  }
};

const handleRoundProgress = async (game: TriviaGameState): Promise<{ hasNextQuestion: boolean; isRoundComplete: boolean }> => {
  logFunctionStart('handleRoundProgress', { 
    gameId: game.id,
    currentCategoryIndex: game.data.currentCategoryIndex,
    questionsAnsweredInCurrentCategory: game.data.questionsAnsweredInCurrentCategory,
    currentRound: game.data.currentRound,
    totalCategories: game.data.selectedCategories.length
  });
  
  try {
    // Increment questions answered in current category
    game.data.questionsAnsweredInCurrentCategory++;
    
    logFunctionStart('handleRoundProgress_check_category_completion', {
      gameId: game.id,
      questionsAnswered: game.data.questionsAnsweredInCurrentCategory,
      questionsPerCategory: QUESTIONS_PER_CATEGORY
    });
    
    // Check if current category is complete (5 questions answered)
    if (game.data.questionsAnsweredInCurrentCategory < QUESTIONS_PER_CATEGORY) {
      // More questions needed in current category
      const currentCategory = game.data.selectedCategories[game.data.currentCategoryIndex];
      const categoryQuestions = SAMPLE_QUESTIONS.filter(q => q.category === currentCategory);
      const randomQuestion = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];
      
      game.data.currentQuestion = randomQuestion;
      game.data.playerAnswers = {};
      game.data.roundStartTime = Date.now();
      game.data.questionTimeout = Date.now() + TRIVIA_CONFIG.questionTimeoutMs;
      
      await updateGame(game.id, {
        data: castTriviaData(game.data)
      });
      
      logFunctionEnd('handleRoundProgress_check_category_completion', {
        gameId: game.id,
        hasNextQuestion: true,
        isRoundComplete: false,
        nextQuestionNumber: game.data.questionsAnsweredInCurrentCategory + 1
      });
      
      logFunctionEnd('handleRoundProgress', { gameId: game.id, hasNextQuestion: true, isRoundComplete: false });
      return { hasNextQuestion: true, isRoundComplete: false };
    } else {
      // Current category is complete
      logFunctionStart('handleRoundProgress_category_complete', {
        gameId: game.id,
        completedCategory: game.data.selectedCategories[game.data.currentCategoryIndex],
        currentRound: game.data.currentRound,
        totalRounds: TOTAL_ROUNDS
      });
      
      // Check if game is complete (6 rounds = 3 categories per player)
      if (game.data.currentRound >= TOTAL_ROUNDS) {
        await finishTriviaGame(game);
        logFunctionEnd('handleRoundProgress_category_complete', {
          gameId: game.id,
          gameComplete: true
        });
        logFunctionEnd('handleRoundProgress', { gameId: game.id, hasNextQuestion: false, isRoundComplete: true, gameComplete: true });
        return { hasNextQuestion: false, isRoundComplete: true };
      }
      
      // Move to next round (next player's turn to select category)
      game.data.currentRound++;
      game.data.currentPlayerIndex = (game.data.currentPlayerIndex + 1) % game.players.length;
      game.data.currentQuestion = null;
      game.data.playerAnswers = {};
      game.data.roundStartTime = null;
      game.data.questionTimeout = null;
      game.data.questionsAnsweredInCurrentCategory = 0;
      game.data.currentCategoryIndex = game.data.selectedCategories.length; // Will be set when category is selected
      
      await updateGame(game.id, {
        data: castTriviaData(game.data)
      });
      
      logFunctionEnd('handleRoundProgress_category_complete', {
        gameId: game.id,
        nextRound: game.data.currentRound,
        nextPlayerIndex: game.data.currentPlayerIndex
      });
      
      logFunctionEnd('handleRoundProgress', { gameId: game.id, hasNextQuestion: false, isRoundComplete: true });
      return { hasNextQuestion: false, isRoundComplete: true };
    }
  } catch (error) {
    logError('handleRoundProgress', error as Error, { gameId: game.id });
    throw error;
  }
};

const finishTriviaGame = async (game: TriviaGameState): Promise<void> => {
  logFunctionStart('finishTriviaGame', { gameId: game.id });
  
  try {
    const finalScores = game.data.scores;
    const playerIds = Object.keys(finalScores);
    const scores = Object.values(finalScores);
    
    let winner: string | undefined;
    let loser: string | undefined;
    let isDraw = false;
    
    if (scores[0] > scores[1]) {
      winner = playerIds[0];
      loser = playerIds[1];
    } else if (scores[1] > scores[0]) {
      winner = playerIds[1];
      loser = playerIds[0];
    } else {
      isDraw = true;
    }
    
    // Award coins
    if (winner) {
      await addCoins(winner, TRIVIA_CONFIG.winReward, 'trivia_game_win');
      if (loser) {
        await addCoins(loser, TRIVIA_CONFIG.loseReward, 'trivia_game_loss');
      }
    } else if (isDraw) {
      for (const playerId of playerIds) {
        await addCoins(playerId, TRIVIA_CONFIG.drawReward, 'trivia_game_draw');
      }
    }
    
    const result: TriviaGameResult = {
      winner,
      loser,
      isDraw,
      finalScores,
      roundResults: [], // TODO: Implement round results tracking
      coinsWon: winner ? TRIVIA_CONFIG.winReward : (isDraw ? TRIVIA_CONFIG.drawReward : 0),
      coinsLost: loser ? 0 : (isDraw ? 0 : 0)
    };
    
    await finishGame(game.id, result);
    
    logFunctionEnd('finishTriviaGame', { gameId: game.id, winner, isDraw });
  } catch (error) {
    logError('finishTriviaGame', error as Error, { gameId: game.id });
    throw error;
  }
};

// Get the current question for a specific player
export const getCurrentQuestionForPlayer = async (gameId: string, playerId: string): Promise<TriviaQuestion | null> => {
  logFunctionStart('getCurrentQuestionForPlayer', { gameId, playerId });
  
  try {
    const game = await getGame(gameId);
    if (!game) throw new Error('Game not found');
    
    const triviaGame = castToTriviaGameState(game);
    const playerProgress = triviaGame.data.playerQuestionProgress[playerId];
    
    if (!playerProgress || playerProgress.isFinished) {
      logFunctionEnd('getCurrentQuestionForPlayer', { gameId, playerId, result: 'no_question' });
      return null;
    }
    
    const question = triviaGame.data.categoryQuestions[playerProgress.currentQuestionIndex];
    logFunctionEnd('getCurrentQuestionForPlayer', { gameId, playerId, questionIndex: playerProgress.currentQuestionIndex });
    return question || null;
  } catch (error) {
    logError('getCurrentQuestionForPlayer', error as Error, { gameId, playerId });
    throw error;
  }
};

// Answer a question for a specific player
export const answerQuestionForPlayer = async (gameId: string, playerId: string, answer: string): Promise<{ isCorrect: boolean; isFinished: boolean; nextQuestion?: TriviaQuestion }> => {
  logFunctionStart('answerQuestionForPlayer', { gameId, playerId, answer });
  
  try {
    const game = await getGame(gameId);
    if (!game) throw new Error('Game not found');
    
    const triviaGame = castToTriviaGameState(game);
    const playerProgress = triviaGame.data.playerQuestionProgress[playerId];
    
    if (!playerProgress || playerProgress.isFinished) {
      throw new Error('Player has already finished this category');
    }
    
    const currentQuestion = triviaGame.data.categoryQuestions[playerProgress.currentQuestionIndex];
    if (!currentQuestion) {
      throw new Error('No current question found');
    }
    
    const isCorrect = answer === currentQuestion.correctAnswer;
    const responseTime = Date.now() - playerProgress.startTime;
    
    // Ensure answers object exists
    if (!playerProgress.answers) {
      playerProgress.answers = {};
    }
    
    // Record the answer
    playerProgress.answers[playerProgress.currentQuestionIndex] = {
      answer,
      responseTime,
      isCorrect
    };
    
    // Update score if correct
    if (isCorrect) {
      triviaGame.data.scores[playerId] = (triviaGame.data.scores[playerId] || 0) + 1;
    }
    
    // Move to next question or finish
    playerProgress.currentQuestionIndex++;
    
    if (playerProgress.currentQuestionIndex >= QUESTIONS_PER_CATEGORY) {
      // Player finished all questions
      playerProgress.isFinished = true;
      
      // Check if both players are finished
      const allPlayersFinished = triviaGame.players.every(player => 
        triviaGame.data.playerQuestionProgress[player.id]?.isFinished
      );
      
      if (allPlayersFinished) {
        // Both players finished, calculate round results
        triviaGame.data.roundStatus = TriviaRoundStatus.CALCULATING_RESULTS;
      }
      
      // Fire and forget Firebase update for better performance
      updateGame(gameId, {
        data: castTriviaData(triviaGame.data)
      }).catch(error => {
        logError('answerQuestionForPlayer_firebase_update', error as Error, { gameId, playerId });
      });
      
      logFunctionEnd('answerQuestionForPlayer', { gameId, playerId, isCorrect, isFinished: true });
      return { isCorrect, isFinished: true };
    } else {
      // Get next question
      const nextQuestion = triviaGame.data.categoryQuestions[playerProgress.currentQuestionIndex];
      
      // Fire and forget Firebase update for better performance
      updateGame(gameId, {
        data: castTriviaData(triviaGame.data)
      }).catch(error => {
        logError('answerQuestionForPlayer_firebase_update', error as Error, { gameId, playerId });
      });
      
      logFunctionEnd('answerQuestionForPlayer', { gameId, playerId, isCorrect, isFinished: false, nextQuestionIndex: playerProgress.currentQuestionIndex });
      return { isCorrect, isFinished: false, nextQuestion };
    }
  } catch (error) {
    logError('answerQuestionForPlayer', error as Error, { gameId, playerId, answer });
    throw error;
  }
};

// Check if both players have finished the category
export const checkCategoryCompletion = async (gameId: string): Promise<{ isComplete: boolean; shouldProceedToNextRound: boolean }> => {
  logFunctionStart('checkCategoryCompletion', { gameId });
  
  try {
    const game = await getGame(gameId);
    if (!game) throw new Error('Game not found');
    
    const triviaGame = castToTriviaGameState(game);
    
    const allPlayersFinished = triviaGame.players.every(player => 
      triviaGame.data.playerQuestionProgress[player.id]?.isFinished
    );
    
    if (allPlayersFinished && triviaGame.data.roundStatus === TriviaRoundStatus.CALCULATING_RESULTS) {
      // Check if game is complete (6 rounds = 3 categories per player)
      if (triviaGame.data.currentRound >= TOTAL_ROUNDS) {
        await finishTriviaGame(triviaGame);
        logFunctionEnd('checkCategoryCompletion', { gameId, isComplete: true, shouldProceedToNextRound: false, gameComplete: true });
        return { isComplete: true, shouldProceedToNextRound: false };
      }
      
      // Move to next round
      triviaGame.data.currentRound++;
      triviaGame.data.currentPlayerIndex = (triviaGame.data.currentPlayerIndex + 1) % triviaGame.players.length;
      triviaGame.data.roundStatus = TriviaRoundStatus.CATEGORY_COMPLETE;
      
      // Fire and forget Firebase update for better performance
      updateGame(gameId, {
        data: castTriviaData(triviaGame.data)
      }).catch(error => {
        logError('checkCategoryCompletion_firebase_update', error as Error, { gameId });
      });
      
      logFunctionEnd('checkCategoryCompletion', { gameId, isComplete: true, shouldProceedToNextRound: true, nextRound: triviaGame.data.currentRound });
      return { isComplete: true, shouldProceedToNextRound: true };
    }
    
    logFunctionEnd('checkCategoryCompletion', { gameId, isComplete: false });
    return { isComplete: false, shouldProceedToNextRound: false };
  } catch (error) {
    logError('checkCategoryCompletion', error as Error, { gameId });
    throw error;
  }
};

export const getQuestionsForCategory = (category: string): TriviaQuestion[] => {
  return SAMPLE_QUESTIONS.filter(q => q.category === category);
};

export const generateAIQuestion = async (category: string): Promise<TriviaQuestion> => {
  // TODO: Implement AI question generation
  // For now, return a placeholder
  return {
    id: `ai_${Date.now()}`,
    category,
    question: 'AI-generated question placeholder',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: 'Option A',
    difficulty: 'medium',
    source: 'AI',
    createdAt: Date.now()
  };
}; 