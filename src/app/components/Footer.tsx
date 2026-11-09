/* 마지막 화면 — 뒤로 한 줄 마퀴가 흐르고, 그 앞으로 수액팩이 25도 기운 채
   아래에서 솟아오른다. 팩 아래에는 주소와 워드마크가 줄을 바꿔 놓인다.
   등장은 뷰포트에 들어올 때 한 번만 켜고, 모션 최소화 설정에서는 바로
   정착 상태로 그린다. */
import { useEffect, useRef, useState } from 'react'

import { prefersReduced } from '../lib/reduced'
import './finale.css'

const EMAIL = 'harok96y@naver.com'
const LINE = '감성과 감각과 배려로 여운을 남기다'
const SIGN = 'de:sign my life'

export function Footer() {
  const root = useRef<HTMLElement>(null)
  const [live, setLive] = useState(false)

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
          똑같은 두 덩이를 gap 없이 붙이고 -50%로 굴린다. */}
      <div aria-hidden className="fin-marquee-mask pointer-events-none absolute inset-0 flex items-center overflow-hidden">
        <div className="fin-marquee animate-marquee flex w-max items-center font-display text-[clamp(52px,10vw,150px)] font-medium leading-none tracking-[-0.04em] text-fg/10 [animation-duration:70s] motion-reduce:animate-none">
          {[0, 1].map((i) => (
            <span key={i} className="flex items-center gap-[0.35em] pr-[0.35em]">
              <span className="whitespace-nowrap">{LINE}</span>
              <span className="text-fg/20">·</span>
            </span>
          ))}
        </div>
      </div>

      <div className="relative flex flex-col items-center px-5 pt-14 pb-10 sm:px-8">
        <img
          src="/images/iv-bag.webp"
          alt=""
          width={780}
          height={1326}
          draggable={false}
          className="fin-bag block w-[min(67vw,396px)] select-none"
        />

        {/* 두 줄은 한 덩이로 — 주소가 앞서고 워드마크가 0.75 비율로 따라붙는다. */}
        <div className="fin-meta mt-[clamp(56px,8vw,76px)] flex flex-col items-center gap-1.5 text-center">
          <a
            href={`mailto:${EMAIL}`}
            className="link-draw text-[clamp(22px,5.6vw,34px)] leading-[1.1] font-bold tracking-[-0.025em]"
          >
            {EMAIL}
          </a>
          <span className="font-script text-[clamp(17px,3.4vw,25px)] leading-none text-fg/70">{SIGN}</span>
        </div>
      </div>
    </footer>
  )
}
