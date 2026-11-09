/* WORK — 경험 타임라인. 열 개의 판이 가로로 늘어서고, 스크롤이 그 사이를
   이동하며 아래 날짜가 판 사이를 보간한다. 스크롤이 멈추면 가장 가까운
   날짜에 스냅된다.

   등장 순서: 물(스크롤에 묶인 페이드) → 제목이 물 위로 떠오름 → 판이 떠오름
   → 캡션、날짜. 다른 섬션과 같이 전역 스무스 스크롤(lenis)은 쓰지 않고,
   프레임마다 스크롤 델타를 재서 종이처럼 살짝 기우는 스큐만 만든다. */
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
const firstDay = fmtCalendar(PLATE_DAYS[0])
const INITIAL_DIGITS = `${firstDay.year}${firstDay.month}${firstDay.day}`.split('')

/* 직접 이동(화살표·카드 클릭)의 시간/이징 */
const STEP = {
  duration: 1.15,
  ease: 'power2.inOut',
} as const

/* 물속 판이 놓이는 깊이(px). 수면 위로 올라올 때 이만큼 떠오른다. */
const SUBMERGE = 22
/* 기본 판 크기(H0 대비)와 활성 판 확대 배율. 판 자리는 고정이고 활성 판만
   그 자리에서 커지므로 이웃 간격이 변하지 않는다. */
const CARD_SCALE = 0.42
const GROW = 0.6
/* 판 비율 — 가로형(4:3). */
const ASPECT = 4 / 3

/* 판 메타(물속 틴트 · 사진 포커스)는 한 번만 꺼내 둔다 — 페인트마다
   map()으로 새 배열을 만들고 "50% 30%" 문자열을 다시 파싱할 이유가 없다. */
const TINTS = PLATES.map((q) => q.tint)
const FOCUS = PLATES.map((q) => parseFocus(q.focus))

/* 스냅 — 스크롤이 멈추면 가장 가까운 날짜로 붙는다. 고정 시간 이징 대신
   지금의 스크롤 속도를 이어받는 크리티컬 댐핑 스프링을 써서, 사용자가 멈춘
   속도에서 자연스럽게 감속하며 제자리에 안착한다(속도가 끊기지 않는다). */
const SNAP = {
  delay: 380, // 스크롤이 멈춘 뒤 정렬 시작까지(ms)
  stiffness: 7.5, // 스프링 강도(1/s) — 클수록 빨리 붙는다
  /* 이어받는 초기 속도 상한(px/s). 터치 플링은 관성까지 끝난 뒤에 스냅이
     걸리는데, 남은 속도를 그대로 이어받으면 목표를 지나 되돌아오는 폭이
     커진다(상한 4200px/s 에서는 최대 40px 남짓). 1200이면 같은 조건에서
     10px 안쪽이라 손끝에 걸리지 않는다. */
  maxVelocity: 1200,
} as const

/* 판 이동이 시작되는 지점. 앞 구간은 인트로(물·제목·사진 등장)에 쓰이므로
   첫 판은 인트로가 끝난 자리에 남아 있고, 스냅도 0%로 되돌아가지 않는다.
   앞쪽을 넉넉히 두어 제목만 보이는 타이밍이 길다. */
const LEAD = 0.17

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
/* 섹션 진행도 → 판 이동 진척도(0..1). */
const nav = (p: number) => clamp((p - LEAD) / (1 - LEAD))

/** object-position 문자열("50% 30%" 등)을 0..1 비율로. */
function parseFocus(value?: string): [number, number] {
  if (!value) return [0.5, 0.5]
  const parts = value.trim().split(/\s+/)
  const at = (v: string | undefined) => {
    if (!v) return 0.5
    const n = parseFloat(v)
    if (Number.isNaN(n)) return 0.5
    return v.includes('%') ? n / 100 : n
  }
  return [at(parts[0]), at(parts[1])]
}

