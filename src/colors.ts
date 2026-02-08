// Shared color definitions — single source of truth
// CSS hex strings for UnoCSS, numeric values for Three.js

export const colors = {
  orange: '#ffba00',
  blue: '#00f0ff',
  white: '#ffffff',
  bg: '#000835',
};

// Convert CSS hex to Three.js numeric format
export const toHex = (css: string): number => parseInt(css.replace('#', ''), 16);
