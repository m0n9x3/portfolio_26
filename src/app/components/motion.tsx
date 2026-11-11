import { animate, stagger } from 'animejs'
import { useEffect, useRef, type ReactNode } from 'react'

import { cx } from '../lib/cx'
import { prefersReduced } from '../lib/reduced'

/* Motion primitives, all on anime.js. The resting state is the plain CSS
   state, so a reduced-motion visitor simply sees the page: the effects only
   ever set the start values themselves. */

/** Runs `onEnter` once when the element first comes into view. */
export function useInViewOnce(
  ref: React.RefObject<HTMLElement | null>,
  onEnter: () => void,
  margin = '0px 0px -8% 0px',
) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReduced()) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        onEnter()
      },
      { rootMargin: margin },
    )
    observer.observe(el)
    return () => observer.disconnect()
    // The callback is recreated per render; the observer only needs the node.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/**
 * Lines of text that rise out of a mask, one after another. The wrapper is
 * what gets observed: a line translated out of its overflow-hidden mask has
 * no visible area, so observing the line itself would never fire.
 */
export function Lines({
  lines,
  className,
  delay = 0,
  as: Tag = 'h1',
}: {
  lines: ReactNode[]
  className?: string
  delay?: number
  as?: 'h1' | 'h2' | 'p'
}) {
  const ref = useRef<HTMLHeadingElement>(null)

  useInViewOnce(ref, () => {
    const spans = ref.current?.querySelectorAll<HTMLElement>('[data-line]')
    if (!spans?.length) return
    animate(spans, {
      translateY: ['110%', '0%'],
      duration: 1000,
      delay: stagger(100, { start: delay * 1000 }),
      ease: 'outQuart',
    })
  }, '0px 0px -5% 0px')

  return (
    <Tag ref={ref} className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
          <span data-line className="block">
            {line}
          </span>
        </span>
      ))}
    </Tag>
  )
}

export function Reveal({
  children,
  delay = 0,
  className,
  y = 24,
  scale = 1,
  style: extra,
}: {
  children: ReactNode
  delay?: number
  className?: string
  y?: number
  scale?: number
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)

  useInViewOnce(ref, () => {
    const el = ref.current
    if (!el) return
    animate(el, {
      opacity: [0, 1],
      translateY: [y, 0],
      scale: [scale, 1],
      duration: 900,
      delay: delay * 1000,
      ease: 'outQuart',
      onComplete: () => {
        if (scale !== 1) el.style.transform = 'none'
      },
    })
  })

  // Start hidden only when the effect above will actually move it.
  const hidden =
    typeof window !== 'undefined' && !prefersReduced()
      ? { opacity: 0, transform: `translateY(${y}px) scale(${scale})` }
      : undefined

  return (
    <div ref={ref} className={className} style={{ ...extra, ...hidden }}>
      {children}
    </div>
  )
}

/** An image that drifts slightly slower than the page while it scrolls past. */
export function Parallax({
  src,
  alt,
  className,
  strength = 8,
  srcSet,
  sizes,
  width,
  height,
}: {
  src: string
  alt: string
  className?: string
  strength?: number
  srcSet?: string
  sizes?: string
  width?: number
  height?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = ref.current
    const image = host?.querySelector('img')
    if (!host || !image || prefersReduced()) return

    let frame = 0
    const update = () => {
      frame = 0
      const rect = host.getBoundingClientRect()
      const viewport = window.innerHeight
      const progress = Math.min(Math.max((viewport - rect.top) / (viewport + rect.height), 0), 1)
      const shift = (0.5 - progress) * 2 * strength
      image.style.transform = `translate3d(0, ${shift.toFixed(2)}%, 0) scale(1.12)`
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    update()
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [strength])

  return (
    <div ref={ref} className={cx('image-frame relative', className)}>
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        width={width}
        height={height}
        alt={alt}
        className="absolute inset-0 size-full scale-[1.12] object-cover"
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}

