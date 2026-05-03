"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import type { ThemeId } from "@/lib/themes";
import { THEMES } from "@/lib/themes";
import toast from "react-hot-toast";

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

      // Handle return from signInWithRedirect
      getRedirectResult(auth).then(async (result) => {
        if (!result) return;
        console.log("[Auth] getRedirectResult — user:", result.user.uid);
        setFirebaseUser(result.user);
        let profile = null;
        try { profile = await getUserProfile(result.user.uid); } catch (e) {
          console.warn("[Auth] getUserProfile failed after redirect:", e);
        }
        if (profile) {
          setUser(profile);
          router.replace("/dashboard");
        } else {
          router.replace("/auth/setup");
        }
      }).catch((err: unknown) => {
        const code = (err as { code?: string }).code ?? "";
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[Auth] getRedirectResult error — code:", code, msg);
        if (code && code !== "auth/no-auth-event") {
          toast.error(`Google sign-in failed (${code})`);
        }
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
