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

// ── Flicker helpers (matching CSS @keyframes exactly) ──────────────
// Each frame = [progress-threshold, opacity]. Step-hold: value holds
// until the next threshold is reached.
type StepFrame = [number, number];

const stepAt = (frames: StepFrame[], t: number): number => {
  const c = Math.max(0, Math.min(1, t));
  for (let i = frames.length - 1; i >= 0; i--) {
    if (c >= frames[i][0]) return frames[i][1];
  }
  return frames[0][1];
};

// @keyframes flicker-in
const FLICKER_IN: StepFrame[] = [
  [0, 0], [0.01, 0.5], [0.20, 0.214], [0.40, 0.844], [0.60, 0.288], [0.80, 1],
];

// @keyframes flicker-text (per-character)
const FLICKER_CHAR: StepFrame[] = [
  [0, 0], [0.01, 0.5], [0.25, 1], [0.501, 0.5], [0.751, 1],
];

/** Element-level flicker-in:  t 0→1, opacity 0 ⇝ 1 */
export const flickerIn = (t: number): number => stepAt(FLICKER_IN, t);
/** Element-level flicker-out: t 0→1, opacity 1 ⇝ 0 */
export const flickerOut = (t: number): number => stepAt(FLICKER_IN, 1 - t);

/** Character-level flicker-in:  t 0→1, opacity 0 ⇝ 1 */
export const flickerCharIn = (t: number): number => stepAt(FLICKER_CHAR, t);
/** Character-level flicker-out: t 0→1, opacity 1 ⇝ 0 */
export const flickerCharOut = (t: number): number => stepAt(FLICKER_CHAR, 1 - t);
