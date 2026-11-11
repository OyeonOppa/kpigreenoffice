import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import Navbar from '../Navbar'
import Footer from '../Footer'
import { breadcrumbs, pageByPath, thaiDate, type Faq, type SeoPage, type Source } from '../../seo/pages'

/* โครงหน้าความรู้ — เส้นทางนำทาง หัวเรื่อง เนื้อหา คำถามที่พบบ่อย แหล่งอ้างอิง และหน้าที่เกี่ยวข้อง */

export function Breadcrumb({ page }: { page: SeoPage }) {
  const crumbs = breadcrumbs(page)
  return (
    <nav aria-label="เส้นทางนำทาง" className="text-sm text-ink/60 mb-4">
      {crumbs.map((c, i) => (
        <span key={c.path}>
          {i > 0 && <span aria-hidden className="mx-1.5">›</span>}
          {i === crumbs.length - 1 ? <span className="text-ink/80">{c.name}</span> : <a href={c.path} className="hover:text-ink underline-offset-2 hover:underline">{c.name}</a>}
        </span>
      ))}
    </nav>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl text-ink tracking-tight mb-3">{title}</h2>
      <div className="space-y-3 text-ink/85 leading-relaxed">{children}</div>
    </section>
  )
}

export function FaqBlock({ items }: { items: Faq[] }) {
  return (
    <Section title="คำถามที่พบบ่อย">
      <dl className="space-y-4">
        {items.map((f) => (
          <div key={f.q}>
            <dt className="font-medium text-ink">{f.q}</dt>
            <dd className="mt-1 text-ink/80">{f.a}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}

export function SourcesBlock({ items }: { items: Source[] }) {
  return (
    <Section title="แหล่งอ้างอิง">
      <ul className="list-disc pl-5 space-y-1.5 text-sm">
        {items.map((s) => (
          <li key={s.href}>
            <a href={s.href} target="_blank" rel="noopener" className="text-accent-deep underline underline-offset-2 break-words">
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </Section>
  )
}

export function RelatedBlock({ paths }: { paths: string[] }) {
  const pages = paths.map(pageByPath).filter((p): p is SeoPage => Boolean(p))
  return (
    <Section title="อ่านหรือเล่นต่อ">
      <PageCards pages={pages} />
    </Section>
  )
}

export function PageCards({ pages }: { pages: SeoPage[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {pages.map((p) => (
        <li key={p.path}>
          <a href={p.path} className="liquid-glass rounded-2xl p-4 h-full flex gap-3 hover:bg-ink/5 transition-colors">
            {p.emoji && (
              <span className="text-3xl shrink-0" aria-hidden>
                {p.emoji}
              </span>
            )}
            <span className="min-w-0">
              <span className="block font-medium text-ink">{p.name}</span>
              <span className="block text-sm text-ink/65 leading-snug mt-0.5">{p.description}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

export function CtaLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="inline-flex items-center gap-1.5 bg-accent text-white rounded-full px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity">
      {children} <ArrowRight size={15} />
    </a>
  )
}

export default function ContentShell({ page, heading, children }: { page: SeoPage; heading: string; children: ReactNode }) {
  return (
    <main className="bg-canvas min-h-screen">
      <Navbar />
      <article className="max-w-3xl mx-auto px-5 sm:px-6 pt-32 pb-16">
        <Breadcrumb page={page} />
        <h1 className="font-display text-3xl sm:text-4xl text-ink tracking-tight leading-tight">{heading}</h1>
        <p className="text-sm text-ink/55 mt-2">อัปเดตล่าสุด {thaiDate(page.updated)}</p>
        {children}
        {page.faq && <FaqBlock items={page.faq} />}
        {page.sources && <SourcesBlock items={page.sources} />}
        {page.related && <RelatedBlock paths={page.related} />}
      </article>
      <Footer />
    </main>
  )
}
