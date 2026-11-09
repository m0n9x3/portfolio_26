/* 마지막 화면 — 뒤로 한 줄 마퀴가 흐르고, 그 앞으로 수액팩이 16도 기운 채
   아래에서 솟아오른다. 팩 아래에는 건네는 한 줄과 주소가 놓인다.
   등장이 끝나면 잡담이 화면 위로 떠오르는데, 모두 마퀴 앞·수액팩 뒤에 깔린다.
   마지막에 강아지 사진이 뜨고 그 둘레에 문장이 붙는다. 등장은 뷰포트에
   들어올 때 한 번만 켜고, 모션 최소화 설정에서는 바로 정착 상태로 그린다. */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

import { prefersReduced } from '../lib/reduced'
import './finale.css'

const EMAIL = 'harok96y@naver.com'
const LINE = '감성과 감각과 배려로 여운을 남기다'

/* 잡담 — 등장이 끝난 뒤 사방에서 하나씩 떠오른다. */
const CHATTER = [
  '퇴근 후에 맥주 마셔야지..',
  '포폴 만들기 짱 힘들다...',
  '와 이번 디자인 진짜 미쳤다!!!',
  '금일 카페인 섭취량: 치사량 직전',
  '초밥 먹고 싶다...',
  '드디어 끝났다!!!',
  '시안_최종_진짜최종.psd',
  '처음거가 가장 예쁘네요.',
]

/* 사진 둘레에서만 말하는 한 줄. */
const NEAR_DOG = '여기 가나디 있지 않았어요?'

const pick = (a: number, b: number) => a + Math.random() * (b - a)

/* 자리 — 떠오를 때마다 이 넷만 새로 뽑는다(속도·주기는 그대로 두어야
   애니메이션이 중간에 끊기지 않는다). */
type Spot = { left: number; bottom: number; rise: number; rot: number }
type Drift = Spot & {
  /* 화면 기준 중심 x(px) — 가로 어디에도 놓을 수 있게 px 로 잡는다. */
  delay: number
  duration: number
  size: number
  peak: number
  sway: number
}

/* 화면 안에 들어오는 중심 x 범위에서 뽑는다. edge 면 팩이 덮는 가운데를
   피해 바깥 띠에만 앉힌다(사진용). */
function spot(vw: number, width: number, opts: { band?: [number, number]; edge?: boolean } = {}): Spot {
  const half = width / 2
  /* 좌우 흔들림(±5px)과 폭 추정 오차가 화면 밖으로 새지 않게 여유를 18px. */
  const lo = half + 18
  const hi = vw - half - 18
  let left = vw / 2
  if (hi > lo) {
    if (opts.edge) {
      const near = pick(lo, Math.max(lo + 1, Math.min(vw * 0.3, hi)))
      const far = pick(Math.min(hi - 1, Math.max(vw * 0.7, lo)), hi)
      left = Math.random() < 0.5 ? near : far
    } else {
      left = pick(lo, hi)
    }
  }
  const [top, floor] = opts.band ?? [8, 74]
  return { left, bottom: pick(top, floor), rise: pick(90, 190), rot: pick(-6, 6) }
}

function makeDrift(vw: number, width: number, opts?: { band?: [number, number]; edge?: boolean }): Drift {
  return {
    ...spot(vw, width, opts),
    /* 등장 애니메이션(팩 + 주소)이 끝나는 1.9초 직후부터 — 바로 보이게. */
    delay: pick(1900, 3000),
    duration: pick(12000, 20000),
    size: Math.round(pick(12, 14)),
    peak: pick(0.28, 0.5),
    sway: pick(2600, 4800),
  }
}

const driftStyle = (d: Drift) =>
  ({
    left: `${d.left}px`,
    bottom: `${d.bottom}%`,
    animationDelay: `${d.delay}ms`,
    animationDuration: `${d.duration}ms`,
    '--rise': `${d.rise}px`,
    '--rot': `${d.rot}deg`,
    '--peak': d.peak,
  }) as CSSProperties

/* 한 줄이 한 번 떠오를 때마다 자리를 새로 뽑는다 — 같은 자리에서만 나오지 않게. */
function Drifter({ vw, text, size, base }: { vw: number; text: string; size: number; base: Drift }) {
  const [s, setS] = useState<Spot>(base)
  const el = useRef<HTMLDivElement>(null)
  const width = text.length * size * 1.02 + 14

  /* 그려진 폭으로 자리를 잡는다 — 글자 폭은 폰트에 따라 달라, 추정만으로는
     긴 문장이 화면 밖으로 몇 px 새어 나간다. */
  useLayoutEffect(() => {
    const d = el.current
    const inner = d?.firstElementChild
    if (!d || !inner) return
    const half = inner.getBoundingClientRect().width / 2 + 8
    d.style.left = `${Math.min(Math.max(s.left, half), window.innerWidth - half)}px`
  }, [s])

  return (
    <div
      ref={el}
      className="fin-drift"
      style={driftStyle({ ...base, ...s })}
      /* 안쪽 흔들림(.fin-sway)의 반복 이벤트도 여기로 올라온다 — 자기
         애니메이션이 끝났을 때만 자리를 새로 뽑는다(보이는 중에 튀지 않게). */
      onAnimationIteration={(e) => {
        if (e.target === e.currentTarget) setS(spot(vw, width))
      }}
    >
      <div className="-translate-x-1/2">
        <span
          className="fin-sway whitespace-nowrap text-fg"
          style={{ fontSize: `${size}px`, animationDuration: `${base.sway}ms` }}
        >
          {text}
        </span>
      </div>
    </div>
  )
}

