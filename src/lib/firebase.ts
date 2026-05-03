// ── Firebase client initialization ────────────────────────────────────────────
//
// NEXT_PUBLIC_* env vars are statically inlined at bundle compile time. If the
// dev server was started before .env.local existed (or was empty), those values
// are undefined in the bundle even after you populate .env.local.
//
// This module uses top-level await so that when any code does:
//   const { auth } = await import("@/lib/firebase")
// the dynamic-import Promise doesn't resolve until getConfig() completes,
// giving callers the real Auth/Firestore/Storage instances, never a Promise.
//
// getConfig() prefers inlined NEXT_PUBLIC_ values; if they're missing it calls
// /api/config which reads process.env at request time on the server and always
// returns current values — no server restart needed.

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

let _fetchPromise: Promise<FirebaseConfig> | null = null;

function getInlinedConfig(): FirebaseConfig | null {
  const c = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  if (c.apiKey && c.authDomain && c.projectId && c.storageBucket && c.messagingSenderId && c.appId) {
    return c as FirebaseConfig;
  }
  return null;
}

async function getConfig(): Promise<FirebaseConfig> {
  const inlined = getInlinedConfig();
  if (inlined) {
    console.log("[Firebase] using inlined NEXT_PUBLIC_ config, apiKey prefix:", inlined.apiKey.slice(0, 8));
    return inlined;
  }

  console.warn("[Firebase] NEXT_PUBLIC_ vars missing — fetching config from /api/config");
  // Fallback: fetch from the server-side /api/config endpoint.
  // The server reads process.env at request time so it always has current values.
  if (!_fetchPromise) {
    _fetchPromise = fetch("/api/config")
      .then((res) => {
        if (!res.ok) {
          return res.json().then((b: { error?: string }) => {
            throw new Error(b.error ?? `Firebase config endpoint returned ${res.status}`);
          });
        }
        return res.json() as Promise<FirebaseConfig>;
      })
      .then((cfg) => {
        console.log("[Firebase] /api/config OK, apiKey prefix:", cfg.apiKey.slice(0, 8));
        return cfg;
      })
      .catch((err) => {
        console.error("[Firebase] /api/config fetch failed:", err);
        _fetchPromise = null;
        throw err;
      });
  }
  return _fetchPromise;
}

// Top-level await — all `await import("@/lib/firebase")` callers wait here
// before receiving the module exports, so auth/db/storage are always the
// real instances, never undefined.
const config = await getConfig();
const app = getApps().length > 0 ? getApp() : initializeApp(config);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");

export const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");

export default app;
