import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        panel: "var(--panel)",
        chip: "var(--chip)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        cream: "#EDEBE4",
        charcoal: "#262220",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono Variable"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl2: "20px",
        xl3: "28px",
      },
      boxShadow: {
        soft: "0 18px 40px -20px rgba(38,34,32,0.28)",
        chip: "0 10px 24px -12px rgba(38,34,32,0.25)",
        pop: "0 24px 60px -24px rgba(38,34,32,0.45)",
      },
      letterSpacing: {
        eyebrow: "0.28em",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-6px)" },
          "40%": { transform: "translateX(6px)" },
          "60%": { transform: "translateX(-4px)" },
          "80%": { transform: "translateX(4px)" },
        },
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        blink: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.25" },
        },
      },
      animation: {
        fadeUp: "fadeUp .5s cubic-bezier(.22,.9,.3,1) both",
        fadeIn: "fadeIn .35s ease both",
        shake: "shake .4s ease",
        floaty: "floaty 5s ease-in-out infinite",
        blink: "blink 1.1s ease infinite",
      },
    },
  },
  plugins: [],
};

export default config;
