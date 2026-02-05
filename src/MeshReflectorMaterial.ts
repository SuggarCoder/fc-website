import * as THREE from 'three';
import { KawaseBlurPass } from 'postprocessing';

export interface MeshReflectorMaterialParams {
  mixBlur?: number;
  mixStrength?: number;
  resolution?: number;
  blur?: [number, number];
  blur2?: [number, number];
  minDepthThreshold?: number;
  maxDepthThreshold?: number;
  depthScale?: number;
  depthToBlurRatioBias?: number;
  mirror?: number;
  distortion?: number;
  mixContrast?: number;
  reflectorOffset?: number;
  bufferSamples?: number;
  planeNormal?: THREE.Vector3;
  roughnessMap?: THREE.Texture;
  normalMap?: THREE.Texture;
  roughness?: number;
  metalness?: number;
  normalScale?: THREE.Vector2;
  distortionMap?: THREE.Texture;
  onBeforeRender?: () => void;
  onAfterRender?: () => void;
}

export class MeshReflectorMaterial extends THREE.MeshStandardMaterial {
  private gl: THREE.WebGLRenderer;
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private parent: THREE.Mesh;

  private fbo1: THREE.WebGLRenderTarget;
  private fbo2: THREE.WebGLRenderTarget;
  private fbo3: THREE.WebGLRenderTarget;

  private kawaseBlurPass: KawaseBlurPass;
  private kawaseBlurPass2: KawaseBlurPass;

  private reflectorPlane: THREE.Plane;
  private normal: THREE.Vector3;
  private reflectorWorldPosition: THREE.Vector3;
  private cameraWorldPosition: THREE.Vector3;
  private rotationMatrix: THREE.Matrix4;
  private lookAtPosition: THREE.Vector3;
  private clipPlane: THREE.Vector4;
  private view: THREE.Vector3;
  private target: THREE.Vector3;
  private q: THREE.Vector4;
  private textureMatrix: THREE.Matrix4;
  private virtualCamera: THREE.PerspectiveCamera;

  private reflectorOffset: number;
  private planeNormal: THREE.Vector3;
  private hasBlur: boolean;

  private reflectorProps: { [key: string]: any };

  // source.js: onBeforeRender/onAfterRender callbacks
  private onBeforeRenderCallback?: () => void;
  private onAfterRenderCallback?: () => void;

  constructor(
    gl: THREE.WebGLRenderer,
    camera: THREE.Camera,
    scene: THREE.Scene,
    parent: THREE.Mesh,
    params: MeshReflectorMaterialParams = {}
  ) {
    super();

    const {
      mixBlur = 0,
      mixStrength = 1,
      resolution = 512,
      blur = [0, 0],
      blur2 = [0, 0],
      minDepthThreshold = 0.9,
      maxDepthThreshold = 1,
      depthScale = 0,
      depthToBlurRatioBias = 0.25,
      mirror = 0,
      distortion = 1,
      mixContrast = 1,
      reflectorOffset = 0,
      bufferSamples = 8,
      planeNormal = new THREE.Vector3(0, 0, 1),
      roughnessMap,
      normalMap,
      roughness = 1,
      metalness = 0,
      normalScale = new THREE.Vector2(1, 1),
      distortionMap,
      onBeforeRender,
      onAfterRender
    } = params;

    this.gl = gl;
    this.camera = camera;
    this.scene = scene;
    this.parent = parent;

    this.hasBlur = blur[0] + blur[1] > 0;

    // source.js: callbacks
    this.onBeforeRenderCallback = onBeforeRender;
    this.onAfterRenderCallback = onAfterRender;

    this.reflectorPlane = new THREE.Plane();
    this.normal = new THREE.Vector3();
    this.reflectorWorldPosition = new THREE.Vector3();
    this.cameraWorldPosition = new THREE.Vector3();
    this.rotationMatrix = new THREE.Matrix4();
    this.lookAtPosition = new THREE.Vector3(0, -1, 0);
    this.clipPlane = new THREE.Vector4();
    this.view = new THREE.Vector3();
    this.target = new THREE.Vector3();
    this.q = new THREE.Vector4();
    this.textureMatrix = new THREE.Matrix4();
    this.virtualCamera = new THREE.PerspectiveCamera();

    this.reflectorOffset = reflectorOffset;
    this.planeNormal = planeNormal;

    // 设置 FBO
    this.setupBuffers(resolution, blur, blur2, bufferSamples);

    // 设置材质属性
    if (roughnessMap) this.roughnessMap = roughnessMap;
    if (normalMap) this.normalMap = normalMap;
    this.roughness = roughness;
    this.metalness = metalness;
    this.normalScale = normalScale;

    // 反射属性 (source.js: reflectorProps)
    this.reflectorProps = {
      mirror,
      textureMatrix: this.textureMatrix,
      mixBlur,
      tDiffuse: this.fbo1.texture,
      tDepth: this.fbo1.depthTexture,
      tDiffuseBlur: this.fbo2.texture,
      tDiffuseBlur2: this.fbo3.texture,
      hasBlur: this.hasBlur,
      mixStrength,
      minDepthThreshold,
      maxDepthThreshold,
      depthScale,
      depthToBlurRatioBias,
      distortion,
      distortionMap,
      mixContrast,
      // source.js: defines
      'defines-USE_BLUR': this.hasBlur ? '' : undefined,
      'defines-USE_DEPTH': depthScale > 0 ? '' : undefined,
      'defines-USE_DISTORTION': distortionMap ? '' : undefined
    };
  }

