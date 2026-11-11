import { animate } from 'animejs'
import { useEffect, useRef } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router'

import { Footer } from './components/Footer'
import { GlassCursor } from './components/GlassCursor'
import { prefersReduced } from './lib/reduced'
import { Nav } from './components/Nav'
import { Preloader } from './components/Preloader'
import { About } from './pages/About'
import { Home } from './pages/Home'
import { Work } from './pages/Work'

function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
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

  useEffect(() => {
    const el = main.current
    // The first paint is the preloader's; only route changes get the fade.
    if (first.current) {
      first.current = false
      return
    }
    if (!el || prefersReduced()) return
    animate(el, { opacity: [0, 1], translateY: [12, 0], duration: 350, ease: 'outQuart' })
  }, [location.pathname])

  return (
    <main ref={main}>
      <Routes location={location}>
        <Route index element={<Home />} />
        <Route path="work/:slug" element={<Work />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<Navigate to="/" replace />} />
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
