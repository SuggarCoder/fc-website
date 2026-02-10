import gsap from 'gsap';
import type CameraControls from 'camera-controls';

export interface MouseParallaxSystem {
  readonly x: number;
  readonly y: number;
  setup: () => void;
  dispose: () => void;
  resize: (width: number, height: number) => void;
  update: (cameraControls: CameraControls) => void;
}

export const createMouseParallax = (width: number, height: number): MouseParallaxSystem => {
  const state = { x: 0, y: 0 };
  let prevX = 0;
  let prevY = 0;
  let w = width;
  let h = height;

  // GSAP quickTo for smooth interpolation
  let quickX: gsap.QuickToFunc | null = null;
  let quickY: gsap.QuickToFunc | null = null;

  const onMouseMove = (e: MouseEvent) => {
    const targetX = e.clientX / (1 * w);
    const targetY = e.clientY / (1 * h);
    quickX?.(targetX);
    quickY?.(targetY);
  };

  return {
    get x() { return state.x; },
    get y() { return state.y; },

    setup: () => {
      // Skip parallax on touch-only devices (no hover support)
      const hasHover = window.matchMedia('(hover: hover)').matches;
      if (!hasHover) return;

      // Initialize quickTo with smooth easing
      quickX = gsap.quickTo(state, 'x', { duration: 0.6, ease: 'power2.out' });
      quickY = gsap.quickTo(state, 'y', { duration: 0.6, ease: 'power2.out' });
      window.addEventListener('mousemove', onMouseMove);
    },

    dispose: () => {
      window.removeEventListener('mousemove', onMouseMove);
      quickX = null;
      quickY = null;
    },

    resize: (newWidth: number, newHeight: number) => {
      w = newWidth;
      h = newHeight;
    },

    update: (cameraControls: CameraControls) => {
      const deltaX = prevX - state.x;
      const deltaY = prevY - state.y;
      prevX = state.x;
      prevY = state.y;
      cameraControls.rotate(1 * deltaX, 0.4 * deltaY, true);
    }
  };
};
