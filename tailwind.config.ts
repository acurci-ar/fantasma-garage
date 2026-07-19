import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#070A0D",
        card: "#023859",
        secondary: "#03658C",
        primary: "#05C7F2",
        foreground: "#EBF2F2",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
      },
      transitionDuration: {
        180: "180ms",
        220: "220ms",
        320: "320ms",
        500: "500ms",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(5, 199, 242, 0.35), 0 8px 30px rgba(5, 199, 242, 0.12)",
      },
      backgroundImage: {
        "fade-bottom":
          "linear-gradient(to bottom, rgba(7,10,13,0) 0%, rgba(7,10,13,0.85) 75%, #070A0D 100%)",
        "fade-radial":
          "radial-gradient(120% 120% at 50% 0%, rgba(5,199,242,0.08) 0%, rgba(7,10,13,0) 60%)",
      },
      maxWidth: {
        content: "1280px",
      },
    },
  },
  plugins: [],
};

export default config;
