import { animate } from 'animejs'
import { useEffect, useState, type CSSProperties } from 'react'

import { INTRO_HOLD_MS, INTRO_OUT_MS } from '../lib/intro'
import { prefersReduced } from '../lib/reduced'
import './preloader.css'

/* 인트로 — 조용한 판. 왼쪽에 브랜드, 가운데에 이름, 오른쪽에 진행률.
   좌우는 헤더와 같은 폭·여백을 쓴다(max-w 1400px, 14px / 32px).
   최소 2초를 채운 뒤 판이 흐려지며 히어로가 드러난다. */

const BRAND = 'DE:SIGN MY LIFE'
const NAME = 'CHOI YOUNG JAE'

export function Preloader() {
  const [show, setShow] = useState(() => typeof window !== 'undefined' && !prefersReduced())
  const [count, setCount] = useState(0)
  const [entered, setEntered] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!show) return
    document.body.style.overflow = 'hidden'

    /* 마운트 직후 한 프레임 뒤에 켜야 처음 위치에서 전환이 걸린다. */
    const raf = requestAnimationFrame(() => setEntered(true))

    /* 2초를 채우는 동안 100까지 오른다. */
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
      document.body.style.overflow = ''
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
