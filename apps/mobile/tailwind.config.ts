import type { Config } from 'tailwindcss';

// Mirrors apps/web/tailwind.config.ts and apps/desktop/tailwind.config.ts — same darkMode
// strategy, no extended theme, since design-system/tokens.md has no concrete values yet.
const config: Config = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
