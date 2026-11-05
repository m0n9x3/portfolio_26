import { animate } from 'animejs'
import { ArrowUpRight, Plus } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'

import { projects, services, site, testimonials } from '../../data/site'
import { Hero } from '../components/Hero'
import { Lines, Magnetic, Parallax, Reveal } from '../components/motion'
import { Statement } from '../components/Statement'
import { WorkCard } from '../components/WorkCard'
import { cx } from '../lib/cx'
import { prefersReduced } from '../lib/reduced'

export function Home() {
  return (
    <>
      <Hero />

      {/* The statement, with the powder field behind it */}
      <Statement />

      {/* Marquee */}
      <div className="overflow-hidden border-y border-line py-5" aria-hidden>
        <ul className="font-display flex w-max animate-marquee items-center gap-10 whitespace-nowrap text-[28px] text-fg/70 sm:text-[36px]">
          {[...site.marquee, ...site.marquee].map((item, i) => (
            <li key={i} className="flex items-center gap-10">
              {item}
              <span className="round size-2 rounded-full bg-accent" />
            </li>
          ))}
        </ul>
      </div>

      {/* Work */}
      <section id="work" className="mx-auto max-w-[1400px] scroll-mt-20 px-5 pt-24 sm:px-8 sm:pt-32">
        <div className="flex items-end justify-between">
          <Lines as="h2" className="font-display text-[44px] sm:text-[64px]" lines={['Selected work']} />
          <Reveal className="hidden text-[14px] text-muted sm:block">{projects.length} projects, 2024 to now</Reveal>
        </div>
        <div className="mt-12 grid gap-x-6 gap-y-14 md:grid-cols-2 lg:gap-x-8 lg:gap-y-20">
          {projects.map((p, i) => (
            <WorkCard key={p.slug} project={p} index={i} />
          ))}
        </div>
      </section>

      {/* About teaser */}
      <section className="mx-auto max-w-[1400px] px-5 pt-32 sm:px-8 sm:pt-44">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <Reveal>
            <Parallax src="/images/portrait.jpg" alt={site.name} className="aspect-[3/4] max-w-[460px] rounded-image" strength={6} />
          </Reveal>
          <div className="flex flex-col justify-center">
            <Lines
              as="h2"
              className="font-display text-balance text-[40px] sm:text-[56px] lg:text-[64px]"
              lines={['I make the thing', 'and the thing', 'around the thing']}
            />
            <Reveal delay={0.2} className="mt-8 max-w-xl text-pretty text-[18px] leading-relaxed text-muted">
              <p>
                Brands need products, products need websites, and websites need someone who cares about the last pixel and the first impression equally. I have spent ten years learning to do all three well, so clients do not have to explain their idea three times.
              </p>
              <p className="mt-4">I work independently, usually with one or two clients at a time, from a studio in {site.location}.</p>
            </Reveal>
            <Reveal delay={0.3} className="mt-8">
              <Link to="/about" className="link-draw inline-flex items-center gap-1.5 text-[16px] font-medium">
                More about me
                <ArrowUpRight className="size-4" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-[1400px] px-5 pt-32 sm:px-8 sm:pt-44">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-20">
          <div>
            <Lines as="h2" className="font-display text-[40px] sm:text-[56px]" lines={['What I do']} />
            <Reveal delay={0.1} className="mt-4 max-w-xs text-[16px] text-muted">
              Four things, done properly. Most projects are two of them.
            </Reveal>
          </div>
          <Services />
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-[1400px] px-5 pt-32 sm:px-8 sm:pt-44">
        <Testimonials />
      </section>
    </>
  )
}

