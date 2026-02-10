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

const TEXT_LINE1 = 'FLOAT'
const TEXT_LINE2 = 'CAPITAL'
const FONT_FAMILY = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif"
const VELOCITY_DECAY = 0.85
const PARTICLE_DECAY = 0.85
const PARTICLE_VEL_DECAY = 0.95
const SMOOTH_FACTOR = 0.1
const MIN_PARTICLE_SIZE = 1

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

const createInitialHead = (): HeadState => ({
  pos: vec2(0, 0),
  vel: vec2(0, 0),
})

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
  const x = vp.width * 0.5 + vp.width * 0.375 * Math.cos(time * 0.0006)
  const y = vp.height * 0.5 + vp.width * 0.05 * Math.cos(time * 0.0011)
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
  const size = (p.size + magVec(p.vel)) * PARTICLE_DECAY

  p.el.setAttribute('cx', String(pos.x))
  p.el.setAttribute('cy', String(pos.y))
  p.el.setAttribute('r', String(size))

  return { ...p, pos, vel, size }
}

const isAlive = (p: ParticleState): boolean => p.size >= MIN_PARTICLE_SIZE

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

const partitionParticles = (
  particles: readonly ParticleState[],
  time: number,
): { alive: ParticleState[]; dead: ParticleState[] } => {
  const alive: ParticleState[] = []
  const dead: ParticleState[] = []
  for (const p of particles) {
    const updated = stepParticle(p, time)
    if (isAlive(updated)) {
      alive.push(updated)
    } else {
      dead.push(updated)
    }
  }
  return { alive, dead }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function GooeyText() {
  const [viewport, setViewport] = createSignal<Viewport>({ width: 0, height: 0 })
  const viewBox = () => `0 0 ${viewport().width} ${viewport().height}`
  const fontSize = () => Math.min(viewport().width * 0.18, viewport().height * 0.3)
  // 两行文字垂直居中：lineHeight ≈ fontSize, 总高度 = 2 * lineHeight, 起点 = center - totalHeight/2
  const lineY1 = () => viewport().height * 0.5 - fontSize() * 0.15
  const lineY2 = () => viewport().height * 0.5 + fontSize() * 1.05

  let svgEl!: SVGSVGElement
  let wrapperEl!: SVGGElement
  let cursorEl!: HTMLDivElement

  // mutable state managed via signals for the animation loop
  let mouseState = createInitialMouse()
  let headState = createInitialHead()
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

    // 2. emit new particle
    const { pos, vel, size } = emitParams(mouseState, headState)
    const newP = createParticle(pos, vel, size, particleCnt % 360)
    particleCnt += 5
    wrapperEl.prepend(newP.el)

    // 3. step existing particles, partition alive / dead
    const { alive, dead } = partitionParticles([...particles, newP], time)
    dead.forEach(p => p.el.remove())
    particles = alive

    // 4. update cursor CSS vars
    cursorEl.style.setProperty('--x', mouseState.smooth.x + 'px')
    cursorEl.style.setProperty('--y', mouseState.smooth.y + 'px')

    rafId = requestAnimationFrame(tick)
  }

  onMount(() => {
    handleResize()
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('resize', handleResize)
    rafId = requestAnimationFrame(tick)
  })

  onCleanup(() => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('touchmove', handleTouchMove)
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
            x="95%" y={lineY1()}
            dominant-baseline="auto"
            text-anchor="end"
            fill="white"
            font-family={FONT_FAMILY}
            font-weight="bold"
            style={{ 'font-size': `${fontSize()}px` }}
          >{TEXT_LINE1}</text>
          <text
            x="95%" y={lineY2()}
            dominant-baseline="auto"
            text-anchor="end"
            fill="white"
            font-family={FONT_FAMILY}
            font-weight="bold"
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
          x="95%" y={lineY1()}
          dominant-baseline="auto"
          text-anchor="end"
          class="fill-[#111827] stroke-[#2a2a2a] stroke-[1px] font-bold leading-none [vector-effect:non-scaling-stroke]"
          font-family={FONT_FAMILY}
          font-weight="bold"
          style={{ 'font-size': `${fontSize()}px` }}
        >{TEXT_LINE1}</text>
        <text
          x="95%" y={lineY2()}
          dominant-baseline="auto"
          text-anchor="end"
          class="fill-[#111827] stroke-[#2a2a2a] stroke-[1px] font-bold leading-none [vector-effect:non-scaling-stroke]"
          font-family={FONT_FAMILY}
          font-weight="bold"
          style={{ 'font-size': `${fontSize()}px` }}
        >{TEXT_LINE2}</text>
        <g ref={wrapperEl!} filter="url(#gooey)" mask="url(#text)" class="js-wrapper" />
      </svg>
      <div ref={cursorEl!} class="cursor js-cursor" />
    </div>
  )
}