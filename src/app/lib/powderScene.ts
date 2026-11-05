/**
 * Powder under the pointer, in the spirit of the "STIR" study on
 * aiforui.dev/lab: a stream function ψ(x, t) drives the grains through its
 * curl u = ∇ × ψ, and the pointer adds a drag on top of that, so moving the
 * cursor through the dust stirs it like water.
 *
 * The grains are one- to two-pixel squares: thousands of them need nothing
 * heavier than a 2D canvas, and the square edge is what reads as powder rather
 * than as dots. Two colours, deep blue and white, the blue first.
 */

type Options = { reducedMotion?: boolean }

type Grain = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  /** Index into PAINT, so a frame paints in four batches instead of thousands. */
  tone: number
}

/* Deep blue carries the field; a pale sky blue lifts it, and white is the dust
   catching the light. */
const PAINT = [
  'rgba(13, 44, 102, 0.3)',
  'rgba(13, 44, 102, 0.55)',
  'rgba(13, 44, 102, 0.85)',
  'rgba(120, 182, 222, 0.72)',
  'rgba(150, 205, 235, 0.55)',
  'rgba(255, 255, 255, 0.85)',
]

/* The grains arrive as one cloud and scatter, so the section opens with the
   sound of sand thrown across the floor rather than a static field. */
const BURST_SECONDS = 1.35

const STIR_RADIUS = 150
const MAX_DPR = 2

