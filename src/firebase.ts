import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  type Auth,
  type User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  type Firestore 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDOTsYQ-U-P7TmCUaBRdaHTrNSGu0_L5kw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0953455656.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0953455656",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0953455656.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1027051421980",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1027051421980:web:4148f96581b22e255fbad9"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || 'ai-studio-bizovistaimanufa-3efa9451-770e-4279-b012-a145b3bf179d';
  db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
} catch (error) {
  console.warn("Firebase initialization warning (running in resilient mode):", error);
}

// Authentication Helpers
export async function loginAsGuest(): Promise<User | null> {
  try {
    if (!auth) return null;
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (error) {
    console.error("Guest login failed:", error);
    return null;
  }
}

export async function loginWithGoogle(): Promise<User | null> {
  try {
    if (!auth) return null;
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    // If popup blocked or cancelled, fallback to guest signin
    return loginAsGuest();
  }
}

export async function logoutUser(): Promise<void> {
  try {
    if (auth) await fbSignOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
  }
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// Firestore Progress & Multi-Device Account Sync
export interface UserProgressData {
  goals?: any[];
  profile?: any;
  roadmap?: any[];
  solvedProblems?: string[];
  completedUiFlows?: string[];
  streakDays?: number;
  lastActive?: string;
  interviewScore?: number;
  generatedQuestions?: Record<string, any>;
  settings?: any;
}

export async function saveUserProgress(userId: string, data: Partial<UserProgressData>) {
  try {
    // Always mirror to localStorage as offline cache
    const prev = JSON.parse(localStorage.getItem(`stackwa_account_${userId}`) || '{}');
    const merged = { ...prev, ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(`stackwa_account_${userId}`, JSON.stringify(merged));

    if (!db) return;
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, merged, { merge: true });
  } catch (e) {
    console.warn("Firestore save fallback to local storage:", e);
  }
}

export async function loadUserProgress(userId: string): Promise<UserProgressData | null> {
  try {
    if (db) {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data() as UserProgressData;
        // Keep local cache fresh
        localStorage.setItem(`stackwa_account_${userId}`, JSON.stringify(data));
        return data;
      }
    }
    return JSON.parse(localStorage.getItem(`stackwa_account_${userId}`) || 'null');
  } catch (e) {
    console.warn("Firestore load fallback to local storage:", e);
    return JSON.parse(localStorage.getItem(`stackwa_account_${userId}`) || 'null');
  }
}

export { auth, db };
