// Sites 업로더가 거부하는 파일(숨김 파일·소스맵)을 지우고, 작업별 공유
// 주소(/work/<slug>)에 그 작업의 제목·설명·썸네일을 가진 HTML 을 만들어 둔다.
// 링크 미리보기 크롤러는 JS 를 실행하지 않으므로 meta 를 빌드 때 심어 둔다.
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { PLATES } from '../src/app/data/florilegium.ts'

const dist = fileURLToPath(new URL('../dist', import.meta.url))

function clean(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (name.startsWith('.') || name.endsWith('.map')) {
      rmSync(path, { recursive: true, force: true })
      continue
    }
    if (statSync(path).isDirectory()) clean(path)
  }
}

const escapeAttr = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function withMeta(html, meta) {
  const title = escapeAttr(meta.title)
  const description = escapeAttr(meta.description)
  const image = escapeAttr(meta.image)
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*"/, `$1${description}"`)
    .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${title}"`)
    .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${description}"`)
    .replace(/(<meta property="og:image" content=")[^"]*"/, `$1${image}"`)
    .replace(/(<\/title>)/, `$1\n    <link rel="canonical" href="${escapeAttr(meta.url)}" />`)
}

clean(dist)

const client = join(dist, 'client')
const shell = readFileSync(join(client, 'index.html'), 'utf8')

for (const plate of PLATES) {
  const html = withMeta(shell, {
    title: `${plate.title} — DE:SIGN MY LIFE`,
    description: plate.detail?.intro?.[0] ?? plate.note,
    image: plate.detail?.thumb ?? plate.src,
    url: `/work/${plate.slug}`,
  })
  const dir = join(client, 'work', plate.slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), html)
}
