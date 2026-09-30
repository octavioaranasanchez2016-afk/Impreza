import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#111111",
          soft: "#3A3A3D",
          muted: "#6B6B70", // contraste 5:1 sobre blanco: se lee bien aun con sol
        },
        paper: {
          DEFAULT: "#FFFFFF",
          soft: "#F4F4F4",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Impact", "sans-serif"],
      },
      borderRadius: {
        brand: "10px",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        pop: {
          "0%": { transform: "scale(0.85)" },
          "60%": { transform: "scale(1.12)" },
          "100%": { transform: "scale(1)" },
        },
        stripes: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "17px 0" },
        },
      },
      animation: {
        marquee: "marquee 35s linear infinite",
        pop: "pop 400ms ease-out",
        stripes: "stripes 1s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
