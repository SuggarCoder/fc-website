import { defineConfig } from '@unocss/vite';
import { presetMini, Theme } from '@unocss/preset-mini';
import presetIcons from '@unocss/preset-icons';
import { colors } from './src/colors';

export default defineConfig({
  presets: [presetMini(), presetIcons()],
  safelist: ['text-orange-500', 'bg-orange-500'],
  theme: {
    fontFamily: {
      sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'].join(','),
    },
    colors: {
      orange: { 500: colors.orange },
      blue: { 500: colors.blue }
    },
  },
  preflights: [
      {
        getCSS: ({ theme }) => {
          const t = theme as Theme;
          return `
            *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 100%; min-height: 100%; font-family: ${t.fontFamily?.sans}; }
            #root { width: 100%; min-height: 100%; }
          `;
        },
      },
  ],
});
