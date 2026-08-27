/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Sunset Saffron & Royal Plum Palette (Palette 1)
        plum: {
          DEFAULT: '#6B1D52', // Royal Plum / Wine
          light: '#8B2C6D',
          dark: '#3D1030',
          night: '#140810', // Deep obsidian background
          surface: '#23101C', // Card surface background
          border: '#4D1D3D',
        },
        saffron: {
          DEFAULT: '#FF3366', // Crimson Sunset Saffron
          light: '#FF5E85',
          glow: '#FF2A5F',
          dark: '#C81B47',
        },
        gold: {
          DEFAULT: '#F4C430', // Champagne Gold accent
          light: '#F8D76D',
          dark: '#C59A16',
        },
        pearl: {
          DEFAULT: '#FFF7F8', // Pure warm cream surface text
          dim: '#E2CDD5', // Muted subtitle text
          muted: '#A58B97', // Subtext
        },
        // Backwards compatibility tokens
        marigold: {
          DEFAULT: '#F4C430',
          light: '#F8D76D',
          dark: '#C59A16',
        },
        sindoor: {
          DEFAULT: '#FF3366',
          light: '#FF5E85',
          dark: '#C81B47',
        },
        mehendi: {
          DEFAULT: '#22C55E',
          light: '#4ADE80',
        },
        ink: '#140810',
        dusk: '#23101C',
        'dusk-light': '#3D1030',
        cream: '#FFF7F8',
        'cream-dim': '#E2CDD5',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        sans: ['var(--font-sora)', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'monospace'],
      },
      backgroundImage: {
        'sunset-glow': 'radial-gradient(circle at top center, rgba(255, 51, 102, 0.25) 0%, rgba(107, 29, 82, 0.35) 45%, rgba(20, 8, 16, 0.95) 100%)',
        'plum-card': 'linear-gradient(145deg, rgba(35, 16, 28, 0.8) 0%, rgba(61, 16, 48, 0.5) 100%)',
        'saffron-gradient': 'linear-gradient(135deg, #FF3366 0%, #E61E50 50%, #6B1D52 100%)',
        'gold-gradient': 'linear-gradient(135deg, #F4C430 0%, #FF8A00 100%)',
        'bloom-soft': 'radial-gradient(circle, rgba(255, 51, 102, 0.3) 0%, rgba(107, 29, 82, 0.2) 60%, transparent 100%)',
      },
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-14px) rotate(1.5deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.08)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        infiniteTicker: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        heartPop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'float-slow': 'floatSlow 7s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s infinite',
        'infinite-ticker': 'infiniteTicker 25s linear infinite',
        'heart-pop': 'heartPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      borderRadius: {
        card: '1.75rem',
      },
      boxShadow: {
        'saffron-glow': '0 0 30px -5px rgba(255, 51, 102, 0.5)',
        'plum-glow': '0 0 35px -5px rgba(107, 29, 82, 0.6)',
        'gold-glow': '0 0 25px -5px rgba(244, 196, 48, 0.4)',
      },
    },
  },
  plugins: [],
};

