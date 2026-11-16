import { animate } from 'animejs'
import { useEffect, useState, type CSSProperties } from 'react'

import { INTRO_HOLD_MS, INTRO_OUT_MS } from '../lib/intro'
import { prefersReduced } from '../lib/reduced'
import './preloader.css'

/* 인트로 — 조용한 판. 왼쪽에 브랜드, 가운데에 이름, 오른쪽에 진행률.
   좌우는 헤더와 같은 폭·여백을 쓴다(max-w 1400px, 14px / 32px).
   최소 1.5초를 채운 뒤 판이 흐려지며 히어로가 드러난다. */

const BRAND = 'DE:SIGN MY LIFE'
const NAME = 'CHOI YOUNG JAE'

export function Preloader() {
  const [show, setShow] = useState(() => typeof window !== 'undefined' && !prefersReduced())
  const [count, setCount] = useState(0)
  const [entered, setEntered] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!show) return
    document.documentElement.classList.add('preloading')

    /* 마운트 직후 한 프레임 뒤에 켜야 처음 위치에서 전환이 걸린다. */
    const raf = requestAnimationFrame(() => setEntered(true))

    /* 로딩 시간 동안 100까지 오른다. */
    const counter = { value: 0 }
    const counting = animate(counter, {
      value: 100,
      duration: INTRO_HOLD_MS - 150,
      delay: 150,
      ease: 'inOutQuad',
      onUpdate: () => setCount(Math.round(counter.value)),
    })

    const out = window.setTimeout(() => setLeaving(true), INTRO_HOLD_MS)
    const done = window.setTimeout(() => setShow(false), INTRO_HOLD_MS + INTRO_OUT_MS)

    return () => {
      cancelAnimationFrame(raf)
      counting.pause()
      window.clearTimeout(out)
      window.clearTimeout(done)
      document.documentElement.classList.remove('preloading')
    }
  }, [show])

  if (!show) return null

  return (
    <div
      className={`pre${entered ? ' is-in' : ''}${leaving ? ' is-leaving' : ''}`}
      role="progressbar"
      aria-label="페이지를 불러오는 중"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={count}
    >
      <svg className="pre-watercolor-defs" aria-hidden="true" focusable="false">
        <defs>
          <filter id="pre-ink-edge" x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="3" seed="8" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="90" xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <radialGradient id="pre-ink-gradient">
            <stop offset="45%" stopColor="black" />
            <stop offset="75%" stopColor="#333" />
            <stop offset="100%" stopColor="white" />
          </radialGradient>
          <mask id="pre-watercolor-mask" maskContentUnits="objectBoundingBox">
            <rect width="1" height="1" fill="white" />
            <g transform="scale(0.001)" filter="url(#pre-ink-edge)">
              <circle className="pre-ink pre-ink--one" cx="220" cy="340" r="520" fill="url(#pre-ink-gradient)" />
              <circle className="pre-ink pre-ink--two" cx="760" cy="650" r="500" fill="url(#pre-ink-gradient)" />
              <circle className="pre-ink pre-ink--three" cx="620" cy="180" r="440" fill="url(#pre-ink-gradient)" />
            </g>
          </mask>
        </defs>
      </svg>
      <div className="pre-message" aria-hidden="true" style={{ '--progress': `${count}%` } as CSSProperties}>
        잠시만 기다려주세요 :)
        <span className="pre-message-fill">잠시만 기다려주세요 :)</span>
      </div>
      {/* 헤더와 같은 좌우 — 같은 최대 폭, 같은 안쪽 여백. */}
      <div className="pre-inner">
        <div className="pre-left">
          <span className="pre-mask">
            <span className="pre-line is-muted" style={{ '--i': 0 } as CSSProperties}>
              {BRAND}
            </span>
          </span>
        </div>

        <div className="pre-center">
          <span className="pre-mask">
            <span className="pre-line" style={{ '--i': 1 } as CSSProperties}>
              {NAME}
            </span>
          </span>
        </div>

        <div className="pre-right">
          <span className="pre-mask">
            <span className="pre-line pre-progress" style={{ '--i': 2 } as CSSProperties}>
              {String(count).padStart(3, '0')}%
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
