import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getDatabase, Database } from "firebase/database";

// Debug: Log the database URL to see what's being loaded
console.log(
  "🔍 FIREBASE DEBUG - Database URL:",
  process.env.FIREBASE_DATABASE_URL
);

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "demo-api-key",
  authDomain:
    process.env.FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "demo-project-id",
  storageBucket:
    process.env.FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.FIREBASE_APP_ID || "demo-app-id",
  databaseURL:
    process.env.FIREBASE_DATABASE_URL ||
    "https://demo-project-id-default-rtdb.firebaseio.com",
};

// Check if we're in development and Firebase config is not set up
const isDevelopment = process.env.NODE_ENV === "development";
const hasFirebaseConfig =
  process.env.FIREBASE_API_KEY &&
  process.env.FIREBASE_API_KEY !== "your-firebase-api-key";

if (isDevelopment && !hasFirebaseConfig) {
  console.warn(`
🚨 Firebase Configuration Missing!

To fix this error, please:

1. Go to https://console.firebase.google.com/
2. Create a new project or select an existing one
3. Add a web app to your project
4. Copy the Firebase config to your .env.local file:

FIREBASE_API_KEY=your-actual-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com

5. Enable Realtime Database in your Firebase project
6. Set database rules to allow read/write access
  `);
}

// Initialize Firebase
let app: ReturnType<typeof initializeApp> | undefined;
let auth: Auth | undefined;
let database: Database | undefined;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  database = getDatabase(app);
} catch (error) {
  console.error("Failed to initialize Firebase:", error);

  if (isDevelopment) {
    console.error(`
Please check your Firebase configuration in .env.local file.
Make sure all FIREBASE_* variables are set correctly.
    `);
  }
}

export { auth, database };
export default app;
