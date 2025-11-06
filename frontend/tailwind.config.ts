import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // VOCH Brand Colors
        primary: {
          DEFAULT: '#2E6F40', // Primary Green
          50: '#E8F5EB',
          100: '#D1EBD7',
          200: '#A3D7AF',
          300: '#75C387',
          400: '#47AF5F',
          500: '#2E6F40',
          600: '#255933',
          700: '#1C4326',
          800: '#132C1A',
          900: '#0A160D',
        },
        secondary: {
          DEFAULT: '#F0B429', // Secondary Amber
          50: '#FEF9EC',
          100: '#FDF3D9',
          200: '#FBE7B3',
          300: '#F9DB8D',
          400: '#F7CF67',
          500: '#F0B429',
          600: '#D99A15',
          700: '#A37610',
          800: '#6C4E0B',
          900: '#362706',
        },
        background: '#F9FAFB',
        surface: '#FFFFFF',
        text: {
          primary: '#1F2937',
          secondary: '#6B7280',
          tertiary: '#9CA3AF',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        'card': '12px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config
