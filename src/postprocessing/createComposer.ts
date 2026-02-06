import * as THREE from 'three';
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  BloomEffect,
  SMAAEffect,
  SMAAPreset,
  ToneMappingEffect,
  ToneMappingMode,
  Effect,
  BlendFunction
} from 'postprocessing';

// 自定义 DotEffect - 简化版，只保留 gradients, vignette, noise
// Chromatic aberration 需要特殊处理，暂时移除
class DotEffect extends Effect {
  constructor() {
    const fragmentShader = `
      uniform float uNoiseStrength;
      uniform float uVignetteOffset;
      uniform float uVignetteDarkness;
      uniform float uGradientsAlpha;
      uniform vec2 uGradient1Position;
      uniform vec3 uGradient1Color;
      uniform float uGradient1Strength;
      uniform float uGradient1Scale;
      uniform vec2 uGradient2Position;
      uniform vec3 uGradient2Color;
      uniform float uGradient2Strength;
      uniform float uGradient2Scale;
      uniform float uBottomGradientScale;
      uniform float uBottomGradientStrength;
      uniform vec3 uBottomGradientColor;
      // 方案3: 地平线雾效参数
      uniform float uHorizonFogStrength;
      uniform float uHorizonFogPosition;
      uniform float uHorizonFogSpread;
      uniform vec3 uHorizonFogColor;

      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      #define PI 3.141592653589793

      float sineInOut(float t) { return -0.5 * (cos(PI * t) - 1.0); }

      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec4 color = inputColor;

        // 方案3: 地平线雾效 - 在地平线位置添加渐变来掩盖分层
        float horizonDist = abs(uv.y - uHorizonFogPosition);
        float horizonFog = 1.0 - smoothstep(0.0, uHorizonFogSpread, horizonDist);
        color.rgb = mix(color.rgb, uHorizonFogColor, horizonFog * uHorizonFogStrength);

        // Gradients
        float gradient1Alpha = 1.0 - distance(uGradient1Position, uv) * uGradient1Scale;
        gradient1Alpha = clamp(gradient1Alpha, 0.0, 1.0);
        gradient1Alpha = sineInOut(gradient1Alpha);
        color.rgb += uGradient1Color * gradient1Alpha * uGradient1Strength * uGradientsAlpha;

        float gradient2Alpha = 1.0 - distance(uGradient2Position, uv) * uGradient2Scale;
        gradient2Alpha = clamp(gradient2Alpha, 0.0, 1.0);
        gradient2Alpha = sineInOut(gradient2Alpha);
        color.rgb += uGradient2Color * gradient2Alpha * uGradient2Strength * uGradientsAlpha;

        // Bottom gradient
        float bottomGradientAlpha = distance(uv.y, 1.0) * uBottomGradientScale;
        bottomGradientAlpha = clamp(bottomGradientAlpha, 0.0, 1.0);
        color.rgb = mix(color.rgb, uBottomGradientColor, bottomGradientAlpha * uBottomGradientStrength);

        // Vignette (only apply if offset > 0)
        if (uVignetteOffset > 0.0) {
          const vec2 center = vec2(0.5);
          float d = distance(uv, center);
          color *= smoothstep(0.8, uVignetteOffset * 0.799, d * (uVignetteDarkness + uVignetteOffset));
        }

        // Noise
        color.rgb += (random(uv) - 0.5) * uNoiseStrength;

        outputColor = color;
      }
    `;

    super('DotEffect', fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ['uNoiseStrength', new THREE.Uniform(0)],
        ['uVignetteOffset', new THREE.Uniform(0)],
        ['uVignetteDarkness', new THREE.Uniform(0)],
        ['uGradientsAlpha', new THREE.Uniform(1)],
        ['uGradient1Position', new THREE.Uniform(new THREE.Vector2(0.5, 1))],
        ['uGradient1Color', new THREE.Uniform(new THREE.Vector3(0.0431, 0.0706, 0.3922))],
        ['uGradient1Strength', new THREE.Uniform(0.77)],
        ['uGradient1Scale', new THREE.Uniform(1.28)],
        ['uGradient2Position', new THREE.Uniform(new THREE.Vector2(0, 0.66))],
        ['uGradient2Color', new THREE.Uniform(new THREE.Vector3(0.0431, 0.0706, 0.3922))],
        ['uGradient2Strength', new THREE.Uniform(0.48)],
        ['uGradient2Scale', new THREE.Uniform(0.17)],
        ['uBottomGradientScale', new THREE.Uniform(0.88)],
        ['uBottomGradientStrength', new THREE.Uniform(0)],
        ['uBottomGradientColor', new THREE.Uniform(new THREE.Vector3(1, 1, 1))],
        // 方案3: 地平线雾效 uniforms
        ['uHorizonFogStrength', new THREE.Uniform(0.3)],      // 雾效强度
        ['uHorizonFogPosition', new THREE.Uniform(0.5)],      // 地平线位置 (0-1, 0.5=屏幕中间)
        ['uHorizonFogSpread', new THREE.Uniform(0.15)],       // 雾效扩散范围
        ['uHorizonFogColor', new THREE.Uniform(new THREE.Vector3(0.114, 0.333, 0.624))] // 雾效颜色 (蓝色)
      ])
    });
  }

  // 方案3: 提供方法来动态调整地平线雾效
  setHorizonFog(strength: number, position: number, spread: number, color?: THREE.Vector3) {
    this.uniforms.get('uHorizonFogStrength')!.value = strength;
    this.uniforms.get('uHorizonFogPosition')!.value = position;
    this.uniforms.get('uHorizonFogSpread')!.value = spread;
    if (color) {
      this.uniforms.get('uHorizonFogColor')!.value = color;
    }
  }
}

export interface PostConfig {
  exposure: number;
  bloomStrength: number;
  bloomThreshold: number;
  bloomRadius: number;
}

export interface ComposerResult {
  composer: EffectComposer;
  toneMappingEffect: ToneMappingEffect;
  bloomEffect: BloomEffect;
  dotEffect: DotEffect;
  smaaEffect: SMAAEffect;
  resize: (width: number, height: number, pixelRatio: number) => void;
}

export const createComposer = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  config: PostConfig
): ComposerResult => {
  const composer = new EffectComposer(renderer, {
    frameBufferType: THREE.HalfFloatType
  });

  // Render pass - renders the scene with background
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // ToneMapping effect (replaces renderer.toneMapping)
  // source.js uses ACESFilmicToneMapping with exposure 0.7
  const toneMappingEffect = new ToneMappingEffect({
    mode: ToneMappingMode.ACES_FILMIC,
    
  });

  // Bloom effect
  const bloomEffect = new BloomEffect({
    luminanceThreshold: config.bloomThreshold,
    luminanceSmoothing: 0.025,
    intensity: config.bloomStrength,
    radius: config.bloomRadius
  });

  // Custom dot effect (CA, vignette, noise, gradients)
  const dotEffect = new DotEffect();

  // SMAA effect (better quality than FXAA)
  const smaaEffect = new SMAAEffect({ preset: SMAAPreset.HIGH });

  // Pass order matters: ToneMapping first, then Bloom, then effects
  composer.addPass(new EffectPass(camera, toneMappingEffect, bloomEffect, dotEffect, smaaEffect));

  return {
    composer,
    toneMappingEffect,
    bloomEffect,
    dotEffect,
    smaaEffect,
    resize: (width: number, height: number, pixelRatio: number) => {
      composer.setSize(width, height);
    }
  };
};
