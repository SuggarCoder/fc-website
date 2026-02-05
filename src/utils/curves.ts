import * as THREE from 'three';

export class LinearCurve extends THREE.Curve<THREE.Vector3> {
  positions: THREE.Vector3[];

  constructor(positions: THREE.Vector3[]) {
    super();
    this.positions = positions;
  }

  getPoint(t: number, optionalTarget = new THREE.Vector3()): THREE.Vector3 {
    const points = this.positions;
    const len = points.length - 1;
    const idx = Math.floor(t * len);
    const segmentT = 1 / len;
    const localT = (t - idx * segmentT) / segmentT;

    const p0 = points[idx];
    const p1 = points[idx + 1];

    if (!p1) return optionalTarget.copy(p0);
    return optionalTarget.lerpVectors(p0, p1, localT);
  }
}

export class StaticCurve extends LinearCurve {
  getPointAt(t: number, optionalTarget?: THREE.Vector3): THREE.Vector3 {
    return this.getPoint(t, optionalTarget);
  }
}
