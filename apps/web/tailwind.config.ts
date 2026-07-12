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
        surface: "var(--surface)",
        field: "var(--field)",
        ink: "var(--ink)",
        ink2: "var(--ink2)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        line: "var(--line)",
        // BLUE — the brand/hero (chrome only: buttons, nav, focus, links)
        brand: {
          DEFAULT: "var(--brand)",
          deep: "var(--brand-deep)",
          soft: "var(--brand-soft)",
          line: "var(--brand-line)",
        },
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
      // Editorial type scale (research-derived: Linear/Vercel/Stripe, bumped for
      // projector legibility). Negative tracking scales with size; serif stays 500.
      fontSize: {
        display: ["clamp(2.75rem, 5vw, 4rem)", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
        h1: ["clamp(2rem, 3.5vw, 2.75rem)", { lineHeight: "1.06", letterSpacing: "-0.02em" }],
        h2: ["clamp(1.5rem, 2.2vw, 1.875rem)", { lineHeight: "1.18", letterSpacing: "-0.015em" }],
        "body-lg": ["1.125rem", { lineHeight: "1.55" }],
        eyebrow: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.14em" }],
      },
      boxShadow: {
        card: "var(--shadow)",
        "card-lg": "var(--shadow-lg)",
        "glow-brand": "var(--glow-brand)",
        "glow-brand-hover": "var(--glow-brand-hover)",
        "glow-b": "var(--glow-b)",
        "glow-a": "var(--glow-a)",
        "glow-b-hover": "var(--glow-b-hover)",
      },
      backgroundImage: {
        "grad-brand": "var(--grad-brand)",
        "grad-cta": "var(--grad-cta)",
        "grad-b": "var(--grad-b)",
        "grad-a": "var(--grad-a)",
        "grad-gold": "var(--grad-gold)",
        "grad-mesh": "var(--grad-mesh)",
        "grad-aurora": "var(--grad-aurora)",
      },
      borderRadius: {
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
