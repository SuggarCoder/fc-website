import * as THREE from 'three';

export interface RendererConfig {
  bgColor: number;
}

export const createRenderer = (
  container: HTMLElement,
  config: RendererConfig
): THREE.WebGLRenderer => {
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // toneMapping 由 postprocessing 的 ToneMappingEffect 处理
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(config.bgColor);
  container.appendChild(renderer.domElement);
  return renderer;
};
