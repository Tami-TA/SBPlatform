"use client";
import { useAuthStore } from "@/store/auth-store";

export function useAuth() {
  const { user, firebaseUser, loading, setUser, setFirebaseUser, setLoading } =
    useAuthStore();

  const signOut = async () => {
    const isDemo =
      !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "placeholder-api-key" ||
      (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "").startsWith("placeholder");

    if (isDemo) {
      const { demoLogout } = await import("@/lib/demo-store");
      demoLogout();
    } else {
      const { auth } = await import("@/lib/firebase");
      const { signOut: firebaseSignOut } = await import("firebase/auth");
      await firebaseSignOut(auth);
    }
    setUser(null);
    setFirebaseUser(null);
  };

  return { user, firebaseUser, loading, signOut };
}
