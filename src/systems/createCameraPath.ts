import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SCALE, PRELOADER_PATH } from '../config';

export interface CameraPathSystem {
  readonly ready: boolean;
  load: (url: string) => Promise<void>;
  onReady: (callback: () => void) => void;
  getInitialPosition: () => THREE.Vector3;
  getInitialTarget: () => THREE.Vector3;
  getPositionAt: (t: number) => THREE.Vector3;
  getTargetAt: (t: number) => THREE.Vector3;
}

export const createCameraPath = (): CameraPathSystem => {
  const gltfLoader = new GLTFLoader();
  let curve = new THREE.CatmullRomCurve3([]);
  let lookCurve = new THREE.CatmullRomCurve3([]);
  const position = new THREE.Vector3();
  const target = new THREE.Vector3();
  let isReady = false;
  let readyCallbacks: (() => void)[] = [];

  const preloaderPath = PRELOADER_PATH.map(p => ({
    position: new THREE.Vector3().fromArray(p.position as unknown as number[]),
    target: new THREE.Vector3().fromArray(p.target as unknown as number[])
  }));

  return {
    get ready() { return isReady; },

    load: (url: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        gltfLoader.load(
          url,
          (gltf) => {
            const positionPoints: THREE.Vector3[] = [];
            const targetPoints: THREE.Vector3[] = [];

            const positionItems: { index: number; pos: THREE.Vector3 }[] = [];
            const targetItems: { index: number; pos: THREE.Vector3 }[] = [];

            gltf.scene.children.forEach((child) => {
              const name = child.name.toLowerCase();
              const pos = child.position.clone();
              pos.multiplyScalar(SCALE);
              pos.z += 0.5;

              // Extract number from name (e.g., "camera_position_4" -> 4)
              const match = name.match(/(\d+)$/);
              const index = match ? parseInt(match[1], 10) : 0;

              if (name.includes('position')) {
                positionItems.push({ index, pos });
              } else if (name.includes('target')) {
                targetItems.push({ index, pos });
              }
            });

            // Sort by index number descending (higher number = start, lower = end)
            positionItems.sort((a, b) => b.index - a.index);
            targetItems.sort((a, b) => b.index - a.index);

            positionItems.forEach(item => positionPoints.push(item.pos));
            targetItems.forEach(item => targetPoints.push(item.pos));

            if (positionPoints.length > 0) {
              curve = new THREE.CatmullRomCurve3(positionPoints);
            }
            if (targetPoints.length > 0) {
              lookCurve = new THREE.CatmullRomCurve3(targetPoints);
            }

            console.log(`[CameraPath] Loaded ${positionPoints.length} position points, ${targetPoints.length} target points`);

            isReady = true;
            readyCallbacks.forEach(cb => cb());
            readyCallbacks = [];
            resolve();
          },
          undefined,
          (error) => {
            console.error('[CameraPath] Failed to load camera.glb:', error);
            reject(error);
          }
        );
      });
    },

    onReady: (callback: () => void) => {
      if (isReady) {
        callback();
      } else {
        readyCallbacks.push(callback);
      }
    },

    getInitialPosition: (): THREE.Vector3 => {
      return preloaderPath[0].position.clone();
    },

    getInitialTarget: (): THREE.Vector3 => {
      return preloaderPath[0].target.clone();
    },

    getPositionAt: (t: number): THREE.Vector3 => {
      if (curve.points.length === 0) {
        return position.copy(preloaderPath[0].position);
      }
      return curve.getPoint(t, position);
    },

    getTargetAt: (t: number): THREE.Vector3 => {
      if (lookCurve.points.length === 0) {
        return target.copy(preloaderPath[0].target);
      }
      return lookCurve.getPoint(t, target);
    }
  };
};
