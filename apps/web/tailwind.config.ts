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
        ink: "var(--ink)",
        ink2: "var(--ink2)",
        muted: "var(--muted)",
        line: "var(--line)",
        a: { DEFAULT: "#5A4BD4", soft: "#EDE9FF" },
        b: { DEFAULT: "#0E9C8B", soft: "#DFF4F0" },
        gold: { DEFAULT: "#B27916", soft: "#F7EED8" },
        good: "#1E9A69",
        bad: "#BB4C3B",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
