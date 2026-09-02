import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { THREE_R } from '../content'

/**
 * 3R — เนื้อหาหลังเมนู Knowledge > 3R (#three-r)
 *
 * id เป็น "three-r" ไม่ใช่ "3r" เพราะ CSS selector ขึ้นต้นด้วยตัวเลขไม่ได้ —
 * querySelector('#3r') จะพังทั้งที่ getElementById ยังใช้ได้ ไว้เจอทีหลังจะงง
 *
 * เดิมเมนูข้อนี้ชี้ไป #waste ซึ่งเป็นเรื่องถังขยะ 4 สี คนกดแล้วไม่เจอ 3R เลย
 * วางไว้ก่อนหมวดจัดการขยะ เพราะ 3R คือหลักคิด ส่วนถัง 4 สีคือวิธีปฏิบัติของ R ตัวสุดท้าย
 */
export default function ThreeRSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="three-r"
      ref={ref}
      className="bg-canvas pt-8 md:pt-12 pb-4 px-6 overflow-hidden scroll-mt-24"
    >
      <div className="max-w-6xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-ink/65 text-sm tracking-widest uppercase mb-6"
        >
          {THREE_R.label}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display text-4xl md:text-6xl text-ink leading-[1.2] tracking-tight mb-6"
        >
          {THREE_R.heading}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-ink/65 text-base md:text-lg leading-relaxed max-w-2xl mb-12 md:mb-16"
        >
          {THREE_R.intro}
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {THREE_R.items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.12 }}
              className="liquid-glass rounded-3xl p-6 md:p-8 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="rounded-full w-11 h-11 flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: `${item.color}1f` }}
                  aria-hidden
                >
                  {item.emoji}
                </span>
                {/* ลำดับความสำคัญของ 3R — เลขนี้คือเหตุผลที่การ์ดเรียงแบบนี้ */}
                <span className="text-ink/35 font-display text-2xl leading-none tabular">
                  {i + 1}
                </span>
              </div>
              <h3 className="text-ink text-lg md:text-xl tracking-tight mb-2">{item.title}</h3>
              <p className="text-ink/65 text-sm leading-relaxed mb-5">{item.body}</p>
              <ul className="flex flex-col gap-2 mt-auto">
                {item.examples.map((ex) => (
                  <li key={ex} className="flex gap-2 text-ink/70 text-sm leading-relaxed">
                    <span aria-hidden style={{ color: item.color }}>
                      •
                    </span>
                    {ex}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="mt-8 flex"
        >
          <a
            href={THREE_R.ctaHref}
            className="liquid-glass rounded-full px-6 py-3 text-ink text-sm font-medium hover:bg-ink/5 transition-colors inline-flex items-center gap-2"
          >
            {THREE_R.ctaLabel} <ArrowRight size={15} />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
