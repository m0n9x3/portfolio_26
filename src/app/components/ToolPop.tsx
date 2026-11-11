import { useEffect, useId, useState, type CSSProperties } from 'react'

/* 문장 속 키워드(예: "디자인")를 테두리 + 굵은 밑줄 박스로 두고, 관심을
   보이면(호버·키보드 포커스) 또는 탭하면 아래에 도구별 설명 목록이 뜬다.

   WCAG 1.4.13 (Content on Hover or Focus)을 따른다:
   · Hoverable — 팝오버가 포인터를 받으므로, 내용 위로 포인터를 옮겨도 닫히지 않는다
   · Dismissible — Escape 로 닫힌다(관심이 남아 있어도)
   · Persistent — 관심이 사라지기 전에는 스스로 닫히지 않는다
   설명은 aria-describedby 로 트리거와 연결해, 호버를 못 쓰는 사용자도 읽을 수 있다. */
export function ToolPop({ word, items }: { word: string; items: string[] }) {
  const [shown, setShown] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  /* 개별 인스턴스마다 고유한 id/anchor-name — 한 페이지에 여러 개가 있다. */
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const popId = `tool-pop-${uid}`
  const anchor = `--tool-pop-${uid}`

  useEffect(() => {
    if (!shown) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDismissed(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shown])

  const close = () => {
    setShown(false)
    setDismissed(false)
  }

  const open = () => {
    setDismissed(false)
    setShown(true)
  }

  return (
    <button
      type="button"
      className="tool-pop"
      style={{ anchorName: anchor } as CSSProperties}
      aria-describedby={popId}
      data-shown={shown && !dismissed ? '' : undefined}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') open()
      }}
      onPointerLeave={close}
      /* 터치/펜은 탭으로 연다 — 호버가 없는 기기에는 다른 입구가 필요하다. */
      onPointerUp={(event) => {
        if (event.pointerType === 'mouse') return
        setDismissed(false)
        setShown((value) => !value)
      }}
      onFocus={open}
      onBlur={close}
    >
      {word}
      {/* 문장(<p>) 안에 들어가므로 목록 태그를 쓰지 않는다 — ul/li 는
          문단의 자식이 될 수 없다. 모양은 같은 클래스로 유지한다. */}
      <span id={popId} className="tool-popover" style={{ positionAnchor: anchor } as CSSProperties}>
        <span className="tool-popover__list">
          {items.map((item) => (
            <span key={item} className="tool-popover__item">
              {item}
            </span>
          ))}
        </span>
      </span>
    </button>
  )
}
