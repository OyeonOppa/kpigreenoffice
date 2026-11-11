import { pageByPath } from '../../seo/pages'
import { Breadcrumb, FaqBlock, RelatedBlock, Section, SourcesBlock } from './ContentShell'

/* คำอธิบายใต้หน้าตั้งค่าเกม — ให้คนอ่านก่อนเล่น และให้เครื่องมือค้นหารู้ว่าหน้านี้คืออะไร */
export default function GameGuide({ path }: { path: string }) {
  const page = pageByPath(path)
  if (!page?.guide) return null
  const { guide } = page
  return (
    <div className="max-w-2xl mx-auto mt-6 pop-card p-6 sm:p-9">
      <Breadcrumb page={page} />
      <p className="text-ink/85 leading-relaxed">{guide.summary}</p>
      <ul className="list-disc pl-5 mt-3 space-y-1 text-ink/80">
        {guide.facts.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <Section title="วิธีเล่น">
        <ol className="list-decimal pl-5 space-y-1.5">
          {guide.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </Section>
      <Section title="เล่นแล้วได้เรียนรู้อะไร">
        <ul className="list-disc pl-5 space-y-1.5">
          {guide.learn.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </Section>
      {page.faq && <FaqBlock items={page.faq} />}
      {page.sources && <SourcesBlock items={page.sources} />}
      {page.related && <RelatedBlock paths={page.related} />}
    </div>
  )
}
