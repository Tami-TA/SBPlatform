"use client";
import { useThemeStore } from "@/store/theme-store";

/** Thin wrapper around the theme store. ThemeProvider handles DOM application. */
export function useTheme() {
  const { theme, setTheme } = useThemeStore();
  return { theme, setTheme };
}
