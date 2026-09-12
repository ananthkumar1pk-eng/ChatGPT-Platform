import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, Auth } from "firebase/auth";

// Firebase configuration for project chatgpt-66492
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDEZl2BNSTvmjq0MVEHxTP1zVXQcLXuVLo",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "chatgpt-66492.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "chatgpt-66492",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "chatgpt-66492.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "24036767035",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:24036767035:web:b0e067f5c56acbf44bb31e",
};

// Initialize Firebase only once
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth: Auth = getAuth(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export interface FirebaseGoogleUser {
  idToken: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  uid: string;
}

/**
 * Triggers a Google Sign-In popup via Firebase Auth and retrieves the Firebase ID token.
 */
export async function signInWithGoogleFirebase(): Promise<FirebaseGoogleUser> {
  const currentKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig.apiKey;
  if (!currentKey) {
    throw new Error(
      "Firebase API Key is missing. Please add your NEXT_PUBLIC_FIREBASE_API_KEY in frontend/.env.local."
    );
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const idToken = await user.getIdToken();

    return {
      idToken,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      uid: user.uid,
    };
  } catch (err: any) {
    if (err.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in popup was closed before completing.");
    } else if (err.code === "auth/cancelled-popup-request") {
      throw new Error("Only one popup request is allowed at a time.");
    } else if (err.code === "auth/unauthorized-domain") {
      throw new Error(
        "Domain not authorized in Firebase Console. Please add 'localhost' in Firebase Console > Authentication > Settings > Authorized Domains."
      );
    } else if (err.code === "auth/configuration-not-found" || err.code === "auth/invalid-api-key") {
      throw new Error(
        "Invalid or missing Firebase API Key. Please verify your .env.local configuration."
      );
    } else if (err.code === "auth/popup-blocked") {
      throw new Error("Sign-in popup was blocked by your browser. Please allow popups for this site.");
    }
    throw err;
  }
}

export async function signOutFirebase(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.warn("Firebase sign out warning:", err);
  }
}

export default app;


