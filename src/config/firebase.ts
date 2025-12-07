/**
 * Firebase Configuration
 *
 * To set up Firebase for your project:
 *
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project
 * 3. Enable Realtime Database
 * 4. Copy your config below
 * 5. Update this file with your credentials
 *
 * Security Rules for Realtime Database:
 * {
 *   "rules": {
 *     "commands": {
 *       ".read": true,
 *       ".write": true,
 *       "$code": {
 *         ".validate": "newData.val().code !== null"
 *       }
 *     },
 *     "status": {
 *       ".read": true,
 *       ".write": true,
 *       "$code": {
 *         "$room": {
 *           ".validate": "newData.val().roomId !== null"
 *         }
 *       }
 *     }
 *   }
 * }
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  databaseURL: string;
}

/**
 * Your Firebase configuration
 * Replace with your actual Firebase project credentials
 */
// Vite exposes env via import.meta.env; fall back to process.env if available
const readEnv = (key: string): string => {
  // Ensure process.env exists in browser build to avoid ReferenceError
  if (typeof (globalThis as any).process === 'undefined') {
    (globalThis as any).process = { env: {} } as any;
  }
  return (
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]) ||
    (typeof process !== 'undefined' && process.env?.[key]) ||
    ''
  );
};

export const firebaseConfig: FirebaseConfig = {
  apiKey: readEnv('VITE_FIREBASE_API_KEY'),
  authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnv('VITE_FIREBASE_APP_ID'),
  databaseURL: readEnv('VITE_FIREBASE_DATABASE_URL'),
};

/**
 * Check if Firebase is configured
 */
export function isFirebaseConfigured(): boolean {
  return Object.values(firebaseConfig).every((value) => value !== '');
}

/**
 * Validate Firebase config
 */
export function validateFirebaseConfig(config: FirebaseConfig): boolean {
  const required = ['apiKey', 'authDomain', 'projectId', 'databaseURL'];
  return required.every((key) => config[key as keyof FirebaseConfig] !== '');
}
