import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './api/**/*.{ts,tsx}',
    './index.tsx',
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#0B4F6C',
        'brand-cyan': '#01BAEF',
        'brand-dark': '#040F16',
        'brand-light': '#FBFBFF',
      },
    },
  },
  plugins: [],
};

export default config;
