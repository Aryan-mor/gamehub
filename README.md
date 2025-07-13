# GameHub - Online Tic-Tac-Toe

A real-time 2-player Tic-Tac-Toe game built with Next.js, TypeScript, Tailwind CSS, and Firebase.

## Features

🎮 **Real-time Gameplay**

- Live game updates using Firebase Realtime Database
- Instant move synchronization between players
- Real-time game state management

🔐 **Authentication**

- Google OAuth2 login integration
- Secure user sessions with NextAuth.js
- User profile management

🏠 **Game Lobby**

- Create new games with shareable links
- Join games using 6-character codes
- Copy game links to clipboard
- Real-time waiting room

🎯 **Game Features**

- Classic 3x3 Tic-Tac-Toe gameplay
- Turn-based moves with visual indicators
- Win/draw detection
- Game reset functionality
- Player avatars and names

💰 **Coin-Stake System**

- **Play with Coins**: Stake 5, 10, or 20 coins per game
- **Winner Takes All**: Winner receives 90% of the pot (10% bot fee)
- **Draw Refunds**: Both players get their stakes back on draws
- **Daily Coins**: Claim 20 free coins daily with `/free_coin`
- **Balance Management**: Check balance with `/balance`

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Hero UI
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: Firebase Realtime Database
- **Deployment**: Vercel (recommended)

## Prerequisites

- Node.js 18+
- npm or yarn
- Google Cloud Console account
- Firebase project

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd gamehub
npm install
```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set up OAuth consent screen
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Client Secret

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication → Google sign-in method
4. Go to Project Settings → General → Your apps
5. Add a web app and copy the config
6. Enable Realtime Database in test mode
7. Set up database rules:

```json
{
  "rules": {
    "games": {
      "$gameId": {
        ".read": true,
        ".write": true
      }
    },
    "users": {
      "$userId": {
        ".read": true,
        ".write": true
      }
    },
    "transfers": {
      ".read": true,
      ".write": true
    }
  }
}
```

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-key

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com

# Telegram Bot Token (for bot functionality)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

### 5. Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Play

### Web Version

1. **Login**: Sign in with your Google account
2. **Create Game**: Click "Create Game" to start a new match
3. **Share Code**: Copy the 6-character game code and share it with a friend
4. **Join Game**: Enter the game code to join an existing game
5. **Play**: Take turns placing X and O on the 3x3 grid
6. **Win**: Get three in a row to win the game!

### Telegram Bot

1. **Start**: Send `/start` to get started
2. **Get Coins**: Use `/free_coin` to claim daily coins
3. **Create Game**: Use `/newgame` to create a stake game (5/10/20 coins)
4. **Join Game**: Use `/join <gameId>` to join an existing game
5. **Check Balance**: Use `/balance` to see your coin balance

## Coin-Stake Gameplay

### Game Creation

- Choose stake amount: 5, 10, or 20 coins
- System validates your balance before creating game
- Stake is deducted immediately and held in escrow

### Game Lobby

- Shows stake amount and potential payout
- Displays "Winner gets X coins – 10% fee"
- Second player must have sufficient balance to join

### Game Finish

- **Win**: Winner receives 90% of total pot (stake × 2 × 0.9)
- **Draw**: Both players get their original stake back
- **Fee**: 10% of pot goes to bot system

### Database Structure

- `users/{userId}`: User coin balances and metadata
- `games/{gameId}`: Game state including stake information
- `transfers/{transferId}`: All coin transactions for audit trail

## Project Structure

```
src/
├── app/
│   ├── api/auth/[...nextauth]/route.ts  # NextAuth configuration
│   ├── game/[gameId]/page.tsx           # Game page
│   ├── lobby/page.tsx                   # Game lobby
│   ├── login/page.tsx                   # Login page
│   └── layout.tsx                       # Root layout
├── components/
│   ├── Header.tsx                       # Navigation header
│   ├── Providers.tsx                    # Auth providers
│   └── GameBoard.tsx                    # Game board component
├── games/
│   └── xo/                              # X/O game implementation
│       ├── game.ts                      # Game state management
│       ├── logic.ts                     # Game logic
│       ├── handlers.ts                  # Telegram bot handlers
│       └── index.ts                     # Game registration
├── lib/
│   ├── firebase.ts                      # Firebase configuration
│   ├── game.ts                          # Game types and utilities
│   ├── gameService.ts                   # Game service layer
│   └── coinService.ts                   # Coin management system
└── bot/
    ├── index.ts                         # Telegram bot entry point
    └── games/
        └── userStats.ts                 # User statistics tracking
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
