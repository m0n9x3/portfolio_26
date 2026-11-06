import { animate } from 'animejs'
import { MousePointer2 } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

import { prefersReduced } from '../lib/reduced'

/* 프로필 사진 위에서 1회 재생되는 Figma 모사 연출.
   1) 핑크 커서가 사진 왼쪽 가장자리에 나타나 왼쪽→오른쪽으로 드래그해
      핑크 선택 영역(레이블 칩 포함)을 만든다 — 커서는 프레임의 드래그
      모서리(오른쪽 아래)를 실시간으로 따라간다.
   2) 드래그가 완성되면 사진 전체가 단단한 핑크 보더 감싸기가 되고,
      이때 사진과 선택 영역은 둘 다 직각(border-radius 0) 상태다.
   3) 커서가 왼쪽 위 레이블로 이동해 "border-radius"를 타이핑하면 현재 값
      (radius)이 표시되고, 잇달아 사진과 프레임의 라운딩이 0에서 실제
      값으로 애니메이션된다.
   4) 마지막에 커서와 핑크 오버레이가 모두 사라져 원래 사진만 남는다.
   뷰포트에 사진이 들어온 그 순간 1회만 재생하고, reduced-motion에서는
   아무 것도 재생되지 않는다. */
export function FigmaSelect({
  label,
  radius,
  className = '',
  children,
}: {
  label: string
  radius: string
  className?: string
  children: ReactNode
}) {
  const hostRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host || prefersReduced()) return

    const timers: number[] = []
    const at = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, ms))
    }

    const overlay = host.querySelector<HTMLElement>('.figma-select-overlay')
    const frame = host.querySelector<HTMLElement>('.figma-frame')
    const chip = host.querySelector<HTMLElement>('.figma-chip')
    const typed = host.querySelector<HTMLElement>('.figma-typed')
    const value = host.querySelector<HTMLElement>('.figma-chip-value')
    const cursor = host.querySelector<HTMLElement>('.figma-cursor')
    if (!overlay || !frame || !chip || !typed || !value || !cursor) return
    /* 라운딩이 눈에 보이는 요소는 img가 아니라 overflow:hidden인 사진
       프레임(Parallax의 .image-frame)이다: img는 사진을 꽉 채우려고
       1.12배로 확대되기 때문에 img 자체의 라운딩은 프레임 바깥으로 나가
       보이지 않는다. 그래서 프레임 div의 border-radius를 0↔실제 값으로
       움직이고, 선택 오버레이(프레임)도 같이 0에서 실제 값으로 맞춘다. */
    const photo = host.querySelector<HTMLElement>('.image-frame')
    if (!photo) return

    const play = () => {
      overlay.classList.add('is-live')
      /* 연출 동안 사진/프레임은 직각으로 시작한다 (마지막에 실제 값으로
         라운딩이 적용되는 애니메이션을 보여주기 위한 준비). */
      photo.style.borderRadius = '0px'
      frame.style.borderRadius = '0px'
      const box = overlay.getBoundingClientRect()
      const W = box.width
      const H = box.height
      /* 커서의 CSS 기준점(top)과 동일한 비율: 드래그 시작은 사진 왼쪽
         가장자리의 28% 높이 지점. 이동량/등장 거리도 사진 크기에 비례시
         켜 PC의 큰 사진에서도 자연스럽다. */
      const startRatio = 0.28
      const dragY = H * (1 - startRatio) /* 기준점(28%)에서 프레임 아래
                                           모서리까지의 이동량 */

      /* 커서 등장: 사진 밖 왼쪽 위 공간에서 사진 왼쪽 가장자리(28% 높이)
         로 들어온다. 거리는 사진 크기에 비례한다. */
      at(60, () =>
        animate(cursor, {
          opacity: [0, 1],
          translateX: [-Math.max(96, W * 0.22), 0],
          translateY: [-Math.max(96, H * 0.32), 0],
          duration: 560,
          ease: 'outCubic',
        }),
      )
      /* 마우스 눌림 → 드래그 시작. */
      at(620, () => animate(cursor, { scale: [1, 0.82], duration: 130, ease: 'outCubic' }))
      at(760, () =>
        animate(cursor, { scale: [0.82, 0.92], duration: 120, ease: 'outCubic' }),
      )
      at(820, () => {
        /* 선택 영역이 왼쪽에서 오른쪽으로 쓸려나가며 자라난다. 커서는
           프레임의 드래그 모서리(오른쪽 아래)를 같은 속도로 따라간다.
           프레임 시작 높이도 커서 기준(28%)와 일치시킨다. */
        animate(frame, { width: [6, '100%'], height: ['28%', '100%'], duration: 1250, ease: 'outCubic' })
        animate(cursor, { translateX: [0, W], translateY: [0, dragY], duration: 1250, ease: 'outCubic' })
        animate(chip, { opacity: [0, 1], translateY: [10, 0], scale: [0.86, 1], duration: 380, ease: 'outBack' })
      })
      /* 드래그 완료: 눌림 해제 + 단단한 사각형 보더. */
      at(2100, () => animate(cursor, { scale: [0.92, 1], duration: 150, ease: 'outCubic' }))
      at(2160, () => frame.classList.add('is-solid'))
      /* 커서가 왼쪽 위 레이블 칩으로 이동(드래그 끝 지점에서 출발).
         커서의 translate 기준점이 (left 0, top 28%)이므로 목표를 오버레이
         좌표에서 기준점만큼 보정해야 칩 위에 정확히 얹힌다 — 이 보정이
         없으면 PC에서 사진 한가운데로 떠버린다. */
      at(2500, () => {
        const o = overlay.getBoundingClientRect()
        const c = chip.getBoundingClientRect()
        animate(cursor, {
          translateX: [W, c.left - o.left + c.width * 0.32],
          translateY: [dragY, c.top - o.top + c.height * 0.55 - H * startRatio],
          duration: 640,
          ease: 'inOutCubic',
        })
      })
      /* 레이블 칩이 입력 칩으로 바뀌고 "border-radius"를 타이핑한다. */
      at(3200, () => chip.classList.add('is-ask'))
      const text = 'border-radius'
      at(3280, () => {
        for (let i = 1; i <= text.length; i++) {
          at((i - 1) * 46, () => {
            typed.textContent = text.slice(0, i)
          })
        }
      })
      /* 타이핑이 끝나면 현재 값이 도장처럼 찍히고, 잇달아 사진과 프레임
        이 직각에서 실제 라운딩 값으로 바뀐다. */
      at(3280 + text.length * 46 + 320, () =>
        animate(value, { opacity: [0, 1], scale: [0.6, 1], duration: 260, ease: 'outCubic' }),
      )
      at(3280 + text.length * 46 + 760, () => {
        animate(photo, { borderRadius: [0, radius], duration: 720, ease: 'outCubic' })
        animate(frame, { borderRadius: [0, radius], duration: 720, ease: 'outCubic' })
      })
      /* 커서 퇴장 → 잠시 후 오버레이 전체가 깔끔하게 사라진다.
         원래 사진의 라운딩은 스타일시트가 담당하므로 인라인 값을 치운다. */
      at(6100, () => animate(cursor, { opacity: [1, 0], duration: 320, ease: 'outCubic' }))
      at(6900, () =>
        animate(overlay, {
          opacity: [1, 0],
          duration: 520,
          ease: 'outCubic',
          onComplete: () => {
            overlay.classList.add('is-done')
            photo.style.borderRadius = ''
          },
        }),
      )
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        /* 사진이 등장해도 곧바로 재생하지 않고 잠깐 여유를 둔다: 등장
           트랜지션/렌더가 안정된 뒤 연출이 시작되는 쪽이 덜 급하다. */
        at(600, play)
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    observer.observe(host)

    /* 사진은 첫 등장부터 연출 시작 전까지(재생 지연 600ms 구간 포함)
       직각이어야 한다 — 스타일시트의 라운딩을 그대로 두면 "border-radius
       입력 전" 묘사보다 모서리가 먼저 둥글어져 보인다. 사진 프레임은
       overflow:hidden이라 이 인라인 값이 실제 보이는 모서리를 결정한다. */
    if (photo) photo.style.borderRadius = '0px'

    return () => {
      observer.disconnect()
      timers.forEach((t) => clearTimeout(t))
      /* 인라인 라운딩을 치우면 스타일시트 값(28px)으로 돌아간다. */
      if (photo) photo.style.borderRadius = ''
    }
  }, [label, radius])

  return (
    <span ref={hostRef} className={`figma-select ${className}`}>
      {children}
      <span className="figma-select-overlay" aria-hidden>
        <span className="figma-frame">
          <span className="figma-chip">
            <span className="figma-chip-name">{label}</span>
            <span className="figma-chip-ask">
              <span className="figma-typed" />
              <span className="figma-caret" />
              <b className="figma-chip-value">{radius}</b>
            </span>
          </span>
        </span>
        <span className="figma-cursor">
          <MousePointer2 className="size-[22px]" strokeWidth={1.5} />
        </span>
      </span>
    </span>
  )
}
