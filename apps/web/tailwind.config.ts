import type { Config } from "tailwindcss";

// Orchestra palette (Playbook): A=purple decision, B=teal workspace, gold=shared.
// Colors resolve to CSS variables (app/globals.css) so light/dark swap at the root.
// Class vocabulary is the contract with @orchestra/ui (see packages/ui/README.md).
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        card: "var(--card)",
        ink: "var(--ink)",
        ink2: "var(--ink2)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        line: "var(--line)",
        a: { DEFAULT: "var(--a)", soft: "var(--a-soft)", line: "var(--a-line)" },
        b: {
          DEFAULT: "var(--b)",
          soft: "var(--b-soft)",
          line: "var(--b-line)",
          deep: "var(--b-deep)",
          strong: "var(--b-strong)",
        },
        gold: { DEFAULT: "var(--gold)", soft: "var(--gold-soft)", line: "var(--gold-line)" },
        good: { DEFAULT: "var(--good)", soft: "var(--good-soft)" },
        bad: { DEFAULT: "var(--bad)", soft: "var(--bad-soft)" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Newsreader", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "var(--shadow)",
        "card-lg": "var(--shadow-lg)",
        "glow-b": "var(--glow-b)",
        "glow-a": "var(--glow-a)",
        "glow-b-hover": "var(--glow-b-hover)",
      },
      backgroundImage: {
        "grad-brand": "var(--grad-brand)",
        "grad-b": "var(--grad-b)",
        "grad-a": "var(--grad-a)",
        "grad-gold": "var(--grad-gold)",
        "grad-mesh": "var(--grad-mesh)",
      },
      borderRadius: {
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
