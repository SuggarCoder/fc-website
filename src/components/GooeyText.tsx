import { onMount, onCleanup } from 'solid-js'
import gsap from 'gsap'

const VELOCITY_DECAY = 0.85
const PARTICLE_VEL_DECAY = 0.95
const PARTICLE_DECAY = 0.98
const SMOOTH_FACTOR = 0.1

export default function CanvasGooey() {
  let canvasRef!: HTMLCanvasElement
  let textRef!: SVGTextElement
  let svgRef!: SVGSVGElement

  let particles: any[] = []
  let mouse = { x: 0, y: 0, sx: 0, sy: 0, vx: 0, vy: 0, svx: 0, svy: 0 }
  let head = { x: 0, y: 0, vx: 0, vy: 0 }
  let particleCnt = 0
  let rafId = 0

  const layout = () => {
    const nw = window.innerWidth
    const nh = window.innerHeight
    canvasRef.width = nw
    canvasRef.height = nh

    const baseHeight = 1000
    const dynamicWidth = (nw / nh) * baseHeight
    svgRef.setAttribute('viewBox', `0 0 ${dynamicWidth} ${baseHeight}`)

    const isMobile = nw < 640 || nw < nh; // 判断是否为手机或竖屏
    const tspans = textRef.querySelectorAll('tspan');

    let fontSize: number;
    let targetX: number;
    let textAnchor: string;

    if (isMobile) {
      // --- 手机端逻辑：居中垂直排列 ---
      fontSize = Math.min(dynamicWidth * 0.2, 180); 
      targetX = dynamicWidth / 2; // 水平居中
      textAnchor = "middle";
      
      gsap.set(textRef, { attr: { y: 400 } }); // 稍微上移
      tspans.forEach(tspan => {
        gsap.set(tspan, { attr: { x: targetX, dy: "1.2em" } });
      });
    } else {
      // --- 大屏幕逻辑：靠右排列，字号随宽度增加 ---
      // 这里的逻辑是：基础 180px + 宽度溢出部分的加成
      fontSize = 280 + (nw > 1400 ? (nw - 1400) * 0.05 : 0);
      fontSize = Math.min(fontSize, 350); // 设置上限防止溢出
      
      const padding = dynamicWidth * 0.06;
      targetX = dynamicWidth - padding;
      textAnchor = "end";

      gsap.set(textRef, { attr: { y: 450 } });
      tspans.forEach(tspan => {
        gsap.set(tspan, { attr: { x: targetX, dy: "1em" } });
      });
    }

    gsap.set(textRef, { 
      attr: { 
        x: targetX, 
        "font-size": fontSize,
        "text-anchor": textAnchor 
      } 
    });
  }

  const entranceAnimation = () => {
    const tspans = textRef.querySelectorAll('tspan');
    const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 1.8 } });
    
    tl.fromTo(textRef, 
      { opacity: 0, attr: { y: window.innerWidth < window.innerHeight ? 300 : 550 } }, 
      { opacity: 1, attr: { y: window.innerWidth < window.innerHeight ? 400 : 450 }, delay: 0.3 }
    )
    .fromTo(tspans, 
      { opacity: 0, y: 50 }, 
      { opacity: 1, y: 0, stagger: 0.2 }, 
      "-=1.4"
    );
  }

  // --- 物理与绘制逻辑 (保持不变) ---
  const updatePhysics = (time: number, width: number, height: number) => {
    mouse.sx += (mouse.x - mouse.sx) * SMOOTH_FACTOR; mouse.sy += (mouse.y - mouse.sy) * SMOOTH_FACTOR
    mouse.svx += (mouse.vx - mouse.svx) * SMOOTH_FACTOR; mouse.svy += (mouse.vy - mouse.svy) * SMOOTH_FACTOR
    mouse.vx *= VELOCITY_DECAY; mouse.vy *= VELOCITY_DECAY
    const oldHx = head.x, oldHy = head.y
    head.x = width * 0.5 + width * 0.35 * Math.cos(time * 0.0008)
    head.y = height * 0.5 + width * 0.15 * Math.cos(time * 0.0013)
    head.vx = oldHx - head.x; head.vy = oldHy - head.y
    const diff = Math.hypot(mouse.x - mouse.sx, mouse.y - mouse.sy)
    if (diff > 0.1) spawn(mouse.sx, mouse.sy, -mouse.svx * 0.25, -mouse.svy * 0.25, diff * 0.25)
    else spawn(head.x, head.y, head.vx * 2, head.vy * 2, Math.hypot(head.vx, head.vy) * 15 + 25)
  }

  const spawn = (x: number, y: number, vx: number, vy: number, size: number) => {
    if (size < 1) return
    particles.push({ x, y, vx, vy, size, color: `hsl(${particleCnt % 360}, 100%, 50%)`, seed: Math.random() * 1000 })
    particleCnt += 2
  }

  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.x += p.vx + Math.cos((time + p.seed) * 0.01) * 0.5; p.y += p.vy + Math.sin((time + p.seed) * 0.01) * 0.5
      p.vx *= PARTICLE_VEL_DECAY; p.vy *= PARTICLE_VEL_DECAY; p.size *= PARTICLE_DECAY
      if (p.size < 1) { particles.splice(i, 1); continue }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.fill()
    }
  }

  onMount(() => {
    const ctx = canvasRef.getContext('2d')!
    const onResize = () => layout()
    const onMouseMove = (e: MouseEvent) => {
      mouse.vx += mouse.x - e.clientX; mouse.vy += mouse.y - e.clientY
      mouse.x = e.clientX; mouse.y = e.clientY
    }
    const tick = (time: number) => {
      updatePhysics(time, canvasRef.width, canvasRef.height); draw(ctx, time); rafId = requestAnimationFrame(tick)
    }
    window.addEventListener('resize', onResize); window.addEventListener('mousemove', onMouseMove)
    layout(); entranceAnimation(); rafId = requestAnimationFrame(tick)
    onCleanup(() => { cancelAnimationFrame(rafId); window.removeEventListener('resize', onResize); window.removeEventListener('mousemove', onMouseMove) })
  })

  return (
    <div class="fixed inset-0 overflow-hidden bg-[linear-gradient(to_top,#1a365d,#2a4365)]">
      <div
        class="absolute inset-0"
        style={{
          "mask-image": 'url(#text-mask)', "-webkit-mask-image": 'url(#text-mask)',
          "mask-type": 'luminance', "-webkit-mask-type": 'luminance'
        }}
      >
        <div class="absolute inset-0 bg-dark" />
        <canvas ref={canvasRef} class="absolute inset-0 w-full h-full blur-[14px] contrast-[22]" />
      </div>

      <svg ref={svgRef} class="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="text-mask" maskUnits="userSpaceOnUse">
            <rect width="100%" height="100%" fill="black" />
            <text 
              ref={textRef} 
              fill="white" 
              font-weight="900" 
              font-family="Inter, system-ui, sans-serif"
              style={{ "letter-spacing": "-0.04em" }}
            >
              FLOAT
              <tspan x="0" dy="1em">CAPITAL</tspan>
            </text>
          </mask>
        </defs>
      </svg>
    </div>
  )
}