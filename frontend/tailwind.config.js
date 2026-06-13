/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          0: '#efefef',   // Mist — page canvas
          1: '#ffffff',   // Paper — card surfaces
          2: '#f5f5f5',   // Fog — subtle insets
          3: '#e8e8e8',   // Chalk — soft dividers, controls
          4: '#dedede',   // Slightly deeper chalk
        },
        accent: {
          DEFAULT: '#ff682c', // Signal Orange
          dim: '#e55a24',     // Darker orange (hover)
          light: '#ff8a5c',   // Lighter orange (highlight)
        },
        txt: {
          0: '#202020',   // Carbon — primary text
          1: '#4d4d4d',   // Graphite — body emphasis
          2: '#828282',   // Slate — helper text
          3: '#a3a3a3',   // Muted labels
          4: '#c0c0c0',   // Placeholder/disabled
        },
        border: {
          DEFAULT: '#e8e8e8', // Chalk
          subtle: '#f0f0f0',  // Near-invisible dividers
        },
        semantic: {
          green: '#22c55e',
          red: '#ef4444',
          amber: '#f59e0b',
          blue: '#3b82f6',
        },
        // Ventriloc named colors
        signal: '#ff682c',
        sienna: '#816729',
        carbon: '#202020',
        graphite: '#4d4d4d',
        slate: '#828282',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': '10px',
        xs: '12px',
        sm: '13px',
        base: '14px',
        md: '15px',
        lg: '16px',
        xl: '18px',
        '2xl': '24px',
        '3xl': '32px',
        '4xl': '40px',
        '5xl': '66px',
      },
      borderRadius: {
        sm: '3px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '20px',
        pill: '200px',
      },
      letterSpacing: {
        display: '-0.02em',
        heading: '-0.02em',
      },
      lineHeight: {
        display: '0.91',
        heading: '1.13',
        subheading: '1.19',
      },
      maxWidth: {
        page: '1200px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
}
