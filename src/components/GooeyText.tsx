import { onMount, onCleanup } from 'solid-js'

// --- 物理常数 ---
const PARTICLE_VEL_DECAY = 0.95
const PARTICLE_DECAY = 0.97
const SMOOTH_FACTOR = 0.1
const MAX_PARTICLES = 150

// --- 颜色调色板 (RGB) ---
const PALETTE: [number, number, number][] = [
  [255, 186, 0],    // #ffba00  金
  [80, 120, 220],   // 过渡蓝
  [42, 65, 152],    // #2a4198  蓝
  [148, 160, 205],  // 过渡淡蓝
]

const lerpColor = (t: number): string => {
  const len = PALETTE.length
  const i = ((t % len) + len) % len
  const idx = Math.floor(i)
  const frac = i - idx
  const c0 = PALETTE[idx]
  const c1 = PALETTE[(idx + 1) % len]
  const s = frac * frac * (3 - 2 * frac)
  return `rgb(${c0[0] + (c1[0] - c0[0]) * s | 0},${c0[1] + (c1[1] - c0[1]) * s | 0},${c0[2] + (c1[2] - c0[2]) * s | 0})`
}

interface Particle {
  x: number; y: number
  vx: number; vy: number
  size: number
  color: string
  seed: number
  // 低分辨率坐标缓存，避免 draw 中重复计算
  lx: number; ly: number; lr: number
}

