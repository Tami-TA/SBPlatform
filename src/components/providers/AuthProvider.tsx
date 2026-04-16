"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";

const IS_DEMO_MODE =
  typeof window !== "undefined" &&
  (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "placeholder-api-key" ||
    (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "").startsWith("placeholder"));

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setFirebaseUser, setLoading } = useAuthStore();

  useEffect(() => {
    if (IS_DEMO_MODE) {
      // Demo mode: restore session from localStorage
      import("@/lib/demo-store").then(({ demoGetSession, demoGetUser }) => {
        const uid = demoGetSession();
        if (uid) {
          const profile = demoGetUser(uid);
          setUser(profile);
        }
        setLoading(false);
      });
      return;
    }

    // Real Firebase mode
    import("@/lib/firebase").then(({ auth }) => {
      import("firebase/auth").then(({ onAuthStateChanged }) => {
        import("@/lib/firestore").then(({ getUserProfile }) => {
          const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setFirebaseUser(fbUser);
            if (fbUser) {
              const profile = await getUserProfile(fbUser.uid);
              setUser(profile);
            } else {
              setUser(null);
            }
            setLoading(false);
          });
          return unsubscribe;
        });
      });
    });
  }, [setUser, setFirebaseUser, setLoading]);

  return <>{children}</>;
}
