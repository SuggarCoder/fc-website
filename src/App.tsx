import { type Component, onMount, onCleanup, createSignal, For, Show } from 'solid-js';
import * as THREE from 'three';
import gsap from 'gsap';
import { BG_COLOR, PostParams, CameraConfig } from './config';
import { createScene } from './scene/createScene';
import { createRenderer } from './scene/createRenderer';
import { createCamera, createCameraControls } from './scene/createCamera';
import { createFloor } from './scene/createFloor';
import { createGradientPlane } from './scene/createGradient';
import { loadLines } from './scene/createLines';
import { createComposer } from './postprocessing/createComposer';
import { createMouseParallax } from './systems/createMouseParallax';
import { createScrollSystem } from './systems/createScrollSystem';
import { createCameraPath } from './systems/createCameraPath';
import { mapRange } from './utils/helpers';
import SplitText from './components/SplitText';

const menuData = [
  {
    label: 'Proposition',
    content: () => (
      <ul class="flex flex-col gap-3 px-8 list-none">
        <li class="text-white/60 text-base leading-relaxed text-xl">Instant Cross-Border Transfers</li>
        <p class="text-white/40">Settle transactions in minutes not days.</p>
        <li class="text-white/60 text-base leading-relaxed text-xl">Lower Transaction Costs</li>
        <p class="text-white/40">Reduce fees compared to traditional correspondent banking networks.</p>
        <li class="text-white/60 text-base leading-relaxed text-xl">Global Reach</li>
        <p class="text-white/40">Move capital across countries and currencies without geographical limitations.</p>
        <li class="text-white/60 text-base leading-relaxed text-xl">Institution-Grade Security</li>
        <p class="text-white/40">Advanced custody, encryption, and risk controls.</p>
      </ul>
    ),
  },
  {
    label: 'Products & Services',
    content: () => (
      <ul class="flex flex-col gap-3 px-8 list-none">
        <li class="text-white/60 text-base leading-relaxed text-xl">Cross-Border Payments</li>
        <p class="text-white/40">Send and receive funds globally using crypto rails while settling in local or digital currencies.</p>
        <li class="text-white/60 text-base leading-relaxed text-xl">Treasury & Liquidity Management</li>
        <p class="text-white/40">Optimize capital allocation, manage digital asset liquidity, and streamline treasury operations across regions.</p>
        <li class="text-white/60 text-base leading-relaxed text-xl">On/Off-Ramp Solutions</li>
        <p class="text-white/40">Seamlessly convert between fiat and digital assets with transparent pricing and fast settlement.</p>
      </ul>
    ),
  },
  {
    label: 'How It Works',
    content: () => (
      <ul class="flex flex-col gap-3 px-8 list-none">
        <li class="text-white/60 text-base leading-relaxed text-xl">Initiate Transfer</li>
        <p class="text-white/40">Submit a payment or settlement request via API or dashboard.</p>
        <li class="text-white/60 text-base leading-relaxed text-xl">Crypto Rail Settlement</li>
        <p class="text-white/40">Funds are transferred using secure blockchain infrastructure.</p>
        <li class="text-white/60 text-base leading-relaxed text-xl">Local Payout</li>
        <p class="text-white/40">Receive funds in the desired currency or digital asset.</p>
      </ul>
    ),
  },
  {
    label: 'Compliance',
    content: () => (
      <ul class="flex flex-col gap-3 px-8 list-none">
        <li class="text-white/60 text-base leading-relaxed text-xl">Multi-layer custody and wallet security</li>
        <li class="text-white/60 text-base leading-relaxed text-xl">Real-time transaction monitoring</li>
        <li class="text-white/60 text-base leading-relaxed text-xl">Regulatory-aligned operations across jurisdictions</li>
      </ul>
    ),
  },
];

const sec4Data = [
  {
    title: 'Cross-Border Payments',
    desc: "Flow Capital's Cross-Border Payments solution enables businesses and institutions to move capital globally with speed, transparency, and reliability. By leveraging blockchain-based settlement rails, we significantly reduce transfer times and costs compared to traditional correspondent banking networks. Payments can be initiated via platform or API and settled in near real time, improving cash flow visibility and operational efficiency. Built-in compliance checks ensure alignment with KYC, AML, and regulatory requirements across jurisdictions. With predictable settlement, transparent pricing, and global coverage, Flow Capital provides a modern, scalable alternative for international payments.",
  },
  {
    title: 'Treasury & Liquidity Management',
    desc: 'Flow Capital offers integrated Treasury and Liquidity Management solutions for organizations operating across multiple markets and currencies. Our platform provides real-time visibility into balances, enables efficient capital allocation, and supports both fiat and digital assets. Faster settlement cycles reduce idle capital and improve liquidity utilization, while programmable workflows streamline treasury operations. Institutional-grade custody, monitoring, and reporting ensure security and compliance at every stage. Flow Capital transforms global treasury management into a more agile, efficient, and strategic function.',
  },
  {
    title: 'On- & Off-Ramp Solutions',
    desc: "Flow Capital's On- and Off-Ramp solutions provide seamless conversion between fiat currencies and digital assets through compliant, transparent infrastructure. Clients benefit from predictable pricing, fast settlement, and reliable access to liquidity without operational complexity. Robust KYC, AML, and transaction monitoring frameworks are embedded throughout the conversion process, supporting regulatory alignment across regions. Our APIs enable easy integration into existing platforms, allowing businesses and institutions to confidently bridge traditional finance and the digital asset ecosystem.",
  },
];

