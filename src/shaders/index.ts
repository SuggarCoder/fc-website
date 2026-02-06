import * as THREE from 'three';

export const DotEffectShader = {
  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: new THREE.Vector2() },
    uNoiseStrength: { value: 0 },
    uCAMaxDistortion: { value: 0 },
    uCAScale: { value: 1 },
    uCASize: { value: 0 },
    uVignetteOffset: { value: 0 },
    uVignetteDarkness: { value: 0 },
    uGradientsAlpha: { value: 1 },
    uGradient1Position: { value: new THREE.Vector2(0.5, 1) },
    uGradient1Color: { value: new THREE.Vector3(0.114, 0.333, 0.624) },
    uGradient1Strength: { value: 0.77 },
    uGradient1Scale: { value: 1.28 },
    uGradient2Position: { value: new THREE.Vector2(0, 0.66) },
    uGradient2Color: { value: new THREE.Vector3(0.0431, 0.0706, 0.3922) },
    uGradient2Strength: { value: 0.48 },
    uGradient2Scale: { value: 0.17 },
    uBottomGradientScale: { value: 0.88 },
    uBottomGradientStrength: { value: 0 },
    uBottomGradientColor: { value: new THREE.Vector3(1, 1, 1) }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uNoiseStrength;
    uniform float uCAMaxDistortion;
    uniform float uCAScale;
    uniform float uCASize;
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
    varying vec2 vUv;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    #define PI 3.141592653589793

    vec2 barrelDistortion(vec2 coord, float amt) {
      vec2 cc = coord - 0.5;
      float dist = dot(cc, cc);
      return coord + cc * dist * amt;
    }

    float sat(float t) { return clamp(t, 0.0, 1.0); }
    float linterp(float t) { return sat(1.0 - abs(2.0 * t - 1.0)); }
    float remap(float t, float a, float b) { return sat((t - a) / (b - a)); }

    vec4 spectrumOffset(float t) {
      vec4 ret;
      float lo = step(t, 0.5);
      float hi = 1.0 - lo;
      float w = linterp(remap(t, 1.0 / 6.0, 5.0 / 6.0));
      ret = vec4(lo, 1.0, hi, 1.) * vec4(1.0 - w, w, 1.0 - w, 1.);
      return pow(ret, vec4(1.0 / 2.2));
    }

    float sineInOut(float t) { return -0.5 * (cos(PI * t) - 1.0); }

    const int CAIterations = 9;
    const float CAReciIterations = 1.0 / float(CAIterations);

    void main() {
      vec2 uv = vUv;
      vec2 caUv = (gl_FragCoord.xy / uResolution.xy * uCAScale) + (1.0 - uCAScale) * 0.5;
      vec4 sumCol = vec4(0.0);
      vec4 sumW = vec4(0.0);
      for (int i = 0; i < CAIterations; ++i) {
        float t = float(i) * CAReciIterations;
        vec4 w = spectrumOffset(t);
        sumW += w;
        sumCol += w * texture2D(tDiffuse, barrelDistortion(caUv, uCASize * uCAMaxDistortion * t));
      }
      vec4 color = sumCol / sumW;

      float gradient1Alpha = 1.0 - distance(uGradient1Position, uv) * uGradient1Scale;
      gradient1Alpha = clamp(gradient1Alpha, 0.0, 1.0);
      gradient1Alpha = sineInOut(gradient1Alpha);
      color.rgb += uGradient1Color * gradient1Alpha * uGradient1Strength * uGradientsAlpha;

      float gradient2Alpha = 1.0 - distance(uGradient2Position, uv) * uGradient2Scale;
      gradient2Alpha = clamp(gradient2Alpha, 0.0, 1.0);
      gradient2Alpha = sineInOut(gradient2Alpha);
      color.rgb += uGradient2Color * gradient2Alpha * uGradient2Strength * uGradientsAlpha;

      float bottomGradientAlpha = distance(uv.y, 1.0) * uBottomGradientScale;
      bottomGradientAlpha = clamp(bottomGradientAlpha, 0.0, 1.0);
      color.rgb = mix(color.rgb, uBottomGradientColor, bottomGradientAlpha * uBottomGradientStrength);

      const vec2 center = vec2(0.5);
      float d = distance(vUv, center);
      color *= smoothstep(0.8, uVignetteOffset * 0.799, d * (uVignetteDarkness + uVignetteOffset));
      color.rgb += (random(vUv) - 0.5) * uNoiseStrength;

      gl_FragColor = color;
    }
  `
};

export const gradientVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const gradientFragmentShader = `
  uniform float uTime;
  varying vec2 vUv;
  #define MOD3 vec3(.1031,.11369,.13787)
  #define COLOR_1 vec3(0.18, 0.27, 0.53)
  #define COLOR_2 vec3(1.0, 1.0, 1.0)
  vec3 hash33(vec3 p3) {
    p3 = fract(p3 * MOD3);
    p3 += dot(p3, p3.yxz + 19.19);
    return -1.0 + 2.0 * fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));
  }
  float simplex_noise(vec3 p) {
    const float K1 = 0.333333333;
    const float K2 = 0.166666667;
    vec3 i = floor(p + (p.x + p.y + p.z) * K1);
    vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
    vec3 e = step(vec3(0.0), d0 - d0.yzx);
    vec3 i1 = e * (1.0 - e.zxy);
    vec3 i2 = 1.0 - e.zxy * (1.0 - e);
    vec3 d1 = d0 - (i1 - 1.0 * K2);
    vec3 d2 = d0 - (i2 - 2.0 * K2);
    vec3 d3 = d0 - (1.0 - 3.0 * K2);
    vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
    vec4 n = h * h * h * h * vec4(dot(d0, hash33(i)), dot(d1, hash33(i + i1)), dot(d2, hash33(i + i2)), dot(d3, hash33(i + 1.0)));
    return dot(vec4(31.316), n);
  }
  void main() {
    vec2 uv = vUv;
    float dist = distance(uv, vec2(0.5, 0.5));
    float alpha = smoothstep(0.5, 0.15, dist);  // 边缘平滑淡出到透明
    float speed = 0.1;
    float time = uTime * speed;
    uv.x += time * -0.3;
    vec2 noiseScaleBlue = vec2(2.0, 4.0);
    vec2 noiseScaleOrange = vec2(2.0, 8.0);
    float cBlue1 = simplex_noise(vec3(uv * noiseScaleBlue, time * 0.5)) * 0.5 + 0.5;
    float cBlue2 = simplex_noise(vec3(uv * noiseScaleBlue * -2.0, time * 0.5)) * 0.5 + 0.5;
    float cOrange1 = simplex_noise(vec3(uv * noiseScaleOrange * 1.0, time * 0.5)) * 0.5 + 0.5;
    float cOrange2 = simplex_noise(vec3(uv * noiseScaleOrange * 3.0 * -2.0, time * 0.5)) * 0.5 + 0.5;
    float cOrange3 = simplex_noise(vec3(uv * noiseScaleOrange * 2.0 * 1.5, time * 0.5)) * 0.5 + 0.5;
    float cMix1 = simplex_noise(vec3(uv * noiseScaleOrange * 2.5, time * 1.25)) * 0.5 + 0.5;
    float cMix2 = simplex_noise(vec3(uv * noiseScaleBlue * 0.5, time * 1.25)) * 0.5 + 0.5;
    float alphaBlue = alpha * cBlue1 * cBlue2;
    float alphaOrange = alpha * cOrange1 * cOrange2 * cOrange3;
    gl_FragColor = mix(vec4(COLOR_1, alphaBlue), vec4(COLOR_2, alphaOrange), cMix1 * cMix1 * cMix2 * cMix2);
    gl_FragColor.a *= 0.35;  // 降低雾气密度
  }
`;

export const lineVertexShader = `
  varying vec2 vUv;
  uniform float uTime;
  varying float vProgress;
  uniform float uSize;
  uniform float uSpeed;
  #include <fog_pars_vertex>
  void main() {
    vUv = uv;
    vec4 pos = modelViewMatrix * vec4(position, 1.0);
    vProgress = smoothstep(-0.5, 0.5, sin(vUv.x * uSize + uTime)) * uSpeed;
    gl_Position = projectionMatrix * pos;
    #include <begin_vertex>
    #include <project_vertex>
    #include <fog_vertex>
  }
`;

export const lineFragmentShader = `
  uniform vec3 uColor;
  uniform float uAlpha;
  uniform bool uHideCorners;
  varying vec2 vUv;
  varying float vProgress;
  #include <fog_pars_fragment>
  void main() {
    float hideCorners = uHideCorners ? smoothstep(0., 0.1, vUv.x) * smoothstep(1., 0.9, vUv.x) : 1.0;
    vec3 finalcolor = mix(uColor, uColor * 3.0, vProgress);
    gl_FragColor = vec4(finalcolor, uAlpha * hideCorners);
    #include <fog_fragment>
  }
`;
