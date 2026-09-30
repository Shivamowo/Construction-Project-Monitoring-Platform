import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    fontSize: {
      xs: ['12px', '16px'],
      sm: ['14px', '20px'],
      base: ['16px', '24px'],
      lg: ['20px', '28px'],
      xl: ['28px', '32px'],
      '2xl': ['44px', '44px'],
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      brand: '#FFE600',
      ink: '#2E2E38',
      graphite: '#747480',
      mist: '#F6F6FA',
      line: '#E1E1E6',
      white: '#FFFFFF',
      good: '#168736',
      warn: '#FF9831',
      bad: '#B9251C',
      info: '#188CE5',
    },
    borderRadius: { none: '0', sm: '4px', DEFAULT: '6px', md: '6px', lg: '8px', full: '999px' },
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
