"use client";
import { useEffect } from "react";
import { useThemeStore } from "@/store/theme-store";
import { DARK_THEMES } from "@/lib/themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;

    // Remove any previously applied theme classes
    const stale = Array.from(root.classList).filter(
      (c) => c.startsWith("theme-") || c === "dark"
    );
    stale.forEach((c) => root.classList.remove(c));

    // Apply the new theme
    if (theme !== "light") {
      root.classList.add(`theme-${theme}`);
    }
    // Add .dark so Tailwind dark: variants and existing .dark{} rules apply
    if (DARK_THEMES.has(theme)) {
      root.classList.add("dark");
    }
  }, [theme]);

  return <>{children}</>;
}