export default function CanvasGooey() {
  let canvasRef!: HTMLCanvasElement

  // rawCanvas: 低分辨率黑色圆 → 用于生成 gooey 形状蒙版
  const rawCanvas = document.createElement('canvas')
  const rctx = rawCanvas.getContext('2d', { alpha: true })!

  // maskCanvas: blur(rawCanvas) + alpha 阈值 → 最终 gooey 蒙版
  const maskCanvas = document.createElement('canvas')
  const mctx = maskCanvas.getContext('2d', { alpha: true })!

  // colorCanvas: 低分辨率彩色粒子 → 被蒙版裁剪后显示颜色
  const colorCanvas = document.createElement('canvas')
  const cctx = colorCanvas.getContext('2d', { alpha: true })!

  // textCanvas: 缓存文字，仅在 resize 时重绘
  const textCanvas = document.createElement('canvas')
  const tctx = textCanvas.getContext('2d', { alpha: true })!

  const pool: Particle[] = []
  const particles: Particle[] = []

  let mouse = { x: 0, y: 0, sx: 0, sy: 0, vx: 0, vy: 0, svx: 0, svy: 0 }
  let rafId = 0
  let dpr = 1
  let screenW = 0
  let screenH = 0

  // 提高到 0.5（半分辨率），边缘更清晰
  const SCALE = 0.5

  let textConfig = { fontSize: 0, x: 0, y: 0, align: 'center' as CanvasTextAlign }
  let blurPx = 8

  const cacheText = () => {
    const w = screenW * dpr
    const h = screenH * dpr
    textCanvas.width = w
    textCanvas.height = h
    tctx.clearRect(0, 0, w, h)
    tctx.font = `900 ${textConfig.fontSize}px Inter, system-ui, sans-serif`
    tctx.textAlign = textConfig.align
    tctx.textBaseline = 'middle'
    tctx.fillStyle = '#000000'
    const lines = ['FLOAT', 'CAPITAL']
    for (let i = 0; i < lines.length; i++) {
      tctx.fillText(lines[i], textConfig.x, textConfig.y + i * textConfig.fontSize * 0.95)
    }
  }

  const layout = () => {
    screenW = window.innerWidth
    screenH = window.innerHeight
    dpr = Math.min(window.devicePixelRatio || 1, 2)

    const fw = screenW * dpr
    const fh = screenH * dpr
    canvasRef.width = fw
    canvasRef.height = fh

    const lw = Math.ceil(fw * SCALE)
    const lh = Math.ceil(fh * SCALE)
    rawCanvas.width = lw
    rawCanvas.height = lh
    maskCanvas.width = lw
    maskCanvas.height = lh
    colorCanvas.width = lw
    colorCanvas.height = lh

    // blur 等效原始 15 CSS px
    blurPx = Math.round(15 * dpr * SCALE)

    const isMobile = screenW < 768
    if (isMobile) {
      textConfig.fontSize = Math.min(screenW * 0.22, 90) * dpr
      textConfig.x = (screenW / 2) * dpr
      textConfig.y = (screenH * 0.45) * dpr
      textConfig.align = 'center'
    } else {
      textConfig.fontSize = Math.min(220 + (screenW - 1400) * 0.05, 300) * dpr
      textConfig.x = (screenW * 0.92) * dpr
      textConfig.y = (screenH * 0.5) * dpr
      textConfig.align = 'right'
    }

    cacheText()
  }

  const spawn = (x: number, y: number, vx: number, vy: number, size: number, time: number) => {
    if (size < 1 || particles.length >= MAX_PARTICLES) return

    const colorT = (time * 0.0008 + Math.random() * 2) % PALETTE.length
    const color = lerpColor(colorT)

    if (pool.length > 0) {
      const p = pool.pop()!
      p.x = x; p.y = y; p.vx = vx; p.vy = vy
      p.size = size; p.color = color; p.seed = Math.random() * 1000
      p.lx = 0; p.ly = 0; p.lr = 0
      particles.push(p)
    } else {
      particles.push({ x, y, vx, vy, size, color, seed: Math.random() * 1000, lx: 0, ly: 0, lr: 0 })
    }
  }

  const TAU = Math.PI * 2

  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    const fw = canvasRef.width
    const fh = canvasRef.height
    const lw = rawCanvas.width
    const lh = rawCanvas.height
    const s = dpr * SCALE

    // --- 步骤 1: 更新粒子 + 绘制黑色圆到 rawCanvas（蒙版源）---
    rctx.clearRect(0, 0, lw, lh)

    let writeIdx = 0
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      const ts = (time + p.seed) * 0.01
      p.x += p.vx + Math.cos(ts) * 0.5
      p.y += p.vy + Math.sin(ts) * 0.5
      p.vx *= PARTICLE_VEL_DECAY
      p.vy *= PARTICLE_VEL_DECAY
      p.size *= PARTICLE_DECAY

      if (p.size < 0.8) {
        pool.push(p)
        continue
      }

      // 缓存低分辨率坐标
      p.lx = p.x * s
      p.ly = p.y * s
      p.lr = p.size * s

      // 黑色圆 — blur 黑色不可能产生白色
      rctx.beginPath()
      rctx.arc(p.lx, p.ly, p.lr, 0, TAU)
      rctx.fillStyle = '#000'
      rctx.fill()

      particles[writeIdx++] = p
    }
    particles.length = writeIdx

    // --- 步骤 2: blur rawCanvas → maskCanvas，然后做 alpha 软阈值 ---
    mctx.clearRect(0, 0, lw, lh)
    mctx.save()
    mctx.filter = `blur(${blurPx}px)`
    mctx.drawImage(rawCanvas, 0, 0)
    mctx.restore()

    // 软阈值：[LO, HI] 线性映射到 [0, 255]，避免硬边锯齿
    const imgData = mctx.getImageData(0, 0, lw, lh)
    const d = imgData.data
    const LO = 30, HI = 110, RANGE = HI - LO
    for (let i = 3; i < d.length; i += 4) {
      const a = d[i]
      d[i] = a <= LO ? 0 : a >= HI ? 255 : ((a - LO) / RANGE * 255) | 0
    }
    mctx.putImageData(imgData, 0, 0)

    // --- 步骤 3: 绘制彩色粒子到 colorCanvas ---
    cctx.clearRect(0, 0, lw, lh)
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      cctx.beginPath()
      cctx.arc(p.lx, p.ly, p.lr, 0, TAU)
      cctx.fillStyle = p.color
      cctx.fill()
    }

    // --- 步骤 4: 用 gooey 蒙版裁剪彩色粒子 ---
    cctx.save()
    cctx.globalCompositeOperation = 'destination-in'
    cctx.drawImage(maskCanvas, 0, 0)
    cctx.restore()

    // --- 步骤 4.5: 朦胧模糊 — 复用 rawCanvas，在低分辨率下 blur 开销极小 ---
    rctx.clearRect(0, 0, lw, lh)
    rctx.save()
    rctx.filter = `blur(${Math.round(3 * dpr)}px)`
    rctx.drawImage(colorCanvas, 0, 0)
    rctx.restore()

    // --- 步骤 5: 合成到主画布 ---
    ctx.clearRect(0, 0, fw, fh)
    ctx.drawImage(textCanvas, 0, 0)
    ctx.save()
    ctx.globalCompositeOperation = 'source-atop'
    ctx.drawImage(rawCanvas, 0, 0, lw, lh, 0, 0, fw, fh)
    ctx.restore()
  }

  onMount(() => {
    const ctx = canvasRef.getContext('2d', { alpha: true })!

    const updateMouse = (nx: number, ny: number) => {
      mouse.vx = (mouse.x - nx) * 0.5
      mouse.vy = (mouse.y - ny) * 0.5
      mouse.x = nx
      mouse.y = ny
    }

    const onMouseMove = (e: MouseEvent) => updateMouse(e.clientX, e.clientY)
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) updateMouse(e.touches[0].clientX, e.touches[0].clientY)
    }

    window.addEventListener('resize', layout)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchmove', onTouchMove, { passive: true })

    layout()

    const tick = (time: number) => {
      mouse.sx += (mouse.x - mouse.sx) * SMOOTH_FACTOR
      mouse.sy += (mouse.y - mouse.sy) * SMOOTH_FACTOR
      mouse.svx += (mouse.vx - mouse.svx) * SMOOTH_FACTOR
      mouse.svy += (mouse.vy - mouse.svy) * SMOOTH_FACTOR

      const mDiff = Math.hypot(mouse.x - mouse.sx, mouse.y - mouse.sy)
      if (mDiff > 1) {
        spawn(mouse.sx, mouse.sy, -mouse.svx, -mouse.svy, mDiff * 0.4, time)
      } else {
        const tx = screenW * 0.5 + screenW * 0.3 * Math.cos(time * 0.001)
        const ty = screenH * 0.5 + screenH * 0.2 * Math.sin(time * 0.0008)
        spawn(tx, ty, Math.cos(time * 0.01) * 2, Math.sin(time * 0.01) * 2, 25, time)
      }

      draw(ctx, time)
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    onCleanup(() => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', layout)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
    })
  })

  return (
    <div class="fixed inset-0 overflow-hidden bg-[linear-gradient(to_top,#213f6d,#2a4198)]">
      <canvas
        ref={canvasRef}
        class="block w-full h-full pointer-events-none"
        style={{ "will-change": "transform" }}
      />
    </div>
  )
}
