import type { Config } from "tailwindcss";

// Orchestra palette (Playbook): A=purple decision, B=teal workspace, gold=shared.
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        card: "var(--card)",
        surface: "var(--surface-raised)",
        ink: "var(--ink)",
        ink2: "var(--ink2)",
        muted: "var(--muted)",
        line: "var(--line)",
        blue: { DEFAULT: "var(--blue)", soft: "var(--blue-soft)", strong: "var(--blue-strong)" },
        a: { DEFAULT: "var(--ai)", soft: "var(--ai-soft)" },
        b: { DEFAULT: "var(--human)", soft: "var(--human-soft)" },
        gold: { DEFAULT: "var(--gold-ui)", soft: "var(--gold-soft-ui)" },
        good: "#15803D",
        bad: "#C62A2F",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
