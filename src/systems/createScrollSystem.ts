import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface ScrollSystem {
  readonly progress: number;
  setup: () => void;
  dispose: () => void;
  resetToStart: () => void;
}

export const createScrollSystem = (): ScrollSystem => {
  const state = { progress: 0 };
  let trigger: ScrollTrigger | null = null;

  return {
    get progress() { return state.progress; },

    setup: () => {
      // Ensure page starts at top
      window.scrollTo(0, 0);
      state.progress = 0;

      trigger = ScrollTrigger.create({
        start: 0,
        end: 'max',
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          state.progress = self.progress;
        }
      });

      // Force refresh to ensure correct initial state
      ScrollTrigger.refresh();
    },

    dispose: () => {
      trigger?.kill();
      trigger = null;
    },

    resetToStart: () => {
      state.progress = 0;
      window.scrollTo(0, 0);
    }
  };
};
