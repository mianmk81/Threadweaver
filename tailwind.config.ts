import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cosmic: {
          dark: "#0a0a0f",
          darker: "#05050a",
          slate: "#1a1a2e",
        },
        gold: {
          DEFAULT: "#FFD700",
          light: "#FFE55C",
          dark: "#CCA300",
        },
        emerald: {
          DEFAULT: "#10B981",
          light: "#34D399",
          dark: "#059669",
        },
      },
      backgroundImage: {
        "cosmic-gradient": "radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0f 50%, #05050a 100%)",
        "thread-glow": "linear-gradient(90deg, rgba(255,215,0,0.1) 0%, rgba(16,185,129,0.1) 100%)",
      },
      animation: {
        "glow-pulse": "glow 3s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "rune-burst": "runeBurst 0.6s ease-out",
      },
      keyframes: {
        glow: {
          "0%, 100%": { opacity: "0.5", filter: "blur(8px)" },
          "50%": { opacity: "1", filter: "blur(12px)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        runeBurst: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "50%": { transform: "scale(1.2)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      boxShadow: {
        "glow-gold": "0 0 20px rgba(255, 215, 0, 0.5)",
        "glow-emerald": "0 0 20px rgba(16, 185, 129, 0.5)",
      },
    },
  },
  plugins: [],
};
export default config;
