import { createSignal, onMount, onCleanup } from 'solid-js'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Vec2 {
  readonly x: number
  readonly y: number
}

interface MouseState {
  readonly pos: Vec2
  readonly smooth: Vec2
  readonly vel: Vec2
  readonly smoothVel: Vec2
  readonly diff: number
}

interface HeadState {
  readonly pos: Vec2
  readonly vel: Vec2
}

interface ParticleState {
  readonly pos: Vec2
  readonly vel: Vec2
  readonly size: number
  readonly age: number
  readonly seed: number
  readonly freq: number
  readonly amplitude: number
  readonly color: string
  readonly el: SVGCircleElement
}

interface Viewport {
  readonly width: number
  readonly height: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const hasHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches

const TEXT_LINE1 = 'FLOAT'
const TEXT_LINE2 = 'CAPITAL'
const FONT_FAMILY = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif"
const VELOCITY_DECAY = 0.85
const PARTICLE_DECAY = 0.85
const PARTICLE_VEL_DECAY = 0.95
const SMOOTH_FACTOR = 0.1
const MIN_PARTICLE_SIZE = 1
const MAX_PARTICLE_SIZE = 200
const MAX_PARTICLES = hasHover ? 150 : 60
const MAX_PARTICLE_AGE = 80

// ─── Pure Functions ──────────────────────────────────────────────────────────

const vec2 = (x: number, y: number): Vec2 => ({ x, y })
const addVec = (a: Vec2, b: Vec2): Vec2 => vec2(a.x + b.x, a.y + b.y)
const scaleVec = (v: Vec2, s: number): Vec2 => vec2(v.x * s, v.y * s)
const magVec = (v: Vec2): number => Math.hypot(v.x, v.y)
const lerpScalar = (a: number, b: number, t: number): number => a + (b - a) * t
const lerpVec = (a: Vec2, b: Vec2, t: number): Vec2 =>
  vec2(lerpScalar(a.x, b.x, t), lerpScalar(a.y, b.y, t))

const createInitialMouse = (): MouseState => ({
  pos: vec2(0, 0),
  smooth: vec2(0, 0),
  vel: vec2(0, 0),
  smoothVel: vec2(0, 0),
  diff: 0,
})

const createInitialHead = (vp: Viewport): HeadState => {
  // Match stepHead(time=0) to avoid first-frame velocity spike
  const cx = hasHover ? 0.5 : 0.55
  const rx = hasHover ? 0.375 : 0.35
  const ry = hasHover ? 0.05 : 0.15
  const x = vp.width * cx + vp.width * rx  // cos(0) = 1
  const y = vp.height * 0.5 + vp.width * ry // cos(0) = 1
  return { pos: vec2(x, y), vel: vec2(0, 0) }
}

const updateMouseOnMove = (prev: MouseState, newPos: Vec2): MouseState => ({
  ...prev,
  pos: newPos,
  vel: addVec(prev.vel, vec2(prev.pos.x - newPos.x, prev.pos.y - newPos.y)),
})

const stepMouse = (m: MouseState): MouseState => {
  const smooth = lerpVec(m.smooth, m.pos, SMOOTH_FACTOR)
  const smoothVel = lerpVec(m.smoothVel, m.vel, SMOOTH_FACTOR)
  const vel = scaleVec(m.vel, VELOCITY_DECAY)
  const diff = magVec(vec2(m.pos.x - smooth.x, m.pos.y - smooth.y))
  return { pos: m.pos, smooth, vel, smoothVel, diff }
}

const stepHead = (prev: HeadState, vp: Viewport, time: number): HeadState => {
  // 手机模式：更丰富的自动轨迹（8字形 + 多频叠加）
  const cx = hasHover ? 0.5 : 0.55
  const rx = hasHover ? 0.375 : 0.35
  const ry = hasHover ? 0.05 : 0.15
  const sx = hasHover ? 0.0006 : 0.0008
  const sy = hasHover ? 0.0011 : 0.0013

  const x = vp.width * cx
    + vp.width * rx * Math.cos(time * sx)
    + (hasHover ? 0 : vp.width * 0.08 * Math.sin(time * 0.0019))
  const y = vp.height * 0.5
    + vp.width * ry * Math.cos(time * sy)
    + (hasHover ? 0 : vp.height * 0.1 * Math.sin(time * 0.0007))

  const newPos = vec2(x, y)
  return { pos: newPos, vel: vec2(prev.pos.x - x, prev.pos.y - y) }
}

const createParticle = (
  pos: Vec2,
  vel: Vec2,
  size: number,
  hue: number,
): ParticleState => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  el.setAttribute('cx', String(pos.x))
  el.setAttribute('cy', String(pos.y))
  el.setAttribute('r', String(size))
  el.setAttribute('fill', `hsl(${hue},100%,50%)`)

