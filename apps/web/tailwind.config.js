/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        peds: {
          canvas: 'var(--peds-color-canvas)',
          carbon: 'var(--peds-color-carbon)',
          surface: 'var(--peds-color-surface)',
          'surface-muted': 'var(--peds-color-surface-muted)',
          'surface-raised': 'var(--peds-color-surface-raised)',
          'surface-overlay': 'var(--peds-color-surface-overlay)',
          line: 'var(--peds-color-line)',
          'line-strong': 'var(--peds-color-line-strong)',
          text: 'var(--peds-color-text)',
          ivory: 'var(--peds-color-ivory)',
          'text-muted': 'var(--peds-color-text-muted)',
          'text-subtle': 'var(--peds-color-text-subtle)',
          accent: 'var(--peds-color-accent)',
          'accent-strong': 'var(--peds-color-accent-strong)',
          'accent-soft': 'var(--peds-color-accent-soft)',
          ignition: 'var(--peds-color-ignition)',
          'racing-red': 'var(--peds-color-racing-red)',
          signal: 'var(--peds-color-signal)',
          scarlet: 'var(--peds-color-scarlet)',
          'burnt-orange': 'var(--peds-color-burnt-orange)',
          'brake-amber': 'var(--peds-color-brake-amber)',
          focus: 'var(--peds-color-focus)',
          // Ignition accent ramp — the single accent of the system.
          flame: {
            300: 'var(--peds-flame-300)',
            400: 'var(--peds-flame-400)',
            500: 'var(--peds-flame-500)',
            600: 'var(--peds-flame-600)',
            wash: 'var(--peds-flame-wash)',
          },
          ok: 'var(--peds-color-ok)',
          error: 'var(--peds-color-error)',
        },
        // Luxury White Studio Palette (Porsche / BMW clean gallery aesthetic)
        // DEPRECATED — light-theme ramp kept only for pages that have not been
        // migrated to the semantic --peds-color-* roles yet (Slice 5).
        studio: {
          50: '#ffffff',
          100: '#fafafa',
          200: '#f4f4f5',
          300: '#e4e4e7',
          400: '#d4d4d8',
          500: '#a1a1aa',
          600: '#71717a',
          700: '#52525b',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        // DEPRECATED — legacy red brand alias. Kept until every consumer
        // migrates to the semantic --peds-color-* roles.
        f1red: {
          DEFAULT: 'var(--peds-color-ignition)',
          dark: 'var(--peds-flame-600)',
          light: 'var(--peds-color-accent-strong)',
          muted: 'var(--peds-color-accent-wash)',
        },
      },
      fontSize: {
        'peds-display': 'var(--peds-text-display)',
        'peds-h1': 'var(--peds-text-h1)',
        'peds-h2': 'var(--peds-text-h2)',
        'peds-body': 'var(--peds-text-body)',
        'peds-label': 'var(--peds-text-label)',
        'peds-data': 'var(--peds-text-data)',
      },
      fontFamily: {
        sans: ['var(--peds-font-body)'],
        body: ['var(--peds-font-body)'],
        ui: ['var(--peds-font-ui)'],
        script: ['var(--peds-font-script)'],
        hand: ['var(--peds-font-hand)'],
        display: ['var(--peds-font-display)'],
        editorial: ['var(--peds-font-editorial)'],
        mono: ['var(--peds-font-mono)'],
      },
      // The display face stops at 800. `font-black` is remapped so it cannot
      // request a weight the shipped font does not carry.
      fontWeight: {
        black: '800',
      },
      maxWidth: {
        'peds-content': 'var(--peds-container-content)',
        'peds-wide': 'var(--peds-container-wide)',
        'peds-full': 'var(--peds-container-full)',
      },
      borderRadius: {
        'peds-sm': 'var(--peds-radius-sm)',
        'peds-md': 'var(--peds-radius-md)',
        'peds-lg': 'var(--peds-radius-lg)',
        'peds-xl': 'var(--peds-radius-xl)',
      },
      letterSpacing: {
        widest2: '0.25em',
        widest3: '0.35em',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'fast-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'peds-standard': 'var(--peds-ease-standard)',
        'peds-emphasis': 'var(--peds-ease-emphasis)',
      },
      transitionDuration: {
        'peds-fast': 'var(--peds-motion-fast)',
        'peds-base': 'var(--peds-motion-base)',
        'peds-slow': 'var(--peds-motion-slow)',
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        luxury: '0 10px 30px -5px rgba(0, 0, 0, 0.06), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
        elevated: '0 20px 40px -10px rgba(0, 0, 0, 0.08), 0 8px 16px -4px rgba(0, 0, 0, 0.04)',
        'peds-panel': 'var(--peds-shadow-panel)',
        'peds-elevated': 'var(--peds-shadow-elevated)',
        'peds-accent': 'var(--peds-shadow-accent)',
        'peds-ignition': '0 12px 34px rgba(255, 74, 24, 0.3)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
        'line-grow': 'lineGrow 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
        'number-up': 'numberUp 0.6s ease-out both',
        'slide-in-right': 'slideInRight 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
        'ticker-marquee': 'tickerMarquee 45s linear infinite',
      },
      keyframes: {
        tickerMarquee: {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '100%': { transform: 'translate3d(-50%, 0, 0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        lineGrow: {
          '0%': { transform: 'scaleX(0)', transformOrigin: 'left' },
          '100%': { transform: 'scaleX(1)', transformOrigin: 'left' },
        },
        numberUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
