import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    fontSize: {
      xs: ['12px', '16px'], sm: ['14px', '20px'], base: ['16px', '24px'], lg: ['20px', '28px'],
      'title-sm': ['36px', '40px'], stat: ['48px', '48px'], title: ['56px', '56px'],
    },
    fontWeight: { light: '300', normal: '400', medium: '500', semibold: '500', bold: '500' },
    colors: {
      transparent: 'transparent', current: 'currentColor', white: '#FFFFFF',
      canvas: '#EEF0F5', tile: '#E3E7EE', surface: '#FFFFFF',
      panel: '#2E2E38', row: '#3A3A48', rowsel: '#4B4B5A', steel: '#4F5D70',
      brand: '#FFE600', ink: '#2E2E38', muted: '#747480', sub: '#565664', fog: '#C9CDD8', line: '#D5D9E2',
      good: '#168736', warn: '#B86200', bad: '#B9251C', info: '#188CE5',
    },
    borderRadius: { none: '0', sm: '8px', DEFAULT: '12px', lg: '16px', xl: '20px', '2xl': '24px', '3xl': '32px', full: '999px' },
    extend: {
      fontFamily: {
        sans: ['var(--font-barlow)', 'system-ui', 'sans-serif'],
        display: ['var(--font-condensed)', 'var(--font-barlow)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