const sec6Data = [
  {
    title: 'Initiate Transfer',
    desc: "Every transaction begins with a clear intent: moving capital across borders with precision and control. Through Flow Capital’s dashboard or API, clients initiate a payment or settlement request by defining the amount, destination, currency, and settlement preferences. Our system immediately validates the request structure and parameters, ensuring accuracy before execution. Whether triggered manually or programmatically, each transfer enters a unified workflow designed for speed and reliability. From the first interaction, clients gain full visibility into the transaction lifecycle, setting the foundation for a seamless and transparent cross-border experience.",
  },
  {
    title: 'Crypto Rail Settlement',
    desc: 'Once initiated, funds move onto Flow Capital’s crypto-powered settlement rails. Instead of passing through multiple correspondent banks, transactions are routed through secure blockchain infrastructure, enabling near real-time settlement and continuous availability. This architecture reduces delays, minimizes intermediaries, and enhances transparency throughout the transfer. Each movement is cryptographically secured and traceable, providing a clear record of settlement progress. By leveraging blockchain as a settlement layer—not speculation—Flow Capital delivers faster finality and more efficient capital movement across global markets.',
  },
  {
    title: 'Local Payout',
    desc: "With settlement complete, funds arrive at their final destination. Flow Capital enables local payout in the client’s chosen currency or digital asset, delivering predictable settlement outcomes and clear confirmation. Whether converting to fiat, retaining digital assets, or redistributing capital internally, payouts are executed efficiently and transparently. Clients receive full reporting and transaction records, supporting reconciliation, audit, and treasury operations. The result is a complete end-to-end flow—capital initiated globally, settled securely, and delivered locally with speed and confidence.",
  },
];

