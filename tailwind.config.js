/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Rye', 'serif'],
        body: ['Special Elite', 'serif'],
        sans: ['Oswald', 'sans-serif'],
      },
      colors: {
        parchment: {
          50: '#fdf9f0',
          100: '#f9efdc',
          200: '#f4e4c1',
          300: '#ecd49a',
          400: '#dfc172',
          DEFAULT: '#f4e4c1',
        },
        dust: {
          100: '#e8d5b7',
          200: '#d4b896',
          300: '#c4a882',
          400: '#a8895e',
          500: '#8b6f47',
          600: '#6e5535',
          DEFAULT: '#c4a882',
        },
        charcoal: {
          600: '#3d3d3d',
          700: '#2d2d2d',
          800: '#1e1e1e',
          900: '#111111',
          DEFAULT: '#2d2d2d',
        },
        blood: {
          400: '#e53e3e',
          500: '#c53030',
          600: '#9b2c2c',
          700: '#742a2a',
          800: '#4a1212',
          DEFAULT: '#c53030',
        },
        gold: {
          300: '#f6d860',
          400: '#e6b830',
          500: '#c9a227',
          600: '#9d7a1c',
          DEFAULT: '#c9a227',
        },
        leather: {
          400: '#a0522d',
          500: '#8b4513',
          600: '#6b3d1e',
          700: '#4a2c0a',
          DEFAULT: '#6b3d1e',
        },
        iron: {
          400: '#6b7280',
          500: '#4b5563',
          600: '#374151',
          DEFAULT: '#4b5563',
        },
      },
      backgroundImage: {
        'wood-grain': "url('/textures/wood.svg')",
      },
      boxShadow: {
        wanted: '0 0 0 2px #c9a227, 0 0 0 6px #6b3d1e, 4px 4px 12px rgba(0,0,0,0.6)',
        panel: 'inset 0 2px 4px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.5)',
        'blood-glow': '0 0 20px rgba(197,48,48,0.6)',
        'gold-glow': '0 0 12px rgba(201,162,39,0.5)',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.85 },
        },
        dustDrift: {
          '0%': { transform: 'translateX(-10px)', opacity: 0 },
          '50%': { opacity: 0.4 },
          '100%': { transform: 'translateX(10px)', opacity: 0 },
        },
        pulseRed: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(197,48,48,0.4)' },
          '50%': { boxShadow: '0 0 24px rgba(197,48,48,0.9)' },
        },
        scrollTicker: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        flicker: 'flicker 3s ease-in-out infinite',
        'dust-drift': 'dustDrift 4s ease-in-out infinite',
        'pulse-red': 'pulseRed 1.5s ease-in-out infinite',
        'scroll-ticker': 'scrollTicker 20s linear infinite',
      },
    },
  },
  plugins: [],
};
