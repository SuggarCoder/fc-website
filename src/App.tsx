import { type Component, onMount, onCleanup, createSignal } from 'solid-js';
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

const App: Component = () => {
  let containerRef: HTMLDivElement | undefined;
  let line1Ref: HTMLSpanElement | undefined;
  let line2Ref: HTMLSpanElement | undefined;
  let arrowRef: HTMLDivElement | undefined;
  let maskRef: HTMLDivElement | undefined;
  let getStartedTl: gsap.core.Timeline | undefined;

  const [menuOpen, setMenuOpen] = createSignal(false);
  const isMobile = false;

  let menuTl: gsap.core.Timeline | undefined;
  const menuProxy = { t: 0 };

  const toggleMenu = () => {
    const opening = !menuOpen();
    setMenuOpen(opening);

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
     tl.to(menuProxy, {                                                                                                                        
           t: opening ? 1 : 0,                                                                                                                     
            duration: 0.75,                                                                                                                         
            ease: 'power2.inOut',                                                                                                                   
            onUpdate: updateOrbit,                                                                                                                  
          });                                                                                                                                       
        };

  onMount(() => {
    if (!containerRef || !arrowRef ||!maskRef) return;
    const button = maskRef.parentElement!;
    let size = 0;
    getStartedTl = gsap.timeline({
      paused: true,
      onStart: () => {
        size = arrowRef.clientHeight * 2;
      },
    });

    getStartedTl
      .to(
        arrowRef,
        {
          rotate: 180,
          transformOrigin: '50% 50%',
          duration: 0.25,
          ease: 'power2.out',
        },
        0
      )
   .to(
    maskRef,
    {
      width: () => size,
      height: () => size,
      x: () => button.clientWidth - size,
      y: () => button.clientHeight - size,
      borderRadius: '0.375rem', // rounded-md
      duration: 0.35,
      ease: 'power2.inOut',
    },
    0
  );

    const onEnter = () => getStartedTl!.play();
    const onLeave = () => getStartedTl!.reverse();

    arrowRef.addEventListener('mouseenter', onEnter);
    arrowRef.addEventListener('mouseleave', onLeave);
    

    // Initialize scene
    const scene = createScene(BG_COLOR);
    const renderer = createRenderer(containerRef, { bgColor: BG_COLOR });
    const camera = createCamera(window.innerWidth / window.innerHeight, CameraConfig);
    const controls = createCameraControls(camera, renderer.domElement);

    // Initialize systems
    const mouseParallax = createMouseParallax(window.innerWidth, window.innerHeight);
    const scrollSystem = createScrollSystem();
    const cameraPath = createCameraPath();

    // Setup systems
    mouseParallax.setup();
    scrollSystem.setup();

    // Initialize camera position using preloader path
    const initPos = cameraPath.getInitialPosition();
    const initTarget = cameraPath.getInitialTarget();
    controls.setLookAt(initPos.x, initPos.y, initPos.z, initTarget.x, initTarget.y, initTarget.z, false);

    // Load camera path
    let pathReady = false;
    cameraPath.load('./camera.glb').then(() => {
      pathReady = true;
      // Reset to curve start position after load
      const startPos = cameraPath.getPositionAt(0);
      const startTarget = cameraPath.getTargetAt(0);
      controls.setLookAt(startPos.x, startPos.y, startPos.z, startTarget.x, startTarget.y, startTarget.z, false);
    }).catch((err) => {
      console.warn('[App] Using fallback preloader path:', err);
      pathReady = true;
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

      if (pathReady) {
        const pos = cameraPath.getPositionAt(scrollSystem.progress);
        const target = cameraPath.getTargetAt(scrollSystem.progress);
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
      const progress = scrollSystem.progress;
      circleLines.forEach((mesh, i) => {
        const offset = 0.02 * Math.floor(i / 4);
        const alpha = mapRange(progress, 0.85 + offset, 0.89 + offset, 0, 1, true);
        (mesh.material as THREE.MeshBasicMaterial).opacity = alpha;
      });

      floorMaterial.update();

      post.composer.render(dt);
    };
    gsap.ticker.add(animate);

    // Cleanup
    onCleanup(() => {
      arrowRef.removeEventListener('mouseenter', onEnter);
      arrowRef.removeEventListener('mouseleave', onLeave);
      getStartedTl?.kill();
      gsap.ticker.remove(animate);
      window.removeEventListener('resize', handleResize);
      mouseParallax.dispose();
      scrollSystem.dispose();
      controls.dispose();
      floorMaterial.dispose();
      renderer.dispose();
      containerRef?.removeChild(renderer.domElement);
    });
  });

  return (
    <>
      <div ref={containerRef} class="fixed inset-0 w-full h-full" />
        <div class="absolute inset-0 flex flex-col items-between justify-between overflow-hidden">
            <nav class="relative flex flex-col lg:flex-row items-start justify-between px-4 py-3 md:px-4 md:py-4">
              <div class="flex flex-row gap-4">
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
                <div class="relative bg-orange-500 transition-colors text-white px-4 lg:w-60 rounded-md flex items-center gap-1 overflow-hidden">
                  <p class="font-700">Get Started</p>
                    {/* 白色蒙版 */}
                  <div
                    ref={maskRef}
                    class="absolute left-0 top-0 h-full bg-white/30 backdrop-blur-sm z-5"
                    style={{ width: '100%', height: '100%' }}/>
                    {/* 箭头（hover 触发源） */}
                    <div
                      ref={arrowRef}
                      class="i-mdi-light-chevron-down text-3xl absolute bottom-1 right-1 z-20 cursor-pointer"
                    />
                </div>                
              </div>
              <div class="lg:text-right lg:flex-1">
                <h1 class="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-light leading-[0.95] tracking-tight">
                  <span class="text-orange-500">Motion</span>
                  <br />
                  <span class="text-white">Without</span>
                  <br />
                  <span class="text-white">Borders</span>
                </h1>
              </div>                
            </nav>
            <div class="relative flex flex-col lg:flex-row items-start justify-between px-4 md:px-4 mt-8 md:mt-16 lg:mt-24 gap-8 lg:gap-0">
              <div class="lg:self-end lg:mb-8 max-w-lg">
                <div class="bg-[#1a1e3a]/80 backdrop-blur-sm rounded-lg p-6 md:p-8">
                  <p class="text-gray-300 text-sm md:text-base leading-relaxed">
                  By combining blockchain infrastructure, compliant custody, and real-time settlement, Flow Capital enables seamless international transfers, treasury operations, and digital asset liquidity management for the modern global economy.
                  </p>
                  <button class="bg-gray mt-6 w-10 h-10 flex items-center justify-center border border-gray-500 rounded-md text-gray-400 hover:text-white hover:border-white transition-colors">
                    <span class="i-carbon-chevron-down text-lg" />
                  </button>
                </div>
              </div>
            </div>
      </div>
    </>
  );
};

export default App;