const App: Component = () => {
  let containerRef: HTMLDivElement | undefined;
  let line1Ref: HTMLSpanElement | undefined;
  let line2Ref: HTMLSpanElement | undefined;
  let arrowRef: HTMLDivElement | undefined;
  let maskRef: HTMLDivElement | undefined;
  let getStartedRef: HTMLDivElement | undefined;
  let headerRef: HTMLDivElement | undefined;
  let mainRef: HTMLDivElement | undefined;
  let drawerRef: HTMLDivElement | undefined;
  let backdropRef: HTMLDivElement | undefined;
  let panelRef: HTMLDivElement | undefined;
  let drawer2Ref: HTMLDivElement | undefined;
  let dividerRef: HTMLDivElement | undefined;
  let pinRef: HTMLDivElement | undefined;
  let heroRef: HTMLDivElement | undefined;
  let descRef: HTMLDivElement | undefined;
  let sec2Ref: HTMLDivElement | undefined;
  let sec2LineRef: HTMLDivElement | undefined;
  let sec3Ref: HTMLDivElement | undefined;
  let sec4Ref: HTMLDivElement | undefined;
  let sec5Ref: HTMLDivElement | undefined;
  let sec6Ref: HTMLDivElement | undefined;
  let whiteOverlayRef: HTMLDivElement | undefined;
  let blackOverlayRef: HTMLDivElement | undefined;
  let getStartedTl: gsap.core.Timeline | undefined;
  let drawer2Tl: gsap.core.Timeline | undefined;
  let scrollSystem: ReturnType<typeof createScrollSystem> | undefined;

  const [menuOpen, setMenuOpen] = createSignal(false);
  const [activeIndex, setActiveIndex] = createSignal(-1);
  const [arrowY, setArrowY] = createSignal(0);
  const [drawer2Open, setDrawer2Open] = createSignal(false);
  const [pathReady, setPathReady] = createSignal(false);
  const isMobile = false;

  // Char refs collected from SplitText components
  const heroChars: HTMLSpanElement[] = [];
  const descChars: HTMLSpanElement[] = [];
  const sec2Chars: HTMLSpanElement[] = [];
  const sec3Chars: HTMLSpanElement[] = [];
  const sec4TitleChars: HTMLSpanElement[][] = [[], [], []];
  const sec4DescChars: HTMLSpanElement[][] = [[], [], []];
  const sec5Chars: HTMLSpanElement[] = [];
  const sec6TitleChars: HTMLSpanElement[][] = [[], [], []];
  const sec6DescChars: HTMLSpanElement[][] = [[], [], []];

  let menuTl: gsap.core.Timeline | undefined;
  const menuProxy = { t: 0 };
  const arrowProxy = { y: 0 };

  const showDrawer2 = (index: number, e: MouseEvent) => {
    setActiveIndex(index);
    if (!drawer2Ref || !panelRef || !dividerRef) return;

    // Arrow follows hovered menu item
    const target = e.currentTarget as HTMLElement;
    const panelRect = panelRef.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const newY = targetRect.top - panelRect.top + targetRect.height / 2;

    if (drawer2Open()) {
      gsap.to(arrowProxy, {
        y: newY, duration: 0.25, ease: 'power2.out',
        onUpdate: () => setArrowY(arrowProxy.y),
      });
      return;
    }

    setDrawer2Open(true);
    arrowProxy.y = newY;
    setArrowY(newY);

    if (drawer2Tl) drawer2Tl.kill();

    const panelWidth = panelRef.offsetWidth;
    const targetWidth = panelWidth / 2;
    gsap.set(drawer2Ref, {
      visibility: 'visible',
      left: panelWidth,
      width: targetWidth,
      clipPath: 'inset(0 100% 0 0)',
    });

    drawer2Tl = gsap.timeline();
    drawer2Tl
      .to(dividerRef, { opacity: 1, duration: 0.3 }, 0)
      .to(drawer2Ref, { clipPath: 'inset(0 0% 0 0)', duration: 0.4, ease: 'power2.out' }, 0);
  };

  const hideDrawer2 = () => {
    setDrawer2Open(false);
    if (!drawer2Ref || !dividerRef) return;
    if (drawer2Tl) drawer2Tl.kill();

    drawer2Tl = gsap.timeline();
    drawer2Tl
      .to(drawer2Ref, { clipPath: 'inset(0 100% 0 0)', duration: 0.3, ease: 'power2.in' }, 0)
      .to(dividerRef, { opacity: 0, duration: 0.3 }, 0)
      .set(drawer2Ref, { visibility: 'hidden' });
    setActiveIndex(-1);
  };

  const toggleMenu = () => {
    const opening = !menuOpen();
    setMenuOpen(opening);

    // 菜单打开时禁用滚动，关闭时恢复
    if (opening) scrollSystem?.stop();
    else scrollSystem?.start();

    if (menuTl) menuTl.kill();

    const radius = 12;
    const sweepAngle = Math.PI * 1.5; // 270° orbit
    const tl = gsap.timeline();
    menuTl = tl;

    const updateOrbit = () => {
      const t = menuProxy.t;
      const r = radius * Math.sin(t * Math.PI);
      const angle = t * sweepAngle;
      // Convergence + orbital arc + rotation — all simultaneous
      gsap.set(line1Ref!, {
        x: r * Math.cos(angle),
        y: -4 * (1 - t) + r * Math.sin(angle),
        rotation: t * 45,
      });
      gsap.set(line2Ref!, {
        x: -r * Math.cos(angle),
        y: 4 * (1 - t) - r * Math.sin(angle),
        rotation: t * -45,
      });
      // Phase 2: spread lines back to initial positions
  };
    // Hamburger orbit
    tl.to(menuProxy, {
      t: opening ? 1 : 0,
      duration: 0.75,
      ease: 'power2.inOut',
      onUpdate: updateOrbit,
    });

    // Drawer
    if (drawerRef && mainRef && backdropRef && panelRef) {
      if (opening) {
        gsap.set(drawerRef, { visibility: 'visible' });
        const navPadLeft = parseFloat(getComputedStyle(mainRef.parentElement!).paddingLeft);
        gsap.set(panelRef, { width: mainRef.offsetWidth + navPadLeft *2, x: '-100%' });
        gsap.set(backdropRef, { opacity: 0 });
        tl.to(backdropRef, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0);
        tl.to(panelRef, { x: '0%', duration: 0.5, ease: 'power2.out' }, 0.1);
      } else {
        // Reset drawer2
        setDrawer2Open(false);
        if (drawer2Ref) gsap.set(drawer2Ref, { visibility: 'hidden', clipPath: 'inset(0 100% 0 0)' });
        if (dividerRef) gsap.set(dividerRef, { opacity: 0 });
        setActiveIndex(-1);

        tl.to(panelRef, { x: '-100%', duration: 0.5, ease: 'power2.inOut' }, 0);
        tl.to(backdropRef, { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0.2);
        tl.set(drawerRef, { visibility: 'hidden' });
      }
    }
  };

  onMount(() => {
    if (!containerRef || !arrowRef || !maskRef || !getStartedRef || !headerRef) return;

    // Collapse container to header-only height
    gsap.set(getStartedRef, { height: headerRef.offsetHeight });

    const maskParent = maskRef.parentElement!;
    let size = 0;
    getStartedTl = gsap.timeline({
      paused: true,
      onStart: () => {
        size = arrowRef.clientHeight * 1.3;
      },
    });

    getStartedTl
      .to(arrowRef, {
        rotate: 180,
        transformOrigin: '50% 50%',
        duration: 0.25,
        ease: 'power2.out',
      }, 0)
      .to(maskRef, {
        width: () => size,
        height: () => size,
        x: () => maskParent.clientWidth - size,
        y: () => maskParent.clientHeight - size,
        borderRadius: '0.375rem',
        duration: 0.35,
        ease: 'power2.inOut',
      }, 0)
      .to(getStartedRef, {
        height: 'auto',
        duration: 0.35,
        ease: 'power2.inOut',
      }, 0);

    // ── Master scroll timeline (scrubbed by scrollSystem.progress) ──
    // Initial states
    gsap.set(sec2Chars, { opacity: 0 });
    gsap.set(sec3Chars, { opacity: 0 });
    gsap.set(sec5Chars, { opacity: 0 });
    sec4TitleChars.forEach(chars => gsap.set(chars, { opacity: 0 }));
    sec4DescChars.forEach(chars => gsap.set(chars, { opacity: 0 }));
    gsap.set(sec4Ref!, { opacity: 0, yPercent: 50 });
    sec6TitleChars.forEach(chars => gsap.set(chars, { opacity: 0 }));
    sec6DescChars.forEach(chars => gsap.set(chars, { opacity: 0 }));
    gsap.set(sec6Ref!, { opacity: 0, yPercent: 50 });

    // Triggered animation state (sec4 + sec3/4 exit, sec6 + sec5/6 exit)
    let prevSec4Idx = -1;
    let sec4Tl: gsap.core.Timeline | null = null;
    let sec34Exited = false;
    let sec34ExitTl: gsap.core.Timeline | null = null;

    let prevSec6Idx = -1;
    let sec6Tl: gsap.core.Timeline | null = null;
    let sec56Exited = false;
    let sec56ExitTl: gsap.core.Timeline | null = null;

    const scrollTl = gsap.timeline({
      paused: true,
      onUpdate: () => {
        const p = scrollTl.progress();

        // ── 0.40→: sec4 triggered (plays at own speed) ──
        const sec4Start = 0.40;
        const sec4Step = 0.08;
        let sec4Idx = p >= sec4Start
          ? Math.min(2, Math.floor((p - sec4Start) / sec4Step))
          : -1;

        if (sec4Idx !== prevSec4Idx && !sec34Exited) {
          if (sec4Tl) sec4Tl.kill();
          // Kill orphaned tweens then force clean state
          gsap.killTweensOf(sec4Ref!);
          sec4TitleChars.forEach(chars => { gsap.killTweensOf(chars); gsap.set(chars, { opacity: 0 }); });
          sec4DescChars.forEach(chars => { gsap.killTweensOf(chars); gsap.set(chars, { opacity: 0 }); });

          sec4Tl = gsap.timeline();
          const isEntering = prevSec4Idx === -1 && sec4Idx >= 0;
          const isLeaving = prevSec4Idx >= 0 && sec4Idx === -1;

          if (isEntering) {
            sec4Tl.to(sec4Ref!, { opacity: 1, yPercent: 0, duration: 0.6, ease: 'power2.out' }, 0);
            const newChars = [...sec4TitleChars[sec4Idx], ...sec4DescChars[sec4Idx]];
            sec4Tl.to(newChars, {
              opacity: 1, duration: 0.05,
              stagger: { amount: 0.5, from: 'random' },
              ease: 'power2.out',
            }, 0.15);
          } else if (isLeaving) {
            // Chars already reset to 0, just exit container
            sec4Tl.to(sec4Ref!, { opacity: 0, yPercent: 50, duration: 0.5, ease: 'power2.in' });
          } else {
            // Switch: old already hidden by reset, only fade in new
            gsap.set(sec4Ref!, { opacity: 1, yPercent: 0 });
            if (sec4Idx >= 0) {
              const newChars = [...sec4TitleChars[sec4Idx], ...sec4DescChars[sec4Idx]];
              sec4Tl.to(newChars, {
                opacity: 1, duration: 0.05,
                stagger: { amount: 0.5, from: 'random' },
                ease: 'power2.out',
              });
            }
          }
          prevSec4Idx = sec4Idx;
        }

        // ── 0.64: sec3 + sec4 combined exit (triggered) ──
        const shouldExit = p >= 0.64;
        if (shouldExit !== sec34Exited) {
          sec34Exited = shouldExit;
          if (sec34ExitTl) sec34ExitTl.kill();

          if (shouldExit) {
            if (sec4Tl) { sec4Tl.kill(); sec4Tl = null; }
            gsap.killTweensOf(sec4Ref!);
            sec4TitleChars.forEach(chars => gsap.killTweensOf(chars));
            sec4DescChars.forEach(chars => gsap.killTweensOf(chars));
            sec34ExitTl = gsap.timeline();
            sec34ExitTl.to(sec3Chars, {
              opacity: 0, duration: 0.03,
              stagger: { amount: 0.3, from: 'random' },
              ease: 'power2.in',
              onComplete: () => { gsap.set(sec3Ref!, { opacity: 0 }); },
            }, 0);
            const activeSec4Chars = prevSec4Idx >= 0
              ? [...sec4TitleChars[prevSec4Idx], ...sec4DescChars[prevSec4Idx]]
              : [];
            if (activeSec4Chars.length) {
              sec34ExitTl.to(activeSec4Chars, {
                opacity: 0, duration: 0.03,
                stagger: { amount: 0.3, from: 'random' },
                ease: 'power2.in',
              }, 0);
            }
            sec34ExitTl.to(sec4Ref!, {
              opacity: 0, yPercent: 50, duration: 0.5, ease: 'power2.in',
            }, 0.2);
          } else {
            prevSec4Idx = sec4Idx;
            sec34ExitTl = gsap.timeline();
            gsap.set(sec3Ref!, { opacity: 1 });
            sec34ExitTl.to(sec3Chars, {
              opacity: 1, duration: 0.05,
              stagger: { amount: 0.5, from: 'random' },
              ease: 'power2.out',
            }, 0);
            sec34ExitTl.to(sec4Ref!, {
              opacity: 1, yPercent: 0, duration: 0.5, ease: 'power2.out',
            }, 0);
            if (sec4Idx >= 0) {
              sec4TitleChars.forEach(chars => gsap.set(chars, { opacity: 0 }));
              sec4DescChars.forEach(chars => gsap.set(chars, { opacity: 0 }));
              const chars = [...sec4TitleChars[sec4Idx], ...sec4DescChars[sec4Idx]];
              sec34ExitTl.to(chars, {
                opacity: 1, duration: 0.05,
                stagger: { amount: 0.5, from: 'random' },
                ease: 'power2.out',
              }, 0.15);
            }
          }
        }

        // ── 0.84→: sec6 triggered (plays at own speed) ──
        const sec6Start = 0.84;
        const sec6Step = 0.04;
        let sec6Idx = p >= sec6Start
          ? Math.min(2, Math.floor((p - sec6Start) / sec6Step))
          : -1;

        if (sec6Idx !== prevSec6Idx && !sec56Exited) {
          if (sec6Tl) sec6Tl.kill();
          gsap.killTweensOf(sec6Ref!);
          sec6TitleChars.forEach(chars => { gsap.killTweensOf(chars); gsap.set(chars, { opacity: 0 }); });
          sec6DescChars.forEach(chars => { gsap.killTweensOf(chars); gsap.set(chars, { opacity: 0 }); });

          sec6Tl = gsap.timeline();
          const isEntering = prevSec6Idx === -1 && sec6Idx >= 0;
          const isLeaving = prevSec6Idx >= 0 && sec6Idx === -1;

          if (isEntering) {
            sec6Tl.to(sec6Ref!, { opacity: 1, yPercent: 0, duration: 0.6, ease: 'power2.out' }, 0);
            const newChars = [...sec6TitleChars[sec6Idx], ...sec6DescChars[sec6Idx]];
            sec6Tl.to(newChars, {
              opacity: 1, duration: 0.05,
              stagger: { amount: 0.5, from: 'random' },
              ease: 'power2.out',
            }, 0.15);
          } else if (isLeaving) {
            sec6Tl.to(sec6Ref!, { opacity: 0, yPercent: 50, duration: 0.5, ease: 'power2.in' });
          } else {
            gsap.set(sec6Ref!, { opacity: 1, yPercent: 0 });
            if (sec6Idx >= 0) {
              const newChars = [...sec6TitleChars[sec6Idx], ...sec6DescChars[sec6Idx]];
              sec6Tl.to(newChars, {
                opacity: 1, duration: 0.05,
                stagger: { amount: 0.5, from: 'random' },
                ease: 'power2.out',
              });
            }
          }
          prevSec6Idx = sec6Idx;
        }

        // ── 0.96: sec5 + sec6 combined exit (triggered) ──
        const shouldExit56 = p >= 0.96;
        if (shouldExit56 !== sec56Exited) {
          sec56Exited = shouldExit56;
          if (sec56ExitTl) sec56ExitTl.kill();

          if (shouldExit56) {
            if (sec6Tl) { sec6Tl.kill(); sec6Tl = null; }
            gsap.killTweensOf(sec6Ref!);
            sec6TitleChars.forEach(chars => gsap.killTweensOf(chars));
            sec6DescChars.forEach(chars => gsap.killTweensOf(chars));
            sec56ExitTl = gsap.timeline();
            sec56ExitTl.to(sec5Chars, {
              opacity: 0, duration: 0.03,
              stagger: { amount: 0.3, from: 'random' },
              ease: 'power2.in',
              onComplete: () => { gsap.set(sec5Ref!, { opacity: 0 }); },
            }, 0);
            const activeSec6Chars = prevSec6Idx >= 0
              ? [...sec6TitleChars[prevSec6Idx], ...sec6DescChars[prevSec6Idx]]
              : [];
            if (activeSec6Chars.length) {
              sec56ExitTl.to(activeSec6Chars, {
                opacity: 0, duration: 0.03,
                stagger: { amount: 0.3, from: 'random' },
                ease: 'power2.in',
              }, 0);
            }
            sec56ExitTl.to(sec6Ref!, {
              opacity: 0, yPercent: 50, duration: 0.5, ease: 'power2.in',
            }, 0.2);
          } else {
            prevSec6Idx = sec6Idx;
            sec56ExitTl = gsap.timeline();
            gsap.set(sec5Ref!, { opacity: 1 });
            sec56ExitTl.to(sec5Chars, {
              opacity: 1, duration: 0.05,
              stagger: { amount: 0.5, from: 'random' },
              ease: 'power2.out',
            }, 0);
            sec56ExitTl.to(sec6Ref!, {
              opacity: 1, yPercent: 0, duration: 0.5, ease: 'power2.out',
            }, 0);
            if (sec6Idx >= 0) {
              sec6TitleChars.forEach(chars => gsap.set(chars, { opacity: 0 }));
              sec6DescChars.forEach(chars => gsap.set(chars, { opacity: 0 }));
              const chars = [...sec6TitleChars[sec6Idx], ...sec6DescChars[sec6Idx]];
              sec56ExitTl.to(chars, {
                opacity: 1, duration: 0.05,
                stagger: { amount: 0.5, from: 'random' },
                ease: 'power2.out',
              }, 0.15);
            }
          }
        }
      },
    });

    // 0.00–0.08: Hero & desc fade out
    scrollTl.to(heroChars, {
      opacity: 0, duration: 0.024,
      stagger: { amount: 0.056, from: 'random' },
      ease: 'power2.in',
    }, 0);
    scrollTl.to(descChars, {
      opacity: 0, duration: 0.024,
      stagger: { amount: 0.056, from: 'random' },
      ease: 'power2.in',
    }, 0);
    scrollTl.to(descRef!, { opacity: 0, duration: 0.08, ease: 'none' }, 0);

    // 0.10–0.18: Sec2 fade in
    scrollTl.set(sec2Ref!, { opacity: 1 }, 0.10);
    scrollTl.to(sec2Chars, {
      opacity: 1, duration: 0.024,
      stagger: { amount: 0.056, from: 'random' },
      ease: 'power2.out',
    }, 0.10);
    scrollTl.to(sec2LineRef!, { opacity: 1, duration: 0.08, ease: 'none' }, 0.10);

    // 0.20–0.26: Sec2 fade out
    scrollTl.to(sec2Chars, {
      opacity: 0, duration: 0.018,
      stagger: { amount: 0.042, from: 'random' },
      ease: 'power2.in',
    }, 0.20);
    scrollTl.to(sec2LineRef!, { opacity: 0, duration: 0.06, ease: 'none' }, 0.20);
    scrollTl.set(sec2Ref!, { opacity: 0 }, 0.26);

    // 0.28–0.32: Sec3 fade in
    scrollTl.set(sec3Ref!, { opacity: 1 }, 0.28);
    scrollTl.to(sec3Chars, {
      opacity: 1, duration: 0.012,
      stagger: { amount: 0.028, from: 'random' },
      ease: 'power2.out',
    }, 0.28);

    // 0.80–0.84: Sec5 fade in
    scrollTl.set(sec5Ref!, { opacity: 1 }, 0.80);
    scrollTl.to(sec5Chars, {
      opacity: 1, duration: 0.012,
      stagger: { amount: 0.028, from: 'random' },
      ease: 'power2.out',
    }, 0.80);

    // Anchor end at progress = 1
    scrollTl.set({}, {}, 1);

    // Initialize scene
    const scene = createScene(BG_COLOR);
    const renderer = createRenderer(containerRef, { bgColor: BG_COLOR });
    const camera = createCamera(window.innerWidth / window.innerHeight, CameraConfig);
    const controls = createCameraControls(camera, renderer.domElement);

    // Initialize systems
    const mouseParallax = createMouseParallax(window.innerWidth, window.innerHeight);
    scrollSystem = createScrollSystem();
    const cameraPath = createCameraPath();

    // Setup systems
    mouseParallax.setup();
    scrollSystem.setup(pinRef!);

    // Initialize camera position using preloader path
    const initPos = cameraPath.getInitialPosition();
    const initTarget = cameraPath.getInitialTarget();
    controls.setLookAt(initPos.x, initPos.y, initPos.z, initTarget.x, initTarget.y, initTarget.z, false);

    // Load camera path
    cameraPath.load('./camera.glb').then(() => {
      setPathReady(true);
      // Reset to curve start position after load
      const startPos = cameraPath.getPositionAt(0);
      const startTarget = cameraPath.getTargetAt(0);
      controls.setLookAt(startPos.x, startPos.y, startPos.z, startTarget.x, startTarget.y, startTarget.z, false);
    }).catch((err) => {
      console.warn('[App] Using fallback preloader path:', err);
      setPathReady(true);
    });

    // Create scene objects
    const { mesh: gradient, material: gradientMaterial } = createGradientPlane();
    const { mesh: floor, material: floorMaterial } = createFloor(renderer, camera, scene, isMobile, BG_COLOR, gradient);
    scene.add(floor, gradient);

    // Load lines
    const lineMaterials: THREE.ShaderMaterial[] = [];
    let circleLines: THREE.Mesh[] = [];
    loadLines('./scene.obj', isMobile).then(({ container, materials, circleLines: circles }) => {
      scene.add(container);
      lineMaterials.push(...materials);
      circleLines = circles;
    });

    // Post-processing
    const post = createComposer(renderer, scene, camera, PostParams);

    // Resize handler
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const pr = renderer.getPixelRatio();

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      post.resize(width, height, pr);
      mouseParallax.resize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = (time: number, deltaTimeMs: number) => {
      const dt = deltaTimeMs / 1000;

      // ── Progress remapping: 前4000px保持原速，后1000px给新div ──
      const rawProgress = scrollSystem.progress;
      const BASE_END = 4000 / 5000; // 0.8
      const baseProgress = Math.min(1, rawProgress / BASE_END);

      if (pathReady()) {
        const pos = cameraPath.getPositionAt(baseProgress);
        const target = cameraPath.getTargetAt(baseProgress);
        controls.setLookAt(pos.x, pos.y, pos.z, target.x, target.y, target.z, true);

        // 关闭后处理雾效，测试反射材质中的地平线淡出效果
        post.dotEffect.setHorizonFog(0, 0.5, 0.1);
      }

      mouseParallax.update(controls);
      controls.update(dt);

      // Update materials
      const animTime = time * 2;
      lineMaterials.forEach(m => m.uniforms.uTime.value = animTime);
      gradientMaterial.uniforms.uTime.value = animTime;

      // Update circleLines alpha based on scroll progress
      circleLines.forEach((mesh, i) => {
        const offset = 0.02 * Math.floor(i / 4);
        const alpha = mapRange(baseProgress, 0.85 + offset, 0.89 + offset, 0, 1, true);
        (mesh.material as THREE.MeshBasicMaterial).opacity = alpha;
      });

      // ── All scroll-driven transitions (scrubbed + triggered via onUpdate) ──
      scrollTl.progress(baseProgress);

      // ── 白色div：从底部滑入（rawProgress 0.8 → 0.9，即500px）──
      const WHITE_END = 0.9;
      const whiteP = mapRange(rawProgress, BASE_END, WHITE_END, 0, 1, true);
      whiteOverlayRef!.style.transform = `translateY(${(1 - whiteP) * 100}%)`;

      // ── 黑色div：从底部滑入（rawProgress 0.9 → 1.0，即500px）──
      const blackP = mapRange(rawProgress, WHITE_END, 1, 0, 1, true);
      blackOverlayRef!.style.transform = `translateY(${(1 - blackP) * 100}%)`;

      floorMaterial.update();

      post.composer.render(dt);
    };
    gsap.ticker.add(animate);

    // Cleanup
    onCleanup(() => {
      // Kill all GSAP timelines
      getStartedTl?.kill();
      scrollTl.kill();
      sec4Tl?.kill();
      sec34ExitTl?.kill();
      sec6Tl?.kill();
      sec56ExitTl?.kill();
      menuTl?.kill();
      drawer2Tl?.kill();

      gsap.ticker.remove(animate);
      window.removeEventListener('resize', handleResize);
      mouseParallax.dispose();
      scrollSystem.dispose();
      controls.dispose();
      floorMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    });
  });

  return (
    <>
      <div ref={containerRef} class="fixed inset-0 w-full h-full" />
      <div ref={pinRef} class="relative w-full h-screen">
          <div ref={whiteOverlayRef} class="absolute inset-0 bg-white z-40" style={{ transform: 'translateY(100%)' }} />
          <div ref={blackOverlayRef} class="absolute inset-0 bg-black z-41" style={{ transform: 'translateY(100%)' }} />
          <div ref={sec2Ref} class="absolute inset-0 flex justify-end px-4 md:px-8" style={{ opacity: 0 }}>
            <div class="w-1/3 flex flex-col gap-6 h-screen justify-center">
              <p class="text-xs font-light text-white leading-tight">
                <SplitText text="Redefining Cross-Border Finance" chars={sec2Chars} />
              </p>
              <div ref={sec2LineRef} class="w-full h-2 border border-solid border-b-0 border-white/50" style={{ opacity: 0 }} />
              <p class="text-gray-300 text-sm md:text-base lg:text-lg leading-relaxed">
                <SplitText text="The global financial landscape is undergoing a fundamental transformation. Traditional correspondent banking networks, built decades ago, remain slow, opaque, and expensive. Settlement windows stretch across days, intermediary fees compound at every hop, and compliance requirements fragment across jurisdictions. For businesses operating internationally, these inefficiencies translate directly into lost revenue and constrained growth." chars={sec2Chars} />
              </p>
            </div>
          </div>
          {/* section3 */}
          <div ref={sec3Ref} class="absolute inset-0 flex justify-start px-4 md:px-8" style={{ opacity: 0 }}>
            <div class="w-1/2 flex flex-col gap-6 h-screen justify-center">
              <p class="text-9xl font-light text-white leading-tight">
                <SplitText text="Our Services" chars={sec3Chars} />
              </p>
            </div>
          </div>
          {/* section4 — fully triggered animations */}
          <div ref={sec4Ref} class="absolute inset-0 flex justify-end">
            <div class="w-[40%] flex flex-col gap-6 h-screen justify-between bg-[#1a1e3a]/80 p-4">
              <div class="relative">
                {sec4Data.map((item, i) => (
                  <h1
                    class={`text-6xl font-light text-white leading-tight ${i > 0 ? 'absolute top-0 left-0 right-0' : ''}`}
                  >
                    <SplitText text={item.title} chars={sec4TitleChars[i]} />
                  </h1>
                ))}
              </div>
              <div>
                <div class="w-full h-2 border border-solid border-b-0 border-white/50" />
                <div class="relative mt-4">
                  {sec4Data.map((item, i) => (
                    <p
                      class={`text-base font-light text-white leading-tight ${i > 0 ? 'absolute top-0 left-0 right-0' : ''}`}
                    >
                      <SplitText text={item.desc} chars={sec4DescChars[i]} />
                    </p>
                  ))}
                </div>
              </div>
              <div></div>
            </div>
          </div>
          {/* section5 */}
          <div ref={sec5Ref} class="absolute inset-0 flex justify-start px-4 md:px-8" style={{ opacity: 0 }}>
            <div class="w-1/2 flex flex-col gap-6 h-screen justify-center">
              <p class="text-9xl font-light text-white leading-tight">
                <SplitText text="Capital Flow" chars={sec5Chars} />
              </p>
            </div>
          </div>
          {/* section6 — triggered animations */}
          <div ref={sec6Ref} class="absolute inset-0 flex justify-end">
            <div class="w-[40%] flex flex-col gap-6 h-screen justify-between bg-[#1a1e3a]/80 p-4">
              <div class="relative">
                {sec6Data.map((item, i) => (
                  <h1
                    class={`text-6xl font-light text-white leading-tight ${i > 0 ? 'absolute top-0 left-0 right-0' : ''}`}
                  >
                    <SplitText text={item.title} chars={sec6TitleChars[i]} />
                  </h1>
                ))}
              </div>
              <div>
                <div class="w-full h-2 border border-solid border-b-0 border-white/50" />
                <div class="relative mt-4">
                  {sec6Data.map((item, i) => (
                    <p
                      class={`text-base font-light text-white leading-tight ${i > 0 ? 'absolute top-0 left-0 right-0' : ''}`}
                    >
                      <SplitText text={item.desc} chars={sec6DescChars[i]} />
                    </p>
                  ))}
                </div>
              </div>
              <div></div>
            </div>
          </div>
        {/* Drawer */}
        <div ref={drawerRef} class="absolute inset-0 z-40 invisible">
          <div ref={backdropRef} class="absolute inset-0 bg-[#0d1033]/80" />
          <div ref={panelRef} class="absolute left-0 top-0 h-full bg-[#0d1033]/95 backdrop-blur-md overflow-y-auto flex items-center" style={{ transform: 'translateX(-100%)' }}>
            <nav class="flex flex-col gap-2 px-6" onMouseLeave={hideDrawer2}>
              <For each={menuData}>
                {(item, i) => (
                  <a class="text-6xl text-white/70 hover:text-white transition-colors cursor-pointer py-2 flex items-center gap-2"
                    onMouseEnter={(e) => showDrawer2(i(), e)}
                  >{item.label} <span class="i-mdi-light-chevron-right text-2xl" /></a>
                )}
              </For>
            </nav>
            {/* Divider: line + angular arrow */}
            <div ref={dividerRef} class="absolute right-0 top-0 h-full opacity-0 pointer-events-none" style={{ width: '12px' }}>
              {/* Top line */}
              <div class="absolute right-px top-0 w-px bg-white/20" style={{ height: `${Math.max(0, arrowY() - 12)}px` }} />
              {/* Angular left-pointing arrow */}
              <svg class="absolute right-0" width="12" height="24" viewBox="0 0 12 24" fill="none"
                style={{ top: `${arrowY() - 12}px` }}>
                <path d="M11 0 L1 12 L11 24" stroke="#fff" stroke-opacity="0.3" stroke-width="1" stroke-linejoin="miter" />
              </svg>
              {/* Bottom line */}
              <div class="absolute right-px w-px bg-white/20" style={{ top: `${arrowY() + 12}px`, bottom: '0' }} />
            </div>
          </div>
          {/* Drawer2 — 描述面板，clip-path 从左向右延伸 */}
          <div ref={drawer2Ref} class="absolute top-0 h-full bg-[#0d1033]/90 backdrop-blur-md flex items-center justify-center invisible">
            <Show when={activeIndex() >= 0}>
              {menuData[activeIndex()].content()}
            </Show>
          </div>
        </div>
        <div class="absolute inset-0 flex flex-col justify-between overflow-hidden">
          <nav class="relative flex flex-col lg:flex-row items-start justify-between px-4 py-3 md:px-4 md:py-4">
            <div id="main" ref={mainRef} class="flex flex-row gap-4 items-start relative z-50">

              <div class="flex flex-row">
                {/* Logo */}
                <div class="flex items-center gap-2 rounded-l-md px-4 bg-[#1a1e3a]/30">
                  <img src="/logo.svg" alt="Logo" class="lg:w-20 lg:h-20" />
                  <p class="text-white lg:text-xl font-700">FLOW CAPITAL</p>
                </div>
                {/* Hamburger */}
                <button
                  class="relative w-20 h-20 rounded-r-md border-white bg-[#6f738a]/40 border-0 cursor-pointer"
                  onClick={toggleMenu}
                >
                  <span ref={line1Ref} class="absolute left-1/2 top-1/2 -ml-4 block w-8 h-px bg-white" style={{ transform: 'translateY(-4px)' }} />
                  <span ref={line2Ref} class="absolute left-1/2 top-1/2 -ml-4 block w-8 h-px bg-white" style={{ transform: 'translateY(4px)' }} />
                </button>
              </div>
              {/* Get Started */}
              <div
                ref={getStartedRef}
                class="relative bg-orange-500 text-white lg:w-80 rounded-md overflow-hidden cursor-pointer"
                onMouseEnter={() => getStartedTl?.play()}
                onMouseLeave={() => getStartedTl?.reverse()}
              >
                {/* Header — 固定高度，蒙版和箭头锚定在此 */}
                <div ref={headerRef} class="relative flex items-center gap-1 px-4 h-20">
                  <p class="font-700">Get Started</p>
                  {/* 白色蒙版 */}
                  <div
                    ref={maskRef}
                    class="absolute left-0 top-0 w-full h-full bg-white/30 backdrop-blur-sm z-5"
                  />
                  {/* 箭头 */}
                  <div
                    ref={arrowRef}
                    class="i-mdi-light-chevron-down text-3xl absolute bottom-1 right-1 z-20 cursor-pointer"
                  />
                </div>
                {/* 展开菜单 */}
                <div class="px-4">
                  <a class="block py-2 text-white/70 lg:text-xl hover:text-white transition-colors cursor-pointer">Initiate Your Settlement</a>
                  <div class="mx-1 h-px bg-white/30" />
                  <a class="block py-2 text-white/70 lg:text-xl hover:text-white transition-colors cursor-pointer">Contact</a>
                </div>
              </div>
            </div>
            <div ref={heroRef} class="lg:text-right lg:flex-1">
              <h1 class="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-light leading-[0.95] tracking-tight">
                <SplitText text="Capital" class="text-orange-500" chars={heroChars} />
                <br />
                <SplitText text="Without" class="text-white" chars={heroChars} />
                <br />
                <SplitText text="Borders" class="text-white" chars={heroChars} />
              </h1>
            </div>
          </nav>
          <div ref={descRef} class="relative px-4 md:px-4 mt-8 md:mt-16 lg:mt-24 gap-8 lg:gap-0" >
            <div class="bg-[#1a1e3a]/80 backdrop-blur-sm rounded-lg max-w-2xl flex flex-col justify-between mb-8 p-4 h-[30vh]">
              <p class="text-gray-300 text-sm md:text-base lg:text-xl leading-relaxed">
                <SplitText text="By combining blockchain infrastructure, compliant custody, and real-time settlement, Flow Capital enables seamless international transfers, treasury operations, and digital asset liquidity management for the modern global economy." chars={descChars} />
              </p>
              <div data-flicker-btn class="bg-white/10 mt-6 w-10 h-10 flex items-center justify-center rounded-md text-gray hover:text-white transition-colors self-end cursor-pointer">
                <span class="i-mdi-light-chevron-down text-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
