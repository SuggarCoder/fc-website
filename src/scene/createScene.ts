import * as THREE from 'three';

export const createScene = (bgColor: number): THREE.Scene => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bgColor);
  // 调整雾效：near=0.01 开始淡化，far=0.08 完全融入背景
  // 这样地平线附近的物体会自然融入背景色
  //scene.fog = new THREE.Fog(bgColor, 0.01, 0.15);
  scene.fog = new THREE.FogExp2(bgColor,15); // 增强雾效密度
  scene.add(new THREE.AmbientLight(0xffffff, 1));
  return scene;
};
