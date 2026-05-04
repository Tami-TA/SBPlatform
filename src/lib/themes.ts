export type ThemeId =
  | "light" | "warm" | "sepia" | "stone"
  | "dark" | "midnight" | "navy" | "slate" | "forest" | "dusk" | "ocean" | "amethyst"
  | "highcontrast";

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  isDark: boolean;
  /** [background, sidebar, accent, text] — used for the swatch preview */
  preview: [string, string, string, string];
}

export const DARK_THEMES = new Set<ThemeId>([
  "dark", "midnight", "navy", "slate", "forest", "dusk", "ocean", "amethyst",
]);

export const THEMES: ThemeConfig[] = [
  // ── Light themes ──────────────────────────────────────────────────────────
  {
    id: "light",
    name: "Default",
    isDark: false,
    preview: ["oklch(99% 0.003 250)", "oklch(97.5% 0.004 250)", "oklch(62% 0.045 245)", "oklch(22% 0.012 255)"],
  },
  {
    id: "warm",
    name: "Warm",
    isDark: false,
    preview: ["oklch(98% 0.012 85)", "oklch(96.5% 0.014 85)", "oklch(65% 0.085 60)", "oklch(23% 0.020 55)"],
  },
  {
    id: "sepia",
    name: "Sepia",
    isDark: false,
    preview: ["oklch(95% 0.030 80)", "oklch(92.5% 0.034 80)", "oklch(52% 0.070 40)", "oklch(24% 0.028 55)"],
  },
  {
    id: "stone",
    name: "Stone",
    isDark: false,
    preview: ["oklch(99% 0.002 220)", "oklch(97% 0.003 220)", "oklch(55% 0.055 225)", "oklch(20% 0.010 230)"],
  },
  // ── Dark themes ───────────────────────────────────────────────────────────
  {
    id: "dark",
    name: "Dark",
    isDark: true,
    preview: ["oklch(14% 0.012 248)", "oklch(11% 0.007 248)", "oklch(66% 0.055 245)", "oklch(93% 0.006 245)"],
  },
  {
    id: "midnight",
    name: "Midnight",
    isDark: true,
    preview: ["oklch(12% 0.016 260)", "oklch(9% 0.012 260)", "oklch(72% 0.065 255)", "oklch(96% 0.004 250)"],
  },
  {
    id: "navy",
    name: "Navy",
    isDark: true,
    preview: ["oklch(20% 0.035 240)", "oklch(16% 0.030 240)", "oklch(74% 0.090 225)", "oklch(95% 0.012 235)"],
  },
  {
    id: "slate",
    name: "Slate",
    isDark: true,
    preview: ["oklch(17% 0.008 225)", "oklch(13% 0.006 225)", "oklch(70% 0.055 225)", "oklch(95% 0.004 220)"],
  },
  {
    id: "forest",
    name: "Forest",
    isDark: true,
    preview: ["oklch(16% 0.022 150)", "oklch(12% 0.018 150)", "oklch(70% 0.090 155)", "oklch(95% 0.006 145)"],
  },
  {
    id: "dusk",
    name: "Dusk",
    isDark: true,
    preview: ["oklch(17% 0.024 55)", "oklch(13% 0.020 55)", "oklch(75% 0.110 62)", "oklch(96% 0.007 60)"],
  },
  {
    id: "ocean",
    name: "Ocean",
    isDark: true,
    preview: ["oklch(16% 0.025 200)", "oklch(12% 0.020 200)", "oklch(72% 0.095 195)", "oklch(96% 0.005 195)"],
  },
  {
    id: "amethyst",
    name: "Amethyst",
    isDark: true,
    preview: ["oklch(16% 0.020 290)", "oklch(12% 0.016 290)", "oklch(72% 0.080 295)", "oklch(95% 0.005 285)"],
  },
  {
    id: "highcontrast",
    name: "High Contrast",
    isDark: false,
    preview: ["oklch(100% 0 0)", "oklch(92% 0 0)", "oklch(22% 0.20 264)", "oklch(0% 0 0)"],
  },
];