  return {
    pos,
    vel,
    size,
    age: 0,
    seed: Math.random() * 1000,
    freq: (0.5 + Math.random()) * 0.01,
    amplitude: (1 - Math.random() * 2) * 0.5,
    color: `hsl(${hue},100%,50%)`,
    el,
  }
}

const stepParticle = (p: ParticleState, time: number): ParticleState => {
  const wave = vec2(
    Math.cos((time + p.seed) * p.freq) * p.amplitude,
    Math.sin((time + p.seed) * p.freq) * p.amplitude,
  )
  const pos = addVec(addVec(p.pos, wave), p.vel)
  const vel = scaleVec(p.vel, PARTICLE_VEL_DECAY)
  const size = Math.min((p.size + magVec(p.vel)) * PARTICLE_DECAY, MAX_PARTICLE_SIZE)
  const age = p.age + 1

  p.el.setAttribute('cx', String(pos.x))
  p.el.setAttribute('cy', String(pos.y))
  p.el.setAttribute('r', String(size))

  return { ...p, pos, vel, size, age }
}

const isAlive = (p: ParticleState): boolean =>
  p.size >= MIN_PARTICLE_SIZE && p.age < MAX_PARTICLE_AGE

const emitParams = (
  mouse: MouseState,
  head: HeadState,
): { pos: Vec2; vel: Vec2; size: number } =>
  mouse.diff > 0.01
    ? {
        pos: mouse.smooth,
        vel: scaleVec(mouse.smoothVel, -0.25),
        size: mouse.diff * 0.25,
      }
    : {
        pos: head.pos,
        vel: scaleVec(head.vel, 2),
        size: magVec(head.vel) * 3,
      }

// Reuse arrays across frames to reduce GC pressure
const _alive: ParticleState[] = []
const _dead: ParticleState[] = []

