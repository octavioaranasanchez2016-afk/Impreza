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
          muted: "#8A8A8D",
        },
        paper: {
          DEFAULT: "#FFFFFF",
          soft: "#F4F4F4",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        brand: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
