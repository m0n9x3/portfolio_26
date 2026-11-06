/* WORK — 경험 타임라인 (Florilegium 스트립 기반).
   열 개의 스톱: 스크롤이 피셔아이를 움직이고, 하단 날짜가 스톱 사이를 보간한다.
   스크롤은 각 날짜(스톱)에 스냅된다.

   원안은 lenis 전역 스무스 스크롤이지만, 이 사이트는 다른 섹션들이 네이티브
   스크롤 값으로 애니메이션하므로 전역 스크롤 라이브러리를 얹지 않는다.
   대신 프레임마다 스크롤 델타를 재서 같은 스큐(±6deg, 감쇠 0.1)를 만든다. */
import './florilegium.css'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'

import { PLATES, PLATE_DAYS, fmtCalendar } from '../data/florilegium'

gsap.registerPlugin(ScrollTrigger)

const N = PLATES.length

/* 날짜 숫자 롤: 8자리(연 4 · 월 2 · 일 2). 각 자리는 0–9 스트립을 세로로
   굴려 숫자가 바뀐다. */
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
const INITIAL_DIGITS = [2, 0, 2, 2, 0, 1, 0, 1]

/* 직접 이동(화살표·카드 클릭)의 시간/이징 */
const STEP = {
  duration: 1.15,
  ease: 'power2.inOut',
} as const

/* 스냅 — 스크롤은 자유롭게, 멈춘 지점이 어느 스톱 근방이면 그 판 중앙으로
   부드럽게 정렬한다. 더 빨리/느리게 붙게 하려면 이 값만 바꾸면 된다. */
