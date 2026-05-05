import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { initializeFirestore, memoryLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase config values are intentionally public (NEXT_PUBLIC_).
// Firebase security is enforced by Firestore Security Rules, not by
// keeping these values secret. Hardcoding them here removes all
// env-var timing issues (Next.js 16 inlines NEXT_PUBLIC_ at build time,
// so values must be present when the bundle is compiled).
const firebaseConfig = {
  apiKey: "AIzaSyDxnzFi_ypj7nrd8oGV48DY2KSsbiopuK4",
  authDomain: "sbplanner-2aa7b.firebaseapp.com",
  projectId: "sbplanner-2aa7b",
  storageBucket: "sbplanner-2aa7b.firebasestorage.app",
  messagingSenderId: "568601186495",
  appId: "1:568601186495:web:cf97813095c4c7250a360a",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
// memoryLocalCache disables offline queuing so writes fail fast with a real
// error code instead of hanging silently when the server is unreachable.
export const db = initializeFirestore(app, { localCache: memoryLocalCache(), ignoreUndefinedProperties: true });
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");

export const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");

export default app;
