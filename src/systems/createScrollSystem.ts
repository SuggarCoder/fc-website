import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface ScrollSystem {
  readonly progress: number;
  setup: (triggerEl: HTMLElement) => void;
  dispose: () => void;
  resetToStart: () => void;
}

export const createScrollSystem = (): ScrollSystem => {
  const state = { progress: 0 };
  let trigger: ScrollTrigger | null = null;

  return {
    get progress() { return state.progress; },

    setup: (triggerEl: HTMLElement) => {
      window.scrollTo(0, 0);
      state.progress = 0;

      trigger = ScrollTrigger.create({
        trigger: triggerEl,
        pin: true,
        start: 'top top',
        end: '+=5000',
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          state.progress = self.progress;
        },
      });

      ScrollTrigger.refresh();
    },

    dispose: () => {
      trigger?.kill();
      trigger = null;
    },

    resetToStart: () => {
      state.progress = 0;
      window.scrollTo(0, 0);
    },
  };
};
