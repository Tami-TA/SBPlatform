"use client";
import { useAuthStore } from "@/store/auth-store";

export function useAuth() {
  const { user, firebaseUser, loading, setUser, setFirebaseUser } = useAuthStore();

  const signOut = async () => {
    try {
      const { auth } = await import("@/lib/firebase");
      const { signOut: firebaseSignOut } = await import("firebase/auth");
      await firebaseSignOut(auth);
    } catch (err) {
      console.error("Sign out failed:", err);
    }
    setUser(null);
    setFirebaseUser(null);
  };

  return { user, firebaseUser, loading, signOut };
}