/** 비활성 판들을 오프스크린 캔버스에 그린다 — 물 섬이 이 레이어를 실제
 *  파동으로 굴절시켜 판을 물속에 넣는다. 활성 판(skip)은 DOM 위에서
 *  선명하게 남으므로 여기서는 그리지 않는다. */
function paintUnderwater(
  layer: HTMLCanvasElement,
  water: HTMLCanvasElement,
  o: {
    vw: number
    vh: number
    f: number
    centerY: number
    offset: number
    X: number[]
    W: number[]
    H: number[]
    imgs: (HTMLImageElement | null)[]
    loaded: boolean[]
    tints: string[]
    focus: [number, number][]
    /* 1 = 수면 위(DOM), 0 = 물속(레이어에서 그림). 전환 중에는 둘을 섞는다. */
    surface: number[]
    /* 사진이 드러나는 정도(0..1). 물속 판도 같은 페이드를 따른다. */
    reveal: number
    /* 활성 판 확대 배율(좁은 화면에서는 작다). */
    growAmt: number
  },
) {
  const { vw, vh, f, centerY, offset, X, W, H, imgs, loaded, tints, focus, surface, reveal, growAmt } = o
  if (!water.width || !water.height || !vw || !vh) return
  if (layer.width !== water.width || layer.height !== water.height) {
    layer.width = water.width
    layer.height = water.height
  }
  const ctx = layer.getContext('2d')
  if (!ctx) return
  const k = water.width / vw
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, layer.width, layer.height)
  ctx.setTransform(k, 0, 0, k, 0, 0)

  const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
    const rad = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + rad, y)
    ctx.arcTo(x + w, y, x + w, y + h, rad)
    ctx.arcTo(x + w, y + h, x, y + h, rad)
    ctx.arcTo(x, y + h, x, y, rad)
    ctx.arcTo(x, y, x + w, y, rad)
    ctx.closePath()
  }

  for (let i = 0; i < X.length; i++) {
    /* 수면 위로 올라온 만큼만 지운다 — 활성 전환은 DOM 판과 교차 페이드. */
    const underwater = (1 - clamp(surface[i] ?? 1)) * reveal
    if (underwater < 0.01) continue
    const w = W[i]
    const h = H[i]
    if (!w || !h) continue
    /* 활성 판은 제자리에서 확대되므로 레이어도 같은 배율로 그려야 한다. */
    const grow = 1 + growAmt * clamp(surface[i] ?? 1)
    const gw = w * grow
    const gh = h * grow
    /* DOM 판과 정확히 같은 자리·같은 배율로 그린다 — 교차 페이드 중에
       두 그림이 엇갈리면 고스트처럼 보인다. */
    const x = X[i] + offset - gw / 2
    const y = centerY - gh / 2 + underwater * SUBMERGE
    /* 물속 판도 뒤에 은은한 그림자를 남긴다. 레이어 안에 그려서 물결과 함께
       일렁이고, 알파도 교차 페이드를 따른다. */
    ctx.save()
    ctx.globalAlpha = underwater
    ctx.shadowColor = 'rgba(4, 34, 46, 0.26)'
    ctx.shadowBlur = 30
    ctx.shadowOffsetY = 12
    roundRect(x, y, gw, gh, 24)
    ctx.fillStyle = tints[i] || '#e7f1f1'
    ctx.fill()
    ctx.restore()

    roundRect(x, y, gw, gh, 24)
    ctx.save()
    ctx.clip()
    ctx.globalAlpha = underwater
    ctx.fillStyle = tints[i] || '#e7f1f1'
    ctx.fillRect(x, y, gw, gh)
    const img = imgs[i]
    if (img && loaded[i] && img.naturalWidth && img.naturalHeight) {
      const scale = Math.max(gw / img.naturalWidth, gh / img.naturalHeight) * 1.22
      const dw = img.naturalWidth * scale
      const dh = img.naturalHeight * scale
      const [fx, fy] = focus[i] ?? [0.5, 0.5]
      const tx = (clamp(-(i - f) * 7, -10, 10) / 100) * gw
      try {
        ctx.drawImage(img, x + (gw - dw) * fx + tx, y + (gh - dh) * fy, dw, dh)
      } catch {
        // 아직 디코드되지 않은 이미지는 다음 프레임에 다시 시도한다.
      }
    }
    ctx.restore()
  }
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
  const rootRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<(HTMLButtonElement | null)[]>([])
  const imgsRef = useRef<(HTMLImageElement | null)[]>([])
  const dialRefs = useRef<(HTMLSpanElement | null)[]>([])
  const waterRef = useRef<HTMLCanvasElement>(null)
  const layerRef = useRef<HTMLCanvasElement | null>(null)
  const sceneRef = useRef<{
    dispose: () => void
    draw: () => void
    pulse: (u?: number, v?: number, amp?: number) => void
  } | null>(null)
  const bakedRef = useRef(false)
  const foregroundRef = useRef(false)
  const loadedRef = useRef<boolean[]>([])
  const loadedCountRef = useRef(0)
  const fillRef = useRef<HTMLElement>(null)
  const introRef = useRef<HTMLParagraphElement>(null)
  const captionRef = useRef<HTMLDivElement>(null)
  const chromeRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const stRef = useRef<ScrollTrigger | null>(null)
  const tweenRef = useRef<gsap.core.Tween | null>(null)
  const reduced = usePrefersReducedMotion()

  /* 히어로와 같은 물 섬을 이 섹션의 배경으로 재사용한다. 비활성 판은
     오프스크린 캔버스에 그려 물 셰이더에 넘기고(source), 물이 그 판들을
     실제 파동으로 굴절·물빛 처리한다. 활성 판은 물 위에 선명하게 남는다. */
  useEffect(() => {
    const canvas = waterRef.current
    const stage = stageRef.current
    if (!canvas || !stage) return
    const layer = document.createElement('canvas')
    layerRef.current = layer
    let cancelled = false
    import('../lib/waterScene')
      .then(({ createWaterScene }) => {
        if (cancelled) return
        const handle = createWaterScene(canvas, { reducedMotion: reduced, container: stage, source: layer })
        sceneRef.current = handle
        if (handle.kind === 'webgl') bakedRef.current = true
      })
      .catch(() => {
        // WebGL이 없으면 CSS 그라디언트 배경과 평범한 카드로 남는다.
      })
    return () => {
      cancelled = true
      bakedRef.current = false
      sceneRef.current?.dispose()
      sceneRef.current = null
      layerRef.current = null
    }
  }, [reduced])

  const [active, setActive] = useState(0)
  const [loaded, setLoaded] = useState<boolean[]>(() => PLATES.map(() => false))
  const [failed, setFailed] = useState<boolean[]>(() => PLATES.map(() => false))
  const loadedCount = loaded.filter(Boolean).length + failed.filter(Boolean).length
  const [ready, setReady] = useState(false)
  loadedRef.current = loaded
  loadedCountRef.current = loadedCount

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
    /* 다시 그릴 이유가 있는지만 숫자로 들고 있는다(문자열 키 생성 없음). */
    const painted = { p: -1, fg: false, idx: -1, vw: -1, vh: -1, loaded: -1, surface: -1 }
    /* 뷰포트에서만 결정되는 값들 — 바뀔 때만 다시 계산한다. */
    let layoutVw = -1
    let layoutVh = -1
    let centerY = 0
    let cardH = 0
    let growAmt: number = GROW
    let lastPulseAt = 0
    /* 판별 "수면 위" 정도(1 = DOM 판, 0 = 물속). 처음에는 어떤 판도 수면
       위에 없다 — 사진이 드러나는 순간에 첫 판도 물속에서 떠오른다. */
    const surface = new Array<number>(N).fill(0)

    const frame = () => {
      const p = st.progress
      const f = nav(p) * (N - 1)
      const idx = Math.round(f)
      const reveal = smooth(LEAD * 0.5, LEAD * 0.95, p)

      /* 종이처럼 살짝 기우는 skew는 이번 프레임의 스크롤 델타에서만 나온다.
         아래 조기 반환 판정에도 쓰이므로 먼저 갱신한다. */
      const yNow = window.scrollY
      const dy = yNow - lastScroll
      lastScroll = yNow
      skew = lerp(skew, reduced ? 0 : clamp(dy * 0.06, -3, 3), 0.08)

      /* 판이 수면으로 떠오르는 중인지(0과 1 사이에 머문 판이 있는지). */
      let floating = Math.abs(skew) >= 0.005
      if (!floating && bakedRef.current) {
        for (let i = 0; i < N; i++) {
          if (Math.abs(surface[i] - (i === idx && reveal > 0.02 ? 1 : 0)) > 0.002) {
            floating = true
            break
          }
        }
      }
      /* 스크롤도 뷰포트도 그대로면 계산할 것도 다시 쓸 스타일도 없다
         (스냅이 안착한 뒤의 프레임이 대부분이다). */
      if (!floating && !dy && vw === layoutVw && vh === layoutVh) return

      /* 프로필에서 넘어올 때 딱 끊기지 않도록, 섹션은 화면 아래에서
         올라오는 만큼 스크롤에 묶여 페이드 인한다. */
      if (rootRef.current) {
        const top = track.getBoundingClientRect().top
        rootRef.current.style.opacity = smooth(1, 0.7, top / Math.max(vh, 1)).toFixed(3)
      }

      /* 제목만 보이는 여유 뒤에 사진이 스크롤 진행도에 묶여 떠오르고
         (되돌리면 다시 가라앉는다), 캡션·날자 같은 나머지는 사진이 다
         드러나는 지점에서 그냥 켜진다. */
      foregroundRef.current = reveal > 0.01
      if (stripRef.current) {
        stripRef.current.style.opacity = reveal.toFixed(3)
        stripRef.current.style.transform = `translate3d(0, ${((1 - reveal) * 48).toFixed(1)}px, 0)`
      }
      if (chromeRef.current) chromeRef.current.style.opacity = reveal > 0.9 ? '1' : '0'
      /* 판 크기·자리·캡션 위치는 뷰포트에서만 결정된다 — 리사이즈 때만
         다시 계산하고, 카드의 폭/높이 스타일도 그때만 쓴다. */
      if (vw !== layoutVw || vh !== layoutVh) {
        layoutVw = vw
        layoutVh = vh
        const mobile = vw < 700
        /* 좁은 화면에서는 판을 키우는 만큼 확대를 줄여 이웃 판이 남게 한다. */
        growAmt = mobile ? 0.45 : GROW
        const H0 = Math.min(vh * (mobile ? 0.56 : 0.48), (vw * (mobile ? 1.02 : 0.3)) / ASPECT, 620)
        centerY = vh * (mobile ? 0.44 : 0.45)
        const gap = Math.max(mobile ? 18 : 14, vw * 0.018)

        /* 판 자리는 모두 같은 간격으로 고정한다. 활성 판은 그 자리에서 확대만
           되므로(transform scale) 이웃 판이 밀려나거나 간격이 벌어지지 않는다. */
        cardH = H0 * CARD_SCALE
        const cardW = cardH * ASPECT
        let acc = 0
        for (let i = 0; i < N; i++) {
          H[i] = cardH
          W[i] = cardW
          X[i] = acc + cardW / 2
          acc += cardW + gap
          const el = cardsRef.current[i]
          if (!el) continue
          el.style.width = `${cardW}px`
          el.style.height = `${cardH}px`
        }

        /* 캡션은 확대된 활성 판 바로 아래(18px)에 앉는다. */
        if (captionRef.current) captionRef.current.style.top = `${centerY + (cardH * (1 + growAmt)) / 2 + 18}px`
      }

      const i0 = Math.floor(f)
      const i1 = Math.min(N - 1, i0 + 1)
      const focusX = lerp(X[i0], X[i1], f - i0)
      const offset = vw / 2 - focusX

      const now = performance.now()

      /* 물속 레이어의 페인트 판정에 쓰는 표면 합계. */
      let surfaceSum = 0

      for (let i = 0; i < N; i++) {
        const el = cardsRef.current[i]
        if (!el) continue
        const x = X[i] + offset
        /* 물속에 있는 동안은 그만큼 아래에 있고, 수면 위로 올라오면서
           제자리로 떠오른다물속 레이어는 아래 자리에 그대로 있다).
           확대는 판 중심 기준이라 자리(간격)는 움직이지 않는다. */
        const focus = bakedRef.current ? surface[i] : i === idx ? 1 : 0
        const lift = (1 - focus) * (bakedRef.current ? SUBMERGE : 0)
        const grow = 1 + growAmt * focus
        el.style.transform = `translate3d(${x - W[i] / 2}px, ${centerY - H[i] / 2 + lift}px, 0) skewX(${skew.toFixed(2)}deg) scale(${grow.toFixed(3)})`
        const img = imgsRef.current[i]
        if (img) img.style.transform = `translate3d(${clamp(-(i - f) * 7, -10, 10)}%, 0, 0) scale(1.22)`
        /* 물이 판을 그리는 동안: 수면 위로 올라온 만큼만 DOM 판을 보여준다.
           두 겹을 겹쳐 페이드하므로 활성 전환에 번쩍임이 없다. */
        if (bakedRef.current) {
          /* 목표에 거의 닿았으면 정확히 스냅한다 — 미세한 차이 때문에
             프레임 루프가 영원히 돌지 않게. */
          const goal = i === idx && reveal > 0.02 ? 1 : 0
          const next = lerp(surface[i], goal, 0.1)
          surface[i] = Math.abs(goal - next) < 0.002 ? goal : next
          surfaceSum += surface[i]
          el.style.opacity = surface[i].toFixed(3)
          /* 물 위로 올리기(z-index·그림자)도 같은 값으로 제어한다. React의
             is-active 클래스만 믿으면 프레임과 어긋나 물 아래에 남는다. */
          const surfaced = surface[i] > 0.5 ? '1' : ''
          if (el.dataset.surfaced !== surfaced) el.dataset.surfaced = surfaced
        }
      }

      /* 물속 레이어: 판 배치가 바뀔 때만 다시 그리고 셰이더에 넘긴다. */
      if (bakedRef.current) {
        const water = waterRef.current
        const layer = layerRef.current
        if (water && layer) {
          /* 다시 그릴 이유가 있는지만 숫자로 비교한다 — 문자열 키를 매 프레임
             조립하면 그 자체가 할당이고, filter()로 배열까지 만든다. */
          const loadedN = loadedCountRef.current
          const surfaceQ = Math.round(surfaceSum * 1000)
          if (
            painted.p !== p ||
            painted.fg !== foregroundRef.current ||
            painted.idx !== idx ||
            painted.vw !== vw ||
            painted.vh !== vh ||
            painted.loaded !== loadedN ||
            painted.surface !== surfaceQ
          ) {
            painted.p = p
            painted.fg = foregroundRef.current
            painted.idx = idx
            painted.vw = vw
            painted.vh = vh
            painted.loaded = loadedN
            painted.surface = surfaceQ
            paintUnderwater(layer, water, {
              vw,
              vh,
              f,
              centerY,
              offset,
              X,
              W,
              H,
              imgs: imgsRef.current,
              loaded: loadedRef.current,
              tints: TINTS,
              focus: FOCUS,
              reveal,
              growAmt,
              surface,
            })
            sceneRef.current?.draw()
          }
        }
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
        /* 다음 스크롤로 넘어갈 때 옆으로 지나가지 않고, 흐려지며 물 아래로
           가라앉는다. 완전히 지우지 않고 물속에 은은하게 남긴다. */
        const t = smooth(0, LEAD * 0.6, p)
        introRef.current.style.opacity = `${(1 - t * 0.8).toFixed(3)}`
        introRef.current.style.transform = `translate3d(0, ${(t * 48).toFixed(1)}px, 0)`
        introRef.current.style.filter = `blur(${(t * 4).toFixed(2)}px)`
      }

      if (idx !== lastActive) {
        lastActive = idx
        setActive(idx)
        /* 판이 바뀔 때마다 활성 판 중앙에서 물결이 퍼진다. 빠른 스크롤에서
           물이 거품이 되지 않도록 최소 간격을 둔다. */
        if (!reduced && foregroundRef.current && now - lastPulseAt > 260) {
          lastPulseAt = now
          sceneRef.current?.pulse(0.5, centerY / Math.max(vh, 1), 0.55)
        }
      }
    }

    /* 자유 스크롤 + 스냅. 스크롤이 멈추면 가장 가까운 날짜로 붑되, 고정 시간
       이징 대신 지금의 속도를 이어받는 크리티컬 댐핑 스프링으로 움직인다.
       사용자가 다시 스크롤하면 즉시 양보하므로 휠과 다투지 않는다. */
    let snapTimer: number | undefined
    let snapRaf = 0
    let snapping = false
    let snapPos = 0
    let snapVel = 0
    let snapTarget = 0
    let prevTime = 0
    let lastY = window.scrollY
    let lastT = performance.now()
    let velocity = 0
    /* 손가락이 화면에 닿아 있는 동안. 이때는 스냅을 걸지 않는다 — 대고
       멈춘 순간 페이지가 발밑에서 미끄러지면 안 된다. */
    let touching = false

    const stopSnap = () => {
      if (!snapping) return
      snapping = false
      cancelAnimationFrame(snapRaf)
    }

    const armSnap = () => {
      window.clearTimeout(snapTimer)
      snapTimer = window.setTimeout(snapToNearest, SNAP.delay)
    }

    /* 크리티컬 댐핑: a = ω²(목표 - 현재) - 2ω·속도. 초기 속도를 그대로
       이어받아 감속하므로 정렬이 시작되는 순간 속도가 끊기지 않는다. */
    const stepSnap = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - prevTime) / 1000))
      prevTime = now
      const w = SNAP.stiffness
      snapVel += (w * w * (snapTarget - snapPos) - 2 * w * snapVel) * dt
      snapPos += snapVel * dt
      if (Math.abs(snapTarget - snapPos) < 0.4 && Math.abs(snapVel) < 8) {
        window.scrollTo({ top: snapTarget, behavior: 'instant' as ScrollBehavior })
        snapping = false
        return
      }
      window.scrollTo({ top: snapPos, behavior: 'instant' as ScrollBehavior })
      snapRaf = requestAnimationFrame(stepSnap)
    }

    const snapToNearest = () => {
      if (snapping || touching || !st.isActive) return
      if (tweenRef.current?.isActive()) return
      const steps = N - 1
      const p = clamp(st.progress)
      /* 인트로 구간에서는 스냅하지 않는다. 첫 스톱도 LEAD 라서 멈춘 자리에
         그대로 남고, 0%로 되돌아가 첫 사진이 다시 가라앉지 않는다. */
      if (p < LEAD) return
      const i = Math.round(nav(p) * steps)
      const targetY = st.start + (LEAD + (i / steps) * (1 - LEAD)) * (st.end - st.start)
      if (Math.abs(window.scrollY - targetY) < 1) return
      if (reduced) {
        window.scrollTo({ top: targetY, behavior: 'auto' })
        return
      }
      snapTarget = targetY
      snapPos = window.scrollY
      /* 멈춘 직후의 잔여 속도만 절반쯤 이어받는다 — 과한 미끄러짐 없이
         속도가 끊기지 않는 정도. */
      snapVel = clamp(velocity * 0.5, -SNAP.maxVelocity, SNAP.maxVelocity)
      snapping = true
      prevTime = performance.now()
      snapRaf = requestAnimationFrame(stepSnap)
    }

    const onScroll = () => {
      const now = performance.now()
      const y = window.scrollY
      const dt = Math.max(8, now - lastT)
      // 스냅이 쓴 스크롤은 속도 측정에서 제외(자기 속도 되먹임 방지)
      if (!snapping) velocity = lerp(velocity, ((y - lastY) / dt) * 1000, 0.4)
      lastY = y
      lastT = now
      armSnap()
    }

    /* 휠·터치·클릭이 오면 스냅을 바로 놓아준다 — 스크롤을 방해하지 않는다. */
    const yieldToUser = () => {
      stopSnap()
      velocity = 0
      lastY = window.scrollY
      lastT = performance.now()
    }

    /* 터치는 시작·종료를 따로 본다 — 드래그 중에는 스냅을 막고, 손을 뗀
       뒤(관성 스크롤이 끝난 뒤)에야 정렬 기회를 준다. */
    const onTouchStart = () => {
      touching = true
      yieldToUser()
    }
    const onTouchEnd = (e: TouchEvent) => {
      /* 손가락이 여럿일 때 하나만 뗀 경우엔 아직 끌고 있는 중이다. */
      touching = (e.touches?.length ?? 0) > 0
      if (!touching) armSnap()
    }
    const onTouchCancel = () => {
      touching = false
      armSnap()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel', yieldToUser, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchCancel, { passive: true })
    window.addEventListener('pointerdown', yieldToUser, { passive: true })

    gsap.ticker.add(frame)
    frame()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', yieldToUser)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchCancel)
      window.removeEventListener('pointerdown', yieldToUser)
      cancelAnimationFrame(snapRaf)
      window.clearTimeout(snapTimer)
      gsap.ticker.remove(frame)
      ro.disconnect()
      st.kill()
      stRef.current = null
    }
  }, [reduced])

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return
    const title = track.querySelector('.fl-intro-reveal')
    foregroundRef.current = false
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(title, { opacity: 1, y: 0, scale: 1, filter: 'none' })
        return
      }
      /* 물은 프레임 루프가 스크롤에 묶어 페이드 인시킨다. 제목은 도착 뒤
         한 박자(0.9s)를 두고 히어로 인트로처럼 물 위로 떠오른다. */
      gsap.timeline({ scrollTrigger: { trigger: track, start: 'top 80%', once: true } }).fromTo(
        title,
        { opacity: 0, y: 18, scale: 0.97, filter: 'blur(4px)' },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.1,
          ease: 'power3.out',
          onStart: () => sceneRef.current?.pulse(0.5, 0.52, 0.85),
        },
        '+=0.9',
      )
    }, track)
    return () => ctx.revert()
  }, [reduced])

  /* ------------------------------------------------------------ actions */
  const scrollToProgress = (target: number) => {
    const st = stRef.current
    if (!st) return
    const y = st.start + (LEAD + clamp(target) * (1 - LEAD)) * (st.end - st.start)
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
    <div ref={rootRef} className="fl-root">
      <section
        id="work"
        ref={trackRef}
        className="fl-track"
        style={{ height: `${N * 42 + 170}vh` }}
        aria-label="Work experience"
      >
        <div ref={stageRef} className="fl-stage">
          {/* 히어로의 물: 같은 씬을 카드・글자 아래(z-0)에 깔아 배경으로 쓴다. */}
          <div aria-hidden="true" className="fl-water-bg" />
          <div aria-hidden="true" className="fl-water">
            <canvas ref={waterRef} className="size-full" />
          </div>

          <div className="fl-intro-reveal" aria-hidden="true">
            <p ref={introRef} className="fl-intro"><span>work:</span> <strong>experience</strong></p>
          </div>

          <div ref={chromeRef} className="fl-chrome">
            <div ref={captionRef} className="fl-caption" aria-live="polite">
              <span key={active} className="fl-caption__title">{plate.title}</span>
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

            {!ready && (
              <div className="fl-loader" role="status">
                Developing plates {String(loadedCount).padStart(2, '0')} / {N}
              </div>
            )}
          </div>

          <div ref={stripRef} className="fl-strip">
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
        </div>
      </section>
    </div>
  )
}
