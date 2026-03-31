/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forge: {
          bg: '#080808',
          surface: '#0F0F0F',
          card: '#161616',
          border: '#252525',
          muted: '#4A4A4A',
          dim: '#777777',
          text: '#F0F0F0',
          accent: '#C8FF00',
          'accent-dim': '#8CAD00',
          danger: '#FF3333',
          success: '#00D97E',
          blue: '#4D9EFF',
        }
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
        body: ['Barlow', 'sans-serif'],
        condensed: ['"Barlow Condensed"', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.3s ease forwards',
        'pulse-slow': 'pulse 3s ease infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
