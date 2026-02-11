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
  let dpr = 1

  const layout = () => {
    const nw = window.innerWidth
    const nh = window.innerHeight
    dpr = window.devicePixelRatio || 1
    
    // Fix Safari Blur: Set canvas internal dimensions based on DPR
    canvasRef.width = nw * dpr
    canvasRef.height = nh * dpr
    // Canvas style remains 100% via Tailwind

    const baseHeight = 1000
    const dynamicWidth = (nw / nh) * baseHeight
    svgRef.setAttribute('viewBox', `0 0 ${dynamicWidth} ${baseHeight}`)

    const isMobile = nw < 768
    const tspans = textRef.querySelectorAll('tspan');

    let fontSize: number;
    let targetX: number;
    let textAnchor: string;

    if (isMobile) {
      fontSize = Math.min(dynamicWidth * 0.18, 160); 
      targetX = dynamicWidth / 2;
      textAnchor = "middle";
      gsap.set(textRef, { attr: { y: 350 } });
      tspans.forEach(tspan => gsap.set(tspan, { attr: { x: targetX, dy: "1.1em" } }));
    } else {
      fontSize = 280 + (nw > 1400 ? (nw - 1400) * 0.05 : 0);
      fontSize = Math.min(fontSize, 350); 
      const padding = dynamicWidth * 0.06;
      targetX = dynamicWidth - padding;
      textAnchor = "end";
      gsap.set(textRef, { attr: { y: 450 } });
      tspans.forEach(tspan => gsap.set(tspan, { attr: { x: targetX, dy: "1em" } }));
    }

    gsap.set(textRef, { 
      attr: { x: targetX, "font-size": fontSize, "text-anchor": textAnchor } 
    });
  }

  // --- Physics & Draw (DPR adjusted) ---
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
    particleCnt += 1.5
  }

  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Scale context for Retina
    ctx.clearRect(0, 0, canvasRef.width / dpr, canvasRef.height / dpr)
    
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; 
      p.x += p.vx + Math.cos((time + p.seed) * 0.01) * 0.5; 
      p.y += p.vy + Math.sin((time + p.seed) * 0.01) * 0.5
      p.vx *= PARTICLE_VEL_DECAY; p.vy *= PARTICLE_VEL_DECAY; p.size *= PARTICLE_DECAY
      if (p.size < 0.5) { particles.splice(i, 1); continue }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.fill()
    }
  }

  onMount(() => {
    const ctx = canvasRef.getContext('2d', { alpha: true })!
    const onResize = () => layout()
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      mouse.vx += mouse.x - touch.clientX; mouse.vy += mouse.y - touch.clientY
      mouse.x = touch.clientX; mouse.y = touch.clientY
    }
    const onMouseMove = (e: MouseEvent) => {
      mouse.vx += mouse.x - e.clientX; mouse.vy += mouse.y - e.clientY
      mouse.x = e.clientX; mouse.y = e.clientY
    }
    
    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    
    layout()
    rafId = requestAnimationFrame(function tick(time) {
      updatePhysics(time, window.innerWidth, window.innerHeight)
      draw(ctx, time)
      rafId = requestAnimationFrame(tick)
    })

    onCleanup(() => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
    })
  })

  return (
    <div class="fixed inset-0 overflow-hidden bg-[linear-gradient(to_top,#213f6d,#2a4198)] ">
        {/* The "Gooey" filter container */}
        <div 
            class="absolute inset-0 w-full h-full"
            style={{ 
                filter: 'url(#goo)', 
                "-webkit-filter": 'url(#goo)',
                "mix-blend-mode": "lighten" // Better for Safari hardware acceleration
            }}
        >
            <canvas 
                ref={canvasRef} 
                class="absolute inset-0 w-full h-full opacity-90" 
                style={{ filter: 'blur(12px)', "-webkit-filter": 'blur(12px)' }}
            />
        </div>

        {/* The Text as an exclusion layer */}
        <svg ref={svgRef} class="absolute inset-0 w-full h-full">
            <defs>
                {/* Standard SVG Gooey Filter - most compatible across mobile */}
                <filter id="goo">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
                    <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                </filter>
                
                {/* Clipping logic: instead of CSS mask, we use the SVG mask strictly inside SVG */}
                <mask id="safari-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <text 
                        ref={textRef} 
                        fill="black" 
                        font-weight="900" 
                        font-family="Inter, sans-serif"
                        style={{ "letter-spacing": "-0.04em" }}
                    >
                        FLOAT
                        <tspan x="0" dy="1em">CAPITAL</tspan>
                    </text>
                </mask>
            </defs>
            
            {/* This rect acts as a "curtain" with the text cut out */}
            <rect 
                width="100%" height="100%" 
                fill="#0a0a0a" 
                mask="url(#safari-mask)" 
                class="pointer-events-none"
            />
        </svg>
    </div>
  )
}