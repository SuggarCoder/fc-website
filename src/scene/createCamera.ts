import * as THREE from 'three';
import CameraControls from 'camera-controls';

CameraControls.install({ THREE });

export interface CameraConfig {
  fov: number;
  near: number;
  far: number;
}

export const createCamera = (
  aspect: number,
  config: CameraConfig
): THREE.PerspectiveCamera => {
  return new THREE.PerspectiveCamera(config.fov, aspect, config.near, config.far);
};

export const createCameraControls = (
  camera: THREE.Camera,
  domElement: HTMLElement
): CameraControls => {
  const controls = new CameraControls(camera, domElement);
  controls.enabled = false;
  controls.smoothTime = 0.2;
  controls.maxPolarAngle = 1.67;
  return controls;
};
