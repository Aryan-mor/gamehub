"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = void 0;
const app_1 = require("firebase/app");
const database_1 = require("firebase/database");
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    databaseURL: process.env.FIREBASE_DATABASE_URL || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
};
const app = (0, app_1.initializeApp)(firebaseConfig);
exports.database = (0, database_1.getDatabase)(app);
exports.default = app;
//# sourceMappingURL=firebase.js.map