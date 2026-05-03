import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ThemeId } from "@/lib/themes";

interface ThemeState {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "dark" as ThemeId,
      setTheme: (theme) => set({ theme }),
    }),
    { name: "sb-theme" }
  )
);
