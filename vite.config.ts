import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

import { PLATES } from './src/app/data/florilegium'

const escapeAttr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/* 링크 미리보기 크롤러는 JS 를 실행하지 않는다. 그래서 작업별 주소
   (/work/<slug>)에 그 작업의 제목·설명·썸네일을 가진 HTML 을 빌드 결과로
   함께 내보낸다 — 화면은 그대로 SPA 가 그리고, 미리보기만 작업별로 달라진다. */
function withMeta(html: string, meta: { title: string; description: string; image: string; url: string }) {
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

function casePages(): Plugin {
  let base = '/'
  return {
    name: 'case-pages',
    apply: 'build',
    configResolved(config) {
      base = config.base
    },
    /* 클라이언트 번들이 다 쓰인 뒤에 파일로 만든다 — index.html 이 완성된
       뒤라야 같은 스크립트 태그를 그대로 복사할 수 있다. */
    writeBundle(options) {
      const dir = options.dir ?? (options.file ? dirname(resolve(options.file)) : null)
      if (!dir) return
      const indexPath = join(dir, 'index.html')
      if (!existsSync(indexPath)) return
      const html = readFileSync(indexPath, 'utf8')
      /* asset() 가 이미 base 를 붙였을 수도 있어, 떼었다가 한 번만 다시 붙인다. */
      const root = base.replace(/\/$/, '')
      const withBase = (path: string) => `${root}${path.startsWith(root) ? path.slice(root.length) : path}`

      for (const plate of PLATES) {
        const page = withMeta(html, {
          title: `${plate.title} — DE:SIGN MY LIFE`,
          description: plate.detail?.intro?.[0] ?? plate.note,
          image: withBase(plate.detail?.thumb ?? plate.src),
          url: `${root}/work/${plate.slug}`,
        })
        /* GitHub Pages·Cloudflare 어느 쪽이든 같은 주소로 열리도록 두 형태로 둔다. */
        mkdirSync(join(dir, 'work', plate.slug), { recursive: true })
        writeFileSync(join(dir, 'work', plate.slug, 'index.html'), page)
        writeFileSync(join(dir, 'work', `${plate.slug}.html`), page)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare(), casePages()],
  server: { port: 5173, strictPort: false },
})
