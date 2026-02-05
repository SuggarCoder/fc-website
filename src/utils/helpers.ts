export const adjustBrightness = (color: number, amount: number): number => {
  let r = (color >> 16) + amount;
  let g = ((color >> 8) & 0xFF) + amount;
  let b = (color & 0xFF) + amount;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return (r << 16) | (g << 8) | b;
};

// source.js: F.a - maps value from one range to another with optional clamping
export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  clamp: boolean = true
): number => {
  const min = outMin < outMax ? outMin : outMax;
  const max = outMin < outMax ? outMax : outMin;
  const result = (value - inMin) / (inMax - inMin) * (outMax - outMin) + outMin;
  return clamp ? Math.max(min, Math.min(max, result)) : result;
};
