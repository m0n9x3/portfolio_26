import { useEffect, useRef, useState } from 'react'

import { createPowderScene } from '../lib/powderScene'
import { prefersReduced } from '../lib/reduced'

/* The statement the reader scrolls through. It is pinned for 80% of a screen:
   the words are written in one glyph at a time, and the three boxes land inside
   that stretch. */
type Run = { text: string; word?: string; strong?: boolean }

const POPOVERS: Record<string, string> = {
  감성: '임시텍스트01',
  감각: '임시텍스트02',
  배려: '임시텍스트03',
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
      { text: '를 더하려고 합니다.' },
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
  const text = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [reduced] = useState(prefersReduced)

  /* Writing: a character takes its ink as the scroll passes it, and a boxed word
     flips the moment its last glyph has been written, so the box lands on a
     word that is already fully inked. */
  useEffect(() => {
    const section = pin.current
    const root = text.current
    if (!section || !root) return

    const chars = Array.from(root.querySelectorAll<HTMLElement>('[data-char]'))
    const words = Array.from(root.querySelectorAll<HTMLElement>('[data-word]'))
    const wordEnds = words.map((word) => Number(word.dataset.end))
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
    }

    if (reduced) {
      write(1)
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
      write(Math.min(Math.max((progress - 0.03) / 0.92, 0), 1))
    }
    window.addEventListener('scroll', read, { passive: true })
    window.addEventListener('resize', read)
    read()
    return () => {
      window.removeEventListener('scroll', read)
      window.removeEventListener('resize', read)
    }
  }, [reduced])

  useEffect(() => {
    const element = canvas.current
    if (!element) return
    const scene = createPowderScene(element, { reducedMotion: !!reduced })
    return () => scene?.dispose()
  }, [reduced])

  return (
    <div ref={pin} className="relative h-[180svh]">
      <section
        aria-labelledby="statement-title"
        // #e6f1f2 at the top edge, dissolving downward into near-white: the
        // colour spreads down from the seam with the hero, never in a band.
        className="sticky top-0 isolate flex min-h-[100svh] items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#e6f1f2_0%,#eff7f8_30%,#f8fdfd_58%,#fbfefe_80%,#f4fafb_100%)]"
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
              <p key={si} className={si ? 'mt-[0.9em]' : undefined}>
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
                          <span key={ri} data-word={run.word} data-end={end} className="statement-word">
                            {glyphs}
                            <span aria-hidden className="statement-pop">
                              {POPOVERS[run.word]}
                            </span>
                          </span>
                        )
                      }
                      if (run.strong) {
                        return (
                          <span key={ri} className="font-semibold">
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
