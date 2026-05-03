"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setFirebaseUser, setLoading } = useAuthStore();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    Promise.all([
      import("@/lib/firebase"),
      import("firebase/auth"),
      import("@/lib/firestore"),
    ]).then(([{ auth }, { onAuthStateChanged }, { getUserProfile }]) => {
      unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        setFirebaseUser(fbUser);
        if (fbUser) {
          try {
            const profile = await getUserProfile(fbUser.uid);
            setUser(profile);
          } catch (err) {
            console.error("Failed to load user profile:", err);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });
    }).catch((err) => {
      console.error("Firebase initialization failed:", err);
      setLoading(false);
    });

    return () => unsubscribe?.();
  }, [setUser, setFirebaseUser, setLoading]);

  return <>{children}</>;
}
