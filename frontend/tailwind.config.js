export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#FAF9f6',
          100: '#F5F3EF',
          200: '#EBE7DF',
          300: '#DDD7CB',
          400: '#C5BCAB',
          500: '#A99E8B',
          800: '#4A443A',
          900: '#2C2720',
        },
        slate: {
          850: '#151E2E',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
