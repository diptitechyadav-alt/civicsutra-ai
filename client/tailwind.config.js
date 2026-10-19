/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#061219',
          900: '#0B1F2A', // Primary dark navy
          800: '#133345',
          700: '#1D4960',
        },
        teal: {
          DEFAULT: '#148F87', // Teal accent
          primary: '#148F87',
          hover: '#0E756E',
          light: '#D5F3EE', // Light teal
          50: '#F0FAF8',
          100: '#D5F3EE',
          600: '#148F87',
          700: '#0E756E',
        },
        brand: {
          bg: '#F4F6F7', // Main background
          surface: '#FFFFFF',
          text: '#172B36', // Primary text
          muted: '#64748B', // Secondary text
          border: '#D9E2E7', // Border
          warning: '#F4A261', // Warning / attention
          critical: '#C94C4C', // Critical issue indicator
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
