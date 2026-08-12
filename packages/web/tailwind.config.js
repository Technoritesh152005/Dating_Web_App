/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // The dusk-jewel palette - see design plan. Named for what they
        // ARE in the theme's world, not generic "primary/secondary" -
        // makes intent legible in every component that uses them.
        ink: '#1B0E14', // primary background - moonless courtyard
        dusk: '#3A1F2B', // secondary dark surface - cards on ink
        'dusk-light': '#4F2E3D', // tertiary surface - hover states, inputs
        marigold: {
          DEFAULT: '#F0A202',
          light: '#F7C25E',
          dark: '#C4830A',
        },
        sindoor: {
          DEFAULT: '#E63950',
          light: '#F0677A',
          dark: '#B82238',
        },
        mehendi: {
          DEFAULT: '#4C7A5E',
          light: '#6B9B7D',
        },
        cream: '#FBF1E3',
        'cream-dim': '#D9CBB8', // muted text on dark surfaces
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        sans: ['var(--font-sora)', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'monospace'],
      },
      backgroundImage: {
        // The "bloom" gradient - the signature motion element's visual
        // basis, also usable statically as a background accent.
        bloom: 'radial-gradient(circle, #E63950 0%, #F0A202 60%, transparent 100%)',
        'bloom-soft': 'radial-gradient(circle, rgba(230,57,80,0.35) 0%, rgba(240,162,2,0.25) 55%, transparent 100%)',
      },
      keyframes: {
        bloomExpand: {
          '0%': { transform: 'scale(0)', opacity: '0.9' },
          '70%': { opacity: '0.5' },
          '100%': { transform: 'scale(1)', opacity: '0' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
      animation: {
        bloom: 'bloomExpand 900ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
      },
      borderRadius: {
        card: '1.75rem', // the soft, tactile "photograph with a mat border" radius used throughout
      },
    },
  },
  plugins: [],
};
