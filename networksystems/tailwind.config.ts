import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: 'var(--color-primary)',
          'primary-dark': 'var(--color-primary-dark)',
          'primary-light': 'var(--color-primary-light)',
        },
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
      boxShadow: {
        clean: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
