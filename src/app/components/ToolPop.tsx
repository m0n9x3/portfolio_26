/* 문장 속 키워드(예: "디자인")를 테두리 + 굵은 밑줄 박스로 두고,
   마우스를 올리거나(키보드 포커스) Tab으로 접근하면 아래에 도구별
   설명 목록(불릿 텍스트)이 팝오버로 뜬다. 팝오버 내용은 장식용
   반복 정보라 스크린리더에서는 읽지 않고 트리거 단어만 읽힌다. */
export function ToolPop({ word, items }: { word: string; items: string[] }) {
  return (
    <span className="tool-pop" tabIndex={0}>
      {word}
      {/* 문장(<p>) 안에 들어가므로 목록 태그를 쓰지 않는다 — ul/li 는
          문단의 자식이 될 수 없다. 모양은 같은 클래스로 유지한다. */}
      <span className="tool-popover" aria-hidden>
        <span className="tool-popover__list">
          {items.map((item) => (
            <span key={item} className="tool-popover__item">
              {item}
            </span>
          ))}
        </span>
      </span>
    </span>
  )
}
