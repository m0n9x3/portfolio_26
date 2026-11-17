import { animate } from 'animejs'
import { useEffect, useRef } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router'

import { Footer } from './components/Footer'
import { GlassCursor } from './components/GlassCursor'
import { prefersReduced } from './lib/reduced'
import { Nav } from './components/Nav'
import { Preloader } from './components/Preloader'
import { Home } from './pages/Home'

function ScrollManager() {
  const { pathname, hash } = useLocation()
  /* 직전 경로 — 상세를 닫을 때(→ '/')도 맨 위로 튀지 않게 하려면,
     어디서 왔는지를 같이 봐야 한다. */
  const from = useRef(pathname)
  useEffect(() => {
    const was = from.current
    from.current = pathname
    /* 작업 상세(/work/<slug>)는 뒤에 깔린 화면을 그대로 두고 모달만 열고
       닫는다 — 상세로 들어갈 때도, 상세에서 나올 때도 스크롤을 건드리지 않는다. */
    if (pathname.startsWith('/work/') || was.startsWith('/work/')) return
    if (hash) {
      /* getElementById 로 찾는다 — '#1' 처럼 숫자로 시작하는 해시는
         querySelector 에서 selector 문법 오류를 던진다. */
      const target = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (target) {
        window.setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 50)
        return
      }
    }
    window.scrollTo({ top: 0 })
  }, [pathname, hash])
  return null
}

function Pages() {
  const location = useLocation()
  const main = useRef<HTMLElement>(null)
  const first = useRef(true)
  const from = useRef(location.pathname)

  useEffect(() => {
    const was = from.current
    from.current = location.pathname
    const el = main.current
    // The first paint is the preloader's; only route changes get the fade.
    if (first.current) {
      first.current = false
      return
    }
    if (!el || prefersReduced()) return
    /* 상세로 들어가고 나올 때는 화면이 그대로 있어야 하므로 페이드를 건너뛴다. */
    if (location.pathname.startsWith('/work/') || was.startsWith('/work/')) return
    animate(el, { opacity: [0, 1], translateY: [12, 0], duration: 350, ease: 'outQuart' })
  }, [location.pathname])

  return (
    <main ref={main}>
      <Routes location={location}>
        {/* 모든 경로를 같은 Home 하나로 그린다 — /work/<slug> 로 주소만
            바꾸면 화면이 다시 마운트되지 않아 스크롤이 그대로 남는다. */}
        <Route path="*" element={<Home />} />
      </Routes>
    </main>
  )
}

export function App() {
  /* GitHub Pages 처럼 하위 경로(/portfolio_26/)에 올라갈 때를 위해
     Vite 의 base 를 라우터 기준 경로로 넘긴다. 개발 서버에서는 '/' . */
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return (
    <BrowserRouter basename={base || '/'}>
      <Preloader />
      <ScrollManager />
      <Nav />
      <Pages />
      <Footer />
      <GlassCursor />
    </BrowserRouter>
  )
}
