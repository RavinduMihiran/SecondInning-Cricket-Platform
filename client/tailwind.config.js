/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#3b82f6',
          DEFAULT: '#2563eb',
          dark: '#1e40af',
        },
        secondary: {
          light: '#f43f5e',
          DEFAULT: '#e11d48',
          dark: '#be123c',
        },
        background: {
          light: '#f8fafc',
          DEFAULT: '#f1f5f9',
          dark: '#0f172a'
        },
        accent: {
          light: '#22d3ee',
          DEFAULT: '#06b6d4',
          dark: '#0e7490',
        },
        success: {
          light: '#4ade80',
          DEFAULT: '#22c55e',
          dark: '#16a34a',
        },
        warning: {
          light: '#fbbf24',
          DEFAULT: '#f59e0b',
          dark: '#d97706',
        },
        info: {
          light: '#38bdf8',
          DEFAULT: '#0ea5e9',
          dark: '#0284c7',
        },
        error: {
          light: '#f87171',
          DEFAULT: '#ef4444',
          dark: '#dc2626',
        },
        gray: {
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        green: {
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          800: '#166534',
        },
        red: {
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          800: '#991b1b',
        },
        yellow: {
          100: '#fef9c3',
          500: '#eab308',
          600: '#ca8a04',
          800: '#854d0e',
        },
        blue: {
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#3b82f6',
          600: '#2563eb',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        white: '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': '0.8125rem',
        'sm': '0.9375rem',
        'base': '1rem',
        'lg': '1.0625rem',
        'xl': '1.125rem',
        '2xl': '1.375rem',
        '3xl': '1.625rem',
        '4xl': '2rem',
        '5xl': '2.375rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'blue': '0 4px 14px 0 rgba(37, 99, 235, 0.3)',
        'rose': '0 4px 14px 0 rgba(225, 29, 72, 0.3)',
        'cyan': '0 4px 14px 0 rgba(6, 182, 212, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'slide-left': 'slideLeft 0.5s ease-out',
        'slide-right': 'slideRight 0.5s ease-out',
        'bounce-light': 'bounce 1s ease-in-out infinite',
        'pulse-light': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      borderRadius: {
        'sm': '0.25rem',
        DEFAULT: '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        'full': '9999px',
      },
    },
  },
  plugins: [],
} 