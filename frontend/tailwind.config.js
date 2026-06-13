/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { 0: '#08080a', 1: '#0c0c0f', 2: '#111114', 3: '#18181b', 4: '#1f1f23' },
        accent: { DEFAULT: '#6366f1', dim: '#4f46e5', light: '#818cf8' },
        txt: { 0: '#fafafa', 1: '#d4d4d8', 2: '#a1a1aa', 3: '#71717a', 4: '#52525b' },
        border: { DEFAULT: '#27272a', subtle: '#1e1e21' },
        semantic: { green: '#22c55e', red: '#ef4444', amber: '#f59e0b', blue: '#3b82f6' },
      },
      fontFamily: {
        sans: ['Satoshi', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': '10px',
        xs: '11px',
        sm: '12px',
        base: '13px',
        md: '14px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
    },
  },
  plugins: [],
}
