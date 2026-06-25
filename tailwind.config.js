/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#4338CA',
          600: '#3730A3',
          700: '#312E81',
          950: '#1E1B4B',
        },
        school: {
          gold: '#D4AF37',
          bg: '#F8F9FE',
        },
        app: {
          primary: '#4F46E5',
          primaryDark: '#3730A3',
          primaryLight: '#EEF2FF',
          background: '#F8FAFC',
          text: '#1E293B',
          muted: '#64748B',
          border: '#E2E8F0',
          link: '#1D4ED8',
        },
      },
    },
  },
  plugins: [],
};
