import { animate } from 'animejs'
import { useEffect, useRef, useState, type CSSProperties } from 'react'

import { prefersReduced } from '../lib/reduced'

/* Where the headline changes as the hero is scrolled through. */
const SWAP_AT = 0.3
const SWAP_BACK_AT = 0.22

/** A line of the headline, split into runs so a single line can carry two
 *  weights: the name stays bold while the rest of the greeting stays light. */
type TitleLine = { parts: { text: string; weight: string }[] }

const LIGHT = 'font-[100]'
const BOLD = 'font-bold'

const DESIGN_LINES: TitleLine[] = [
  { parts: [{ text: 'DE:', weight: LIGHT }] },
  { parts: [{ text: 'SIGN', weight: LIGHT }] },
  { parts: [{ text: 'MY LIFE', weight: BOLD }] },
]

const GREETING_LINES: TitleLine[] = [
  { parts: [{ text: '안녕:', weight: LIGHT }] },
  { parts: [{ text: '하세요?', weight: LIGHT }] },
  { parts: [{ text: '최영재', weight: BOLD }, { text: '입니다 :)', weight: LIGHT }] },
]

/**
 * The hero is looked at from above: the section itself is the surface of a
 * shallow, transparent pool on white. The type lives in the DOM *under* the
 * canvas, so the caustics and the ripples pass over the letters. Move the
 * cursor and the surface answers (see lib/waterScene.ts), and a glass bead
 * rests in the centre, refracting the pool (see lib/beadScene.ts).
 *
 * The section is pinned: the first screen of scrolling holds the pool still and,
 * a third of the way in, the headline blurs out and greets the reader with the
 * same rise it used on arrival.
 */
