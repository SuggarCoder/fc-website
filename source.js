(window.webpackJsonp = window.webpackJsonp || []).push([[11], {
    304: function(e, t, i) {
        "use strict";
        i.r(t);
        var s = i(0)
          , n = i(1)
          , o = i.n(n)
          , r = i(2)
          , a = i(10)
          , h = i(306)
          , l = i(307)
          , c = i(311);
        class d extends h.fe {
            constructor(e, t, i, s, {mixBlur: n=0, mixStrength: o=1, resolution: r=512, blur: a=[0, 0], blur2: l=[0, 0], minDepthThreshold: c=.9, maxDepthThreshold: d=1, depthScale: u=0, depthToBlurRatioBias: m=.25, mirror: p=0, distortion: f=1, mixContrast: g=1, distortionMap: v, reflectorOffset: w=0, bufferSamples: b=8, planeNormal: P=new h.Fh(0,0,1), onBeforeRender: x, onAfterRender: C}={}) {
                super(),
                this.gl = e,
                this.camera = t,
                this.scene = i,
                this.parent = s,
                this.hasBlur = a[0] + a[1] > 0,
                this.reflectorPlane = new h.Ue,
                this.normal = new h.Fh,
                this.reflectorWorldPosition = new h.Fh,
                this.cameraWorldPosition = new h.Fh,
                this.rotationMatrix = new h.Ud,
                this.lookAtPosition = new h.Fh(0,-1,0),
                this.clipPlane = new h.Gh,
                this.view = new h.Fh,
                this.target = new h.Fh,
                this.q = new h.Gh,
                this.textureMatrix = new h.Ud,
                this.virtualCamera = new h.Te,
                this.reflectorOffset = w,
                this.planeNormal = P,
                this.onBeforeRenderCallback = x,
                this.onAfterRenderCallback = C,
                this.setupBuffers(r, a, l, b),
                this.reflectorProps = {
                    mirror: p,
                    textureMatrix: this.textureMatrix,
                    mixBlur: n,
                    tDiffuse: this.fbo1.texture,
                    tDepth: this.fbo1.depthTexture,
                    tDiffuseBlur: this.fbo2.texture,
                    tDiffuseBlur2: this.fbo3.texture,
                    hasBlur: this.hasBlur,
                    mixStrength: o,
                    minDepthThreshold: c,
                    maxDepthThreshold: d,
                    depthScale: u,
                    depthToBlurRatioBias: m,
                    distortion: f,
                    distortionMap: v,
                    mixContrast: g,
                    "defines-USE_BLUR": this.hasBlur ? "" : void 0,
                    "defines-USE_DEPTH": u > 0 ? "" : void 0,
                    "defines-USE_DISTORTION": v ? "" : void 0
                }
            }
            setupBuffers(e, t, i, s) {
                const n = {
                    minFilter: h.xd,
                    magFilter: h.xd,
                    colorSpace: this.gl.outputColorSpace
                }
                  , o = new h.Oh(e,e,n);
                o.depthBuffer = !0,
                o.depthTexture = new h.Ob(e,e),
                o.depthTexture.format = h.Mb,
                o.depthTexture.type = h.zh;
                const r = new h.Oh(e,e,n)
                  , a = new h.Oh(e,e,n);
                this.gl.capabilities.isWebGL2 && (o.samples = s),
                this.fbo1 = o,
                this.fbo2 = r,
                this.fbo3 = a,
                this.kawaseBlurPass = new c.a,
                this.kawaseBlurPass.setSize(t[0], t[1]),
                this.kawaseBlurPass2 = new c.a,
                this.kawaseBlurPass2.setSize(i[0], i[1])
            }
            beforeRender() {
                if (!this.parent)
                    return;
                if (this.reflectorWorldPosition.setFromMatrixPosition(this.parent.matrixWorld),
                this.cameraWorldPosition.setFromMatrixPosition(this.camera.matrixWorld),
                this.rotationMatrix.extractRotation(this.parent.matrixWorld),
                this.normal.copy(this.planeNormal),
                this.normal.applyMatrix4(this.rotationMatrix),
                this.reflectorWorldPosition.addScaledVector(this.normal, this.reflectorOffset),
                this.view.subVectors(this.reflectorWorldPosition, this.cameraWorldPosition),
                this.view.dot(this.normal) > 0)
                    return;
                this.view.reflect(this.normal).negate(),
                this.view.add(this.reflectorWorldPosition),
                this.rotationMatrix.extractRotation(this.camera.matrixWorld),
                this.lookAtPosition.set(0, 0, -1),
                this.lookAtPosition.applyMatrix4(this.rotationMatrix),
                this.lookAtPosition.add(this.cameraWorldPosition),
                this.target.subVectors(this.reflectorWorldPosition, this.lookAtPosition),
                this.target.reflect(this.normal).negate(),
                this.target.add(this.reflectorWorldPosition),
                this.virtualCamera.position.copy(this.view),
                this.virtualCamera.scale.copy(this.camera.scale),
                this.virtualCamera.up.set(0, 1, 0),
                this.virtualCamera.up.applyMatrix4(this.rotationMatrix),
                this.virtualCamera.up.reflect(this.normal),
                this.virtualCamera.lookAt(this.target),
                this.virtualCamera.far = this.camera.far,
                this.virtualCamera.updateMatrixWorld(),
                this.virtualCamera.projectionMatrix.copy(this.camera.projectionMatrix),
                this.textureMatrix.set(.5, 0, 0, .5, 0, .5, 0, .5, 0, 0, .5, .5, 0, 0, 0, 1),
                this.textureMatrix.multiply(this.virtualCamera.projectionMatrix),
                this.textureMatrix.multiply(this.virtualCamera.matrixWorldInverse),
                this.textureMatrix.multiply(this.parent.matrixWorld),
                this.reflectorPlane.setFromNormalAndCoplanarPoint(this.normal, this.reflectorWorldPosition),
                this.reflectorPlane.applyMatrix4(this.virtualCamera.matrixWorldInverse),
                this.clipPlane.set(this.reflectorPlane.normal.x, this.reflectorPlane.normal.y, this.reflectorPlane.normal.z, this.reflectorPlane.constant);
                const e = this.virtualCamera.projectionMatrix;
                this.q.x = (Math.sign(this.clipPlane.x) + e.elements[8]) / e.elements[0],
                this.q.y = (Math.sign(this.clipPlane.y) + e.elements[9]) / e.elements[5],
                this.q.z = -1,
                this.q.w = (1 + e.elements[10]) / e.elements[14],
                this.clipPlane.multiplyScalar(2 / this.clipPlane.dot(this.q)),
                e.elements[2] = this.clipPlane.x,
                e.elements[6] = this.clipPlane.y,
                e.elements[10] = this.clipPlane.z + 1,
                e.elements[14] = this.clipPlane.w
            }
            update() {
                if (this.parent.material !== this)
                    return;
                this.parent.visible = !1;
                const e = this.gl.xr.enabled
                  , t = this.gl.shadowMap.autoUpdate;
                this.onBeforeRenderCallback && this.onBeforeRenderCallback(),
                this.beforeRender(),
                this.gl.xr.enabled = !1,
                this.gl.shadowMap.autoUpdate = !1,
                this.gl.setRenderTarget(this.fbo1),
                this.gl.state.buffers.depth.setMask(!0),
                this.gl.clearColor(),
                this.gl.autoClear || this.gl.clear(),
                this.gl.render(this.scene, this.virtualCamera),
                this.hasBlur && (this.kawaseBlurPass.render(this.gl, this.fbo1, this.fbo2),
                this.kawaseBlurPass2.render(this.gl, this.fbo1, this.fbo3)),
                this.gl.xr.enabled = e,
                this.gl.shadowMap.autoUpdate = t,
                this.parent.visible = !0,
                this.gl.setRenderTarget(null),
                this.onAfterRenderCallback && this.onAfterRenderCallback()
            }
            onBeforeCompile(e, ...t) {
                super.onBeforeCompile(e, ...t),
                void 0 === this.defines && (this.defines = {}),
                this.defines.USE_UV || (this.defines.USE_UV = ""),
                void 0 !== this.reflectorProps["defines-USE_BLUR"] && (this.defines.USE_BLUR = ""),
                void 0 !== this.reflectorProps["defines-USE_DEPTH"] && (this.defines.USE_DEPTH = ""),
                void 0 !== this.reflectorProps["defines-USE_DISTORTION"] && (this.defines.USE_DISTORTION = "");
                let i = this.reflectorProps;
                for (let t in i)
                    e.uniforms[t] = {
                        get value() {
                            return i[t]
                        }
                    };
                e.vertexShader = "\n            uniform mat4 textureMatrix;\n            varying vec4 my_vUv;\n          " + e.vertexShader,
                e.vertexShader = e.vertexShader.replace("#include <project_vertex>", "\n          #include <project_vertex>\n          my_vUv = textureMatrix * vec4( position, 1.0 );\n          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n          "),
                e.fragmentShader = "\n            uniform sampler2D tDiffuse;\n            uniform sampler2D tDiffuseBlur;\n            uniform sampler2D tDiffuseBlur2;\n            uniform sampler2D tDepth;\n            uniform sampler2D distortionMap;\n            uniform float distortion;\n            uniform float cameraNear;\n            uniform float cameraFar;\n            uniform bool hasBlur;\n            uniform float mixBlur;\n            uniform float mirror;\n            uniform float mixStrength;\n            uniform float minDepthThreshold;\n            uniform float maxDepthThreshold;\n            uniform float mixContrast;\n            uniform float depthScale;\n            uniform float depthToBlurRatioBias;\n            varying vec4 my_vUv;\n\n            float rand222(vec2 n) {\n                return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);\n            }\n\n            float noise(vec2 p){\n                vec2 ip = floor(p);\n                vec2 u = fract(p);\n                u = u*u*(3.0-2.0*u);\n\n                float res = mix(\n                    mix(rand222(ip),rand222(ip+vec2(1.0,0.0)),u.x),\n                    mix(rand222(ip+vec2(0.0,1.0)),rand222(ip+vec2(1.0,1.0)),u.x),u.y);\n                return res*res;\n            }\n\n            " + e.fragmentShader,
                e.fragmentShader = e.fragmentShader.replace("#include <emissivemap_fragment>", "\n          #include <emissivemap_fragment>\n\n          float distortionFactor = 0.0;\n          #ifdef USE_DISTORTION\n            distortionFactor = texture2D(distortionMap, vUv).r * distortion;\n          #else\n            vec4 depth2 = texture2DProj(tDepth, my_vUv);\n            float depthFactor2 = (depth2.r * depth2.a);\n            distortionFactor = noise(vec2(my_vUv.x * 500000.0, my_vUv.y * 500000.0)) * (depthFactor2 * 0.001);\n          #endif\n\n          vec4 new_vUv = my_vUv;\n          new_vUv.x += distortionFactor;\n          new_vUv.y += distortionFactor;\n\n          vec4 base = texture2DProj(tDiffuse, new_vUv);\n          vec4 blur = texture2DProj(tDiffuseBlur, new_vUv);\n          vec4 blur2 = texture2DProj(tDiffuseBlur2, new_vUv);\n\n          vec4 merge = base;\n\n          #ifdef USE_NORMALMAP\n            vec2 normal_uv = vec2(0.0);\n            vec4 normalColor = texture2D(normalMap, vUv);\n            vec3 my_normal = normalize( vec3( normalColor.r * 2.0 - 1.0, normalColor.b,  normalColor.g * 2.0 - 1.0 ) );\n            vec3 coord = new_vUv.xyz / new_vUv.w;\n            normal_uv = coord.xy + coord.z * my_normal.xz * 0.05 * normalScale;\n            vec4 base_normal = texture2D(tDiffuse, normal_uv);\n            vec4 blur_normal = texture2D(tDiffuseBlur, normal_uv);\n            merge = base_normal;\n            blur = blur_normal;\n          #endif\n\n          float depthFactor = 0.0001;\n          float blurFactor = 0.0;\n\n          #ifdef USE_DEPTH\n            vec4 depth = texture2DProj(tDepth, new_vUv);\n            depthFactor = smoothstep(minDepthThreshold, maxDepthThreshold, 1.0-(depth.r * depth.a));\n            depthFactor *= depthScale;\n            depthFactor = max(0.0001, min(1.0, depthFactor));\n\n            #ifdef USE_BLUR\n              blur = blur * min(1.0, depthFactor + depthToBlurRatioBias);\n              merge = merge * min(1.0, depthFactor + 0.5);\n            #else\n              merge = merge * depthFactor;\n            #endif\n\n          #endif\n\n          float reflectorRoughnessFactor = roughness;\n          #ifdef USE_ROUGHNESSMAP\n            vec4 reflectorTexelRoughness = texture2D( roughnessMap, vUv );\n\n            reflectorRoughnessFactor *= reflectorTexelRoughness.g;\n          #endif\n\n          #ifdef USE_BLUR\n            blurFactor = min(1.0, mixBlur * reflectorRoughnessFactor);\n            merge = mix(merge, blur, blurFactor);\n\n            merge.r += (blur2.r + blur2.r) * 0.5 * blurFactor;\n            merge.g += (blur2.g + blur2.g) * 0.5 * blurFactor;\n            merge.b += (blur2.b + blur2.b) * 0.5 * blurFactor;\n          #endif\n\n          vec4 newMerge = vec4(0.0, 0.0, 0.0, 1.0);\n          newMerge.r = (merge.r - 0.5) * mixContrast + 0.5;\n          newMerge.g = (merge.g - 0.5) * mixContrast + 0.5;\n          newMerge.b = (merge.b - 0.5) * mixContrast + 0.5;\n\n          diffuseColor.rgb = diffuseColor.rgb * ((1.0 - min(1.0, mirror)) + newMerge.rgb * mixStrength);\n        //   diffuseColor.rgb = blur.rgb * 2.0;\n          "),
                e.fragmentShader = e.fragmentShader.replace("#include <lights_fragment_begin>", l.ShaderChunk.lights_fragment_begin),
                e.fragmentShader = e.fragmentShader.replace("#if ( NUM_DIR_LIGHTS > 0 )", "#if ( 0 > 0 )")
            }
        }
        const u = r.a.isMobile();
        class m {
            constructor(e) {
                this.app = e,
                this.camera = e.camera,
                this.scene = e.scene,
                this.renderer = e.renderer,
                this.time = e.time,
                this.scroller = e.scroller,
                this.gui = null,
                this.phone = e.phone,
                this.fakeFloor = e.fakeFloor,
                this.geometry = new h.Ve(1.5,1.5),
                this.container = new h.Ee,
                this.textureLoader = new h.eh,
                this.MRMParams = {
                    metalness: .4,
                    roughness: 2,
                    normalScale: .5,
                    distortion: .001,
                    mixStrength: 1.75,
                    mixContrast: 1,
                    mixBlur: 3.2,
                    mirror: .96,
                    depthToBlurRatioBias: 0,
                    depthScale: 2,
                    minDepthThreshold: 0,
                    maxDepthThreshold: 2
                },
                this.generateFloor()
            }
            setVisible(e) {
                this.container.visible = e
            }
            dispose() {
                this.container.parent.remove(this.container),
                this.time.off("tick.mesh-reflector-material")
            }
            createFloorMaterial() {
                let e = this.roughnessMap
                  , t = this.normalMap;
                e || (e = new h.eh(this.loadingManager).load("/assets/webgl-lines/textures/unnamed.avif"),
                e.repeat.set(4, 4),
                e.offset.set(0, 0),
                e.wrapS = e.wrapT = h.ie),
                t || (t = new h.eh(this.loadingManager).load("/assets/webgl-lines/textures/def-normal.avif"),
                t.repeat.set(4, 4),
                t.offset.set(0, 0),
                t.wrapS = t.wrapT = h.ie);
                const i = new d(this.renderer,this.camera.instance,this.scene,this.plane,{
                    resolution: u ? 512 : 2048,
                    blur: u ? [512, 512] : [2048, 2048],
                    blur2: u ? [64, 64] : [128, 128],
                    roughness: this.MRMParams.roughness,
                    distortion: this.MRMParams.distortion,
                    mixStrength: this.MRMParams.mixStrength,
                    mixContrast: this.MRMParams.mixContrast,
                    mixBlur: this.MRMParams.mixBlur,
                    mirror: this.MRMParams.mirror,
                    depthToBlurRatioBias: this.MRMParams.depthToBlurRatioBias,
                    depthScale: this.MRMParams.depthScale,
                    minDepthThreshold: this.MRMParams.minDepthThreshold,
                    maxDepthThreshold: this.MRMParams.maxDepthThreshold,
                    onBeforeRender: () => {
                        this.fakeFloor && (this.fakeFloor.wasVisibleBeforeReflector = this.fakeFloor.visible,
                        this.fakeFloor.visible = !1)
                    }
                    ,
                    onAfterRender: () => {
                        this.fakeFloor && (this.fakeFloor.visible = this.fakeFloor.wasVisibleBeforeReflector)
                    }
                });
                return i.roughnessMap = e,
                i.normalMap = t,
                i.setValues({
                    roughnessMap: e,
                    normalMap: t,
                    normalScale: new h.Eh(this.MRMParams.normalScale,this.MRMParams.normalScale),
                    roughness: this.MRMParams.roughness,
                    metalness: this.MRMParams.metalness
                }),
                i
            }
            generateFloor() {
                this.plane = new h.Wd(this.geometry),
                this.plane.position.y = -5e-4,
                this.plane.rotation.x = -Math.PI / 2,
                this.meshReflectorMaterial = this.createFloorMaterial(),
                this.plane.material = this.meshReflectorMaterial,
                this.container.add(this.plane),
                this.time.on("tick.mesh-reflector-material", () => {
                    this.plane.material.update()
                }
                )
            }
            setGUI(e) {
                this.gui = e;
                const t = e.addFolder("Plane Rotation");
                t.close(),
                t.add({
                    zRotation: this.plane.rotation.z
                }, "zRotation", -Math.PI, Math.PI, .01).onChange(e => {
                    this.plane.rotation.z = e
                }
                );
                const i = e.addFolder("MeshReflectorMaterial");
                i.close(),
                i.add({
                    debugMaterial: !1
                }, "debugMaterial").onChange(e => {
                    this.plane.material = e ? new h.Xd({
                        color: 10027008
                    }) : this.meshReflectorMaterial
                }
                )
            }
        }
        var p = i(312)
          , f = i.n(p)
          , g = i(313)
          , v = i.n(g);
        class w {
            constructor(e) {
                this.app = e,
                this.gui = null,
                this.container = new h.Ee,
                this.fakePlane = null,
                this.generateFakeGradient()
            }
            get visible() {
                return this.container.visible
            }
            set visible(e) {
                this.container.visible = e
            }
            generateFakeGradient() {
                const e = new h.Ve(.1,.1)
                  , t = new h.tg({
                    lights: !1,
                    vertexShader: v.a,
                    fragmentShader: f.a,
                    side: h.B,
                    transparent: !0,
                    uniforms: {
                        uTime: {
                            value: 0
                        }
                    }
                })
                  , i = this.fakePlane = new h.Wd(e,t);
                i.position.set(-.135, 0, .64),
                i.rotation.x = Math.PI / 2,
                i.rotation.z = 2.36,
                this.container.add(i),
                this.app.time.on("tick", () => {
                    t.uniforms.uTime.value = this.app.time.elapsed / 500
                }
                )
            }
            setGUI(e) {
                this.gui = e
            }
        }
        var b = i(3)
          , P = i(113);
        class x extends h.yb {
            constructor(e) {
                super(),
                this.positions = e
            }
            getPoint(e, t=new h.Fh) {
                const i = this.positions.length - 1
                  , s = Math.floor(e * i)
                  , n = 1 / i
                  , o = (e - s * n) / n
                  , r = this.positions[s]
                  , a = this.positions[s + 1];
                return a ? t.lerpVectors(r, a, o) : t.copy(r)
            }
        }
        class C extends x {
            getPointAt(e, t) {
                return this.getPoint(e, t)
            }
        }
        var S = i(314)
          , y = i.n(S)
          , M = i(315)
          , k = i.n(M)
          , F = i(34);
        var z = i(33);
        function T(e, t) {
            var i = Object.keys(e);
            if (Object.getOwnPropertySymbols) {
                var s = Object.getOwnPropertySymbols(e);
                t && (s = s.filter((function(t) {
                    return Object.getOwnPropertyDescriptor(e, t).enumerable
                }
                ))),
                i.push.apply(i, s)
            }
            return i
        }
        function E(e, t, i) {
            return (t = function(e) {
                var t = function(e, t) {
                    if ("object" != typeof e || !e)
                        return e;
                    var i = e[Symbol.toPrimitive];
                    if (void 0 !== i) {
                        var s = i.call(e, t || "default");
                        if ("object" != typeof s)
                            return s;
                        throw new TypeError("@@toPrimitive must return a primitive value.")
                    }
                    return ("string" === t ? String : Number)(e)
                }(e, "string");
                return "symbol" == typeof t ? t : t + ""
            }(t))in e ? Object.defineProperty(e, t, {
                value: i,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = i,
            e
        }
        class A {
            constructor(e, t, i) {
                this.app = e,
                this.camera = e.camera,
                this.options = function(e) {
                    for (var t = 1; t < arguments.length; t++) {
                        var i = null != arguments[t] ? arguments[t] : {};
                        t % 2 ? T(Object(i), !0).forEach((function(t) {
                            E(e, t, i[t])
                        }
                        )) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(i)) : T(Object(i)).forEach((function(t) {
                            Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(i, t))
                        }
                        ))
                    }
                    return e
                }({
                    name: null,
                    dotPosition: null,
                    scaled: null,
                    opacity: null,
                    visible: null,
                    originalColor: null,
                    hoveredColor: null,
                    point: null
                }, i),
                this.ns = Object(b.a)(),
                this.$element = t,
                this.point = this.options.point || new h.Fh(0,0,0),
                this.mesh = null,
                this.originalColor = i.originalColor,
                this.isHovered = !1,
                this.isHoveredAnimated = new z.a(0,{
                    autorun: !1
                }),
                this.activeCallbacks = [],
                this.inactiveCallbacks = [],
                this.options.visible && e.scroller.onScrollSmooth(this.handleSmoothScroll.bind(this)),
                r.a.hasHoverSupport() ? this.$element.hover(this.toggleHovered.bind(this, !0), this.toggleHovered.bind(this, !1)) : (this.$element.click(this.handlePinClick.bind(this)),
                $(document).on("click." + this.ns, this.handleDocumentClick.bind(this)),
                e.scroller.onScroll(this.handleToggleOnScroll.bind(this)))
            }
            dispose() {
                $(document).off("click." + this.ns),
                this.activeCallbacks = [],
                this.inactiveCallbacks = [],
                this.mesh = null,
                this.isHoveredAnimated.destroy()
            }
            getName() {
                return this.options.name
            }
            getDotPosition() {
                return this.options.dotPosition
            }
            getIsActive() {
                return this.isHovered
            }
            setPoint(e) {
                this.point = e
            }
            getPoint() {
                return this.point
            }
            setMesh(e) {
                this.mesh = e,
                e.material.uniforms && e.material.uniforms.uColor && (this.originalColor = e.material.uniforms.uColor.value.clone())
            }
            onactive(e) {
                requestAnimationFrame( () => {
                    this.activeCallbacks.push(e)
                }
                )
            }
            oninactive(e) {
                requestAnimationFrame( () => {
                    this.inactiveCallbacks.push(e)
                }
                )
            }
            handlePinClick(e) {
                if (this.mesh) {
                    const t = !!$(e.target).closest(".js-pin-close").length
                      , i = !!$(e.target).closest(".pin__info").length;
                    let s = null;
                    t ? s = !1 : i || (s = !this.isHovered),
                    null !== s && this.toggleHovered(s)
                }
            }
            handleToggleOnScroll() {
                this.isHovered && this.toggleHovered(!1)
            }
            handleSmoothScroll(e) {
                const t = e >= this.options.visible.from && e <= this.options.visible.to;
                this.$element.toggleClass("pin--visible", t)
            }
            handleDocumentClick(e) {
                $(e.target).closest(this.$element).length || this.toggleHovered(!1)
            }
            toggleHovered(e) {
                this.mesh && this.isHovered !== e && (this.isHoveredAnimated.set(e ? 1 : 0),
                this.$element.toggleClass("pin--hovered", e),
                this.isHovered = e,
                e ? this.activeCallbacks.forEach(e => e(this)) : this.inactiveCallbacks.forEach(e => e(this)))
            }
            update(e) {
                const t = this.point.clone()
                  , i = this.camera.instance.position.distanceTo(t)
                  , s = this.options.opacity ? Object(F.a)(1 - i, this.options.opacity.from, this.options.opacity.to, 0, 1, !0) : 1
                  , n = this.options.scaled ? Object(F.a)(1 - i, this.options.scaled.from, this.options.scaled.to, 0, 1, !0) : 1;
                t.project(this.camera.instance);
                const o = (t.x + 1) / 2 * window.innerWidth
                  , r = (t.y - 1) / 2 * window.innerHeight * -1;
                if (this.$element.css("--opacity", s),
                this.$element.css("--scale", n),
                this.$element.css("transform", `translate(-50%, -50%) translate(${o}px, ${r}px) scale(${n})`),
                this.isHoveredAnimated.update(e),
                this.mesh) {
                    const e = this.mesh.material.uniforms && this.mesh.material.uniforms.uColor ? this.mesh.material.uniforms.uColor.value : this.mesh.material.color;
                    e.copy(this.options.hoveredColor),
                    e.lerp(this.originalColor, 1 - this.isHoveredAnimated.get())
                }
            }
        }
        const _ = "rtl" === document.documentElement.dir
          , G = _ ? -1 : 1;
        function R(e) {
            return e * G
        }
        function O(e) {
            return e.x = e.x * G,
            e
        }
        const L = [{
            $element: ".js-lines-hover-pin-1",
            name: "graphic_orange_2_1",
            dotPosition: .8
        }, {
            $element: ".js-lines-hover-pin-2",
            name: "graphic_blue_2",
            dotPosition: .66
        }, {
            $element: ".js-lines-hover-pin-3",
            name: "graphic_orange_1",
            dotPosition: .83
        }, {
            $element: ".js-lines-hover-pin-4",
            name: "graphic_blue_3",
            dotPosition: .6
        }]
          , D = r.a.isMobile()
          , B = 1271806
          , U = 16728576
          , I = 16777215;
        class V {
            constructor(e) {
                this.ns = Object(b.a)(),
                this.app = e,
                this.scene = e.scene,
                this.loader = e.loader,
                this.camera = e.camera,
                this.time = e.time,
                this.scroller = e.scroller,
                this.gui = null,
                this.container = new h.Ee,
                this.materialCache = {},
                this.circleLines = [],
                this.circleLinesColors = [],
                this.gltf,
                this.ready = new P.a,
                this.pins = L.map(this.createPin.bind(this)),
                this.setScroller(),
                this.loadObj()
            }
            createPin(e) {
                return new A(this.app,$(e.$element),{
                    name: e.name,
                    dotPosition: e.dotPosition,
                    visible: {
                        from: .202,
                        to: .29
                    },
                    opacity: {
                        from: .75,
                        to: .85
                    },
                    scale: {
                        from: .8,
                        to: .95
                    },
                    hoveredColor: new h.ab(1,1,1)
                })
            }
            setScroller() {
                this.scroller.onScrollSmooth(this.handleScroll.bind(this))
            }
            handleScroll(e) {
                this.scene && this.circleLines.forEach( (t, i) => {
                    const s = .01 * Math.floor(i / 4)
                      , n = Object(F.a)(e, .72 + s, .76 + s, 0, 1, !0);
                    t.material.uniforms.uAlpha.value = n
                }
                )
            }
            dispose() {
                $(window).off("mousemove." + this.ns),
                this.pins.forEach(e => {
                    e.dispose()
                }
                ),
                this.pins = []
            }
            update(e) {
                this.pins.forEach(t => {
                    t.update(e)
                }
                )
            }
            createMaterial(e, t, i, s, n) {
                const o = `${e}-${t}-${i}-${s}`;
                if (this.materialCache[o] && !n)
                    return this.materialCache[o];
                {
                    const n = new h.tg({
                        lights: !1,
                        vertexShader: y.a,
                        fragmentShader: k.a,
                        transparent: !0,
                        depthTest: !0,
                        depthWrite: !0,
                        fog: !0,
                        uniforms: h.vh.merge([l.UniformsLib.fog, {
                            uColor: {
                                value: (new h.ab).setHex(s, h.Dd)
                            },
                            uTime: {
                                value: 0
                            },
                            uSize: {
                                value: e / 2
                            },
                            uSpeed: {
                                value: t ? 1 : 0
                            },
                            uHideCorners: {
                                value: i
                            },
                            uAlpha: {
                                value: 1
                            }
                        }])
                    });
                    return this.materialCache[o] = n,
                    this.materials.push(n),
                    n
                }
            }
            loadObj() {
                this.loader.load("/assets/webgl-lines/scene-16.obj", e => {
                    this.materials = [];
                    const t = []
                      , i = [];
                    e.children.forEach(e => {
                        const s = e.name.toLowerCase()
                          , n = s.includes("road") || s.includes("graphic") || s.includes("integration") || s.includes("payments")
                          , o = e.name.toLowerCase().includes("blue")
                          , a = e.name.toLowerCase().includes("white") ? I : o ? B : U
                          , l = e.geometry.attributes.position.array
                          , c = [];
                        for (let e = 0; e < l.length; e += 3)
                            c.push(new h.Fh(l[e],l[e + 1],l[e + 2]).multiplyScalar(1 / 7.7));
                        const d = n ? new x(c) : new C(c)
                          , u = d.getLength()
                          , m = Math.round(100 * u);
                        let p;
                        const f = D ? 4 : 5;
                        let g, v, w = !1;
                        n ? (v = function(e, t) {
                            let i = !1;
                            const s = "number" == typeof e;
                            s || "#" != e[0] || (e = e.slice(1),
                            i = !0);
                            const n = s ? e : parseInt(e, 16);
                            let o = (n >> 16) + t;
                            o > 255 ? o = 255 : o < 0 && (o = 0);
                            let r = (n >> 8 & 255) + t;
                            r > 255 ? r = 255 : r < 0 && (r = 0);
                            let a = (255 & n) + t;
                            return a > 255 ? a = 255 : a < 0 && (a = 0),
                            s ? a | r << 8 | o << 16 : (i ? "#" : "") + (a | r << 8 | o << 16).toString(16)
                        }(a, -20),
                        w = !0,
                        g = s.includes("thin") ? r.a.isMobile() ? 6e-5 : 3e-5 : r.a.isMobile() ? 8775e-8 : 585e-7,
                        p = m < 10 ? D ? 100 : 200 : D ? 250 : 500) : (v = a,
                        p = c.length - 1,
                        g = r.a.isMobile() ? 6e-5 : 3e-5,
                        w = !1);
                        const b = new h.nh(d,p,g,f,!1)
                          , P = this.createMaterial(m, n, w, v, !0)
                          , S = new h.Wd(b,P);
                        S.name = s,
                        this.container.add(S),
                        this.pins.forEach(e => {
                            s.includes(e.getName()) && (e.setMesh(S),
                            d.getPointAt(e.getDotPosition(), e.getPoint()),
                            O(e.getPoint()),
                            e.getPoint().z += .5)
                        }
                        ),
                        s.includes("crossroad_orange_circle_") && i.push(S),
                        t.push(S)
                    }
                    ),
                    this.circleLines = i,
                    this.circleLinesColors = this.circleLines.map(e => e.material.uniforms.uColor.value.clone()),
                    this.time.on("tick", () => {
                        this.materials.forEach(e => {
                            e.uniforms.uTime.value = this.time.elapsed / 500
                        }
                        )
                    }
                    ),
                    this.container.position.set(0, 0, .5),
                    this.handleScroll(this.scroller.getScrollProgress()),
                    this.ready.resolve(!0)
                }
                )
            }
            setGUI(e) {
                this.gui = e;
                const t = e.addFolder("LineMaterial");
                t.close();
                const i = {
                    start: 1,
                    end: -1
                };
                t.add(i, "start", 0, 1, .001).onChange(e => {
                    this.materials.forEach(t => {
                        t.uniforms.uStart.value = e,
                        t.needsUpdate = !0
                    }
                    )
                }
                ),
                t.add(i, "end", -1, 1, .001).onChange(e => {
                    this.materials.forEach(t => {
                        t.uniforms.uEnd.value = e,
                        t.needsUpdate = !0
                    }
                    )
                }
                )
            }
        }
        var j = i(4);
        const H = [{
            $element: ".js-truck-hover-pin-boxes",
            point: new h.Fh(-.1463,.011,.646),
            name: "BOXES"
        }, {
            $element: ".js-truck-hover-pin-wheels",
            point: new h.Fh(-.1395,.002,.641),
            name: "WHEELS"
        }, {
            $element: ".js-truck-hover-pin-cabin",
            point: new h.Fh(-.1215,.006,.622),
            name: "CABIN"
        }];
        class N {
            constructor(e) {
                this.app = e,
                this.$title = $(".js-hero-title"),
                this.isTitleVisible = !0,
                this.container = new h.Ee,
                this.gltf = null,
                this.pins = H.map(this.createPin.bind(this)),
                this.ready = new P.a,
                this.loadModel()
            }
            createPin(e) {
                const t = new A(this.app,$(e.$element),{
                    name: e.name,
                    point: O(e.point.clone()),
                    visible: {
                        from: 0,
                        to: .03
                    },
                    originalColor: new h.ab(0,0,0),
                    hoveredColor: new h.ab(.1,.1,.1)
                });
                return t.onactive(this.onPinToggle.bind(this)),
                t.oninactive(this.onPinToggle.bind(this)),
                t
            }
            onPinToggle() {
                this.pins.some(e => e.getIsActive()) ? j.a.matches("md-down") ? this.toggleTitle(!1) : this.toggleTitle(!0) : j.a.matches("md-down") && this.toggleTitle(!0)
            }
            toggleTitle(e) {
                this.isTitleVisible !== e && (this.isTitleVisible = e,
                e ? "ar" == $("html").attr("lang") ? this.$title.transition(!0, "text") : this.$title.transition(!0, "title") : "ar" == $("html").attr("lang") ? this.$title.transition(!0, "text-out", "hideInvisible") : this.$title.transition(!0, "title-out", "hideInvisible"))
            }
            dispose() {
                this.pins.forEach(e => {
                    e.dispose()
                }
                ),
                this.pins = []
            }
            update(e) {
                this.pins.forEach(t => {
                    t.update(e)
                }
                )
            }
            loadModel() {
                const e = new h.Xd({
                    color: 0
                });
                this.app.gltfLoader.load("/assets/webgl-lines/truck-5.glb", t => {
                    this.gltf = t.scene.children[0],
                    this.gltf.scale.set(1 / 7.7, 1 / 7.7, 1 / 7.7),
                    this.gltf.position.set(0, 0, .4998),
                    this.gltf.children[0].children.forEach((function(t, i) {
                        t.material = e
                    }
                    )),
                    this.gltf.traverse(e => {
                        this.pins.forEach(t => {
                            e.name.includes(t.getName()) && (e.material = e.material.clone(),
                            t.setMesh(e))
                        }
                        )
                    }
                    ),
                    this.container.add(this.gltf),
                    this.ready.resolve(!0),
                    this.gui && this.setGUI(this.gui)
                }
                )
            }
            setGUI(e) {
                if (this.gui = e,
                this.gltf) {
                    this.truckFolder = this.gui.addFolder("Truck"),
                    this.truckFolder.close();
                    const e = {
                        x: this.gltf.position.x,
                        y: this.gltf.position.y,
                        z: this.gltf.position.z
                    }
                      , t = {
                        y: this.gltf.rotation.y
                    };
                    this.truckFolder.add(e, "x", -.13, 0, 1e-4).onChange(e => {
                        this.gltf.position.x = e
                    }
                    ),
                    this.truckFolder.add(e, "y", -.05, 0, 1e-4).onChange(e => {
                        this.gltf.position.y = e
                    }
                    ),
                    this.truckFolder.add(e, "z", .48, .5, 1e-4).onChange(e => {
                        this.gltf.position.z = e
                    }
                    ),
                    this.truckFolder.add(t, "y", 0, Math.PI, 1e-4).onChange(e => {
                        this.gltf.rotation.y = e
                    }
                    )
                }
            }
        }
        class W {
            constructor(e={}) {
                this.callbacks = e,
                this.callbacks.base = {}
            }
            on(e, t) {
                const i = this;
                if (void 0 === e || "" === e)
                    return console.warn("wrong names"),
                    !1;
                if (void 0 === t)
                    return console.warn("wrong callback"),
                    !1;
                return this.resolveNames(e).forEach((function(e) {
                    const s = i.resolveName(e);
                    i.callbacks[s.namespace]instanceof Object || (i.callbacks[s.namespace] = {}),
                    i.callbacks[s.namespace][s.value]instanceof Array || (i.callbacks[s.namespace][s.value] = []),
                    i.callbacks[s.namespace][s.value].push(t)
                }
                )),
                this
            }
            off(e) {
                const t = this;
                if (void 0 === e || "" === e)
                    return console.warn("wrong name"),
                    !1;
                return this.resolveNames(e).forEach((function(e) {
                    const i = t.resolveName(e);
                    if ("base" !== i.namespace && "" === i.value)
                        delete t.callbacks[i.namespace];
                    else if ("base" === i.namespace)
                        for (const e in t.callbacks)
                            t.callbacks[e]instanceof Object && t.callbacks[e][i.value]instanceof Array && (delete t.callbacks[e][i.value],
                            0 === Object.keys(t.callbacks[e]).length && delete t.callbacks[e]);
                    else
                        t.callbacks[i.namespace]instanceof Object && t.callbacks[i.namespace][i.value]instanceof Array && (delete t.callbacks[i.namespace][i.value],
                        0 === Object.keys(t.callbacks[i.namespace]).length && delete t.callbacks[i.namespace])
                }
                )),
                this
            }
            trigger(e, t) {
                if (void 0 === e || "" === e)
                    return console.warn("wrong name"),
                    !1;
                const i = this;
                let s = null
                  , n = null;
                const o = t instanceof Array ? t : []
                  , r = this.resolveNames(e)[0]
                  , a = this.resolveName(r);
                if ("base" === a.namespace)
                    for (const e in i.callbacks)
                        i.callbacks[e]instanceof Object && i.callbacks[e][a.value]instanceof Array && i.callbacks[e][a.value].forEach((function(e) {
                            n = e.apply(i, o),
                            void 0 === s && (s = n)
                        }
                        ));
                else if (this.callbacks[a.namespace]instanceof Object && this.callbacks[a.namespace][a.value]instanceof Array) {
                    if ("" === a.value)
                        return console.warn("wrong name"),
                        this;
                    i.callbacks[a.namespace][a.value].forEach((function(e) {
                        n = e.apply(i, o),
                        void 0 === s && (s = n)
                    }
                    ))
                }
                return s
            }
            resolveNames(e) {
                let t = e;
                return t = t.replace(/[^a-zA-Z0-9 ,/.]/g, ""),
                t = t.replace(/[,/]+/g, " "),
                t = t.split(" "),
                t
            }
            resolveName(e) {
                const t = {}
                  , i = e.split(".");
                return t.original = e,
                t.value = i[0],
                t.namespace = "base",
                i.length > 1 && "" !== i[1] && (t.namespace = i[1]),
                t
            }
        }
        class q extends W {
            constructor(e={}, t=document.createElement("div"), i=0, s=0) {
                super(),
                this.viewport = e,
                this.$sizeViewport = t,
                this.width = i,
                this.height = s,
                this.$sizeViewport.style.width = "100vw",
                this.$sizeViewport.style.height = "100svh",
                this.$sizeViewport.style.position = "absolute",
                this.$sizeViewport.style.top = "0",
                this.$sizeViewport.style.left = "0",
                this.$sizeViewport.style.pointerEvents = "none",
                this.resize = this.resize.bind(this),
                window.addEventListener("resize", this.resize),
                this.resize()
            }
            resize() {
                document.body.appendChild(this.$sizeViewport),
                this.viewport.width = this.$sizeViewport.offsetWidth,
                this.viewport.height = this.$sizeViewport.offsetHeight,
                document.body.removeChild(this.$sizeViewport),
                this.width = window.innerWidth,
                this.height = window.innerHeight,
                this.trigger("resize")
            }
            dispose() {
                window.removeEventListener("resize", this.resize)
            }
        }
        class X {
            cosntructor(e) {
                this.reset(e)
            }
            getSize() {
                return this.used
            }
            isFull() {
                return this.used === this.size
            }
            add(e) {
                this.pointer = (this.pointer + 1) % this.size,
                this.used = Math.min(this.size, this.used + 1),
                this.values[this.pointer] = e
            }
            getMedian() {
                const e = this.values.slice(0, this.used).sort( (e, t) => e - t).slice(.25 * this.used, .75 * this.used);
                let t = 0;
                for (let i = 0; i < e.length; i++)
                    t += e[i];
                return t / e.length
            }
            reset(e) {
                this.size = Math.ceil(e),
                this.values = new Array(this.size).fill(null),
                this.used = 0,
                this.pointer = -1
            }
            resetToHalf() {
                this.used = Math.floor(this.used / 2)
            }
        }
        class Y {
            constructor(e) {
                this.options = e,
                this.hasFPSLimit = e.fpsLimit !== Number.POSITIVE_INFINITY,
                this.fpsLimit = this.hasFPSLimit && e.fpsLimit || 60,
                this.minFpsLimit = e.minFpsLimit || 30,
                this.enabled = !("enabled"in e) || e.enabled,
                this.frameTimeIsSet = !1,
                this.time = 0,
                this.startTime = 0,
                this.deltaTime = 16,
                this.elapsedTime = 0,
                this.currentTime = 0,
                this.skipTime = 0,
                this.deltaTimes = new X(this.fpsLimit),
                this.measureStart = Date.now(),
                this.isVisualFidelityDegraded = !e.degradeVisualFidelity,
                this.isVisualFidelityDegradedCounter = 0,
                this.isFPSLimitReached = !1
            }
            calculateFPSLimit() {
                return new Promise(e => {
                    let t = Number.POSITIVE_INFINITY
                      , i = 0
                      , s = 0;
                    const n = o => {
                        i > 0 && (t = Math.min(t, o - s)),
                        5 === i ? e(t) : (i++,
                        s = o,
                        requestAnimationFrame(n))
                    }
                    ;
                    requestIdleCallback( () => {
                        requestAnimationFrame(n)
                    }
                    )
                }
                ).then(e => {
                    this.setFrameTime(e)
                }
                )
            }
            setFrameTime(e) {
                if (this.frameTimeIsSet)
                    this.reset();
                else {
                    let t = 1e3 / e;
                    t > 25 && t < 35 && (t = 30),
                    t > 55 && t < 65 && (t = 60),
                    t > 85 && t < 95 && (t = 90),
                    t > 115 && t < 125 && (t = 120),
                    t > 140 && t < 150 && (t = 144),
                    this.frameTimeIsSet = !0,
                    this.fpsLimit = t,
                    this.reset()
                }
            }
            reset() {
                this.time = this.startTime = Date.now() - 1e3 / this.fpsLimit,
                this.deltaTimes.reset(this.fpsLimit),
                this.measureStart = Date.now()
            }
            update() {
                if (!this.enabled)
                    return !0;
                const e = 1e3 / this.fpsLimit
                  , t = .1 * e
                  , i = Date.now()
                  , s = i - this.time;
                return (!this.hasFPSLimit || s >= e - t) && (this.time = i,
                this.deltaTime = Math.min(s, 60),
                this.elapsedTime = i - this.startTime,
                this.currentTime = i,
                this.isVisualFidelityDegraded && this.isFPSLimitReached || (this.deltaTimes.add(Math.min(1.5 * e, s)),
                this.deltaTimes.isFull() && this.hasFPSLimit && Date.now() - this.measureStart > 1e3 && (this.deltaTimes.getMedian() > e / 45 * 60 ? (this.fpsLimit > 61 ? this.reduceFPS() || this.degradeVisualFidelity() : this.degradeVisualFidelity() || this.reduceFPS(),
                this.deltaTimes.reset(Math.max(10, this.fpsLimit)),
                this.measureStart = Date.now()) : this.deltaTimes.resetToHalf())),
                !0)
            }
            degradeVisualFidelity() {
                return !this.isVisualFidelityDegraded && this.options.degradeVisualFidelity(this.isVisualFidelityDegradedCounter) ? (this.isVisualFidelityDegradedCounter++,
                !0) : (this.isVisualFidelityDegraded = !0,
                !1)
            }
            reduceFPS() {
                return !this.isFPSLimitReached && (this.fpsLimit = Math.max(this.fpsLimit / 2, this.minFpsLimit),
                this.isFPSLimitReached = this.fpsLimit === this.minFpsLimit,
                !0)
            }
        }
        class K extends W {
            constructor({current: e=Date.now(), elapsed: t=0, delta: i=16, ticker: s, degradeVisualFidelity: n=null}={}) {
                super(),
                this.current = e,
                this.elapsed = t,
                this.delta = i,
                this.ticker = s,
                this.isRunning = !1,
                this.fps = 0,
                this.frameLimiter = new Y({
                    fpsLimit: 60,
                    degradeVisualFidelity: n
                }),
                this.tick = this.tick.bind(this),
                this.ready = this.frameLimiter.calculateFPSLimit()
            }
            start() {
                this.isRunning || (this.isRunning = !0,
                this.ready.then( () => {
                    this.isRunning && (this.ticker = window.requestAnimationFrame(this.tick))
                }
                ))
            }
            stop() {
                this.isRunning && (window.cancelAnimationFrame(this.ticker),
                this.isRunning = !1)
            }
            tick() {
                this.ticker = window.requestAnimationFrame(this.tick);
                const e = this.frameLimiter.update();
                this.delta = this.frameLimiter.deltaTime,
                this.elapsed = this.elapsedTime = this.frameLimiter.elapsedTime,
                this.current = this.currentTime = this.frameLimiter.currentTime,
                this.trigger("tick", [e])
            }
        }
        const Z = [{
            position: [-.040721529489987855, .004611680066430723, .7385440120449314],
            target: [-.0858017642946919, -.015792414071579598, .6964963255943545]
        }, {
            position: [-.13376623005061952, .009090909129613405 + (j.a.matches("sm-down") ? .01 : 0), .7077922108885529],
            target: [-.1382848370839809, .004561268119052631 + (j.a.matches("sm-down") ? .01 : 0), .6431731177192963]
        }];
        class J {
            constructor(e) {
                this.scene = e.scene,
                this.gltfLoader = e.gltfLoader,
                this.camera = e.camera,
                this.scroller = e.scroller,
                this.gui = null,
                this._position = new h.Fh,
                this._target = new h.Fh,
                this.animationProgress = {
                    value: 0
                },
                this.isPlaying = !0,
                this.ready = new P.a,
                this.preloaderPath = Z.map(e => ({
                    position: (new h.Fh).fromArray(e.position),
                    target: (new h.Fh).fromArray(e.target)
                })),
                this.setCurves()
            }
            setScroller() {
                this.scroller.onScroll(this.handleScroll.bind(this))
            }
            handleScroll(e) {
                this.scene && !this.isPlaying && (this.curve.getPoint(e, this._position),
                this.lookCurve.getPoint(e, this._target),
                this.camera.cameraControls.setLookAt(R(this._position.x), this._position.y, this._position.z, R(this._target.x), this._target.y, this._target.z, !0))
            }
            setInitialPosition() {
                this.camera.cameraControls.setLookAt(R(this.preloaderPath[0].position.x), this.preloaderPath[0].position.y, this.preloaderPath[0].position.z, R(this.preloaderPath[0].target.x), this.preloaderPath[0].target.y, this.preloaderPath[0].target.z, !1)
            }
            play() {
                const e = $.fn.scroller && $.isCustomScroll && $.isCustomScroll();
                e && $("body").scroller("setDisabled", !0),
                setTimeout( () => {
                    this.camera.cameraControls.smoothTime = .6,
                    this.camera.cameraControls.setLookAt(R(this.preloaderPath[1].position.x), this.preloaderPath[1].position.y, this.preloaderPath[1].position.z, R(this.preloaderPath[1].target.x), this.preloaderPath[1].target.y, this.preloaderPath[1].target.z, !0),
                    setTimeout( () => {
                        this.camera.cameraControls.smoothTime = .2,
                        this.isPlaying = !1,
                        this.handleScroll(this.scroller.getScrollProgress()),
                        e && $("body").scroller("setDisabled", !1)
                    }
                    , 3e3),
                    setTimeout( () => {
                        const e = $(".js-hero-title")
                          , t = $(".js-hero-box");
                        e.data("hidden-with-parallax") || ("ar" == $("html").attr("lang") ? e.transition("text") : e.transition("title")),
                        t.data("hidden-with-parallax") || t.transition("flicker-in")
                    }
                    , 2e3)
                }
                , 250)
            }
            setCurves() {
                this.curve = new h.V,
                this.lookCurve = new h.V,
                this.gltfLoader.load("/assets/webgl-lines/camera-4.glb", e => {
                    this.gltf = e.scene,
                    this.gltf.children.forEach(e => {
                        const t = e.name.toLowerCase();
                        e.position.multiplyScalar(1 / 7.7),
                        e.position.z += .5,
                        t.includes("position") ? this.curve.points.push(e.position) : t.includes("target") && this.lookCurve.points.push(e.position)
                    }
                    ),
                    this.curve.points.reverse(),
                    this.lookCurve.points.reverse(),
                    j.a.matches("sm-down") && (this.curve.points[0].y += .01,
                    this.lookCurve.points[0].y += .01,
                    this.curve.points[3].y += .005,
                    this.lookCurve.points[3].y += .005),
                    this.setScroller(),
                    this.setInitialPosition(),
                    this.ready.resolve(!0),
                    this.gui && this.setGUI(this.gui)
                }
                )
            }
            updateGUIPathMesh() {
                this.scene.remove(this.pathMesh),
                this.points = this.curve.getPoints(50),
                this.pathMesh = new h.pd((new h.N).setFromPoints(this.points),new h.rd({
                    color: 16777215,
                    fog: !1
                })),
                this.scene.add(this.pathMesh)
            }
            updateGUILookMesh() {
                this.scene.remove(this.lookPathMesh),
                this.lookPoints = this.lookCurve.getPoints(50),
                this.lookPathMesh = new h.pd((new h.N).setFromPoints(this.lookPoints),new h.rd({
                    color: 16776960,
                    fog: !1
                })),
                this.scene.add(this.lookPathMesh)
            }
            setGUI(e) {
                if (this.gui = e,
                this.gltf) {
                    this.points = this.curve.getPoints(50),
                    this.pathMesh = new h.pd((new h.N).setFromPoints(this.points),new h.rd({
                        color: 16777215,
                        fog: !1
                    })),
                    this.scene.add(this.pathMesh);
                    for (let t = 0; t < this.curve.points.length; t++) {
                        const i = e.addFolder("Point " + (t + 1), {
                            closed: !0
                        })
                          , s = this.curve.points[t];
                        i.add(s, "x", -.2, .6, 1e-4).onChange( () => {
                            this.updateGUIPathMesh()
                        }
                        ),
                        i.add(s, "y", -.1, .1, 1e-4).onChange( () => {
                            this.updateGUIPathMesh()
                        }
                        ),
                        i.add(s, "z", -2, 1, 1e-4).onChange( () => {
                            this.updateGUIPathMesh()
                        }
                        ),
                        i.close()
                    }
                    this.lookPoints = this.lookCurve.getPoints(50),
                    this.lookPathMesh = new h.pd((new h.N).setFromPoints(this.lookPoints),new h.rd({
                        color: 16776960,
                        fog: !1
                    })),
                    this.scene.add(this.lookPathMesh);
                    for (let t = 0; t < this.lookCurve.points.length; t++) {
                        const i = e.addFolder("Look " + (t + 1))
                          , s = this.lookCurve.points[t];
                        i.add(s, "x", -.4, .6, 1e-4).onChange( () => {
                            this.updateGUILookMesh()
                        }
                        ),
                        i.add(s, "y", -.05, .05, 1e-4).onChange( () => {
                            this.updateGUILookMesh()
                        }
                        ),
                        i.add(s, "z", -2, 1, 1e-4).onChange( () => {
                            this.updateGUILookMesh()
                        }
                        ),
                        i.close()
                    }
                }
            }
        }
        var Q = i(316);
        class ee {
            constructor(e) {
                this.time = e.time,
                this.sizes = e.sizes,
                this.renderer = e.renderer,
                this.config = e.config,
                this.gui = null,
                this.instance = null,
                this.cameraControls,
                this.setupThree(),
                this.setInstance(),
                this.setCameraControls(),
                this.moveToWorldEdge()
            }
            setupThree() {
                if (!ee.initialized) {
                    ee.initialized = !0;
                    const e = {
                        Vector2: h.Eh,
                        Vector3: h.Fh,
                        Vector4: h.Gh,
                        Quaternion: h.if,
                        Matrix4: h.Ud,
                        Spherical: h.Gg,
                        Box3: h.I,
                        Sphere: h.Eg,
                        Raycaster: h.cg
                    };
                    Q.a.install({
                        THREE: e
                    })
                }
            }
            setInstance() {
                const e = j.a.matches("sm-down") ? 65 : j.a.matches("md-down") ? 50 : 35;
                this.instance = new h.Te(e,this.sizes.viewport.width / this.sizes.viewport.height,.001,.15),
                this.sizes.on("resize", () => {
                    if (this.instance) {
                        const e = j.a.matches("sm-down") ? 65 : j.a.matches("md-down") ? 50 : 35;
                        this.instance.fov = e,
                        this.instance.aspect = this.sizes.viewport.width / this.sizes.viewport.height
                    }
                    this.instance.updateProjectionMatrix()
                }
                )
            }
            moveToWorldEdge() {
                this.instance && (this.cameraControls.setLookAt(R(-.139), .01, .705, R(-.1385), .017, .6312, !1),
                this.cameraControls.zoomTo(1, !1))
            }
            setLookAt(e, t, i) {
                if (!this.instance)
                    return;
                const s = new h.Fh(R(e),t,i);
                this.instance.lookAt(s),
                this.instance.updateProjectionMatrix()
            }
            setCameraControls() {
                this.instance && (this.cameraControls = new Q.a(this.instance,this.renderer.domElement),
                this.cameraControls.enabled = !1,
                this.cameraControls.smoothTime = .2,
                this.cameraControls.maxPolarAngle = 1.67)
            }
            setGUI(e) {
                this.gui = e;
                const t = this.gui.addFolder("Camera Position");
                t.close();
                const i = {
                    x: R(-.139),
                    y: .007,
                    z: .705
                }
                  , s = {
                    x: R(-.156),
                    y: .017,
                    z: 0
                };
                t.add(i, "x", -.2, .2, .001).onChange(e => {
                    this.cameraControls.setLookAt(e, this.instance.position.y, this.instance.position.z, s.x, s.y, s.z, !1)
                }
                ).name("Position X"),
                t.add(i, "y", -.01, .01, .001).onChange(e => {
                    this.cameraControls.setLookAt(this.instance.position.x, e, this.instance.position.z, s.x, s.y, s.z, !1)
                }
                ).name("Position Y"),
                t.add(i, "z", -1, 1, .001).onChange(e => {
                    this.cameraControls.setLookAt(this.instance.position.x, this.instance.position.y, e, s.x, s.y, s.z, !1)
                }
                ).name("Position Z"),
                t.add(s, "x", -1, 1, .001).onChange(e => {
                    s.x = e,
                    this.cameraControls.setLookAt(this.instance.position.x, this.instance.position.y, this.instance.position.z, e, s.y, s.z, !1)
                }
                ).name("Target X"),
                t.add(s, "y", -1, 1, .001).onChange(e => {
                    s.y = e,
                    this.cameraControls.setLookAt(this.instance.position.x, this.instance.position.y, this.instance.position.z, s.x, e, s.z, !1)
                }
                ).name("Target Y"),
                t.add(s, "z", -1, 1, .001).onChange(e => {
                    s.z = e,
                    this.cameraControls.setLookAt(this.instance.position.x, this.instance.position.y, this.instance.position.z, s.x, s.y, e, !1)
                }
                ).name("Target Z"),
                t.add(this.instance, "zoom", 0, 5, .01).onChange(e => {
                    this.instance.zoom = e,
                    this.cameraControls.zoomTo(e, !1),
                    this.instance.updateProjectionMatrix()
                }
                ),
                t.add(this.instance, "fov", 1, 100, 1).onChange(e => {
                    this.instance.fov = e,
                    this.instance.updateProjectionMatrix()
                }
                )
            }
        }
        class te {
            constructor(e) {
                this.x = 0,
                this.y = 0,
                this._nextX = 0,
                this._nextY = 0,
                this._sizes = e
            }
            setup() {
                r.a.hasHoverSupport() && (this.onMouseMoveBinded = this.onMouseMove.bind(this),
                window.addEventListener("mousemove", this.onMouseMoveBinded))
            }
            dispose() {
                window.removeEventListener("mousemove", this.onMouseMoveBinded)
            }
            onMouseMove(e) {
                this._nextX = e.clientX / (4.5 * this._sizes.viewport.width),
                this._nextY = e.clientY / (4.5 * this._sizes.viewport.height)
            }
            update(e) {
                const t = this.x - this._nextX
                  , i = this.y - this._nextY;
                this.x = this._nextX,
                this.y = this._nextY,
                e.rotate(.5 * t, .2 * i, !0)
            }
        }
        function ie(e, t, i, s, n=1 / 0, o) {
            const r = 2 / (s = Math.max(1e-4, s))
              , a = r * o
              , h = 1 / (1 + a + .48 * a * a + .235 * a * a * a);
            let l = e - t;
            const c = t
              , d = n * s;
            var u, m, p;
            u = l,
            m = -d,
            p = d,
            l = Math.max(m, Math.min(p, u)),
            t = e - l;
            const f = (i.value + r * l) * o;
            i.value = (i.value - r * f) * h;
            let g = t + (l + f) * h;
            return c - e > 0 == g > c && (g = c,
            i.value = (g - c) / o),
            g
        }
        var se = i(28)
          , ne = i(24);
        const oe = [{
            from: 4.05,
            to: 7.8
        }, {
            from: 11.1,
            to: 12.6
        }, {
            from: 15,
            to: 16.5
        }, {
            from: 19.2,
            to: 20.7
        }, {
            from: 20.7,
            to: 21.7,
            amount: .5
        }]
          , re = [{
            from: 7.12,
            to: 8.52
        }];
        class ae {
            constructor(e) {
                this.$container = Object(s.a)(e),
                this.$wrapper = this.$container.closest(".sticky"),
                this.$scrollParent = this.$container.scrollParent(),
                this.callbacks = [],
                this.callbacksSmooth = [],
                this.ns = Object(b.a)(),
                this.viewportHeight = 0,
                this.wrapperHeight = 0,
                this.progressVelocity = {
                    value: 0
                },
                this.progressTarget = 0,
                this.progress = 0;
                let t = 0;
                this.progressTotalInSVH = 13,
                this.progressFreezePoints = oe.map(e => {
                    const i = e.to - e.from
                      , s = e.amount || .95
                      , n = {
                        from: e.from - t,
                        to: e.to - t,
                        offset: t,
                        size: i * s,
                        move: i * (1 - s)
                    };
                    return t += i,
                    n
                }
                ),
                t = 0,
                this.progressTotalInSVHMobile = 13,
                this.progressFreezePointsMobile = re.map(e => {
                    const i = e.to - e.from
                      , s = e.amount || .5
                      , n = {
                        from: e.from - t,
                        to: e.to - t,
                        offset: t,
                        size: i * s,
                        move: i * (1 - s)
                    };
                    return t += i,
                    n
                }
                ),
                this._handleResize(),
                this.$scrollParent.on("scroll." + this.ns, this._handleScroll.bind(this)),
                Object(s.a)(window).on("resize." + this.ns, this._handleResize.bind(this))
            }
            onScroll(e) {
                this.callbacks.push(e)
            }
            onScrollSmooth(e) {
                this.callbacksSmooth.push(e)
            }
            getScrollProgress() {
                return this.progress
            }
            dispose() {
                this.callbacks = [],
                this.$scrollParent.off("scroll." + this.ns)
            }
            _handleResize() {
                this.viewportHeight = Object(s.a)(window).height(),
                this.wrapperHeight = this.$wrapper.height(),
                this._handleScroll()
            }
            _handleScroll() {
                let e = this.$scrollParent.scrollTop() / Object(ne.b)() / 100;
                const t = j.a.matches("md-down") ? this.progressFreezePointsMobile : this.progressFreezePoints
                  , i = j.a.matches("md-down") ? this.progressTotalInSVHMobile : this.progressTotalInSVH;
                t.forEach(t => {
                    if (e >= t.from && e <= t.to) {
                        const i = (e - t.from) / (t.to - t.from);
                        e = t.from + t.move * i
                    } else
                        e > t.to && (e -= t.size)
                }
                ),
                this.progressTarget = Object(se.a)(e / i, 0, 1),
                this.callbacks.forEach(e => {
                    e(this.progressTarget)
                }
                )
            }
            update(e) {
                this.progress = ie(this.progress, this.progressTarget, this.progressVelocity, .2, 1 / 0, e),
                this.callbacksSmooth.forEach(e => {
                    e(this.progress)
                }
                )
            }
        }
        const he = [{
            from: .203,
            text: "01"
        }, {
            from: .457,
            text: "02"
        }, {
            from: .642,
            text: "03"
        }, {
            from: .834,
            text: "04"
        }]
          , le = [{
            from: .2941314005143793,
            to: .3597147533317746
        }, {
            from: .5477823240589199,
            to: .5793757306523265
        }, {
            from: .716962824409633,
            to: .7783376198269815
        }, {
            from: .9324760346036943,
            to: .9919219078793546
        }];
        class ce {
            constructor(e, t) {
                this.$element = $(e).find(".js-progress-indicator"),
                this.$text = $(e).find(".js-progress-indicator-text"),
                this.index = 0,
                this.isVisible = !1,
                t.onScrollSmooth(this.update.bind(this))
            }
            update(e) {
                let t = 0
                  , i = !1;
                for (let s = 0; s < he.length; s++)
                    e >= he[s].from && (t = s,
                    i = !0);
                if (j.a.matches("md-down"))
                    for (let t = 0; t < le.length; t++)
                        e >= le[t].from && e <= le[t].to && (i = !1);
                this.isVisible !== i && (this.isVisible = i,
                i ? this.$element.transition("flicker-in") : this.$element.transition("flicker-out", "hideInvisible")),
                this.index !== t && (this.index = t,
                this.$text.text(he[t].text))
            }
        }
        var de = i(323)
          , ue = i(317)
          , me = i(309)
          , pe = i(325)
          , fe = i(318)
          , ge = i(324);
        const ve = {
            uniforms: {
                tDiffuse: {
                    value: null
                },
                uNoiseStrength: {
                    value: 0
                },
                uCAScale: {
                    value: 1
                },
                uCAMaxDistortion: {
                    value: 0
                },
                uCASize: {
                    value: 0
                },
                uVignetteOffset: {
                    value: 0
                },
                uVignetteDarkness: {
                    value: 0
                },
                uGradientsAlpha: {
                    value: 1
                },
                uGradient1Position: {
                    value: new h.Eh(.5,1)
                },
                uGradient1Color: {
                    value: new h.Fh(.0431,.0706,.3922)
                },
                uGradient1Strength: {
                    value: .77
                },
                uGradient1Scale: {
                    value: 1.28
                },
                uGradient2Position: {
                    value: new h.Eh(0,.66)
                },
                uGradient2Color: {
                    value: new h.Fh(.0431,.0706,.3922)
                },
                uGradient2Strength: {
                    value: .48
                },
                uGradient2Scale: {
                    value: .17
                },
                uBottomGradientScale: {
                    value: .88
                },
                uBottomGradientStrength: {
                    value: 0
                },
                uBottomGradientColor: {
                    value: new h.Fh(1,1,1)
                },
                uResolution: {
                    value: new h.Eh(0,0)
                }
            },
            vertexShader: "\n\n        varying vec2 vUv;\n        void main() {\n            vUv = uv;\n            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n        }\n\n    ",
            fragmentShader: "\n\n        uniform sampler2D tDiffuse;\n        uniform vec2 uResolution;\n\n        // Noise\n\n        uniform float uNoiseStrength;\n\n        // Chromatic aberration\n\n        uniform float uCAMaxDistortion;\n        uniform float uCAScale;\n        uniform float uCASize;\n\n        // Vignette\n\n        uniform float uVignetteOffset;\n        uniform float uVignetteDarkness;\n\n        // Gradients\n\n        uniform float uGradientsAlpha;\n        uniform vec2 uGradient1Position;\n        uniform vec3 uGradient1Color;\n        uniform float uGradient1Strength;\n        uniform float uGradient1Scale;\n        uniform vec2 uGradient2Position;\n        uniform vec3 uGradient2Color;\n        uniform float uGradient2Strength;\n        uniform float uGradient2Scale;\n\n        // Bottom gradient\n\n        uniform float uBottomGradientScale;\n        uniform float uBottomGradientStrength;\n        uniform vec3 uBottomGradientColor;\n        varying vec2 vUv;\n        float random(vec2 st) {\n            return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);\n        }\n        #define PI 3.141592653589793\n        vec2 barrelDistortion(vec2 coord, float amt) {\n            vec2 cc = coord - 0.5;\n            float dist = dot(cc, cc);\n            return coord + cc * dist * amt;\n        }\n        float sat(float t) {\n            return clamp( t, 0.0, 1.0 );\n        }\n        float linterp(float t) {\n            return sat(1.0 - abs(2.0 * t - 1.0));\n        }\n        float remap(float t, float a, float b) {\n            return sat((t - a) / (b - a));\n        }\n        vec4 spectrumOffset( float t ) {\n            vec4 ret;\n            float lo = step(t, 0.5);\n            float hi = 1.0 - lo;\n            float w = linterp(remap(t, 1.0 / 6.0, 5.0 / 6.0));\n            ret = vec4(lo, 1.0, hi, 1.) * vec4(1.0 - w, w, 1.0 - w, 1.);\n            return pow(ret, vec4(1.0 / 2.2));\n        }\n        float sineInOut(float t) {\n            return -0.5 * (cos(PI * t) - 1.0);\n        }\n        const int CAIterations = 9;\n        const float CAReciIterations = 1.0 / float(CAIterations);\n        void main() {\n            vec2 uv = vUv;\n\n            // Chromatic aberration\n\n            vec2 caUv = (gl_FragCoord.xy / uResolution.xy * uCAScale) + (1.0 - uCAScale) * 0.5;\n            vec4 sumCol = vec4(0.0);\n            vec4 sumW = vec4(0.0);\n            for (int i = 0; i < CAIterations; ++i) {\n                float t = float(i) * CAReciIterations;\n                vec4 w = spectrumOffset(t);\n                sumW += w;\n                sumCol += w * texture2D(tDiffuse, barrelDistortion(caUv, uCASize * uCAMaxDistortion * t));\n            }\n            vec4 color = sumCol / sumW;\n\n            // Gradients\n\n            float gradient1Alpha = 1.0 - distance(uGradient1Position, uv) * uGradient1Scale;\n            gradient1Alpha = clamp(gradient1Alpha, 0.0, 1.0);\n            gradient1Alpha = sineInOut(gradient1Alpha);\n            color.rgb += uGradient1Color * gradient1Alpha * uGradient1Strength * uGradientsAlpha;\n            float gradient2Alpha = 1.0 - distance(uGradient2Position, uv) * uGradient2Scale;\n            gradient2Alpha = clamp(gradient2Alpha, 0.0, 1.0);\n            gradient2Alpha = sineInOut(gradient2Alpha);\n            color.rgb += uGradient2Color * gradient2Alpha * uGradient2Strength * uGradientsAlpha;\n\n            // Bottom gradient\n\n            float bottomGradientAlpha = distance(uv.y, 1.0) * uBottomGradientScale;\n            bottomGradientAlpha = clamp(bottomGradientAlpha, 0.0, 1.0);\n            // bottomGradientAlpha = sineInOut(bottomGradientAlpha);\n\n            color.rgb = mix(color.rgb, uBottomGradientColor, bottomGradientAlpha * uBottomGradientStrength);\n\n            // Vignette\n\n            const vec2 center = vec2(0.5);\n            float d = distance(vUv, center);\n            color *= smoothstep(0.8, uVignetteOffset * 0.799, d * (uVignetteDarkness + uVignetteOffset));\n\n            // Noise\n\n            color.rgb += (random(vUv) - 0.5) * uNoiseStrength;\n\n            // Final\n\n            gl_FragColor = color;\n        }\n    "
        };
        class we {
            constructor(e) {
                this.app = e,
                this.container = e.container,
                this.scene = e.scene,
                this.renderer = e.renderer,
                this.camera = e.camera,
                this.sizes = e.sizes,
                this.PostParams = e.PostParams,
                this.bloomPass = null,
                this.dotEffect = null,
                this.fxaaPass = null,
                this.composer = null,
                this.init()
            }
            init() {
                this.composer = new de.a(this.renderer);
                const e = this.renderer.getPixelRatio()
                  , t = new ue.a(this.scene,this.camera.instance);
                this.composer.addPass(t);
                const i = this.bloomPass = new ge.a(new h.Eh(this.sizes.width,this.sizes.height),1.5,.4,.85);
                i.threshold = this.PostParams.bloomThreshold,
                i.strength = this.PostParams.bloomStrength,
                i.radius = this.PostParams.bloomRadius,
                this.dotEffect = new me.a(ve),
                this.dotEffect.uniforms.uResolution.value = new h.Eh(this.sizes.width * e,this.sizes.height * e),
                this.fxaaPass = new me.a(fe.a),
                this.fxaaPass.material.uniforms.resolution.value.x = 1 / (this.sizes.width * e),
                this.fxaaPass.material.uniforms.resolution.value.y = 1 / (this.sizes.height * e);
                const s = this.outputPass = new pe.a;
                this.outputPass && this.composer.addPass(s),
                this.bloomPass && this.composer.addPass(i),
                this.dotEffect && this.composer.addPass(this.dotEffect),
                this.fxaaPass && this.composer.addPass(this.fxaaPass)
            }
            setPixelRatio(e) {
                this.renderer.setPixelRatio(e),
                this.composer && (this.composer.setPixelRatio(e),
                this.dotEffect && (this.dotEffect.uniforms.uResolution.value = new h.Eh(this.sizes.width * e,this.sizes.height * e)),
                this.fxaaPass && (this.fxaaPass.material.uniforms.resolution.value.x = 1 / (this.sizes.width * e)),
                this.fxaaPass && (this.fxaaPass.material.uniforms.resolution.value.y = 1 / (this.sizes.height * e)))
            }
            toggleBloom() {
                this.bloomPass.enabled ? (this.bloomPass.enabled = !1,
                this.renderer.toneMappingExposure = 1.4) : (this.bloomPass.enabled = !0,
                this.renderer.toneMappingExposure = .7)
            }
            disableBloom() {
                this.bloomPass.enabled = !1,
                this.renderer.toneMappingExposure = 1.4
            }
            disableFXAA() {
                this.fxaaPass.enabled = !1
            }
            render() {
                return !!this.composer && (this.composer.render(this.scene, this.camera.instance),
                !0)
            }
            setGUI(e) {
                this.gui = e;
                const t = this.bloomPass
                  , i = this.gui.addFolder("Post Processing").close();
                i.add(t, "threshold", 0, 1, .01).onChange(e => {
                    t.threshold = e
                }
                ),
                i.add(t, "strength", 0, 5, .01).onChange(e => {
                    t.strength = e
                }
                ),
                i.add(t, "radius", 0, 1.5, .01).onChange(e => {
                    t.radius = e
                }
                ),
                i.add(this.PostParams, "exposure", 0, 2, .01).onChange( () => {
                    this.renderer.toneMappingExposure = this.PostParams.exposure
                }
                );
                const s = i.addFolder("Dot Effect").close();
                s.add(this.dotEffect.uniforms.uCAScale, "value", 0, 1, .01).name("uCAScale").onChange(e => {
                    this.dotEffect.uniforms.uCAScale.value = e
                }
                ),
                s.add(this.dotEffect.uniforms.uNoiseStrength, "value", 0, .1, .001).name("uNoiseStrength").onChange(e => {
                    this.dotEffect.uniforms.uNoiseStrength.value = e
                }
                ),
                s.add(this.dotEffect.uniforms.uCAMaxDistortion, "value", 0, 1, .01).name("uCAMaxDistortion").onChange(e => {
                    this.dotEffect.uniforms.uCAMaxDistortion.value = e
                }
                ),
                s.add(this.dotEffect.uniforms.uCASize, "value", 0, 1, .01).name("uCASize").onChange(e => {
                    this.dotEffect.uniforms.uCASize.value = e
                }
                ),
                s.add(this.dotEffect.uniforms.uVignetteOffset, "value", 0, 1, .01).name("uVignetteOffset").onChange(e => {
                    this.dotEffect.uniforms.uVignetteOffset.value = e
                }
                ),
                s.add(this.dotEffect.uniforms.uVignetteDarkness, "value", 0, 1, .01).name("uVignetteDarkness").onChange(e => {
                    this.dotEffect.uniforms.uVignetteDarkness.value = e
                }
                ),
                s.add(this.dotEffect.uniforms.uGradientsAlpha, "value", 0, 1, .01).name("uGradientsAlpha").onChange(e => {
                    this.dotEffect.uniforms.uGradientsAlpha.value = e
                }
                ),
                s.addColor(this.dotEffect.uniforms.uGradient1Color, "value").name("uGradient1Color").onChange(e => {
                    this.dotEffect.uniforms.uGradient1Color.value.set(e[0], e[1], e[2])
                }
                ),
                s.add(this.dotEffect.uniforms.uGradient1Strength, "value", 0, 1, .01).name("uGradient1Strength").onChange(e => {
                    this.dotEffect.uniforms.uGradient1Strength.value = e
                }
                ),
                s.add(this.dotEffect.uniforms.uGradient1Scale, "value", 0, 3, .01).name("uGradient1Scale").onChange(e => {
                    this.dotEffect.uniforms.uGradient1Scale.value = e
                }
                ),
                s.addColor(this.dotEffect.uniforms.uGradient2Color, "value").name("uGradient2Color").onChange(e => {
                    this.dotEffect.uniforms.uGradient2Color.value.set(e[0], e[1], e[2])
                }
                ),
                s.add(this.dotEffect.uniforms.uGradient2Strength, "value", 0, 1, .01).name("uGradient2Strength").onChange(e => {
                    this.dotEffect.uniforms.uGradient2Strength.value = e
                }
                ),
                s.add(this.dotEffect.uniforms.uGradient2Scale, "value", 0, 3, .01).name("uGradient2Scale").onChange(e => {
                    this.dotEffect.uniforms.uGradient2Scale.value = e
                }
                ),
                s.add(this.dotEffect.uniforms.uBottomGradientScale, "value", 0, 1, .01).name("uBottomGradientScale").onChange(e => {
                    this.dotEffect.uniforms.uBottomGradientScale.value = e
                }
                ),
                s.add(this.dotEffect.uniforms.uBottomGradientStrength, "value", 0, 1, .01).name("uBottomGradientStrength").onChange(e => {
                    this.dotEffect.uniforms.uBottomGradientStrength.value = e
                }
                ),
                s.addColor(this.dotEffect.uniforms.uBottomGradientColor, "value").name("uBottomGradientColor").onChange(e => {
                    this.dotEffect.uniforms.uBottomGradientColor.value.set(e[0], e[1], e[2])
                }
                ),
                i.addColor(this.PostParams, "rendererColor").onChange(e => {
                    this.renderer.setClearColor(e),
                    this.scene.fog.color.set(e)
                }
                ).name("Background color");
                const n = {
                    dotEffect: !0,
                    fxaaPass: !0,
                    bloomPass: !0,
                    blurPass: !0
                };
                i.add(n, "dotEffect").onChange(e => {
                    this.dotEffect.enabled = e
                }
                ),
                i.add(n, "bloomPass").onChange(e => {
                    t.enabled = e
                }
                ),
                i.add(n, "fxaaPass").onChange(e => {
                    this.fxaaPass.enabled = e
                }
                )
            }
        }
        var be = i(320)
          , Pe = i(322)
          , xe = i(319);
        const {Scene: Ce, WebGLRenderer: Se, AmbientLight: ye, Group: Me, ACESFilmicToneMapping: ke, LoadingManager: Fe, LinearSRGBColorSpace: ze, Fog: Te, Color: Ee, HalfFloatType: Ae, Vector2: _e, RGBAFormat: Ge, REVISION: Re} = l
          , Oe = new Fe
          , Le = `https://unpkg.com/three@0.${Re}.x`
          , De = new xe.a(Oe).setDecoderPath(Le + "/examples/jsm/libs/draco/gltf/");
        var Be = class {
            constructor(e) {
                this.test = "#debug" === window.location.hash,
                this.testFPSOnly = "#debug-fps" === window.location.hash,
                this.testFPSOnlyNoLimit = "#debug-fps=nolimit" === window.location.hash,
                this.hasPreloaderAnimationPlayed = !1,
                this.container = e.container,
                this.scroller = new ae(e.container),
                this.indicator = new ce(e.container,this.scroller),
                this.sizes = new q,
                this.time = new K({
                    fpsLimit: this.testFPSOnlyNoLimit ? Number.POSITIVE_INFINITY : 60,
                    minFpsLimit: 30,
                    degradeVisualFidelity: this.degradeVisualFidelity.bind(this)
                }),
                this.mouseMovement = new te(this.sizes),
                this.classes = {
                    isLoaded: "is-loaded"
                },
                this.PostParams = {
                    exposure: .7,
                    bloomStrength: .5,
                    bloomThreshold: 0,
                    bloomRadius: 0,
                    rendererColor: "#000835"
                },
                this.gui = null,
                this.fpsCounter = null,
                this.isActive = !0,
                this.isInView = !1,
                this.loader = new be.a(Oe).setCrossOrigin("anonymous"),
                this.gltfLoader = new Pe.a(Oe).setCrossOrigin("anonymous").setDRACOLoader(De),
                this.ready = this.time.ready,
                this.init()
            }
            init() {
                this.setScene(),
                this.setRenderer(),
                this.setCamera(),
                this.setWorld(),
                this.setPost(),
                this.resizeHandler(),
                this.mouseMovement.setup(),
                (this.test || this.testFPSOnly || this.testFPSOnlyNoLimit) && (this.setFPSCounter(),
                window.THREE = l,
                window.app = this),
                this.test && (this.setGUI(),
                window.THREE = l,
                window.app = this),
                this.time.start(),
                this.ready = Promise.all([this.time.ready, this.lines.ready, this.truck.ready, this.floor.ready, this.animation.ready])
            }
            setScene() {
                this.scene = new Ce,
                this.group = new Me,
                _ && this.scene.scale.set(-1, 1, 1)
            }
            setCamera() {
                this.camera = new ee(this)
            }
            setRenderer() {
                this.renderer = new Se({
                    antialias: !1
                }),
                this.renderer.setPixelRatio(2),
                this.renderer.info.autoReset = !1,
                this.renderer.setSize(this.sizes.viewport.width, this.sizes.viewport.height),
                this.renderer.type = Ae,
                this.renderer.format = Ge,
                this.renderer.toneMapping = ke,
                this.renderer.outputColorSpace = ze,
                this.renderer.toneMappingExposure = this.PostParams.exposure,
                this.renderer.physicallyCorrectLights = !0,
                this.renderer.setClearColor(this.PostParams.rendererColor),
                this.sizes.on("resize", () => {
                    this.resizeHandler()
                }
                ),
                this.ready.then( () => {
                    $(this.container).prepend(this.renderer.domElement),
                    new a.a($(this.container),{
                        threshold: .01,
                        enter: this.inviewPlay.bind(this),
                        leave: this.inviewPause.bind(this)
                    })
                }
                ),
                this.time.on("tick", e => {
                    this.fpsCounter && this.fpsCounter.begin(),
                    this.isInView && this.isActive && this.renderer && this.scene && this.camera && this.camera.instance && this.render(e)
                }
                )
            }
            resizeHandler() {
                if (this.renderer.setSize(this.sizes.width, this.sizes.height),
                !this.plane)
                    return;
                const e = new _e;
                this.camera.instance.getViewSize(1.5, e),
                this.plane.scale.set(e.x, e.y, 1)
            }
            pause() {
                this.isActive = !1
            }
            play() {
                this.isActive = !0,
                this.render(!0)
            }
            inviewPause() {
                this.isInView = !1
            }
            inviewPlay() {
                this.isInView || (this.isInView = !0,
                this.isActive && this.isInView && this.play())
            }
            playPreloaderAnimation() {
                this.hasPreloaderAnimationPlayed || (this.hasPreloaderAnimationPlayed = !0,
                this.ready.then( () => {
                    this.animation.play()
                }
                ))
            }
            dispose() {
                this.sizes.dispose(),
                this.mouseMovement.dispose(),
                this.scene.remove(this.group),
                this.renderer.dispose(),
                this.scroller.dispose(),
                this.lines.dispose(),
                this.truck.dispose(),
                this.time.stop(),
                this.isActive = !1
            }
            setWorld() {
                this.setWorldObjects(),
                this.setWorldLights(),
                this.setWorldFog(),
                this.setAnimation()
            }
            setWorldObjects() {
                this.setLines(),
                this.setTruck(),
                this.setFloor(),
                this.addGroup(),
                this.renderer.compile(this.scene, this.camera.instance)
            }
            setWorldLights() {
                this.ambientLight = new ye(16777215,1),
                this.scene.add(this.ambientLight)
            }
            setWorldFog() {
                this.fogParams = {
                    near: .02,
                    far: .15
                };
                const e = new Ee("#000835");
                this.scene.fog = new Te(e,this.fogParams.near,this.fogParams.far)
            }
            setFloor() {
                this.scene && (this.fakeFloor = new w(this),
                this.group.add(this.fakeFloor.container),
                this.floor = new m(this),
                this.group.add(this.floor.container))
            }
            setTruck() {
                this.scene && (this.truck = new N(this),
                this.group.add(this.truck.container))
            }
            setLines() {
                this.scene && (this.lines = new V(this),
                this.group.add(this.lines.container))
            }
            addGroup() {
                this.scene.add(this.group)
            }
            setAnimation() {
                this.animation = new J(this)
            }
            setPost() {
                this.post = new we(this)
            }
            degradeVisualFidelity(e) {
                return r.a.isMobile() ? 0 === e ? (this.floor.dispose(),
                !0) : 1 === e && (this.post.setPixelRatio(1.5),
                !0) : 0 === e ? (this.post.setPixelRatio(1.5),
                !0) : 1 === e ? (this.floor.dispose(),
                !0) : 2 === e ? (this.post.disableBloom(),
                !0) : 3 === e && (this.post.setPixelRatio(1),
                !0)
            }
            setFPSCounter() {
                i.e(10).then(i.bind(null, 326)).then( ({default: e}) => {
                    this.fpsCounter = new e
                }
                )
            }
            setGUI() {
                i.e(8).then(i.bind(null, 327)).then(e => {
                    this.gui = new e.GUI,
                    this.camera && this.camera.setGUI(this.gui),
                    this.fakeFloor && this.fakeFloor.setGUI(this.gui),
                    this.floor && this.floor.setGUI(this.gui),
                    this.truck && this.truck.setGUI(this.gui),
                    this.lines && this.lines.setGUI(this.gui),
                    this.animation && this.animation.setGUI(this.gui),
                    this.post && this.post.setGUI(this.gui)
                }
                )
            }
            render(e) {
                this.renderer.info.reset(),
                e && (this.camera.instance.updateMatrixWorld(),
                this.truck && this.truck.update(this.time.delta),
                this.lines && this.lines.update(this.time.delta),
                this.post && this.post.render() || this.renderer.render(this.scene, this.camera.instance),
                this.mouseMovement.update(this.camera.cameraControls, this.time.delta),
                this.camera.cameraControls.update(this.time.delta / 1e3)),
                this.scroller.update(this.time.delta / 1e3),
                e && this.fpsCounter && this.fpsCounter.end()
            }
        }
        ;
        s.a.fn.webglLines = o()((function(e, t) {
            const i = new Be({
                container: e.get(0),
                canvas: e.find(".js-webgl-lines").get(0)
            });
            return {
                play() {
                    i.play()
                },
                pause() {
                    i.pause()
                },
                ready: () => i.ready,
                playPreloaderAnimation() {
                    i.playPreloaderAnimation()
                }
            }
        }
        ))
    },
    312: function(e, t) {
        e.exports = "uniform float uTime;\nvarying vec2 vUv;\n\n#define MOD3 vec3(.1031,.11369,.13787)\n\n#define COLOR_1 vec3(0.18, 0.27, 0.53)\n#define COLOR_2 vec3(0.7294, 0.5725, 0.0)\n\nvec3 hash33(vec3 p3)\n{\n\tp3 = fract(p3 * MOD3);\n    p3 += dot(p3, p3.yxz+19.19);\n    return -1.0 + 2.0 * fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));\n}\n\nfloat simplex_noise(vec3 p)\n{\n    const float K1 = 0.333333333;\n    const float K2 = 0.166666667;\n\n    vec3 i = floor(p + (p.x + p.y + p.z) * K1);\n    vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);\n\n    // thx nikita: https://www.shadertoy.com/view/XsX3zB\n    vec3 e = step(vec3(0.0), d0 - d0.yzx);\n\tvec3 i1 = e * (1.0 - e.zxy);\n\tvec3 i2 = 1.0 - e.zxy * (1.0 - e);\n\n    vec3 d1 = d0 - (i1 - 1.0 * K2);\n    vec3 d2 = d0 - (i2 - 2.0 * K2);\n    vec3 d3 = d0 - (1.0 - 3.0 * K2);\n\n    vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);\n    vec4 n = h * h * h * h * vec4(dot(d0, hash33(i)), dot(d1, hash33(i + i1)), dot(d2, hash33(i + i2)), dot(d3, hash33(i + 1.0)));\n\n    return dot(vec4(31.316), n);\n}\n\nvoid main() {\n    vec2 uv = vUv;\n    float alpha = 1.0 - distance(uv, vec2(0.5, 0.5)) * 2.0;\n\n    float speed = 0.1;\n    float time = uTime * speed;\n    uv.x += time * -0.3;\n\n    vec2 noiseScaleBlue = vec2(2.0, 4.0);\n    vec2 noiseScaleOrange = vec2(2.0, 8.0);\n\n    float cBlue1 = simplex_noise(vec3(uv * noiseScaleBlue, time * 0.5)) * 0.5 + 0.5;\n    float cBlue2 = simplex_noise(vec3(uv * noiseScaleBlue * -2.0, time * 0.5)) * 0.5 + 0.5;\n\n    float cOrange1 = simplex_noise(vec3(uv * noiseScaleOrange * 1.0, time * 0.5)) * 0.5 + 0.5;\n    float cOrange2 = simplex_noise(vec3(uv * noiseScaleOrange * 3.0 * -2.0, time * 0.5)) * 0.5 + 0.5;\n    float cOrange3 = simplex_noise(vec3(uv * noiseScaleOrange * 2.0 * 1.5, time * 0.5)) * 0.5 + 0.5;\n\n    float cMix1 = simplex_noise(vec3(uv * noiseScaleOrange * 2.5, time * 1.25)) * 0.5 + 0.5;\n    float cMix2 = simplex_noise(vec3(uv * noiseScaleBlue * 0.5, time * 1.25)) * 0.5 + 0.5;\n\n    float alphaBlue = alpha * cBlue1 * cBlue2;\n    float alphaOrange = alpha * cOrange1 * cOrange2 * cOrange3;\n\n    gl_FragColor = mix(vec4(COLOR_1, alphaBlue), vec4(COLOR_2, alphaOrange), cMix1 * cMix1 * cMix2 * cMix2);\n    gl_FragColor.a *= 0.75;\n}\n"
    },
    313: function(e, t) {
        e.exports = "varying vec2 vUv;\n\nvoid main() {\n    vUv = uv;\n    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n}\n"
    },
    314: function(e, t) {
        e.exports = "varying vec2 vUv;\nuniform float uTime;\nvarying float vProgress;\nuniform float uSize;\nuniform float uSpeed;\n\n#include <fog_pars_vertex>\n\nvoid main() {\n    vUv = uv;\n\n    vec4 pos = modelViewMatrix * vec4(position, 1.0);\n\n    // Animation progress\n    vProgress = smoothstep(-0.5, 0.5, sin(vUv.x * uSize + uTime)) * uSpeed;\n\n    gl_Position = projectionMatrix * pos;\n\n    #include <begin_vertex>\n    #include <project_vertex>\n    #include <fog_vertex>\n}\n"
    },
    315: function(e, t) {
        e.exports = "uniform vec3 uColor;\nuniform float uSize;\nuniform float uSpeed;\nuniform float uAlpha;\nuniform bool uHideCorners;\nvarying vec2 vUv;\nvarying float vProgress;\n\n#include <fog_pars_fragment>\n\nvoid main() {\n\n    // line tails\n    float hideCorners = uHideCorners ? smoothstep(0., 0.1, vUv.x) * smoothstep(1., 0.9, vUv.x) : 1.0;\n\n    // two colors\n    vec3 finalcolor = mix(uColor, (uColor * 3.), vProgress);\n\n    gl_FragColor.rgba = vec4(finalcolor, uAlpha * hideCorners);\n\n    #include <fog_fragment>\n}\n"
    },
    34: function(e, t, i) {
        "use strict";
        function s(e, t, i, s, n, o=!0) {
            const r = s < n ? s : n
              , a = s < n ? n : s
              , h = (e - t) / (i - t) * (n - s) + s;
            return o ? Math.max(r, Math.min(a, h)) : h
        }
        i.d(t, "a", (function() {
            return s
        }
        ))
    }
}]);
