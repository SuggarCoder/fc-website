import * as THREE from 'three';

export const createScene = (bgColor: number): THREE.Scene => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bgColor);
  scene.fog = new THREE.Fog(bgColor, 0.02, 0.15);
  scene.add(new THREE.AmbientLight(0xffffff, 1));
  return scene;
};