export function createPowderScene(canvas: HTMLCanvasElement, options: Options = {}) {
  const context = canvas.getContext('2d', { alpha: true })
  if (!context) return undefined
  /* Held in a second const: the narrowing above does not survive into the
     paint/step closures. */
  const ctx = context

  const reduced = !!options.reducedMotion
  const pointer = { x: 0, y: 0, vx: 0, vy: 0, last: 0, active: false, at: 0 }

  let width = 0
  let height = 0
  let dpr = 1
  let grains: Grain[] = []
  let frame = 0
  let timer = 0
  let last = 0
  let clock = 0
  let visible = true
  /* Seconds of burst still to run; 0 once the grains have scattered. */
  let intro = 0
  let scattered = false

  const random = (min: number, max: number) => min + Math.random() * (max - min)

  /* The field, in pixels per second: the curl of a two-term stream function,
     which gives the slow, folded flow of something drifting in water instead of
     a wind that pushes everything one way. */
  const flow = { x: 0, y: 0 }
  function sample(x: number, y: number) {
    const nx = x / width
    const ny = y / height
    const a = nx * 3 + clock * 0.11
    const b = ny * 2.2 - clock * 0.09
    const c = nx * 4.1 - ny * 2.7 + clock * 0.15
    const sa = Math.sin(a)
    const sb = Math.sin(b)
    const ca = Math.cos(a)
    const cb = Math.cos(b)
    const cc = Math.cos(c)
    const scale = width * 0.0075
    // ψ = sin a · cos b + 0.35 sin c  →  u = ∂ψ/∂y, v = −∂ψ/∂x
    flow.x = (-2.2 * sa * sb - 0.945 * cc) * scale
    flow.y = -(3 * ca * cb + 1.435 * cc) * scale
    return flow
  }

  function seed(burst: boolean) {
    const count = Math.round(Math.min(3000, Math.max(1200, (width * height) / 380)))
    grains = new Array(count)
    const cx = width / 2
    const cy = height / 2
    const spread = Math.min(width, height) * 0.2
    for (let i = 0; i < count; i += 1) {
      const roll = Math.random()
      const grain: Grain = {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: random(-4, 4),
        vy: random(-4, 4),
        size: random(1.1, 2.4),
        tone: roll < 0.2 ? 3 : roll < 0.32 ? 4 : roll < 0.48 ? 5 : roll < 0.68 ? 0 : roll < 0.88 ? 1 : 2,
      }
      if (burst) {
        // Tight cloud in the middle, every grain thrown outward on its own arc.
        const angle = Math.random() * Math.PI * 2
        const r = Math.sqrt(Math.random()) * spread
        // No slow tail: a grain that barely moves would stay behind as a lump
        // in the middle of the section.
        const speed = random(340, 1000) * (1.15 - (r / spread) * 0.45)
        grain.x = cx + Math.cos(angle) * r
        grain.y = cy + Math.sin(angle) * r * 0.72
        grain.vx = Math.cos(angle) * speed
        grain.vy = Math.sin(angle) * speed * 0.8
      }
      grains[i] = grain
    }
  }

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    for (let tone = 0; tone < PAINT.length; tone += 1) {
      ctx.fillStyle = PAINT[tone]
      ctx.beginPath()
      for (const g of grains) {
        if (g.tone !== tone) continue
        ctx.rect(g.x, g.y, g.size, g.size)
      }
      ctx.fill()
    }
  }

  function step(dt: number) {
    // While the cloud is still flying it keeps its momentum; the water only
    // takes over as it slows.
    const damping = Math.pow(intro > 0 ? 0.988 : 0.93, dt * 60)
    if (intro > 0) intro = Math.max(0, intro - dt)
    const stirred = pointer.active && performance.now() - pointer.at < 1600
    for (const g of grains) {
      const f = sample(g.x, g.y)
      // A little lift so the powder hangs in the air instead of settling.
      g.vx = (g.vx + f.x * dt) * damping
      g.vy = (g.vy + (f.y - 9) * dt) * damping

      if (stirred) {
        const dx = g.x - pointer.x
        const dy = g.y - pointer.y
        const d2 = dx * dx + dy * dy
        if (d2 < STIR_RADIUS * STIR_RADIUS) {
          const d = Math.sqrt(d2) + 0.001
          const fall = 1 - d / STIR_RADIUS
          const push = fall * fall * 420
          g.vx += ((dx / d) * push - (dy / d) * 130 * fall + pointer.vx * 1.7 * fall) * dt
          g.vy += ((dy / d) * push + (dx / d) * 130 * fall + pointer.vy * 1.7 * fall) * dt
        }
      }

      g.x += g.vx * dt
      g.y += g.vy * dt

      // Wrap with a margin so grains never pop in on the edge.
      if (g.x < -12) g.x = width + 12
      else if (g.x > width + 12) g.x = -12
      if (g.y < -12) g.y = height + 12
      else if (g.y > height + 12) g.y = -12
    }
  }

  function loop(now: number) {
    frame = 0
    if (!visible) return
    const dt = Math.min((now - (last || now)) / 1000, 1 / 20)
    last = now
    clock += dt
    step(dt)
    paint()
    frame = requestAnimationFrame(loop)
  }

  function resize() {
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const nextDpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    const changed = rect.width !== width || rect.height !== height
    width = rect.width
    height = rect.height
    dpr = nextDpr
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    if (changed || !grains.length) seed(!scattered && !reduced)
    if (reduced) {
      step(0.016)
      paint()
    }
  }

  const observer = new ResizeObserver(resize)
  observer.observe(canvas)

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const now = performance.now()
    if (pointer.last) {
      const span = Math.max(8, now - pointer.last) / 1000
      // Smoothed so one fast flick does not fling the field.
      pointer.vx = pointer.vx * 0.6 + ((x - pointer.x) / span) * 0.4
      pointer.vy = pointer.vy * 0.6 + ((y - pointer.y) / span) * 0.4
    }
    pointer.x = x
    pointer.y = y
    pointer.last = now
    pointer.at = now
    pointer.active = true
  }

  const onPointerLeave = () => {
    pointer.active = false
    pointer.last = 0
    pointer.vx = 0
    pointer.vy = 0
  }

  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frame)
      frame = 0
      clearTimeout(timer)
    } else if (visible && !reduced && !frame) {
      last = 0
      frame = requestAnimationFrame(loop)
    }
  }

  if (!reduced) {
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('pointerleave', onPointerLeave)
    document.addEventListener('visibilitychange', onVisibility)
    // One frame in, so the canvas has its measured size before the first paint.
    timer = window.setTimeout(() => {
      resize()
      last = 0
      frame = requestAnimationFrame(loop)
    }, 80)
  } else {
    resize()
  }

  /* The burst starts when the section is properly in view, not on the first
     pixel: the grains should scatter where the reader can see them land. */
  const burstObserver = new IntersectionObserver(
    (entries) => {
      if (!entries[0]?.isIntersecting || scattered) return
      scattered = true
      intro = BURST_SECONDS
      seed(true)
      burstObserver.disconnect()
    },
    { threshold: 0.45 },
  )
  if (!reduced) burstObserver.observe(canvas)

  const onIntersect = (entries: IntersectionObserverEntry[]) => {
    visible = entries[0]?.isIntersecting ?? true
    if (reduced) return
    if (visible) {
      if (!frame) {
        last = 0
        frame = requestAnimationFrame(loop)
      }
    } else {
      cancelAnimationFrame(frame)
      frame = 0
    }
  }
  const io = new IntersectionObserver(onIntersect, { rootMargin: '120px' })
  io.observe(canvas)

  return {
    dispose() {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
      observer.disconnect()
      io.disconnect()
      burstObserver.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      grains = []
    },
  }
}
