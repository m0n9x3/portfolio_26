import { useEffect, useRef, useState } from 'react'

import { createPowderScene } from '../lib/powderScene'
import { prefersReduced } from '../lib/reduced'

/* The statement the reader scrolls through. It is pinned for 80% of a screen:
   the words are written in one glyph at a time, and the three boxes land inside
   that stretch. */
type Run = { text: string; word?: string; strong?: boolean }

/* The copy that appears under a highlighted word on hover. */
const POPOVERS: Record<string, string> = {
  감성: '사람과 사람을 잇습니다. 따스함을 느끼게 합니다.',
  감각: '미려하고 아름답게 합니다. 최선을 찾습니다.',
  배려: '사용자를 생각합니다. 다른 입장에서 항상 바라봅니다.',
}

const STANZAS: Run[][][] = [
  [
    [{ text: '모두가 비슷해져가는 AI의 시대에,' }],
    [
      { text: '감성', word: '감성' },
      { text: '과 ' },
      { text: '감각', word: '감각' },
      { text: ', 그리고 ' },
      { text: '배려', word: '배려' },
      { text: '를 추구합니다.' },
    ],
  ],
  [
    [{ text: '그렇게 달려나간 길에 잘못된 길은 없었고,' }],
    [{ text: '앞으로도 틀리지 않을 것', strong: true }, { text: '이라고 믿고 있어요.' }],
  ],
]

/* Why every glyph is its own element: the ink has to arrive in the order the
   sentence was written, and a glyph is the smallest unit that can carry that.
   Spaces stay plain text so lines still break at words. */
type Char = { ch: string; index: number }
type Built = { run: Run; chars: Char[]; end: number }

function build() {
  let index = 0
  const stanzas: Built[][][] = STANZAS.map((stanza) =>
    stanza.map((runs) =>
      runs.map((run) => {
        const chars = [...run.text].map((ch) => (ch === ' ' ? { ch, index: -1 } : { ch, index: index++ }))
        return { run, chars, end: index }
      }),
    ),
  )
  return { stanzas, total: index }
}

const TEXT = build()

const FULL_TEXT = STANZAS.map((stanza) => stanza.map((runs) => runs.map((run) => run.text).join('')).join(' ')).join(' ')

