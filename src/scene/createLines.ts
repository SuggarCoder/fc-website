import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { SCALE, COLORS, LineConfig } from '../config';
import { lineVertexShader, lineFragmentShader } from '../shaders';
import { LinearCurve, StaticCurve } from '../utils/curves';
import { adjustBrightness } from '../utils/helpers';

export interface LinesResult {
  container: THREE.Group;
  materials: THREE.ShaderMaterial[];
  circleLines: THREE.Mesh[];  // crossroad_orange_circle_ lines for alpha animation
}

const createLineMaterial = (
  segmentCount: number,
  isAnimated: boolean,
  hideCorners: boolean,
  color: number
): THREE.ShaderMaterial => {
  const colorObj = new THREE.Color();
  // source.js uses LinearSRGBColorSpace (h.Dd)
  colorObj.setHex(color, THREE.LinearSRGBColorSpace);
  return new THREE.ShaderMaterial({
    lights: false, // source.js: lights: !1
    vertexShader: lineVertexShader,
    fragmentShader: lineFragmentShader,
    transparent: true,
    depthTest: true,
    depthWrite: true,
    fog: true,
    side: THREE.DoubleSide,  // 防止某些角度背面被剔除导致断续
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uColor: { value: colorObj },
        uTime: { value: 0 },
        uSize: { value: segmentCount / 2 },
        uSpeed: { value: isAnimated ? 1 : 0 },
        uHideCorners: { value: hideCorners },
        uAlpha: { value: 1 }
      }
    ])
  });
};

export const loadLines = (url: string, isMobile: boolean): Promise<LinesResult> => {
  return new Promise((resolve) => {
    const objLoader = new OBJLoader();
    const materials: THREE.ShaderMaterial[] = [];
    const circleLines: THREE.Mesh[] = [];
    const container = new THREE.Group();

    objLoader.load(url, (obj) => {
      obj.children.forEach((child) => {
        if (!(child instanceof THREE.Mesh || child instanceof THREE.Line)) return;
        const geo = (child as THREE.Mesh | THREE.Line).geometry as THREE.BufferGeometry;
        if (!geo?.attributes?.position) return;

        const name = child.name.toLowerCase();
        const posArray = geo.attributes.position.array as Float32Array;
        const points: THREE.Vector3[] = [];
        for (let i = 0; i < posArray.length; i += 3) {
          points.push(new THREE.Vector3(posArray[i], posArray[i + 1], posArray[i + 2]).multiplyScalar(SCALE));
        }
        if (points.length < 2) return;

        const isRoadOrGraphic = name.includes('road') || name.includes('graphic') ||
                                name.includes('integration') || name.includes('payments');
        const isBlue = name.includes('blue');
        const isWhite = name.includes('white');
        const baseColor = isWhite ? COLORS.WHITE : (isBlue ? COLORS.BLUE : COLORS.ORANGE);

        const curve = isRoadOrGraphic ? new LinearCurve(points) : new StaticCurve(points);
        const curveLength = curve.getLength();
        const segmentCount = Math.round(100 * curveLength);

        let tubularSegments: number, radius: number, color: number, hideCorners: boolean;

        if (isRoadOrGraphic) {
          color = adjustBrightness(baseColor, -20);
          hideCorners = true;
          const isThin = name.includes('thin');
          radius = isThin
            ? (isMobile ? LineConfig.mobileRadius.thin : LineConfig.desktopRadius.thin)
            : (isMobile ? LineConfig.mobileRadius.normal : LineConfig.desktopRadius.normal);
          tubularSegments = segmentCount < 10
            ? (isMobile ? LineConfig.mobileTubularSegments.low : LineConfig.desktopTubularSegments.low)
            : (isMobile ? LineConfig.mobileTubularSegments.high : LineConfig.desktopTubularSegments.high);
        } else {
          color = baseColor;
          hideCorners = false;
          radius = isMobile ? LineConfig.mobileRadius.thin : LineConfig.desktopRadius.thin;
          tubularSegments = points.length - 1;
        }

        const radialSegments = isMobile ? LineConfig.mobileRadialSegments : LineConfig.desktopRadialSegments;
        const tubeGeo = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
        const material = createLineMaterial(segmentCount, isRoadOrGraphic, hideCorners, color);
        materials.push(material);
        const mesh = new THREE.Mesh(tubeGeo, material);
        mesh.name = name;
        container.add(mesh);

        // Collect circleLines for alpha animation (source.js: crossroad_orange_circle_)
        if (name.includes('crossroad_orange_circle_')) {
          circleLines.push(mesh);
        }
      });

      container.position.set(0, 0, 0.5);
      resolve({ container, materials, circleLines });
    });
  });
};
