/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          0: '#09090b',   // Deep void
          1: '#0f0f12',   // Card surfaces
          2: '#15151a',   // Elevated panels
          3: '#1c1c24',   // Controls / inputs
          4: '#25252e',   // Active states
        },
        accent: {
          DEFAULT: '#6366f1', // Indigo
          dim: '#4f46e5',
          light: '#818cf8',
          glow: 'rgba(99, 102, 241, 0.15)',
        },
        txt: {
          0: '#fafafa',
          1: '#e4e4e7',
          2: '#a1a1aa',
          3: '#71717a',
          4: '#3f3f46',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.06)',
          subtle: 'rgba(255, 255, 255, 0.03)',
          glow: 'rgba(99, 102, 241, 0.2)',
        },
        semantic: {
          green: '#34d399',
          red: '#f87171',
          amber: '#fbbf24',
          blue: '#60a5fa',
        },
        glass: {
          DEFAULT: 'rgba(15, 15, 18, 0.7)',
          light: 'rgba(255, 255, 255, 0.03)',
          border: 'rgba(255, 255, 255, 0.08)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
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
        '4xl': '40px',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        '2xl': '24px',
      },
      boxShadow: {
        glow: '0 0 20px rgba(99, 102, 241, 0.15)',
        'glow-sm': '0 0 10px rgba(99, 102, 241, 0.1)',
        'glow-lg': '0 0 40px rgba(99, 102, 241, 0.2)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.4)',
        'float': '0 20px 60px rgba(0, 0, 0, 0.5)',
      },
      backdropBlur: {
        glass: '16px',
        heavy: '24px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'gradient-x': 'gradient-x 3s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(99, 102, 241, 0.1)' },
          '50%': { boxShadow: '0 0 25px rgba(99, 102, 241, 0.25)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}
