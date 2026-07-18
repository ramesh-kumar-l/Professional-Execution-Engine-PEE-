import type { Config } from 'tailwindcss';

// Same defaults as apps/web/tailwind.config.ts — no custom tokens exist yet (design-system/tokens.md
// is still TBD), so both clients share the identical Tailwind baseline rather than diverging.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
