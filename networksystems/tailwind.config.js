/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        brand: {
          primary: 'var(--color-primary)',
          'primary-dark': 'var(--color-primary-dark)',
          'primary-light': 'var(--color-primary-light)',
        },
        // Semantic colors for consistent usage
        status: {
          success: 'var(--color-success)',
          'success-bg': 'var(--color-success-bg)',
          'success-border': 'var(--color-success-border)',
          'success-text': 'var(--color-success-text)',
          error: 'var(--color-error)',
          'error-bg': 'var(--color-error-bg)',
          'error-border': 'var(--color-error-border)',
          'error-text': 'var(--color-error-text)',
          warning: 'var(--color-warning)',
          'warning-bg': 'var(--color-warning-bg)',
          'warning-border': 'var(--color-warning-border)',
          'warning-text': 'var(--color-warning-text)',
          info: 'var(--color-info)',
          'info-bg': 'var(--color-info-bg)',
          'info-border': 'var(--color-info-border)',
          'info-text': 'var(--color-info-text)',
          critical: 'var(--color-critical)',
          'critical-bg': 'var(--color-critical-bg)',
          'critical-border': 'var(--color-critical-border)',
          'critical-text': 'var(--color-critical-text)',
        },
        // Extend zinc to be the default neutral (Swiss minimal)
        neutral: {
          50: 'var(--color-neutral-50)',
          100: 'var(--color-neutral-100)',
          200: 'var(--color-neutral-200)',
          300: 'var(--color-neutral-300)',
          400: 'var(--color-neutral-400)',
          500: 'var(--color-neutral-500)',
          600: 'var(--color-neutral-600)',
          700: 'var(--color-neutral-700)',
          800: 'var(--color-neutral-800)',
          900: 'var(--color-neutral-900)',
        },
      },
      backgroundColor: {
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
      },
      textColor: {
        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
        tertiary: 'var(--color-text-tertiary)',
        disabled: 'var(--color-text-disabled)',
      },
      borderColor: {
        DEFAULT: 'var(--color-border)',
        hover: 'var(--color-border-hover)',
      },
    },
  },
  plugins: [],
}