const SNAP = {
  delay: 420, // 스크롤이 멈춘 뒤 정렬 시작까지(ms) — 클수록 덜 끼어든다
  duration: 0.9, // 정렬 이동 시간(s)
  ease: 'power3.out',
  // 스톱 간격 대비 정렬 범위. 0.38이면 간격의 76% 안쪽은 스톱으로 붙고,
  // 스톱과 스톱의 한가운데 근처에서 멈추면 그대로 머문다(과한 끌림 방지)
  range: 0.38,
} as const

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export function Florilegium() {
  const trackRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<(HTMLButtonElement | null)[]>([])
  const imgsRef = useRef<(HTMLImageElement | null)[]>([])
  const dialRefs = useRef<(HTMLSpanElement | null)[]>([])
  const fillRef = useRef<HTMLElement>(null)
  const introRef = useRef<HTMLParagraphElement>(null)
  const captionRef = useRef<HTMLDivElement>(null)
  const stRef = useRef<ScrollTrigger | null>(null)
  const tweenRef = useRef<gsap.core.Tween | null>(null)
  const reduced = usePrefersReducedMotion()

  const [active, setActive] = useState(0)
  const [loaded, setLoaded] = useState<boolean[]>(() => PLATES.map(() => false))
  const [failed, setFailed] = useState<boolean[]>(() => PLATES.map(() => false))
  const loadedCount = loaded.filter(Boolean).length + failed.filter(Boolean).length
  const [ready, setReady] = useState(false)

  // 모든 판이 로드/실패했거나, 6초가 지나면 로더 해제
  useEffect(() => {
    if (loadedCount >= N) setReady(true)
  }, [loadedCount])
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 6000)
    return () => clearTimeout(t)
  }, [])

  /* ------------------------------------------- per-frame fisheye layout */
  useLayoutEffect(() => {
    const track = trackRef.current
    const stage = stageRef.current
    if (!track || !stage) return

    const st = ScrollTrigger.create({ trigger: track, start: 'top top', end: 'bottom bottom' })
    stRef.current = st

    let vw = stage.clientWidth
    let vh = stage.clientHeight
    const ro = new ResizeObserver(() => {
      vw = stage.clientWidth
      vh = stage.clientHeight
    })
    ro.observe(stage)

    let skew = 0
    let lastScroll = window.scrollY
    let lastActive = -1
    const X = new Array<number>(N).fill(0)
    const W = new Array<number>(N).fill(0)
    const H = new Array<number>(N).fill(0)

    const frame = () => {
      const p = st.progress
      const f = clamp(p) * (N - 1)
      const mobile = vw < 700
      const H0 = Math.min(vh * (mobile ? 0.5 : 0.48), (vw * (mobile ? 0.66 : 0.34)) / 0.75, 620)
      const gap = Math.max(14, vw * 0.018)
      const centerY = vh * (mobile ? 0.44 : 0.45)

      /* 캡션은 항상 활성 카드 바로 아래(18px)에 앉는다 — 카드 높이가
         뷰포트에 따라 달라져도 간격이 일정해 레이아웃 균형이 맞는다. */
      if (captionRef.current) captionRef.current.style.top = `${centerY + H0 / 2 + 18}px`

      // sizes: gaussian falloff around the focused (continuous) index
      let acc = 0
      for (let i = 0; i < N; i++) {
        const d = i - f
        const s = 0.42 + 0.58 * Math.exp(-(d * d) / 0.7)
        H[i] = H0 * s
        W[i] = H[i] * 0.75
        X[i] = acc + W[i] / 2
        acc += W[i] + gap
      }
      const i0 = Math.floor(f)
      const i1 = Math.min(N - 1, i0 + 1)
      const focusX = lerp(X[i0], X[i1], f - i0)
      const offset = vw / 2 - focusX

      // velocity skew: native scroll delta per frame — 부드럽게 보이도록
      // 각도와 반응을 낮게 잡아 종이처럼 살짝만 기운다
      const dy = window.scrollY - lastScroll
      lastScroll = window.scrollY
      skew = lerp(skew, reduced ? 0 : clamp(dy * 0.06, -3, 3), 0.08)

      for (let i = 0; i < N; i++) {
        const el = cardsRef.current[i]
        if (!el) continue
        const x = X[i] + offset
        el.style.width = `${W[i]}px`
        el.style.height = `${H[i]}px`
        el.style.transform = `translate3d(${x - W[i] / 2}px, ${centerY - H[i] / 2}px, 0) skewX(${skew.toFixed(2)}deg)`
        const img = imgsRef.current[i]
        if (img) img.style.transform = `translate3d(${clamp(-(i - f) * 7, -10, 10)}%, 0, 0) scale(1.22)`
      }

      // 날짜: 인접한 두 스톱 날짜 사이를 보간 — 스냅되면 정확히 스톱 날짜에 멈춘다
      const days = lerp(PLATE_DAYS[i0], PLATE_DAYS[i1], f - i0)
      const cal = fmtCalendar(days)
      const digits = `${cal.year}${cal.month}${cal.day}`
      for (let k = 0; k < digits.length; k++) {
        const el = dialRefs.current[k]
        if (!el || el.dataset.d === digits[k]) continue
        el.dataset.d = digits[k]
        el.style.setProperty('--d', digits[k])
      }
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${f / (N - 1)})`
      if (introRef.current) {
        const t = smooth(0, 0.05, p)
        introRef.current.style.opacity = `${1 - t}`
        introRef.current.style.transform = `translate3d(${-t * 40}px, -50%, 0)`
      }

      const idx = Math.round(f)
      if (idx !== lastActive) {
        lastActive = idx
        setActive(idx)
      }
    }

    /* 자유 스크롤 + 강한 스냅: 스크롤이 잠시 멈추면 가장 가까운 날짜
       스톱으로 부드럽게 정렬한다(휠을 가로채지 않 으므로 관성은 그대로).
       섹션이 화면을 덮고 있을 때만, 사용자가 직접 스크롤한 뒤에만 동작. */
    let snapTimer: number | undefined
    const snapToNearest = () => {
      if (!st.isActive) return
      if (tweenRef.current?.isActive()) return
      const steps = N - 1
      const p = clamp(st.progress)
      const i = Math.round(p * steps)
      // 범위(기본 0.5 = 항상) 안이면 가장 가까운 스톱으로
      if (Math.abs(i / steps - p) > SNAP.range / steps) return
      const targetY = st.start + (i / steps) * (st.end - st.start)
      if (Math.abs(window.scrollY - targetY) < 2) return
      if (reduced) {
        window.scrollTo({ top: targetY, behavior: 'auto' })
        return
      }
      tweenRef.current?.kill()
      const state = { y: window.scrollY }
      tweenRef.current = gsap.to(state, {
        y: targetY,
        duration: SNAP.duration,
        ease: SNAP.ease,
        onUpdate: () => window.scrollTo({ top: state.y, behavior: 'instant' as ScrollBehavior }),
      })
    }
    const onScroll = () => {
      window.clearTimeout(snapTimer)
      snapTimer = window.setTimeout(snapToNearest, SNAP.delay)
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    gsap.ticker.add(frame)
    frame()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(snapTimer)
      gsap.ticker.remove(frame)
      ro.disconnect()
      st.kill()
      stRef.current = null
    }
  }, [reduced])

  /* ------------------------------------------------------------- intro */
  useLayoutEffect(() => {
    if (!ready || reduced) return
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: 'expo.out' } })
        .from('.fl-card__clip', { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.6, stagger: { each: 0.06, from: 'center' } })
        .from('.fl-time > *', { yPercent: 100, opacity: 0, duration: 1.4, stagger: 0.08 }, 0.4)
        .from('.fl-caption', { opacity: 0, duration: 1 }, 0.8)
    }, stageRef)
    return () => ctx.revert()
  }, [ready, reduced])

  /* ------------------------------------------------------------ actions */
  const scrollToProgress = (target: number) => {
    const st = stRef.current
    if (!st) return
    const y = st.start + clamp(target) * (st.end - st.start)
    tweenRef.current?.kill()
    if (reduced) {
      window.scrollTo({ top: y, behavior: 'auto' })
      return
    }
    const state = { y: window.scrollY }
    tweenRef.current = gsap.to(state, {
      y,
      duration: STEP.duration,
      ease: STEP.ease,
      onUpdate: () => window.scrollTo({ top: state.y, behavior: 'instant' as ScrollBehavior }),
    })
  }
  useEffect(() => () => { tweenRef.current?.kill() }, [])

  const goTo = (i: number) => scrollToProgress(clamp(i, 0, N - 1) / (N - 1))

  // arrow keys step through plates while the section is on screen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = stRef.current
      if (!st || !st.isActive) return
      if ((e.target as HTMLElement).closest('input, textarea')) return
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(active + 1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(active - 1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reduced])

  const plate = PLATES[active]

  return (
    <div className="fl-root" data-ready={ready}>
      <section
        id="work"
        ref={trackRef}
        className="fl-track"
        style={{ height: `${N * 42 + 170}vh` }}
        aria-label="Work experience"
      >
        <div ref={stageRef} className="fl-stage">
          <div className="fl-chrome">
            <div ref={captionRef} className="fl-caption" aria-live="polite">
              <span key={active} className="fl-caption__title">{plate.title}</span>
              <span className="fl-caption__note">{plate.note}</span>
            </div>

            <div className="fl-time" aria-hidden="true">
              {/* 날짜는 그냥 텍스트. 자리마다 0–9 스트립을 세로로 굴려
                  숫자가 바뀔 때 롤 효과가 난다. */}
              <span className="fl-now">
                {INITIAL_DIGITS.map((d, i) => (
                  <Fragment key={i}>
                    {(i === 4 || i === 6) && <span className="fl-now__dot">.</span>}
                    <span className="fl-dial">
                      <span
                        className="fl-dial__strip"
                        ref={(el) => { dialRefs.current[i] = el }}
                        data-d={d}
                        style={{ ['--d' as string]: String(d) } as CSSProperties}
                      >
                        {DIGITS.map((n) => <span key={n}>{n}</span>)}
                      </span>
                    </span>
                  </Fragment>
                ))}
              </span>
              <span className="fl-time__line"><i ref={fillRef} /></span>
              <span className="fl-time__end">2026.11.06</span>
            </div>

            <p ref={introRef} className="fl-intro">
              <span>WORK:</span>
              <strong>EXPERIENCE</strong>
            </p>
          </div>

          <div className="fl-strip">
            {PLATES.map((p, i) => (
              <button
                key={i}
                type="button"
                ref={(el) => { cardsRef.current[i] = el }}
                className={`fl-card${i === active ? ' is-active' : ''}`}
                style={{ background: p.tint }}
                aria-label={`${p.title}, ${p.note}`}
                aria-current={i === active ? 'true' : undefined}
                onClick={() => goTo(i)}
              >
                <span className="fl-card__clip">
                  {!failed[i] ? (
                    <img
                      ref={(el) => { imgsRef.current[i] = el }}
                      src={p.src}
                      alt=""
                      decoding="async"
                      loading="eager"
                      draggable={false}
                      style={p.focus ? { objectPosition: p.focus } : undefined}
                      className={loaded[i] ? 'is-loaded' : ''}
                      onLoad={() => setLoaded((l) => l.map((v, j) => (j === i ? true : v)))}
                      onError={() => setFailed((l) => l.map((v, j) => (j === i ? true : v)))}
                    />
                  ) : (
                    <span className="fl-card__fallback">{p.title}</span>
                  )}
                </span>
              </button>
            ))}
          </div>

          {!ready && (
            <div className="fl-loader" role="status">
              Developing plates {String(loadedCount).padStart(2, '0')} / {N}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
