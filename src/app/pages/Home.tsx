import { animate } from 'animejs'
import { ArrowUpRight, Plus } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'

import { services, site, testimonials } from '../../data/site'
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
