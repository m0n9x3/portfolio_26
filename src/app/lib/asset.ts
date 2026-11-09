/* public/ 안의 파일 경로는 루트 절대경로('/images/...')로 적혀 있다. 사이트가
   하위 경로(GitHub Pages 의 /portfolio_26/)에 올라가면 그 경로는 다른 곳을
   가리키므로, 지금 빌드의 base 를 앞에 붙여 준다. 개발 서버에서는 base 가
   '/' 라 결과가 그대로다. */
export function asset(path: string) {
  return import.meta.env.BASE_URL.replace(/\/$/, '') + path
}
