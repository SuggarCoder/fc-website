import * as THREE from 'three';
import { gradientVertexShader, gradientFragmentShader } from '../shaders';

export interface GradientResult {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
}

export const createGradientPlane = (): GradientResult => {
  const material = new THREE.ShaderMaterial({
    lights: false, // source.js: lights: !1
    vertexShader: gradientVertexShader,
    fragmentShader: gradientFragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 } }
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), material);
  mesh.position.set(-0.135, 0, 0.64);
  mesh.rotation.x = Math.PI / 2;
  mesh.rotation.z = 2.36;

  return { mesh, material };
};
