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

1. **Login**: Sign in with your Google account
2. **Create Game**: Click "Create Game" to start a new match
3. **Share Code**: Copy the 6-character game code and share it with a friend
4. **Join Game**: Enter the game code to join an existing game
5. **Play**: Take turns placing X and O on the 3x3 grid
6. **Win**: Get three in a row to win the game!

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
│   └── TicTacToeBoard.tsx              # Game board component
└── lib/
    ├── auth.ts                          # Auth configuration
    ├── firebase.ts                      # Firebase setup
    ├── game.ts                          # Game types and utilities
    └── gameService.ts                   # Firebase game operations
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

If you encounter any issues:

1. Check the console for error messages
2. Verify your environment variables
3. Ensure Firebase rules are set correctly
4. Check that Google OAuth is properly configured

---

Built with ❤️ using Next.js, TypeScript, and Firebase
