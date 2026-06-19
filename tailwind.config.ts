import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          900: "#0f172a",
        },
        success: "#10b981",
        danger: "#ef4444",
        warning: "#f59e0b",
      },
      boxShadow: {
        soft: "0 8px 32px rgba(15, 23, 42, 0.06)",
        card: "0 4px 24px rgba(15, 23, 42, 0.05)",
        glow: "0 0 40px rgba(37, 99, 235, 0.15)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
