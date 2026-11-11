import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { Navigate, useParams } from 'react-router'

import { bySlug, projects } from '../../data/site'
import { imageSet, imageSrc } from '../lib/asset'
import { Lines, Parallax, Reveal } from '../components/motion'

export function Work() {
  const { slug } = useParams()
  const project = slug ? bySlug(slug) : undefined
  if (!project) return <Navigate to="/" replace />
  const index = projects.findIndex((p) => p.slug === project.slug)
  const next = projects[(index + 1) % projects.length]

  return (
    <article className="mx-auto max-w-[1400px] px-5 pt-28 sm:px-8 sm:pt-36">
      <span className="inline-flex h-9 items-center gap-1.5 text-[14px] text-muted">
        <ArrowLeft className="size-4" />
        All work
      </span>

      <div className="mt-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <Lines as="h1" className="font-display text-[clamp(56px,10vw,150px)]" lines={[project.title]} />
        <Reveal delay={0.2} className="max-w-md text-pretty text-[18px] leading-relaxed text-muted lg:pb-4">
          {project.summary}
        </Reveal>
      </div>

      <Reveal delay={0.2} y={30} scale={0.98} className="mt-12 overflow-hidden rounded-[32px]" style={{ background: project.tint }}>
        <Parallax
          src={imageSrc(project.cover, 1100)}
          srcSet={imageSet(project.cover, [480, 1100])}
          sizes="(min-width: 1024px) 78vw, 100vw"
          width={1100}
          height={825}
          alt={project.title}
          className="aspect-[16/10] sm:aspect-[16/9]"
          strength={5}
        />
      </Reveal>

      <div className="mt-16 grid gap-12 lg:grid-cols-[320px_1fr] lg:gap-24">
        <Reveal>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-8 text-[14px] lg:grid-cols-1">
            {[
              ['Client', project.client],
              ['Year', project.year],
              ['Role', project.role.join(', ')],
              ['Delivered', project.deliverables.join(', ')],
            ].map(([label, value]) => (
              <div key={label} className="border-t border-line pt-3">
                <dt className="text-muted">{label}</dt>
                <dd className="mt-1 text-fg">{value}</dd>
              </div>
            ))}
            {project.link && (
              <div className="border-t border-line pt-3">
                <span className="inline-flex items-center gap-1 font-medium">
                  Visit the site
                  <ArrowUpRight className="size-4" />
                </span>
              </div>
            )}
          </dl>
        </Reveal>
        <div className="max-w-2xl">
          {project.body.map((paragraph, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <p className={`text-pretty leading-relaxed text-fg/90 ${i === 0 ? 'font-display text-[28px] leading-[1.2] sm:text-[36px]' : 'mt-6 text-[18px] text-muted'}`}>{paragraph}</p>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-2">
        <Reveal>
          <div className="image-frame aspect-[4/3] rounded-image" style={{ background: project.tint }}>
            <img
              src={imageSrc(project.cover, 1100)}
              srcSet={imageSet(project.cover, [480, 1100])}
              sizes="(min-width: 768px) 45vw, 100vw"
              alt=""
              decoding="async"
              className="size-full object-cover"
              style={{ transform: 'scale(1.6)', transformOrigin: '30% 40%' }}
            />
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="image-frame aspect-[4/3] rounded-image" style={{ background: project.tint }}>
            <img
              src={imageSrc(project.cover, 1100)}
              srcSet={imageSet(project.cover, [480, 1100])}
              sizes="(min-width: 768px) 45vw, 100vw"
              alt=""
              decoding="async"
              className="size-full object-cover"
              style={{ transform: 'scale(2.2)', transformOrigin: '70% 65%' }}
            />
          </div>
        </Reveal>
      </div>

      <div className="group mt-32 block border-t border-line pt-10">
        <p className="text-[14px] text-muted">Next project</p>
        <div className="mt-3 flex items-end justify-between gap-6">
          <h2 className="font-display text-[clamp(44px,8vw,120px)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-3">{next.title}</h2>
          <span className="image-frame hidden aspect-[4/3] w-[260px] shrink-0 rounded-[20px] sm:block" style={{ background: next.tint }}>
            <img
              src={imageSrc(next.cover, 1100)}
              srcSet={imageSet(next.cover, [480, 1100])}
              sizes="260px"
              alt=""
              decoding="async"
              className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </span>
        </div>
      </div>
    </article>
  )
}
