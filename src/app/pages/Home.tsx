import { animate } from 'animejs'
import { ArrowUpRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'

import { site, testimonials } from '../../data/site'
import { FigmaSelect } from '../components/FigmaSelect'
import { Florilegium } from '../components/Florilegium'
import { Hero } from '../components/Hero'
import { Lines, Magnetic, Parallax, Reveal } from '../components/motion'
import { Statement } from '../components/Statement'
import { ToolPop } from '../components/ToolPop'
import { cx } from '../lib/cx'
import { prefersReduced } from '../lib/reduced'

/* 프로필 키워드 팝오버 내용 — 호버 시 각 키워드 아래에 펼쳐지는
   설명 목록(불릿 텍스트). */
const PROFILE_TOOLS = {
  design: [
    'Photoshop 과 같은 그래픽 디자인 툴을 능숙하게 다뤄요',
    'Illustrator 와 같은 벡터 디자인 툴을 능숙하게 다뤄요',
    'Figma, adobeXD 와 같은 프로토타이핑, UIUX 툴을 능숙하게 다뤄요',
    'Zeplin 과 같은 디자인-개발자 협업 툴 사용이 가능해요.',
  ],
  front: [
    'HTML, CSS를 이용한 마크업 작성을 웹표준에 준수하게 할 수 있어요.',
    'SEO, AEO 등에 대한 이해가 있어요.',
    'AI를 통한 퍼블리싱, 프론트 작업을 정교하고 능숙하게 할 수 있어요.',
    'Vue, React 와 같은 프레임워크 환경에서 컴포넌트 단위의 마크업 작업이 가능해요.',
  ],
  dev: [
    '개발과 협업에 용이한 퍼블리싱이 가능해요.',
    'JavaScript, jQuery, PHP 를 이용한 개발, 유지보수에 능숙해요.',
    'React, Vue와 같은 프레임워크 환경에서의 유지보수가 가능해요.',
    'Git, SVN 과 같은 형상 관리 시스템 내에서의 버전 관리를 통한 협업이 가능해요.',
    'AI를 이용한 개발 작업을 유지보수와 보안을 놓치지 않고 할 수 있어요.',
  ],
}

/* What I do 아래 링크 목록 — 왼쪽이 제목, 오른쪽이 일한 곳(in COMPANY).
   판이나 아이콘 없이 텍스트만 두고, 회사 이름만 링크로 읽히게 한다.
   실제 회사·주소로 바꿀 때는 이 배열만 고치면 된다. */
const CREDITS = [
  { title: 'Brand identity', places: ['BDSCAST'], image: '/images/aurora.jpg' },
  { title: 'Product design', places: ['MECROSS'], image: '/images/meridian.jpg' },
  { title: 'Websites', places: ['BDSCAST'], image: '/images/halcyon.jpg' },
  { title: 'Creative development', places: ['MECROSS'], image: '/images/fold.jpg' },
]

export function Home() {
  const copyRef = useRef<HTMLDivElement>(null)

  /* 팝오버는 단어 아래(다른 문단과 겹칠 수 있는 영역) 떠야 하므로,
     마우스가 올라간 키워드가 속한 문단을 맨 앞으로 올린다(문단에
     position:relative가 있어 z-index가 동작) — Statement 섹션과 같은
     방식. 또 화면 오른쪽에 붙은 키워드는 팝오버를 오른쪽 가장자리로
     붙여 창 밖으로 나가지 않게 한다. */
  useEffect(() => {
    const root = copyRef.current
    if (!root) return
    const words = Array.from(root.querySelectorAll<HTMLElement>('.tool-pop'))
    const verses = Array.from(root.querySelectorAll('p'))
    const clamp = () => {
      for (const word of words) {
        const room = window.innerWidth - 12 - word.getBoundingClientRect().left
        if (room < 360) word.dataset.clamp = ''
        else delete word.dataset.clamp
      }
    }
    clamp()
    window.addEventListener('resize', clamp)
    document.fonts?.ready.then(clamp)
    const onOver = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null
      const word = target && target.closest('.tool-pop')
      verses.forEach((verse) => { verse.style.zIndex = '' })
      if (word) {
        const verse = word.closest('p') as HTMLElement | null
        if (verse) verse.style.zIndex = '2'
      }
    }
    root.addEventListener('pointerover', onOver)
    return () => {
      root.removeEventListener('pointerover', onOver)
      window.removeEventListener('resize', clamp)
    }
  }, [])

  return (
    <>
      <Hero />

      {/* The statement, with the powder field behind it */}
      <Statement />

      {/* Marquee: 프로필 뒤로 흐르는 유령 밴드. 글자 280px, 밴드 전체 투명도
          2%. 프로필 섹션이 위(z-10)에 얹히고 이 밴드는 아래(z-0)에서 흐른다. */}
      <div className="relative z-0 overflow-hidden py-8" aria-hidden>
        <ul className="animate-marquee flex w-max items-center gap-20 whitespace-nowrap font-display text-[280px] leading-none opacity-[0.02] [animation-duration:80s]">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <li key={i} className="flex items-center gap-20">
              <span className="font-light">DE:SIGN</span>
              <span className="font-bold">MY LIFE</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Profile: 텍스트 섹션 바로 아래. 위 여백을 줄여 위쪽으로 당겨
          뒤의 마퀴 밴드(2% 투명 유령 글자)와 겹치게 하고, z-10으로
          밴드보다 앞에 있게 한다. 바탕색은 페이지 배경(#eef5f6)을 그대로
          써서 앞뒤 섹션과의 경계 없이 이어진다. */}
      <section className="relative z-10 mx-auto max-w-[1400px] px-5 -mt-[260px] sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <Reveal>
            <FigmaSelect className="mx-auto max-w-[460px]" label="Profile.jpg" radius="28px">
              <Parallax src="/images/portrait.jpg" alt={site.name} className="aspect-[3/4] rounded-image" strength={6} />
            </FigmaSelect>
          </Reveal>
          <div className="flex flex-col justify-center">
            <Lines
              as="h2"
              className="font-display text-balance text-[24px]"
              lines={['상상하고, 구체화하고 구현합니다.']}
            />
            <Reveal delay={0.2} className="relative z-10 mt-8 max-w-xl text-pretty text-[18px] leading-relaxed text-muted">
              <div ref={copyRef}>
                <p>
                  안녕하세요, 최영재입니다.
                  <br />
                  상상을 구현하는 것을 즐거워했고, 여전히 즐거워하며 작업해요.
                </p>
                <p className="relative mt-4">
                  <ToolPop word="디자인" items={PROFILE_TOOLS.design} />을 섬세하게 다루고,
                  <br />
                  다양한 환경에서의 <ToolPop word="프론트 작업" items={PROFILE_TOOLS.front} />을 접근성과 웹표준을 고려해 능숙하게 할 수 있어요.
                </p>
                <p className="relative mt-4">
                  <ToolPop word="개발 지식" items={PROFILE_TOOLS.dev} />이 있어 개발자와의 협업에도 능한 편이고,
                  <br />
                  AI를 수준급으로 다룰 수 있어요.
                </p>
                <p className="relative mt-4">
                  UX 에 관심이 많아 사용자를 생각한 섬세한 작업을 하는 것을 좋아해요.
                  <br />
                  다양한 사람들과 함께 상상을 현실로 만들어 가려고 해요.
                </p>
              </div>
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

      {/* Work — 임시: Florilegium 피셔아이 갤러리(프롬프트 기반). 이후 요청에 맞춰 수정. */}
      <Florilegium />

      {/* Services */}
      <section className="mx-auto max-w-[1400px] px-5 pt-32 sm:px-8 sm:pt-44">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-20">
          <div>
            <Lines as="h2" className="font-display text-[40px] sm:text-[56px]" lines={['그리고..']} />
            <Reveal delay={0.1} className="mt-4 max-w-xs text-[16px] text-muted">
              이런 것들을 더 해왔어요.
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

/* 수상 내역처럼 한 줄에 제목과 링크 텍스트만 두는 목록. 줄 전체가 링크이고,
   오른쪽 회사 이름은 호버에서만 밑줄이 그어진다. 좁은 화면에서는 회사
   이름이 제목 아래로 내려간다(같은 마크업, 그리드 열만 바뀐다). */
function Services() {
  const [active, setActive] = useState<number | null>(null)
  const ghost = useRef<HTMLDivElement>(null)
  const point = useRef({ x: 0, y: 0 })

  /* 커서를 따라오는 미리보기. 줄에 올라간 동안에만 창에 좌표 리스너를 걸고,
     위치는 리스너 안에서 바로 쓴다(rAF 없이도 포인터 이벤트만큼만 움직임).
     터치에서는 뜨지 않는다 — 떠도 손끝을 가릴 뿐이다. */
  useEffect(() => {
    if (active === null) return
    const el = ghost.current
    if (!el) return
    const place = (x: number, y: number) => {
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
    }
    place(point.current.x, point.current.y)
    const onMove = (event: PointerEvent) => {
      point.current = { x: event.clientX, y: event.clientY }
      place(event.clientX, event.clientY)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [active])

  return (
    <>
      <ul className="border-t border-line" onPointerLeave={() => setActive(null)}>
        {CREDITS.map((row, i) => (
          <li key={row.title} className="border-b border-line">
            <Link
              to="/work"
              onPointerEnter={(event) => {
                if (event.pointerType !== 'mouse') return
                point.current = { x: event.clientX, y: event.clientY }
                setActive(i)
              }}
              className="group grid grid-cols-[1.75rem_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1.5 py-6 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:gap-x-6 sm:py-7"
            >
              <span className="text-[13px] tabular-nums text-faint sm:text-[14px]">0{i + 1}</span>
              <span className="font-display text-[26px] leading-[1.1] text-fg/60 transition-colors duration-300 group-hover:text-fg sm:text-[42px]">
                {row.title}
              </span>
              <span className="col-start-2 flex items-baseline gap-2 text-[14px] text-muted transition-colors duration-300 group-hover:text-fg sm:col-start-3 sm:text-[16px]">
                {row.places.map((place, j) => (
                  <span key={place} className="flex items-baseline gap-2">
                    {j > 0 && <span className="text-faint">/</span>}
                    <span className="link-draw">in {place}</span>
                  </span>
                ))}
                <ArrowUpRight className="size-4 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* 미리보기 — 고정 위치에 떠 있고 좌표만 따라온다. 네 장을 모두 올려
          두고 투명도만 바꿔, 줄을 옮길 때 이미지가 다시 로드되지 않는다.
          body 로 포털해 두는 이유: 조상 중 transform/filter 가 있으면
          position:fixed 가 그 조상 기준이 되어 페이지와 함께 미끄러진다. */}
      {createPortal(
        <div
          ref={ghost}
        aria-hidden
          className={cx(
            'pointer-events-none fixed left-0 top-0 z-[60] hidden w-[260px] overflow-hidden rounded-[16px] border border-line bg-surface-2 shadow-[0_24px_50px_-30px_rgb(7_25_27/0.55)] transition-[opacity,scale] duration-300 ease-out will-change-transform md:block',
            active === null ? 'scale-75 opacity-0' : 'scale-100 opacity-100',
          )}
        >
          <div className="relative aspect-[4/3]">
            {CREDITS.map((row, i) => (
              <img
                key={row.title}
                src={row.image}
                alt=""
                draggable={false}
                className={cx('absolute inset-0 size-full object-cover transition-opacity duration-300', active === i ? 'opacity-100' : 'opacity-0')}
              />
            ))}
          </div>
        </div>,
        document.body,
      )}
    </>
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
