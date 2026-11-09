import { useEffect, useRef } from 'react'

/* A glass lens that follows the pointer: it takes its tone from whatever it is
   over and swells on anything you can press. One behaviour everywhere — over
   text, pictures and the pool alike — with the refraction held in the rim,
   since a CSS backdrop can be tinted and lit but never bent or enlarged. */

const INTERACTIVE = 'a, button, [role="button"], summary, label, [data-glass-grow]'
const DARK = '[data-glass-dark]'

export function GlassCursor() {
  const host = useRef<HTMLDivElement>(null)
  const lens = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const hostEl = host.current
    const lensEl = lens.current
    if (!hostEl || !lensEl) return

    const fine = window.matchMedia('(pointer: fine)')
    const still = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!fine.matches || still.matches) return

    const root = document.documentElement
    root.dataset.glassCursor = 'on'

    let pointerX = window.innerWidth / 2
    let pointerY = window.innerHeight / 2
    let x = pointerX
    let y = pointerY
    let last = performance.now()
    let raf = 0

    /* A resize (or a rotation) can leave the lens outside the new viewport:
       it is fixed, so it never gets re-laid-out, and an off-screen fixed box
       widens the page. Pull it back to the middle and let the next pointermove
       take over from there. */
    const recenter = () => {
      if (x > window.innerWidth || y > window.innerHeight || x < 0 || y < 0) {
        pointerX = x = window.innerWidth / 2
        pointerY = y = window.innerHeight / 2
        hostEl.style.transform = `translate3d(${x}px, ${y}px, 0)`
        flag('visible', false)
      }
    }

    const flag = (key: 'visible' | 'hover' | 'press', on: boolean) => {
      const value = String(on)
      if (hostEl.dataset[key] !== value) hostEl.dataset[key] = value
    }

    hostEl.style.transform = `translate3d(${x}px, ${y}px, 0)`

    const tone = (el: Element | null) => {
      const next = el?.closest(DARK) ? 'on-dark' : 'light'
      if (lensEl.dataset.glass !== next) lensEl.dataset.glass = next
    }

    const onMove = (event: PointerEvent) => {
      pointerX = event.clientX
      pointerY = event.clientY
      const el = event.target instanceof Element ? event.target : null
      flag('visible', true)
      flag('hover', Boolean(el?.closest(INTERACTIVE)))
      tone(el)
    }

    const onDown = () => flag('press', true)
    const onUp = () => flag('press', false)
    const onLeave = () => flag('visible', false)
    const onEnter = () => flag('visible', true)
    const onBlur = () => flag('visible', false)

    const tick = (now: number) => {
      const dt = Math.min(now - last, 40)
      last = now
      /* Short, fixed catch-up: long enough to read as glass rather than a
         second cursor, short enough to still aim with. */
      const k = 1 - Math.exp(-dt / 30)
      x += (pointerX - x) * k
      y += (pointerY - y) * k
      hostEl.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('resize', recenter)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('pointercancel', onUp, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    document.addEventListener('pointerenter', onEnter)
    window.addEventListener('blur', onBlur)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', recenter)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('pointerenter', onEnter)
      window.removeEventListener('blur', onBlur)
      delete root.dataset.glassCursor
    }
  }, [])

  return (
    <div ref={host} className="glass-cursor" data-visible="false" aria-hidden>
      <div ref={lens} className="glass-lens" data-glass="light">
        <span className="glass-magnify" />
        <span className="glass-bevel" />
        <span className="glass-dispersion" />
      </div>
    </div>
  )
}
