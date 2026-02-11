import { onMount, onCleanup } from 'solid-js'

// --- 物理常数 ---
const VELOCITY_DECAY = 0.85
const PARTICLE_VEL_DECAY = 0.95
const PARTICLE_DECAY = 0.97
const SMOOTH_FACTOR = 0.1
const MAX_PARTICLES = 150

// --- 预设颜色 ---
const COLORS = ['#ffba00', '#2a4198', '#ffffff']

export default function CanvasGooey() {
  let canvasRef!: HTMLCanvasElement
  
  // 离屏 Canvas 用于生成带 Gooey 效果的粒子
  const offscreenCanvas = document.createElement('canvas')
  const octx = offscreenCanvas.getContext('2d', { alpha: true })!

  let particles: any[] = []
  let mouse = { x: 0, y: 0, sx: 0, sy: 0, vx: 0, vy: 0, svx: 0, svy: 0 }
  let head = { x: 0, y: 0, vx: 0, vy: 0 }
  let particleCnt = 0
  let rafId = 0
  let dpr = 1

  let textConfig = { fontSize: 0, x: 0, y: 0, align: 'center' as CanvasTextAlign }

  const layout = () => {
    const nw = window.innerWidth
    const nh = window.innerHeight
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    
    canvasRef.width = offscreenCanvas.width = nw * dpr
    canvasRef.height = offscreenCanvas.height = nh * dpr

    const isMobile = nw < 768
    if (isMobile) {
      textConfig.fontSize = Math.min(nw * 0.22, 90) * dpr
      textConfig.x = (nw / 2) * dpr
      textConfig.y = (nh * 0.45) * dpr
      textConfig.align = 'center'
    } else {
      textConfig.fontSize = Math.min(220 + (nw - 1400) * 0.05, 300) * dpr
      textConfig.x = (nw * 0.92) * dpr
      textConfig.y = (nh * 0.5) * dpr
      textConfig.align = 'right'
    }
  }

  const spawn = (x: number, y: number, vx: number, vy: number, size: number) => {
    if (size < 1 || particles.length > MAX_PARTICLES) return
    
    // 随机选择你指定的三个颜色之一
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    
    particles.push({ 
      x, y, vx, vy, 
      size, 
      color, 
      seed: Math.random() * 1000 
    })
    particleCnt++
  }

  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    const { width, height } = canvasRef

    // --- 1. 离屏 Canvas: 绘制 Gooey 粒子 ---
    octx.clearRect(0, 0, width, height)
    octx.save()
    // 关键：Gooey 滤镜处理
    octx.filter = 'blur(15px) contrast(25)' 
    
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.x += p.vx + Math.cos((time + p.seed) * 0.01) * 0.5
      p.y += p.vy + Math.sin((time + p.seed) * 0.01) * 0.5
      p.vx *= PARTICLE_VEL_DECAY
      p.vy *= PARTICLE_VEL_DECAY
      p.size *= PARTICLE_DECAY

      if (p.size < 0.8) {
        particles.splice(i, 1)
        continue
      }

      octx.beginPath()
      octx.arc(p.x * dpr, p.y * dpr, p.size * dpr, 0, Math.PI * 2)
      octx.fillStyle = p.color
      octx.fill()
    }
    octx.restore()

    // --- 2. 主画布合成 ---
    ctx.clearRect(0, 0, width, height)

    const drawText = () => {
      ctx.font = `900 ${textConfig.fontSize}px Inter, system-ui, sans-serif`
      ctx.textAlign = textConfig.align
      ctx.textBaseline = 'middle'
      const lines = ["FLOAT", "CAPITAL"]
      lines.forEach((line, i) => {
        ctx.fillText(line, textConfig.x, textConfig.y + (i * textConfig.fontSize * 0.95))
      })
    }

    // A. 绘制黑色底色文字（默认镂空效果）
    ctx.save()
    ctx.fillStyle = '#000000'
    drawText()
    ctx.restore()

    // B. 将粒子“剪切”并“覆盖”在黑色文字上
    // source-atop: 只在现有内容（黑色文字）上绘制，且保留文字范围以外的透明
    ctx.save()
    ctx.globalCompositeOperation = 'source-atop'
    ctx.drawImage(offscreenCanvas, 0, 0)
    ctx.restore()
  }

  onMount(() => {
    const ctx = canvasRef.getContext('2d', { alpha: true })!
    
    const updateMouse = (nx: number, ny: number) => {
      mouse.vx = (mouse.x - nx) * 0.5; mouse.vy = (mouse.y - ny) * 0.5
      mouse.x = nx; mouse.y = ny
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
      // 鼠标逻辑
      mouse.sx += (mouse.x - mouse.sx) * SMOOTH_FACTOR
      mouse.sy += (mouse.y - mouse.sy) * SMOOTH_FACTOR
      mouse.svx += (mouse.vx - mouse.svx) * SMOOTH_FACTOR
      mouse.svy += (mouse.vy - mouse.svy) * SMOOTH_FACTOR
      
      const mDiff = Math.hypot(mouse.x - mouse.sx, mouse.y - mouse.sy)
      if (mDiff > 1) {
        spawn(mouse.sx, mouse.sy, -mouse.svx, -mouse.svy, mDiff * 0.4)
      } else {
        // 自动浮动游走逻辑
        const sw = window.innerWidth, sh = window.innerHeight
        const tx = sw * 0.5 + sw * 0.3 * Math.cos(time * 0.001)
        const ty = sh * 0.5 + sh * 0.2 * Math.sin(time * 0.0008)
        spawn(tx, ty, Math.cos(time * 0.01) * 2, Math.sin(time * 0.01) * 2, 25)
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