/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        chroma: {
          dark: '#0B0D14',
          card: '#121624',
          border: '#1E2438',
          accent: '#6366F1',
          gold: '#FFB800',
        },
      },
    },
  },
  plugins: [],
};
