import { colors, toHex } from '../colors';

// Configuration constants
export const BG_COLOR = toHex(colors.bg);

// source.js uses 1/7.7 for all model scaling
export const SCALE = 1 / 7.7;

export const COLORS = {
  BLUE: toHex(colors.blue),
  ORANGE: toHex(colors.orange),
  WHITE: toHex(colors.white)
} as const;

export const PostParams = {
  bloomStrength: 0.5,
  bloomThreshold: 0,
  bloomRadius: 0
} as const;

export const CameraConfig = {
  fov: 35,
  near: 0.001,
  far: 0.15
} as const;

export const PRELOADER_PATH = [
  {
    position: [-1.22307, -1.6568, 0.228435] as const,
    target: [-1.07854, -1.20615, 0] as const
  }
] as const;

export const FloorConfig = {
  mobileResolution: 512,
  desktopResolution: 2048,
  mobileBlur: [512, 512] as [number, number],
  desktopBlur: [2048, 2048] as [number, number],
  mobileBlur2: [64, 64] as [number, number],
  desktopBlur2: [128, 128] as [number, number],
  mixBlur: 3.2,
  mixStrength: 1.3,
  mixContrast: 1,
  mirror: 0.96,
  depthScale: 0,
  // 方案2: 恢复原值，主要依靠方案4解决
  minDepthThreshold: 0,
  maxDepthThreshold: 2,
  depthToBlurRatioBias: 0,
  distortion: 0.001,
  roughness: 1,
  metalness: 0.4,
  normalScale: [0.5, 0.5] as [number, number]
} as const;

export const LineConfig = {
  mobileRadius: {
    thin: 6e-5,
    normal: 8.775e-5
  },
  desktopRadius: {
    thin: 3e-5,
    normal: 5.85e-5
  },
  mobileTubularSegments: {
    low: 100,
    high: 250
  },
  desktopTubularSegments: {
    low: 200,
    high: 500
  },
  mobileRadialSegments: 4,
  desktopRadialSegments: 5
} as const;
