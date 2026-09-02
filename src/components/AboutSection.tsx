import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { ABOUT } from '../content'

/**
 * นโยบายของเรา (#about) — ปลายทางของเมนู "นโยบาย"
 *
 * เดิมมีแค่หัวข้อใหญ่ใบเดียว คนกดเมนู "นโยบาย" มาแล้วไม่เจอเนื้อหานโยบายเลย
 * 4 ด้านนี้ผูกกับตัวชี้วัดใน ORG_IMPACT.stats ตัวต่อตัว — นโยบายกับผลลัพธ์จึงพูดเรื่องเดียวกัน
 */
export default function AboutSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="about"
      ref={ref}
      className="relative bg-canvas pt-32 md:pt-44 pb-10 md:pb-14 px-6 overflow-hidden scroll-mt-24"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(87,145,110,0.06)_0%,_transparent_70%)]" />
      <div className="relative max-w-6xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-ink/65 text-sm tracking-widest uppercase mb-8"
        >
          {ABOUT.label}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display text-4xl md:text-6xl lg:text-7xl text-ink leading-[1.2] tracking-tight"
        >
          {ABOUT.headingParts.before}{' '}
          <em className="italic text-accent-deep">{ABOUT.headingParts.accent}</em>
          <br className="hidden md:block" /> {ABOUT.headingParts.after}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-ink/65 text-base md:text-lg leading-relaxed max-w-3xl mt-8 md:mt-10"
        >
          {ABOUT.intro}
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 mt-10 md:mt-14">
          {ABOUT.pillars.map((pillar, i) => (
            <motion.div
              key={pillar.id}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.25 + i * 0.1 }}
              className="liquid-glass rounded-3xl p-6"
            >
              <span className="text-accent-deep/50 font-display text-xl leading-none tabular">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="text-ink text-lg tracking-tight mt-3 mb-2">{pillar.title}</h3>
              <p className="text-ink/65 text-sm leading-relaxed">{pillar.body}</p>
            </motion.div>
          ))}
        </div>

        {/* ลิงก์เอกสารนโยบายฉบับเต็ม — ยังไม่ตั้ง docHref ก็ไม่ต้องขึ้นปุ่มที่กดแล้วไม่ไปไหน */}
        {ABOUT.docHref && (
          <motion.a
            href={ABOUT.docHref}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="liquid-glass rounded-full px-6 py-3 text-ink text-sm font-medium hover:bg-ink/5 transition-colors inline-flex items-center gap-2 mt-8"
          >
            {ABOUT.docLabel} <ExternalLink size={15} />
          </motion.a>
        )}
      </div>
    </section>
  )
}