  private setupBuffers(resolution: number, blur: [number, number], blur2: [number, number], samples: number) {
    const params: THREE.RenderTargetOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      colorSpace: THREE.SRGBColorSpace
    };

    this.fbo1 = new THREE.WebGLRenderTarget(resolution, resolution, params);
    this.fbo1.depthBuffer = true;
    this.fbo1.depthTexture = new THREE.DepthTexture(resolution, resolution);
    this.fbo1.depthTexture.format = THREE.DepthFormat;
    this.fbo1.depthTexture.type = THREE.UnsignedShortType;

    this.fbo2 = new THREE.WebGLRenderTarget(resolution, resolution, params);
    this.fbo3 = new THREE.WebGLRenderTarget(resolution, resolution, params);

    if (this.gl.capabilities.isWebGL2) {
      this.fbo1.samples = samples;
    }

    this.kawaseBlurPass = new KawaseBlurPass();
    this.kawaseBlurPass.setSize(blur[0], blur[1]);

    this.kawaseBlurPass2 = new KawaseBlurPass();
    this.kawaseBlurPass2.setSize(blur2[0], blur2[1]);
  }

  private beforeRender() {
    if (!this.parent) return;

    this.reflectorWorldPosition.setFromMatrixPosition(this.parent.matrixWorld);
    this.cameraWorldPosition.setFromMatrixPosition(this.camera.matrixWorld);

    this.rotationMatrix.extractRotation(this.parent.matrixWorld);

    this.normal.copy(this.planeNormal);
    this.normal.applyMatrix4(this.rotationMatrix);

    this.reflectorWorldPosition.addScaledVector(this.normal, this.reflectorOffset);

    this.view.subVectors(this.reflectorWorldPosition, this.cameraWorldPosition);

    // 如果相机在反射面背面，不渲染
    if (this.view.dot(this.normal) > 0) return;

    this.view.reflect(this.normal).negate();
    this.view.add(this.reflectorWorldPosition);

    this.rotationMatrix.extractRotation(this.camera.matrixWorld);

    this.lookAtPosition.set(0, 0, -1);
    this.lookAtPosition.applyMatrix4(this.rotationMatrix);
    this.lookAtPosition.add(this.cameraWorldPosition);

    this.target.subVectors(this.reflectorWorldPosition, this.lookAtPosition);
    this.target.reflect(this.normal).negate();
    this.target.add(this.reflectorWorldPosition);

    this.virtualCamera.position.copy(this.view);
    this.virtualCamera.scale.copy(this.camera.scale as THREE.Vector3);
    this.virtualCamera.up.set(0, 1, 0);
    this.virtualCamera.up.applyMatrix4(this.rotationMatrix);
    this.virtualCamera.up.reflect(this.normal);
    this.virtualCamera.lookAt(this.target);
    this.virtualCamera.far = (this.camera as THREE.PerspectiveCamera).far;
    this.virtualCamera.updateMatrixWorld();
    this.virtualCamera.projectionMatrix.copy((this.camera as THREE.PerspectiveCamera).projectionMatrix);

    // 纹理矩阵
    this.textureMatrix.set(
      0.5, 0.0, 0.0, 0.5,
      0.0, 0.5, 0.0, 0.5,
      0.0, 0.0, 0.5, 0.5,
      0.0, 0.0, 0.0, 1.0
    );
    this.textureMatrix.multiply(this.virtualCamera.projectionMatrix);
    this.textureMatrix.multiply(this.virtualCamera.matrixWorldInverse);
    this.textureMatrix.multiply(this.parent.matrixWorld);

    // 斜裁剪平面
    this.reflectorPlane.setFromNormalAndCoplanarPoint(this.normal, this.reflectorWorldPosition);
    this.reflectorPlane.applyMatrix4(this.virtualCamera.matrixWorldInverse);

    this.clipPlane.set(
      this.reflectorPlane.normal.x,
      this.reflectorPlane.normal.y,
      this.reflectorPlane.normal.z,
      this.reflectorPlane.constant
    );

    const projectionMatrix = this.virtualCamera.projectionMatrix;

    this.q.x = (Math.sign(this.clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
    this.q.y = (Math.sign(this.clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
    this.q.z = -1.0;
    this.q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];

    this.clipPlane.multiplyScalar(2.0 / this.clipPlane.dot(this.q));

    projectionMatrix.elements[2] = this.clipPlane.x;
    projectionMatrix.elements[6] = this.clipPlane.y;
    projectionMatrix.elements[10] = this.clipPlane.z + 1.0;
    projectionMatrix.elements[14] = this.clipPlane.w;
  }

  update() {
    if (this.parent.material !== this) return;

    this.parent.visible = false;

    const xrEnabled = this.gl.xr.enabled;
    const shadowAutoUpdate = this.gl.shadowMap.autoUpdate;

    // source.js: onBeforeRenderCallback
    if (this.onBeforeRenderCallback) {
      this.onBeforeRenderCallback();
    }

    this.beforeRender();

    this.gl.xr.enabled = false;
    this.gl.shadowMap.autoUpdate = false;

    this.gl.setRenderTarget(this.fbo1);
    this.gl.clearColor();
    if (!this.gl.autoClear) {
      this.gl.clear();
    }
    this.gl.render(this.scene, this.virtualCamera);

    if (this.hasBlur) {
      this.kawaseBlurPass.render(this.gl, this.fbo1, this.fbo2);
      this.kawaseBlurPass2.render(this.gl, this.fbo1, this.fbo3);
    }

    this.gl.xr.enabled = xrEnabled;
    this.gl.shadowMap.autoUpdate = shadowAutoUpdate;
    this.parent.visible = true;

    this.gl.setRenderTarget(null);

    // source.js: onAfterRenderCallback
    if (this.onAfterRenderCallback) {
      this.onAfterRenderCallback();
    }
  }

  onBeforeCompile(shader: THREE.WebGLProgramParametersWithUniforms, ...rest: any[]) {
    // source.js: super.onBeforeCompile(e, ...t)
    // @ts-ignore
    if (super.onBeforeCompile) {
      // @ts-ignore
      super.onBeforeCompile(shader, ...rest);
    }

    if (this.defines === undefined) {
      this.defines = {};
    }

    // source.js: this.defines.USE_UV || (this.defines.USE_UV = "")
    if (!this.defines.USE_UV) {
      this.defines.USE_UV = '';
    }

    // source.js: defines from reflectorProps
    if (this.reflectorProps['defines-USE_BLUR'] !== undefined) {
      this.defines.USE_BLUR = '';
    }
    if (this.reflectorProps['defines-USE_DEPTH'] !== undefined) {
      this.defines.USE_DEPTH = '';
    }
    if (this.reflectorProps['defines-USE_DISTORTION'] !== undefined) {
      this.defines.USE_DISTORTION = '';
    }

    // source.js: 添加 uniforms with getter
    const props = this.reflectorProps;
    for (const key in props) {
      if (!key.startsWith('defines-')) {
        shader.uniforms[key] = {
          get value() {
            return props[key];
          }
        };
      }
    }

    // 修改顶点着色器
    shader.vertexShader = `
      uniform mat4 textureMatrix;
      varying vec4 my_vUv;
    ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `
      #include <project_vertex>
      my_vUv = textureMatrix * vec4( position, 1.0 );
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      `
    );

    // 修改片段着色器
    shader.fragmentShader = `
      uniform sampler2D tDiffuse;
      uniform sampler2D tDiffuseBlur;
      uniform sampler2D tDiffuseBlur2;
      uniform sampler2D tDepth;
      uniform sampler2D distortionMap;
      uniform float distortion;
      uniform float cameraNear;
      uniform float cameraFar;
      uniform bool hasBlur;
      uniform float mixBlur;
      uniform float mirror;
      uniform float mixStrength;
      uniform float minDepthThreshold;
      uniform float maxDepthThreshold;
      uniform float mixContrast;
      uniform float depthScale;
      uniform float depthToBlurRatioBias;
      varying vec4 my_vUv;

      float rand222(vec2 n) {
        return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 ip = floor(p);
        vec2 u = fract(p);
        u = u * u * (3.0 - 2.0 * u);
        float res = mix(
          mix(rand222(ip), rand222(ip + vec2(1.0, 0.0)), u.x),
          mix(rand222(ip + vec2(0.0, 1.0)), rand222(ip + vec2(1.0, 1.0)), u.x),
          u.y
        );
        return res * res;
      }
    ` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `
      #include <emissivemap_fragment>

      float distortionFactor = 0.0;
      #ifdef USE_DISTORTION
        distortionFactor = texture2D(distortionMap, vUv).r * distortion;
      #else
        vec4 depth2 = texture2DProj(tDepth, my_vUv);
        float depthFactor2 = (depth2.r * depth2.a);
        distortionFactor = noise(vec2(my_vUv.x * 500000.0, my_vUv.y * 500000.0)) * (depthFactor2 * 0.001);
      #endif

      vec4 new_vUv = my_vUv;
      new_vUv.x += distortionFactor;
      new_vUv.y += distortionFactor;

      vec4 base = texture2DProj(tDiffuse, new_vUv);
      vec4 blur = texture2DProj(tDiffuseBlur, new_vUv);
      vec4 blur2 = texture2DProj(tDiffuseBlur2, new_vUv);

      vec4 merge = base;

      #ifdef USE_NORMALMAP
        vec2 normal_uv = vec2(0.0);
        vec4 normalColor = texture2D(normalMap, vUv);
        vec3 my_normal = normalize(vec3(normalColor.r * 2.0 - 1.0, normalColor.b, normalColor.g * 2.0 - 1.0));
        vec3 coord = new_vUv.xyz / new_vUv.w;
        normal_uv = coord.xy + coord.z * my_normal.xz * 0.05 * normalScale;
        vec4 base_normal = texture2D(tDiffuse, normal_uv);
        vec4 blur_normal = texture2D(tDiffuseBlur, normal_uv);
        merge = base_normal;
        blur = blur_normal;
      #endif

      float depthFactor = 0.0001;
      float blurFactor = 0.0;

      #ifdef USE_DEPTH
        vec4 depth = texture2DProj(tDepth, new_vUv);
        depthFactor = smoothstep(minDepthThreshold, maxDepthThreshold, 1.0 - (depth.r * depth.a));
        depthFactor *= depthScale;
        depthFactor = max(0.0001, min(1.0, depthFactor));

        #ifdef USE_BLUR
          blur = blur * min(1.0, depthFactor + depthToBlurRatioBias);
          merge = merge * min(1.0, depthFactor + 0.5);
        #else
          merge = merge * depthFactor;
        #endif
      #endif

      float reflectorRoughnessFactor = roughness;
      #ifdef USE_ROUGHNESSMAP
        vec4 reflectorTexelRoughness = texture2D(roughnessMap, vUv);
        reflectorRoughnessFactor *= reflectorTexelRoughness.g;
      #endif

      #ifdef USE_BLUR
        blurFactor = min(1.0, mixBlur * reflectorRoughnessFactor);
        merge = mix(merge, blur, blurFactor);
        merge.r += (blur2.r + blur2.r) * 0.5 * blurFactor;
        merge.g += (blur2.g + blur2.g) * 0.5 * blurFactor;
        merge.b += (blur2.b + blur2.b) * 0.5 * blurFactor;
      #endif

      vec4 newMerge = vec4(0.0, 0.0, 0.0, 1.0);
      newMerge.r = (merge.r - 0.5) * mixContrast + 0.5;
      newMerge.g = (merge.g - 0.5) * mixContrast + 0.5;
      newMerge.b = (merge.b - 0.5) * mixContrast + 0.5;

      diffuseColor.rgb = diffuseColor.rgb * ((1.0 - min(1.0, mirror)) + newMerge.rgb * mixStrength);
      `
    );

    // source.js: 替换 lights_fragment_begin 和禁用方向光
    // 这是为了优化反射材质的光照计算
    shader.fragmentShader = shader.fragmentShader.replace(
      '#if ( NUM_DIR_LIGHTS > 0 )',
      '#if ( 0 > 0 )'
    );
  }

  dispose() {
    this.fbo1.dispose();
    this.fbo2.dispose();
    this.fbo3.dispose();
    this.kawaseBlurPass.dispose();
    this.kawaseBlurPass2.dispose();
    super.dispose();
  }
}