function Services() {
  const [open, setOpen] = useState(0)
  return (
    <ul className="border-t border-line">
      {services.map((s, i) => {
        const isOpen = open === i
        return (
          <li key={s.title} className="border-b border-line">
            <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)} className="group flex w-full items-center gap-6 py-7 text-left">
              <span className="w-10 shrink-0 text-[14px] tabular-nums text-faint">0{i + 1}</span>
              <span className={cx('font-display flex-1 text-[32px] transition-colors sm:text-[44px]', isOpen ? 'text-fg' : 'text-fg/60 group-hover:text-fg')}>{s.title}</span>
              <span className={cx('grid size-10 shrink-0 place-items-center rounded-[12px] border border-line-strong transition-colors duration-300', isOpen && 'border-fg bg-fg text-bg')}>
                <Plus className={cx('size-4 transition-transform duration-500', isOpen && 'rotate-45')} />
              </span>
            </button>
            <Accordion open={isOpen}>
              <p className="max-w-xl pb-8 pl-16 text-pretty text-[16px] leading-relaxed text-muted">{s.body}</p>
            </Accordion>
          </li>
        )
      })}
    </ul>
  )
}

/* The panel stays mounted and its height is measured, so anime.js can ease
   between the real heights instead of guessing at `auto`. */
function Accordion({ open, children }: { open: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const mounted = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const rest = () => {
      el.style.height = open ? 'auto' : '0px'
      el.style.opacity = open ? '1' : '0'
    }
    if (!mounted.current || prefersReduced()) {
      mounted.current = true
      rest()
      return
    }
    // `auto` has no height to animate from, so pin the current pixel height
    // first and only release it once the tween has finished.
    const from = el.getBoundingClientRect().height
    el.style.height = `${from}px`
    animate(el, {
      height: open ? `${el.scrollHeight}px` : '0px',
      opacity: open ? 1 : 0,
      duration: 450,
      ease: 'outQuart',
      onComplete: rest,
    })
  }, [open])

  return (
    <div ref={ref} className="overflow-hidden" style={{ height: 0, opacity: 0 }}>
      {children}
    </div>
  )
}

function Testimonials() {
  const [index, setIndex] = useState(0)
  const [shown, setShown] = useState(0)
  const quote = useRef<HTMLDivElement>(null)
  const swapping = useRef(false)
  const t = testimonials[shown]

  /* Crossfade in two steps: the old quote leaves, the new one is committed,
     then it arrives. State drives the copy, anime.js drives the film. */
  const select = (next: number) => {
    if (next === shown || swapping.current) return
    setIndex(next)
    const el = quote.current
    if (!el || prefersReduced()) {
      setShown(next)
      return
    }
    swapping.current = true
    animate(el, {
      opacity: [1, 0],
      translateY: [0, -8],
      duration: 220,
      ease: 'inQuad',
      onComplete: () => {
        setShown(next)
        window.setTimeout(() => {
          animate(el, {
            opacity: [0, 1],
            translateY: [12, 0],
            duration: 420,
            ease: 'outQuart',
            onComplete: () => {
              swapping.current = false
            },
          })
        }, 40)
      },
    })
  }

  return (
    <div data-glass-dark className="rounded-[32px] bg-fg px-6 py-14 text-bg sm:px-14 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div ref={quote}>
          <blockquote>
            <p className="font-display text-balance text-[30px] leading-[1.1] sm:text-[44px]">“{t.quote}”</p>
            <footer className="mt-8 text-[16px] text-bg/60">
              <span className="text-bg">{t.name}</span>, {t.role}
            </footer>
          </blockquote>
        </div>
        <div className="mt-10 flex items-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Testimonial ${i + 1}`}
              onClick={() => select(i)}
              className={cx('h-1.5 rounded-[3px] transition-all duration-500', i === index ? 'w-10 bg-bg' : 'w-4 bg-bg/30 hover:bg-bg/50')}
            />
          ))}
          <Magnetic className="ml-auto">
            <button type="button" onClick={() => select((shown + 1) % testimonials.length)} className="grid size-12 place-items-center rounded-[14px] border border-bg/20 transition-colors hover:bg-bg hover:text-fg" aria-label="Next">
              <ArrowUpRight className="size-4 rotate-45" />
            </button>
          </Magnetic>
        </div>
      </div>
    </div>
  )
}
