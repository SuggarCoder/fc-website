import { type Component, onMount, onCleanup } from 'solid-js';
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
  const isMobile = false;

  onMount(() => {
    if (!containerRef) return;

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
      <div class="relative z-10 pointer-events-none select-none">
        <div class="h-screen flex items-center justify-center">
          <div class="text-white text-center pointer-events-auto">
            <h1 class="text-4xl font-bold mb-4">Scroll Down</h1>
            <p class="text-lg opacity-70">滚动页面查看相机动画效果</p>
          </div>
        </div>
        <div class="h-screen flex items-center justify-center">
          <div class="text-white text-center pointer-events-auto">
            <h2 class="text-3xl font-bold mb-4">Section 2</h2>
            <p class="text-lg opacity-70">相机正在移动...</p>
          </div>
        </div>
        <div class="h-screen flex items-center justify-center">
          <div class="text-white text-center pointer-events-auto">
            <h2 class="text-3xl font-bold mb-4">Section 4</h2>
            <p class="text-lg opacity-70">即将到达终点</p>
          </div>
        </div>
        <div class="h-screen flex items-center justify-center">
          <div class="text-white text-center pointer-events-auto">
            <h2 class="text-3xl font-bold mb-4">The End</h2>
            <p class="text-lg opacity-70">滚动回顶部重新开始</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
