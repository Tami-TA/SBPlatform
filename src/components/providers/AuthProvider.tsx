"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import type { ThemeId } from "@/lib/themes";
import { THEMES } from "@/lib/themes";

const VALID_THEME_IDS = new Set(THEMES.map((t) => t.id));

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setFirebaseUser, setLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    Promise.all([
      import("@/lib/firebase"),
      import("firebase/auth"),
      import("@/lib/firestore"),
    ]).then(([{ auth }, { onAuthStateChanged, getRedirectResult }, { getUserProfile }]) => {

      // Handle the return from signInWithRedirect (Google/Apple OAuth)
      getRedirectResult(auth).then(async (result) => {
        if (!result) return;
        setFirebaseUser(result.user);
        let profile = null;
        try { profile = await getUserProfile(result.user.uid); } catch { /* new user */ }
        if (profile) {
          setUser(profile);
          router.replace("/dashboard");
        } else {
          router.replace("/auth/setup");
        }
      }).catch((err) => {
        console.error("Redirect result error:", err);
      });

      unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        setFirebaseUser(fbUser);
        if (fbUser) {
          try {
            const profile = await getUserProfile(fbUser.uid);
            setUser(profile);
            if (profile?.theme && VALID_THEME_IDS.has(profile.theme as ThemeId)) {
              useThemeStore.getState().setTheme(profile.theme as ThemeId);
            }
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
  }, [setUser, setFirebaseUser, setLoading, router]);

  return <>{children}</>;
}
