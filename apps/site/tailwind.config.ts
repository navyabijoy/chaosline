import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Page surfaces
        surface: "var(--bg-page)",
        raised: "var(--bg-card)",
        sunken: "var(--bg-sunken)",
        paper: "#FFFFFF",
        "bg-dark": "#0A0A0C",

        // Ink
        ink: "var(--ink-900)",
        body: "var(--ink-700)",
        muted: "var(--ink-500)",
        subtle: "var(--ink-400)",

        // Lines
        line: "var(--border)",
        "line-strong": "var(--border-strong)",

        // Accents
        primary: "#0066CC",
        "primary-focus": "#0071E3",

        // Verdict colors
        "verdict-harmful": "#FF3B30",
        "verdict-silent": "#FF9500",
        "verdict-safe": "#34C759",
        "verdict-degraded": "#FFCC00",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "Menlo", "monospace"],
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "hero":        ["72px", { lineHeight: "1.04", letterSpacing: "-0.035em", fontWeight: "600" }],
        "display-lg":  ["56px", { lineHeight: "1.07", letterSpacing: "-0.03em",  fontWeight: "600" }],
        "display-md":  ["44px", { lineHeight: "1.1",  letterSpacing: "-0.025em", fontWeight: "600" }],
        "display-sm":  ["36px", { lineHeight: "1.12", letterSpacing: "-0.02em",  fontWeight: "600" }],
        "lead":        ["20px", { lineHeight: "1.6",  letterSpacing: "-0.01em",  fontWeight: "400" }],
        "body-lg":     ["17px", { lineHeight: "1.65", letterSpacing: "-0.01em",  fontWeight: "400" }],
        "body-base":   ["15px", { lineHeight: "1.6",  letterSpacing: "0em",      fontWeight: "400" }],
        "caption":     ["13px", { lineHeight: "1.5",  letterSpacing: "0em",      fontWeight: "400" }],
        "label":       ["11px", { lineHeight: "1.0",  letterSpacing: "0.1em",    fontWeight: "500" }],
      },
      borderRadius: {
        none: "0px",
        xs:   "5px",
        sm:   "8px",
        md:   "12px",
        lg:   "16px",
        xl:   "20px",
        "2xl":"24px",
        pill: "9999px",
      },
      spacing: {
        xxs: "4px",
        xs:  "8px",
        sm:  "12px",
        md:  "16px",
        lg:  "24px",
        xl:  "32px",
        xxl: "48px",
        section: "96px",
      },
      boxShadow: {
        "card": "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.08), 0 16px 40px rgba(0,0,0,0.06)",
        "terminal": "0 0 0 1px rgba(0,0,0,0.12), 0 32px 80px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.3)",
        "nav": "0 1px 0 rgba(0,0,0,0.06)",
      },
      animation: {
        "fade-in":    "fadeIn 0.5s ease-in-out",
        "slide-up":   "slideUp 0.5s ease-out",
        "pulse-glow": "pulseGlow 2.5s ease-in-out infinite",
        "blink":      "blink 1s step-end infinite",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255,59,48,0.0)" },
          "50%":       { boxShadow: "0 0 40px 8px rgba(255,59,48,0.12)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0" },
        },
      },
    },
  },
  plugins: [typography],
};

export default config;
