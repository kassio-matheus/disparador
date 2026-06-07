/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: "var(--font-geist)",
        mono: "var(--font-geist-mono)",
      },
      fontSize: {
        // Aumentar tamanhos de fonte para melhor visualização em 1920x1080
        xs: ["0.875rem", { lineHeight: "1.25rem" }], // 14px
        sm: ["1rem", { lineHeight: "1.5rem" }], // 16px
        base: ["1.125rem", { lineHeight: "1.75rem" }], // 18px
        lg: ["1.25rem", { lineHeight: "1.75rem" }], // 20px
        xl: ["1.5rem", { lineHeight: "2rem" }], // 24px
        "2xl": ["1.875rem", { lineHeight: "2.25rem" }], // 30px
        "3xl": ["2.25rem", { lineHeight: "2.5rem" }], // 36px
      },
      spacing: {
        // Espaçamentos maiores
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
    },
  },
  plugins: [],
};