export function Hero() {
  /* Scroll listeners are cheap; a pending swap timer is not, so it is cleared
     when the hero goes away. */
  const canvas = useRef<HTMLCanvasElement>(null)
  const beadCanvas = useRef<HTMLCanvasElement>(null)
  const titleCanvas = useRef<HTMLCanvasElement>(null)
  const pin = useRef<HTMLDivElement>(null)
  const titleScene = useRef<{ repaint?: () => void } | null>(null)
  const [reduced] = useState(prefersReduced)
  const [delay, setDelay] = useState(0.4)
  const [greeting, setGreeting] = useState(false)
  // The swap is driven from a scroll listener, so it reads these through refs.
  const greetingRef = useRef(false)
  // Both live outside the scroll effect: a re-run of that effect (the reduced
  // motion query resolving) must not cancel a swap that is already in flight.
  const swapping = useRef(false)
  const swapTimer = useRef(0)
  // Latest scroll reading, so a finished swap can re-check where the reader is.
  const readRef = useRef<() => void>(() => {})
  // The bead scene starts its surfacing whenever the dynamic import resolves,
  // so it reads the settled delay through a ref instead of a snapshot.
  const delayRef = useRef(delay)
  delayRef.current = delay

  // The preloader covers the first 1.5s of a fresh tab; surfacing after it is
  // the whole point, so the type waits for the curtain.
  useEffect(() => {
    setDelay(sessionStorage.getItem('preloaded') ? 0.35 : 1.8)
  }, [])

  useEffect(() => {
    const element = canvas.current
    if (!element) return
    let handle: { dispose: () => void } | undefined
    let beadHandle: { dispose: () => void } | undefined
    let titleHandle: { dispose: () => void; repaint?: () => void } | undefined
    let cancelled = false

    import('../lib/waterScene')
      .then(({ createWaterScene }) => {
        if (cancelled) return
        // The pool itself. It carries no type, so the bead refracts clean
        // water and never shows the letters through its glass.
        handle = createWaterScene(element, { reducedMotion: !!reduced })
        // The type gets a transparent pass of its own, layered UNDER the bead:
        // glyphs bend with the real ripples, and the bead simply hides them.
        const titleElement = titleCanvas.current
        if (titleElement) {
          titleHandle = createWaterScene(titleElement, {
            reducedMotion: !!reduced,
            bakeTitle: document.getElementById('hero-title'),
            titleOnly: true,
          })
          titleScene.current = titleHandle ?? null
        }
        const beadElement = beadCanvas.current
        if (!beadElement) return
        return import('../lib/beadScene').then(({ createBeadScene }) => {
          if (cancelled || !beadElement) return
          beadHandle = createBeadScene(beadElement, element, { reducedMotion: !!reduced, introDelay: delayRef.current }) ?? undefined
        })
      })
      .catch(() => {
        // No WebGL: the white ground behind the type is the fallback.
      })
      .finally(() => {
        // If nothing baked the type (no WebGL, or a parse failure upstream),
        // hand the DOM copy back so the hero still has a title.
        window.setTimeout(() => {
          const title = document.getElementById('hero-title')
          if (title && !title.hasAttribute('data-raster')) title.removeAttribute('data-pending')
        }, 1600)
      })

    return () => {
      cancelled = true
      titleScene.current = null
      beadHandle?.dispose()
      titleHandle?.dispose()
      handle?.dispose()
    }
  }, [reduced])

  /* Arrival: the type rises out of the pool once the bead has settled. The
     start values are set here rather than in CSS so a reduced-motion visitor
     simply gets the settled headline. */
  useEffect(() => {
    const layer = titleCanvas.current
    if (!layer || reduced) return
    layer.style.opacity = '0'
    layer.style.filter = 'blur(4px)'
    layer.style.transform = 'translateY(18px) scale(0.97)'
    const timer = window.setTimeout(() => {
      animate(layer, {
        opacity: [0, 1],
        translateY: [18, 0],
        scale: [0.97, 1],
        filter: ['blur(4px)', 'blur(0px)'],
        duration: 1100,
        ease: 'outQuart',
        onComplete: () => {
          layer.style.transform = 'none'
        },
      })
    }, (delay + 1.25) * 1000)
    return () => window.clearTimeout(timer)
  }, [delay, reduced])

  /* Scroll: hold the pool still, and swap the headline about a third of the way
     through the pinned stretch. Hysteresis keeps it from flapping at the edge. */
  useEffect(() => {
    const section = pin.current
    if (!section) return

    const swap = (next: boolean) => {
      const layer = titleCanvas.current
      greetingRef.current = next
      swapping.current = true
      window.clearTimeout(swapTimer.current)

      let settled = false
      /* The lock is held for the whole sequence, rise included: releasing it
         early would let a second swap drive the same canvas at once, and the
         two animations would fight over opacity and transform. Once it is
         released, the scroll position is read again in case the reader kept
         moving while the type was arriving. */
      const settle = () => {
        if (settled) return
        settled = true
        window.clearTimeout(swapTimer.current)
        swapping.current = false
        readRef.current()
      }

      if (reduced || !layer) {
        setGreeting(next)
        requestAnimationFrame(() => {
          titleScene.current?.repaint?.()
          settle()
        })
        return
      }

      // A throttled tab pauses animation frames, so timers behind the sequence
      // guarantee the headline can never stay hidden or keep the lock.
      const unstick = window.setTimeout(() => {
        layer.style.opacity = '1'
        layer.style.filter = 'none'
        layer.style.transform = 'none'
        setGreeting(next)
        settle()
      }, 2400)

      // Blur out, change the text under cover, then let it rise again: the
      // same entrance the hero used on arrival.
      animate(layer, {
        opacity: [1, 0],
        filter: ['blur(0px)', 'blur(7px)'],
        scale: [1, 0.99],
        duration: 340,
        ease: 'inQuad',
        onComplete: () => {
          setGreeting(next)
          // Wait for React to commit the new line before the pass re-bakes the
          // type, otherwise the bake reads the old text.
          swapTimer.current = window.setTimeout(() => {
            window.clearTimeout(unstick)
            titleScene.current?.repaint?.()
            animate(layer, {
              opacity: [0, 1],
              translateY: [18, 0],
              scale: [0.97, 1],
              filter: ['blur(4px)', 'blur(0px)'],
              duration: 1100,
              ease: 'outQuart',
              onComplete: () => {
                layer.style.transform = 'none'
                settle()
              },
            })
          }, 60)
        },
      })
    }

    readRef.current = () => {
      const rect = section.getBoundingClientRect()
      const runway = Math.max(1, rect.height - window.innerHeight)
      const progress = Math.min(Math.max(-rect.top / runway, 0), 1)
      if (swapping.current) return
      if (!greetingRef.current && progress >= SWAP_AT) swap(true)
      else if (greetingRef.current && progress <= SWAP_BACK_AT) swap(false)
    }

    /* Scroll events already arrive at about one per frame, so this reads the
       rect directly: no extra animation frame in the path of the swap. */
    const onScroll = () => readRef.current()

    window.addEventListener('scroll', onScroll, { passive: true })
    readRef.current()
    return () => window.removeEventListener('scroll', onScroll)
  }, [reduced])

  useEffect(() => () => window.clearTimeout(swapTimer.current), [])


  const lines = greeting ? GREETING_LINES : DESIGN_LINES

  return (
    <div ref={pin} className="relative h-[200svh]">
      <section
        aria-labelledby="hero-title"
        className="sticky top-0 isolate flex min-h-[100svh] flex-col justify-center overflow-hidden bg-[radial-gradient(125%_95%_at_50%_-15%,#ffffff_0%,#ffffff_38%,#fbfdfd_62%,#f3f8f8_84%,#eaf3f3_100%)]"
      >
        {/* The type layer: baked under the water so the glass refracts it, with
            this DOM copy left transparent for drag-selection. It sits clear of
            the bead, off its lower right shoulder. */}
        <div className="absolute inset-0 z-30">
          {/* Anchored so the bead's lower-right point is the type's bottom. */}
          {/* On narrow screens the type sits centred under the bead: the longer
              greeting line has nowhere to go beside it. From lg up it takes the
              bead's lower-right shoulder. */}
          {/* min() keeps the type off the right edge on ~1024px screens, where
              the bead offset alone leaves no margin beside the greeting. */}
          <div className="pointer-events-auto absolute left-[min(calc(50%+24vmin),calc(100%-21rem))] top-[calc(50%+24vmin)] -translate-y-full max-lg:left-1/2 max-lg:top-[66%] max-lg:-translate-x-1/2 max-lg:translate-y-0">
            {/* data-pending hides this copy from the first paint: until the
                gl passes have baked it, showing it would flash the type in
                and out. If the passes never come up, the effect below releases
                it again so the fallback still reads. */}
            <h1
              id="hero-title"
              data-pending
              aria-label={greeting ? '안녕하세요, 최영재입니다' : 'Design My Life'}
              className="whitespace-nowrap"
            >
              {/* The DOM copy never animates: the pass that actually paints the
                  type is the transparent canvas layered under the bead, and it
                  is animated whole, so no frame can clip a glyph. */}
              <span
                className="block font-suit text-[52px] leading-[1.08] tracking-[-0.01em] max-lg:text-[40px]"
                // 80% ink: the type reads like something seen through the water
                // rather than printed on top of it.
                style={{ '--title-ink': 'rgba(7, 25, 27, 0.8)' } as CSSProperties}
              >
                {lines.map((line, i) => (
                  <span key={i} className="block">
                    {line.parts.map((part, j) => (
                      <span key={j} className={part.weight}>
                        {part.text}
                      </span>
                    ))}
                  </span>
                ))}
              </span>
            </h1>
          </div>
        </div>

        {/* The surface itself, over the type but never in the way of the pointer.
            The glass bead lives on its own transparent layer above the water, so
            it can refract what the pool draws. The surfacing itself is drawn by
            the bead shader: the sphere breaks a wobbling waterline on the way up. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-20">
          <canvas ref={canvas} className="size-full" />
          {/* The type, under the bead: it hovers up out of the pool once the
              glass has settled, and the bead covers it rather than showing it.
              Swapping it means fading this pass out, changing the DOM, re-baking
              the texture and letting it rise again — an anime.js sequence. */}
          <canvas ref={titleCanvas} className="title-layer absolute inset-0 size-full origin-center" />
          <canvas ref={beadCanvas} className="absolute inset-0 size-full" />
        </div>

        <WaterFilter animate={!reduced} />
      </section>
    </div>
  )
}

/** The refraction pass: type seen through the moving surface. */
function WaterFilter({ animate }: { animate: boolean }) {
  return (
    <svg aria-hidden className="absolute size-0" focusable="false">
      <filter id="hero-water" x="-6%" y="-12%" width="112%" height="124%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.016" numOctaves="2" seed="4" result="noise">
          {animate && (
            <animate
              attributeName="baseFrequency"
              dur="21s"
              repeatCount="indefinite"
              values="0.008 0.016;0.011 0.013;0.007 0.019;0.010 0.015;0.008 0.016"
            />
          )}
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  )
}
