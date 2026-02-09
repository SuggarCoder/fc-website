import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export interface ScrollSystem {
  readonly progress: number;
  setup: (triggerEl: HTMLElement) => void;
  dispose: () => void;
  resetToStart: () => void;
  stop: () => void;
  start: () => void;
  scrollToProgress: (progress: number) => void;
}

export const createScrollSystem = (): ScrollSystem => {
  const state = { progress: 0 };
  let trigger: ScrollTrigger | null = null;
  let lenis: Lenis | null = null;

  return {
    get progress() { return state.progress; },

    setup: (triggerEl: HTMLElement) => {
      window.scrollTo(0, 0);
      state.progress = 0;

      // Lenis smooth scroll
      lenis = new Lenis({
        lerp: 0.08,
        smoothWheel: true,
      });

      // Connect Lenis → ScrollTrigger
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => { lenis?.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);

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
      lenis?.destroy();
      lenis = null;
      trigger?.kill();
      trigger = null;
    },

    resetToStart: () => {
      state.progress = 0;
      lenis?.scrollTo(0, { immediate: true });
    },

    stop: () => { lenis?.stop(); },
    start: () => { lenis?.start(); },

    scrollToProgress: (p: number) => {
      if (!trigger || !lenis) return;
      const px = trigger.start + (trigger.end - trigger.start) * p;
      lenis.scrollTo(px, { duration: 2 });
    },
  };
};
