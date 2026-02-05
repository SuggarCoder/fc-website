import * as THREE from 'three';
import { MeshReflectorMaterial } from '../MeshReflectorMaterial';
import { FloorConfig } from '../config';

export interface FloorResult {
  mesh: THREE.Mesh;
  material: MeshReflectorMaterial;
}

export const createFloor = (
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  scene: THREE.Scene,
  isMobile: boolean,
  fakeFloor?: THREE.Object3D
): FloorResult => {
  const textureLoader = new THREE.TextureLoader();

  const roughnessMap = textureLoader.load('./texture/unnamed.avif');
  roughnessMap.repeat.set(4, 4);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;

  const normalMap = textureLoader.load('./texture/def-normal.avif');
  normalMap.repeat.set(4, 4);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;

  const geometry = new THREE.PlaneGeometry(1.5, 1.5);
  const mesh = new THREE.Mesh(geometry);
  mesh.position.y = -0.0005;
  mesh.rotation.x = -Math.PI / 2;

  // Track fakeFloor visibility state
  let fakeFloorWasVisible = false;

  const material = new MeshReflectorMaterial(renderer, camera, scene, mesh, {
    resolution: isMobile ? FloorConfig.mobileResolution : FloorConfig.desktopResolution,
    blur: isMobile ? FloorConfig.mobileBlur : FloorConfig.desktopBlur,
    blur2: isMobile ? FloorConfig.mobileBlur2 : FloorConfig.desktopBlur2,
    mixBlur: FloorConfig.mixBlur,
    mixStrength: FloorConfig.mixStrength,
    mixContrast: FloorConfig.mixContrast,
    mirror: FloorConfig.mirror,
    depthScale: FloorConfig.depthScale,
    minDepthThreshold: FloorConfig.minDepthThreshold,
    maxDepthThreshold: FloorConfig.maxDepthThreshold,
    depthToBlurRatioBias: FloorConfig.depthToBlurRatioBias,
    distortion: FloorConfig.distortion,
    roughnessMap: roughnessMap,
    normalMap: normalMap,
    roughness: FloorConfig.roughness,
    metalness: FloorConfig.metalness,
    normalScale: new THREE.Vector2(...FloorConfig.normalScale),
    onBeforeRender: () => {
      if (fakeFloor) {
        fakeFloorWasVisible = fakeFloor.visible;
        fakeFloor.visible = false;
      }
    },
    onAfterRender: () => {
      if (fakeFloor) {
        fakeFloor.visible = fakeFloorWasVisible;
      }
    }
  });

  mesh.material = material;

  return { mesh, material };
};
