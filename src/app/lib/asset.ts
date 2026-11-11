/* public/ 안의 파일 경로는 루트 절대경로('/images/...')로 적혀 있다. 사이트가
   하위 경로(GitHub Pages 의 /portfolio_26/)에 올라가면 그 경로는 다른 곳을
   가리키므로, 지금 빌드의 base 를 앞에 붙여 준다. 개발 서버에서는 base 가
   '/' 라 결과가 그대로다. */
export function asset(path: string) {
  return import.meta.env.BASE_URL.replace(/\/$/, '') + path
}

/* 원본 이미지 옆에 미리 만들어 둔 WebP 파생본({이름}-{폭}.webp)을 가리킨다.
   원본(예: /images/portrait.jpg)은 화질 손실 없는 마스터로 public 에 그대로
   두고, 실제로 내려보내는 것은 파생본이다. */
const stripExt = (path: string) => path.replace(/\.(jpe?g|png|webp|gif)$/i, '')

export function imageSrc(src: string, width: number) {
  return `${stripExt(src)}-${width}.webp`
}

export function imageSet(src: string, widths: number[]) {
  return widths.map((width) => `${imageSrc(src, width)} ${width}w`).join(', ')
}
