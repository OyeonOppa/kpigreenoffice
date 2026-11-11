import ContentShell, { PageCards, Section } from '../components/seo/ContentShell'
import { GAMES_PROMO } from '../content'
import { SEO_PAGES, pageByPath } from '../seo/pages'

const articles = SEO_PAGES.filter((p) => p.kind === 'article')
const tools = SEO_PAGES.filter((p) => p.kind === 'tool')
const games = SEO_PAGES.filter((p) => p.kind === 'game')

export function KnowledgeHubPage() {
  return (
    <ContentShell page={pageByPath('/knowledge/')!} heading="คลังความรู้ลดคาร์บอนและจัดการขยะ">
      <p className="mt-5 text-lg text-ink/90 leading-relaxed">
        รวมเรื่องที่คนถามบ่อยเกี่ยวกับขยะและคาร์บอน พร้อมตารางข้อมูลและแหล่งอ้างอิงในทุกหน้า นำไปใช้ประกอบการสอน งานนำเสนอ หรือกิจกรรมในองค์กรได้
      </p>
      <Section title="บทความและตารางข้อมูล">
        <PageCards pages={articles} />
      </Section>
      <Section title="เครื่องมือ">
        <PageCards pages={tools} />
      </Section>
      <Section title="เรียนรู้ผ่านเกม">
        <PageCards pages={games} />
      </Section>
    </ContentShell>
  )
}

const internalGames = GAMES_PROMO.items.filter((g) => g.href === '/#/forest' || g.href === '/#/live')

export function GamesHubPage() {
  return (
    <ContentShell page={pageByPath('/games/')!} heading="เกมสิ่งแวดล้อมออนไลน์ เล่นฟรี">
      <p className="mt-5 text-lg text-ink/90 leading-relaxed">
        เกมการ์ดและเกมสั้นเรื่องการแยกขยะ เวลาย่อยสลาย การลดคาร์บอน และการประหยัดไฟ เล่นบนเว็บได้ทันทีโดยไม่ต้องสมัครสมาชิก เหมาะกับห้องเรียน ชุมชน และกิจกรรมองค์กร
      </p>
      <Section title="เกมที่เล่นได้เลย">
        <PageCards pages={games} />
      </Section>
      <Section title="กิจกรรมสำหรับบุคลากรในหน่วยงาน">
        <ul className="grid gap-3 sm:grid-cols-2">
          {internalGames.map((g) => (
            <li key={g.href}>
              <a href={g.href} className="liquid-glass rounded-2xl p-4 h-full flex gap-3 hover:bg-ink/5 transition-colors">
                <span className="text-3xl shrink-0" aria-hidden>{g.emoji}</span>
                <span className="min-w-0">
                  <span className="block font-medium text-ink">{g.title}</span>
                  <span className="block text-sm text-ink/65 leading-snug mt-0.5">{g.description}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Section>
    </ContentShell>
  )
}

export function NotFoundPage() {
  return (
    <main className="bg-canvas min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-3" aria-hidden>🗑️</div>
        <h1 className="font-display text-3xl text-ink">ไม่พบหน้านี้</h1>
        <p className="text-ink/70 mt-2">หน้านี้อาจถูกย้ายหรือไม่มีอยู่จริง ลองเริ่มจากหน้าด้านล่าง</p>
        <div className="flex flex-wrap justify-center gap-3 mt-5">
          <a href="/" className="bg-accent text-white rounded-full px-5 py-2.5 text-sm font-medium">หน้าแรก</a>
          <a href="/knowledge/" className="liquid-glass rounded-full px-5 py-2.5 text-sm font-medium text-ink">คลังความรู้</a>
          <a href="/games/" className="liquid-glass rounded-full px-5 py-2.5 text-sm font-medium text-ink">เกม</a>
        </div>
      </div>
    </main>
  )
}
