// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // couleur principale
        brand: {
          DEFAULT: "#fe7a2e",  // bg-brand / text-brand
          light: "#ff9b5c",    // hover
          dark: "#cc5f20",     // actif
        },
        // fonds globaux
        background: {
          DEFAULT: "#000000",  // bg-background
          card: "#0f0f10",     // bg-background-card
          soft: "#141416",     // bg-background-soft
        },
        // textes
        textc: {
          DEFAULT: "#ffffff",  // text-textc
          muted: "#a1a1aa",    // text-textc-muted
        },
        // bordures
        borderc: {
          DEFAULT: "#1f1f22",  // border-borderc
        },
      },
    },
  },
  plugins: [],
};
