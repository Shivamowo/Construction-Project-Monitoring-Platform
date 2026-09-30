import type { Config } from 'tailwindcss';

/** Layout utilities only. Colours, type and sizes live as tokens in app/globals.css. */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { fontSize: {}, fontFamily: {}, letterSpacing: {}, extend: {} },
  plugins: [],
};
export default config;
