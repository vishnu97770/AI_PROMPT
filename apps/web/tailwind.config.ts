import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border:   "hsl(var(--border))",
        input:    "hsl(var(--input))",
        ring:     "hsl(var(--ring))",
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        surface: {
          1: "hsl(var(--surface-1))",
          2: "hsl(var(--surface-2))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        /* Dialog / Sheet */
        "overlay-show":   { from: { opacity: "0" }, to: { opacity: "1" } },
        "overlay-hide":   { from: { opacity: "1" }, to: { opacity: "0" } },
        "content-show": {
          from: { opacity: "0", transform: "translate(-50%,-48%) scale(.97)" },
          to:   { opacity: "1", transform: "translate(-50%,-50%) scale(1)"   },
        },
        "content-hide": {
          from: { opacity: "1", transform: "translate(-50%,-50%) scale(1)"   },
          to:   { opacity: "0", transform: "translate(-50%,-48%) scale(.97)" },
        },
        /* Sidebar slide */
        "slide-in-left": {
          from: { transform: "translateX(-100%)" },
          to:   { transform: "translateX(0)" },
        },
        "slide-out-left": {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-100%)" },
        },
        /* Dropdown */
        "fade-in-down": {
          from: { opacity: "0", transform: "translateY(-4px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out-up": {
          from: { opacity: "1", transform: "translateY(0)" },
          to:   { opacity: "0", transform: "translateY(-4px)" },
        },
        /* Generic */
        "fade-in":  { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-out": { from: { opacity: "1" }, to: { opacity: "0" } },
        /* Spinner */
        spin: {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
        /* Skeleton pulse */
        shimmer: {
          "0%,100%": { opacity: "1" },
          "50%":     { opacity: "0.4" },
        },
      },
      animation: {
        "overlay-show":   "overlay-show 0.15s ease-out",
        "overlay-hide":   "overlay-hide 0.15s ease-in",
        "content-show":   "content-show 0.2s cubic-bezier(0.16,1,0.3,1)",
        "content-hide":   "content-hide 0.15s ease-in",
        "slide-in-left":  "slide-in-left 0.2s ease-out",
        "slide-out-left": "slide-out-left 0.2s ease-in",
        "fade-in-down":   "fade-in-down 0.15s ease-out",
        "fade-out-up":    "fade-out-up 0.15s ease-in",
        "fade-in":        "fade-in 0.15s ease-out",
        "fade-out":       "fade-out 0.1s ease-in",
        shimmer:          "shimmer 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [typography],
};

export default config;