export function Statement() {
  const pin = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLElement>(null)
  const text = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [reduced] = useState(prefersReduced)    /* Writing: a character takes its ink as the scroll passes it, and a boxed word
       flips the moment its last glyph has been written, so the box lands on a
       word that is already fully inked. The writing finishes by the pin's 80%
       mark, so the last 20% of the pin is a calm tail to read the text. */
  useEffect(() => {
    const section = pin.current
    const root = text.current
    if (!section || !root) return

    const chars = Array.from(root.querySelectorAll<HTMLElement>('[data-char]'))
    const words = Array.from(root.querySelectorAll<HTMLElement>('[data-word]'))
    const wordEnds = words.map((word) => Number(word.dataset.end))
    const marks = Array.from(root.querySelectorAll<HTMLElement>('[data-mark]'))
    const markEnds = marks.map((mark) => Number(mark.dataset.end))
    /* 스탠자별 라이즈 순서 계산용: 각 문단의 첫 글자가 전체 글자에서
       차지하는 비율. 잉크 진행 raw 식 (0.02 + 비율 * 0.78)이 그 문단에
       잉크가 닿기 시작하는 핀 진행도가 된다. */
    const verses = Array.from(root.querySelectorAll('p'))
    const starts = verses.map((verse) => {
      const first = verse.querySelector('[data-char]')
      return first ? chars.indexOf(first as HTMLElement) / chars.length : 0
    })
    let painted = 0

    const write = (progress: number) => {
      const upto = Math.round(progress * chars.length)
      if (upto !== painted) {
        const from = Math.min(painted, upto)
        const to = Math.max(painted, upto)
        for (let i = from; i < to; i += 1) {
          const glyph = chars[i]
          if (!glyph) continue
          if (i < upto) glyph.dataset.ink = ''
          else delete glyph.dataset.ink
        }
        painted = upto
      }
      words.forEach((word, i) => {
        if (upto >= wordEnds[i]) word.dataset.boxed = ''
        else delete word.dataset.boxed
      })
      marks.forEach((mark, i) => {
        if (upto >= markEnds[i]) mark.dataset.lit = ''
        else delete mark.dataset.lit
      })
    }

    if (reduced) {
      write(1)
      verses.forEach((verse) => {
        verse.style.transform = 'translate3d(0, 0, 0)'
        verse.style.opacity = ''
      })
      return
    }

    /* Scroll events arrive about once a frame, so the rect is read straight in
       the handler: an animation frame in the path would only add a frame of lag
       and would freeze the fill whenever frames are paused. */
    const read = () => {
      const rect = section.getBoundingClientRect()
      const runway = Math.max(1, rect.height - window.innerHeight)
      const progress = Math.min(Math.max(-rect.top / runway, 0), 1)
      // A breath at both ends: the writing starts just after the pin begins and
      // is finished just before it lets go.
      // 잉크는 핀 80%까지 채우고, 남은 20%는 그대로 고정돼 여유 있게 본다.
      write(Math.min(Math.max((progress - 0.02) / 0.78, 0), 1))
      // 핀 100%에서 시작해, 핀이 풀린 뒤 50% 더 간 지점(150%)까지 섹션 전체
      // (배경·글자 포함)가 투명해진다. 히어로 틴트와 같이 핀 진행도를
      // 풀린 뒤에도 clamp 없이 그대로 흘려 계산한다.
      const raw = -rect.top / runway
      const fade = Math.min(Math.max((raw - 1) / 0.5, 0), 1)
      if (panel.current) panel.current.style.opacity = String(1 - fade)
      // 스탠자 라이즈: 각 문단은 기본적으로 36px 아래에 가려져 있다가,
      // "자기 첫 글자에 잉크가 닿기 직전"부터 아래에서 위로 떠오른다.
      // 첫 문단은 핀 시작 직후, 두 번째 문단은 첫 문단 잉크가 끝나갈 무렵:
      // 즉, 스탠자가 스크롤 순서대로 차례로 보인다. 스크롤에 직결되므로
      // 트랜지션 없이 즉석 계산한다.
      verses.forEach((verse, i) => {
        const start = i === 0 ? 0.01 : Math.max(0.02 + starts[i] * 0.78 - 0.02, 0.01)
        const rise = Math.min(Math.max((progress - start) / 0.14, 0), 1)
        // 유령 글씨(연한 색) 자체가 서서히 나타난다(투명도 0→100%).
        // 라이즈보다 느린 구간(0.24)을 주어 "나타나서 → 잉크가 덮히는"
        // 두 단계가 읽히게 한다. 스크롤에 직결되므로 트랜지션 없이 즉석 계산.
        const appear = Math.min(Math.max((progress - start) / 0.24, 0), 1)
        verse.style.transform = `translate3d(0, ${(1 - rise) * 36}px, 0)`
        verse.style.opacity = String(appear)
      })
    }
    window.addEventListener('scroll', read, { passive: true })
    window.addEventListener('resize', read)
    read()
    return () => {
      window.removeEventListener('scroll', read)
      window.removeEventListener('resize', read)
    }
  }, [reduced])

  /* The hover card is anchored to its word's left edge, but a word sitting in
     the right half could push the card out of the window. Those words anchor
     the card to their right edge instead, so it always opens inward. 같은
     효과에서 팝오버가 뒤 문단 텍스트에 가리지 않게: 마우스가 올라간 단어의
     문단을 맨 앞으로 끌어올린다(문단에 position: relative가 있으므로
     z-index가 동작한다). */
  useEffect(() => {
    const root = text.current
    if (!root) return
    const words = Array.from(root.querySelectorAll<HTMLElement>('[data-word]'))
    const verses = Array.from(root.querySelectorAll('p'))
    const set = () => {
      for (const word of words) {
        const card = word.querySelector<HTMLElement>('.statement-pop')
        if (!card) continue
        const room = window.innerWidth - 12 - word.getBoundingClientRect().left
        if (room < card.getBoundingClientRect().width) word.dataset.clamp = ''
        else delete word.dataset.clamp
      }
    }
    set()
    const onOver = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null
      const word = target && target.closest('[data-word]')
      verses.forEach((verse) => { verse.style.zIndex = '' })
      if (word) {
        const verse = word.closest('p') as HTMLElement | null
        if (verse) verse.style.zIndex = '2'
      }
    }
    root.addEventListener('pointerover', onOver)
    document.fonts?.ready.then(set)
    window.addEventListener('resize', set)
    return () => {
      root.removeEventListener('pointerover', onOver)
      window.removeEventListener('resize', set)
    }
  }, [])

  useEffect(() => {
    const element = canvas.current
    if (!element) return
    const scene = createPowderScene(element, { reducedMotion: !!reduced })
    return () => scene?.dispose()
  }, [reduced])

  return (
    <div ref={pin} className="relative h-[180svh]">
      <section
        ref={panel}
        aria-labelledby="statement-title"
        // #e6f1f2 at the top edge, dissolving downward into near-white: the
        // colour spreads down from the seam with the hero, never in a band.
        // 아래쪽 끝이 페이지 바탕(#eef5f6)과 같은 색으로 흘러 들어가
        // 다음 섹션과의 색 경계가 안 보인다.
        className="sticky top-0 isolate flex min-h-[100svh] items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#e6f1f2_0%,#eff7f8_30%,#f5fbfc_58%,#ecf4f5_80%,#eef5f6_100%)]"
      >
        <canvas ref={canvas} aria-hidden className="absolute inset-0 size-full" />

        <div className="relative z-10 mx-auto w-full max-w-[1020px] px-6 py-24 text-center sm:px-10">
          {/* For screen readers and search: the words once, as plain text. The
              glyphs below are the same sentence, laid out for the ink. */}
          <h2 id="statement-title" className="sr-only">
            {FULL_TEXT}
          </h2>
          {/* break-keep: Korean wraps at spaces, never mid-word. */}
          <div
            ref={text}
            aria-hidden
            className="break-keep text-balance text-[20px] font-normal leading-[1.5] tracking-[-0.03em] sm:text-[26px] lg:text-[34px]"
          >
            {TEXT.stanzas.map((stanza, si) => (
              <p key={si} className={si ? 'relative mt-[0.9em]' : 'relative'}>
                {stanza.map((runs, li) => (
                  <span key={li} className="block">
                    {runs.map(({ run, chars, end }, ri) => {
                      const glyphs = chars.map((c, i) =>
                        c.index === -1 ? (
                          <span key={`s${i}`}> </span>
                        ) : (
                          <span key={c.index} data-char={c.index} className="statement-char">
                            {c.ch}
                          </span>
                        ),
                      )
                      if (run.word) {
                        return (
                          <span key={ri} data-word={run.word} data-end={end} data-glass-grow className="statement-word">
                            {glyphs}
                            {/* 문장 단위로만 줄바꿈: 마침표 뒤에서만 감는다. */}
                            <span aria-hidden className="statement-pop">
                              {POPOVERS[run.word].split('. ').map((sentence, i, list) => (
                                <span key={i} className="block">
                                  {sentence + (i < list.length - 1 ? '.' : '')}
                                </span>
                              ))}
                            </span>
                          </span>
                        )
                      }
                      if (run.strong) {
                        return (
                          <span key={ri} data-mark data-end={end} className="relative inline-block font-semibold">
                            {/* 형광펜 밑줄: 문구가 다 쓰여지면 왼쪽에서부터
                                스치듯 채워진다. */}
                            <span aria-hidden className="statement-mark" />
                            {glyphs}
                          </span>
                        )
                      }
                      return <span key={ri}>{glyphs}</span>
                    })}
                  </span>
                ))}
              </p>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