const partitionParticles = (
  particles: ParticleState[],
  time: number,
): { alive: ParticleState[]; dead: ParticleState[] } => {
  _alive.length = 0
  _dead.length = 0
  for (let i = 0; i < particles.length; i++) {
    const updated = stepParticle(particles[i], time)
    if (isAlive(updated)) {
      _alive.push(updated)
    } else {
      _dead.push(updated)
    }
  }
  return { alive: _alive, dead: _dead }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function GooeyText() {
  const [viewport, setViewport] = createSignal<Viewport>({ width: 0, height: 0 })
  const viewBox = () => `0 0 ${viewport().width} ${viewport().height}`
  const isMobileView = () => viewport().width < 768

  // 桌面：横排两行；手机：竖排两列，字体更大
  const fontSize = () => isMobileView()
    ? Math.min(viewport().width * 0.28, viewport().height * 0.14)
    : Math.min(viewport().width * 0.18, viewport().height * 0.3)

  // 桌面：两行水平排列，垂直居中
  const lineY1 = () => viewport().height * 0.5 - fontSize() * 0.15
  const lineY2 = () => viewport().height * 0.5 + fontSize() * 1.05

  // 手机竖排：右对齐，垂直居中，两列从右往左排
  const colX1 = () => viewport().width - fontSize() * 0.55        // CAPITAL（右列）
  const colX2 = () => colX1() - fontSize() * 1.15                 // FLOAT（左列）
  const colY = () => viewport().height * 0.5                      // 垂直居中

  let svgEl!: SVGSVGElement
  let wrapperEl!: SVGGElement
  let cursorEl!: HTMLDivElement

  // mutable state managed via signals for the animation loop
  let mouseState = createInitialMouse()
  let headState: HeadState = { pos: vec2(0, 0), vel: vec2(0, 0) }
  let particles: ParticleState[] = []
  let particleCnt = 0
  let rafId = 0

  const handleMouseMove = (e: MouseEvent): void => {
    const rect = svgEl.getBoundingClientRect()
    mouseState = updateMouseOnMove(
      mouseState,
      vec2(e.clientX - rect.left, e.clientY - rect.top),
    )
  }

  const handleTouchMove = (e: TouchEvent): void => {
    const touch = e.touches[0]
    if (!touch) return
    const rect = svgEl.getBoundingClientRect()
    mouseState = updateMouseOnMove(
      mouseState,
      vec2(touch.clientX - rect.left, touch.clientY - rect.top),
    )
  }

  const handleResize = (): void => {
    const vp: Viewport = { width: window.innerWidth - 4, height: window.innerHeight }
    setViewport(vp)
    svgEl.style.width = vp.width + 'px'
    svgEl.style.height = vp.height + 'px'
  }

  const tick = (time: number): void => {
    // 1. step mouse & head (pure transforms)
    mouseState = stepMouse(mouseState)
    headState = stepHead(headState, viewport(), time)

    // 2. emit new particle (capped to prevent unbounded growth)
    if (particles.length < MAX_PARTICLES) {
      const { pos, vel, size } = emitParams(mouseState, headState)
      const newP = createParticle(pos, vel, size, particleCnt % 360)
      particleCnt += 15
      wrapperEl.prepend(newP.el)
      particles.push(newP)
    }

    // 3. step existing particles, partition alive / dead
    const { alive, dead } = partitionParticles(particles, time)
    for (let i = 0; i < dead.length; i++) dead[i].el.remove()
    particles = alive.slice()

    // 4. update cursor CSS vars
    cursorEl.style.setProperty('--x', mouseState.smooth.x + 'px')
    cursorEl.style.setProperty('--y', mouseState.smooth.y + 'px')

    rafId = requestAnimationFrame(tick)
  }

  onMount(() => {
    handleResize()
    headState = createInitialHead(viewport())
    if (hasHover) {
      window.addEventListener('mousemove', handleMouseMove)
    }
    window.addEventListener('resize', handleResize)
    rafId = requestAnimationFrame(tick)
  })

  onCleanup(() => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('resize', handleResize)
  })

  return (
    <div class="relative">
      <svg
        ref={svgEl!}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox()}
        preserveAspectRatio="none"
        class="top-0 left-0 z-1 relative"
      >
        <mask id="text">
          <text
            x={isMobileView() ? colX2() : '95%'}
            y={isMobileView() ? colY() : lineY1()}
            dominant-baseline="auto"
            text-anchor={isMobileView() ? 'middle' : 'end'}
            fill="white"
            font-family={FONT_FAMILY}
            font-weight="bold"
            writing-mode={isMobileView() ? 'vertical-rl' : 'horizontal-tb'}
            style={{ 'font-size': `${fontSize()}px` }}
          >{TEXT_LINE1}</text>
          <text
            x={isMobileView() ? colX1() : '95%'}
            y={isMobileView() ? colY() : lineY2()}
            dominant-baseline="auto"
            text-anchor={isMobileView() ? 'middle' : 'end'}
            fill="white"
            font-family={FONT_FAMILY}
            font-weight="bold"
            writing-mode={isMobileView() ? 'vertical-rl' : 'horizontal-tb'}
            style={{ 'font-size': `${fontSize()}px` }}
          >{TEXT_LINE2}</text>
        </mask>
        <filter id="gooey">
          <feGaussianBlur in="SourceGraphic" stdDeviation="30" />
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            result="goo"
          />
        </filter>
        <text
          x={isMobileView() ? colX2() : '95%'}
          y={isMobileView() ? colY() : lineY1()}
          dominant-baseline="auto"
          text-anchor={isMobileView() ? 'middle' : 'end'}
          class="fill-[#111827] stroke-[#2a2a2a] stroke-[1px] font-bold leading-none [vector-effect:non-scaling-stroke]"
          font-family={FONT_FAMILY}
          font-weight="bold"
          writing-mode={isMobileView() ? 'vertical-rl' : 'horizontal-tb'}
          style={{ 'font-size': `${fontSize()}px` }}
        >{TEXT_LINE1}</text>
        <text
          x={isMobileView() ? colX1() : '95%'}
          y={isMobileView() ? colY() : lineY2()}
          dominant-baseline="auto"
          text-anchor={isMobileView() ? 'middle' : 'end'}
          class="fill-[#111827] stroke-[#2a2a2a] stroke-[1px] font-bold leading-none [vector-effect:non-scaling-stroke]"
          font-family={FONT_FAMILY}
          font-weight="bold"
          writing-mode={isMobileView() ? 'vertical-rl' : 'horizontal-tb'}
          style={{ 'font-size': `${fontSize()}px` }}
        >{TEXT_LINE2}</text>
        <g ref={wrapperEl!} filter="url(#gooey)" mask="url(#text)" class="js-wrapper" />
      </svg>
      <div ref={cursorEl!} class="cursor js-cursor" />
    </div>
  )
}