/* 사진 — 마퀴 앞, 팩 뒤. 한 바퀴 돌 때마다 자리와 이름표가 함께 새로 잡힌다. */
function Dog({ vw }: { vw: number }) {
  const size = Math.min(200, vw * 0.46)
  const base = useMemo(
    () => ({
      ...makeDrift(vw, size, { band: [22, 48], edge: true }),
      delay: pick(2000, 2800),
      duration: pick(15000, 21000),
      rise: pick(120, 180),
      peak: 0.95,
    }),
    [vw, size],
  )
  const [pos, setPos] = useState<Spot>(base)

  return (
    <div
      className="fin-drift"
      style={driftStyle({ ...base, ...pos, size: 12 })}
      /* 안쪽 흔들림(.fin-sway)의 반복 이벤트도 여기로 올라온다 — 자기
         애니메이션이 끝났을 때만 자리를 새로 뽑는다. */
      onAnimationIteration={(e) => {
        if (e.target === e.currentTarget) setPos(spot(vw, size, { band: [22, 48], edge: true }))
      }}
    >
      <div className="-translate-x-1/2">
        <div className="fin-sway" style={{ animationDuration: `${base.sway}ms` }}>
          <img
              src="/images/ganadi.gif"
              alt=""
              width={200}
              height={200}
              draggable={false}
              className="block w-[min(200px,46vw)] select-none"
            />
        </div>
      </div>
    </div>
  )
}

/* 떠오르는 것들 — 모두 한 겹에 담아 마퀴 바로 위, 수액팩 바로 아래에 놓는다. */
function Float({ vw }: { vw: number }) {
  const texts = useMemo(
    () =>
      CHATTER.map((text) => {
        const d = makeDrift(vw, text.length * 13 * 1.02 + 14)
        return { text, d }
      }),
    [vw],
  )

  const near = useMemo(
    /* 사진이 뜬 뒤라 조금만 늦게. */
    () => ({ ...makeDrift(vw, NEAR_DOG.length * 12 * 1.02 + 14), size: 12, delay: pick(3200, 4600) }),
    [vw],
  )

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {texts.map((t) => (
        <Drifter key={t.text} vw={vw} text={t.text} size={t.d.size} base={t.d} />
      ))}

      <Dog vw={vw} />

      {/* 사진이 뜬 뒤, 사진 둘레에서 늦게 한 번 더 말을 건다. */}
      <Drifter vw={vw} text={NEAR_DOG} size={12} base={near} />
    </div>
  )
}

export function Footer() {
  const root = useRef<HTMLElement>(null)
  const [live, setLive] = useState(false)
  const [vw, setVw] = useState(() => (typeof window === 'undefined' ? 720 : window.innerWidth))

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const el = root.current
    if (!el) return
    if (prefersReduced()) {
      setLive(true)
      return
    }
    /* 스크롤에서 직접 잰다 — 페이지 높이가 자라는 도중에도 확실히 걸리고,
       한 번 열면 리스너를 바로 뗀다. 마운트 시점 검사가 #contact로 바로
       들어온 경우를 같이 처리한다. */
    const stop = () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
    const check = () => {
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight * 0.86 && rect.bottom > 0) {
        setLive(true)
        stop()
      }
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return stop
  }, [])

  return (
    <footer
      id="contact"
      ref={root}
      data-live={live}
      className="fin relative isolate flex min-h-[100svh] flex-col justify-center overflow-hidden border-t border-line"
    >
      {/* 뒤편의 한 줄 — 흐림 없이, 화면 폭보다 길게 흐른다. 이음매가 없도록
          똑같은 두 덩이를 붙이고 -50%로 굴린다. */}
      <div aria-hidden className="fin-marquee-mask pointer-events-none absolute inset-0 flex items-center overflow-hidden">
        <div className="fin-marquee animate-marquee flex w-max items-center font-display text-[clamp(52px,10vw,150px)] font-medium leading-none tracking-[-0.04em] text-fg/10 [animation-duration:70s] motion-reduce:animate-none">
          {[0, 1].map((i) => (
            <span key={i} className="whitespace-nowrap pr-[0.5em]">
              {LINE}
            </span>
          ))}
        </div>
      </div>

      <Float vw={vw} />

      <div className="relative flex flex-col items-center px-5 pt-14 pb-10 sm:px-8">
        {/* 그림자는 감싼 상자에 준다 — 팩의 블러 인(filter)이 상쇄되지 않게. */}
        <div className="fin-bag-cast w-fit">
          <img
            src="/images/iv-bag.webp"
            alt=""
            width={780}
            height={1326}
            draggable={false}
            className="fin-bag block w-[min(67vw,396px)] select-none"
          />
        </div>

        {/* 팩 아래 두 줄 — 한 줄 건네고, 주소가 이어진다. */}
        <div className="fin-meta mt-[clamp(56px,8vw,76px)] flex flex-col items-center gap-1.5 text-center">
          <p className="text-[18px] leading-[1.4] text-muted">함께 하고 싶어요 :)</p>
          <span className="text-[clamp(22px,5.6vw,34px)] leading-[1.1] font-bold tracking-[-0.025em]">
            {EMAIL}
          </span>
        </div>
      </div>
    </footer>
  )
}
