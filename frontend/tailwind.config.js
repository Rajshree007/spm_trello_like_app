/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#e6f3ff',
          100: '#cce7ff',
          200: '#99ceff',
          300: '#66b5ff',
          400: '#1a8fff',
          500: '#0079bf',
          600: '#026aa7',
          700: '#015a8e',
          800: '#014976',
          900: '#013663',
        },
      },
      boxShadow: {
        card:       '0 1px 3px rgba(9,30,66,0.13), 0 0 0 1px rgba(9,30,66,0.06)',
        'card-lg':  '0 8px 24px rgba(9,30,66,0.2), 0 2px 6px rgba(9,30,66,0.12)',
        list:       '0 2px 8px rgba(9,30,66,0.12)',
        modal:      '0 24px 64px rgba(9,30,66,0.35)',
        'inner-sm': 'inset 0 1px 2px rgba(0,0,0,0.06)',
      },
      backgroundImage: {
        'auth-gradient': 'linear-gradient(135deg, #0047ab 0%, #0079bf 55%, #00a0d2 100%)',
      },
      animation: {
        'fade-in':   'fadeIn 0.2s ease-out both',
        'slide-up':  'slideUp 0.25s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':  'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1) both',
        'shimmer':   'shimmer 1.6s linear infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
