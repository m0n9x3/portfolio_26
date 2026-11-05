import { animate } from 'animejs'
import { useEffect, useRef, useState } from 'react'

import { site } from '../../data/site'
import { prefersReduced } from '../lib/reduced'

// A short counted reveal on first visit per tab. Everything is skipped when
// the user prefers reduced motion.
export function Preloader() {
  const [show, setShow] = useState(() => typeof window !== 'undefined' && !prefersReduced() && !sessionStorage.getItem('preloaded'))
  const [count, setCount] = useState(0)
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!show) return
    document.body.style.overflow = 'hidden'

    const counter = { value: 0 }
    const counting = animate(counter, {
      value: 100,
      duration: 1100,
      ease: 'inOutQuad',
      onUpdate: () => setCount(Math.round(counter.value)),
    })

    const name = panel.current?.querySelector<HTMLElement>('[data-preload-name]')
    const rising = name
      ? animate(name, { opacity: [0, 1], translateY: [10, 0], duration: 500, delay: 100, ease: 'outQuart' })
      : null

    const timer = window.setTimeout(() => {
      sessionStorage.setItem('preloaded', '1')
      const curtain = panel.current
      if (!curtain) {
        setShow(false)
        return
      }
      animate(curtain, { translateY: ['0%', '-100%'], duration: 800, ease: 'inOutQuart', onComplete: () => setShow(false) })
    }, 1500)

    return () => {
      counting.pause()
      rising?.pause()
      window.clearTimeout(timer)
      document.body.style.overflow = ''
    }
  }, [show])

  if (!show) return null

  return (
    <div ref={panel} className="fixed inset-0 z-[100] flex items-end justify-between bg-fg p-6 text-bg sm:p-10">
      <p data-preload-name className="font-display text-[28px] sm:text-[40px]">
        {site.name}
      </p>
      <p className="font-display tabular-nums text-[80px] leading-none sm:text-[140px]">{count}</p>
    </div>
  )
}
