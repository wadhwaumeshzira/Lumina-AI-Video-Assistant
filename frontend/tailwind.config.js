/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        surface: '#111118',
        'surface-2': '#1a1a25',
        border: '#2a2a3a',
        accent: '#7c3aed',
        'accent-glow': '#9f67ff',
        'accent-2': '#06b6d4',
        text: '#e8e8f0',
        'text-muted': '#7070a0',
        success: '#10b981',
      },
      fontFamily: {
        sans: ['JetBrains Mono', 'monospace'],
        display: ['Syne', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
