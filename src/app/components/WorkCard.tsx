import { animate } from 'animejs'
import { useRef, useState } from 'react'

import type { Project } from '../../data/site'
import { cx } from '../lib/cx'
import { prefersReduced } from '../lib/reduced'
import { Parallax, useInViewOnce } from './motion'

export function WorkCard({ project, index = 0 }: { project: Project; index?: number }) {
  const link = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const wrapper = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState(false)

  useInViewOnce(wrapper, () => {
    const el = wrapper.current
    if (!el) return
    animate(el, {
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 900,
      delay: (index % 2) * 100,
      ease: 'outQuart',
    })
  })

  /* The label follows the pointer: anime.js eases left/top, which leaves the
     transform free for the hover scale. */
  const place = (event: React.MouseEvent, instantly = false) => {
    const rect = link.current?.getBoundingClientRect()
    const el = label.current
    if (!rect || !el) return
    const left = event.clientX - rect.left
    const top = event.clientY - rect.top
    // Entering the card should not sweep in from the corner it last left.
    if (instantly) {
      el.style.left = `${left}px`
      el.style.top = `${top}px`
      return
    }
    animate(el, { left, top, duration: 300, ease: 'outCubic' })
  }

  return (
    <div
      ref={wrapper}
      className={cx(project.size === 'large' ? 'md:col-span-2' : 'md:col-span-1')}
      style={prefersReduced() ? undefined : { opacity: 0, transform: 'translateY(30px)' }}
    >
      <div
        ref={link}
        className="group relative block"
        onMouseEnter={(event) => {
          setHover(true)
          place(event, true)
        }}
        onMouseLeave={() => setHover(false)}
        onMouseMove={(event) => place(event)}
      >
        <div className={cx('relative overflow-hidden rounded-image', project.size === 'large' ? 'aspect-[16/10]' : 'aspect-[4/5] md:aspect-[4/4.6]')} style={{ background: project.tint }}>
          <div className="absolute inset-0 transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]">
            <Parallax src={project.cover} alt={project.title} className="size-full" strength={6} />
          </div>
          <span
            ref={label}
            aria-hidden
            style={{ translate: '-50% -50%' }}
            className={cx(
              'pointer-events-none absolute left-0 top-0 hidden items-center rounded-[14px] bg-fg px-4 py-2.5 text-[14px] font-medium text-bg transition-[opacity,scale] duration-300 md:flex',
              hover ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
            )}
          >
            View project
          </span>
        </div>
        <div className="mt-4 flex items-baseline justify-between gap-4">
          <h3 className="font-display text-[28px] sm:text-[32px]">{project.title}</h3>
          <p className="shrink-0 text-[14px] text-muted">
            {project.category}
            <span className="ml-3 tabular-nums text-faint">{project.year}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
