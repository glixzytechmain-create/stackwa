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
  db = getFirestore(app);
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

// Firestore Progress Sync
export interface UserProgressData {
  solvedProblems: string[];
  completedUiFlows: string[];
  streakDays: number;
  lastActive: string;
  interviewScore: number;
}

export async function saveUserProgress(userId: string, data: Partial<UserProgressData>) {
  try {
    if (!db) {
      // LocalStorage fallback
      const prev = JSON.parse(localStorage.getItem(`stackwa_progress_${userId}`) || '{}');
      localStorage.setItem(`stackwa_progress_${userId}`, JSON.stringify({ ...prev, ...data }));
      return;
    }
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.warn("Firestore save fallback to local storage:", e);
    const prev = JSON.parse(localStorage.getItem(`stackwa_progress_${userId}`) || '{}');
    localStorage.setItem(`stackwa_progress_${userId}`, JSON.stringify({ ...prev, ...data }));
  }
}

export async function loadUserProgress(userId: string): Promise<UserProgressData | null> {
  try {
    if (!db) {
      return JSON.parse(localStorage.getItem(`stackwa_progress_${userId}`) || 'null');
    }
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProgressData;
    }
    return JSON.parse(localStorage.getItem(`stackwa_progress_${userId}`) || 'null');
  } catch (e) {
    console.warn("Firestore load fallback to local storage:", e);
    return JSON.parse(localStorage.getItem(`stackwa_progress_${userId}`) || 'null');
  }
}

export { auth, db };
