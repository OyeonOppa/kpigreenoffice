import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { DASHBOARD } from '../content'
import ImpactStats from './ImpactStats'

// หมวด "ผลลัพธ์" — ตัวเลขทั้งหมดมาจาก ORG_IMPACT ผ่าน ImpactStats แหล่งเดียว
export default function DashboardSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="dashboard"
      ref={ref}
      className="relative bg-canvas py-28 md:py-40 px-6 overflow-hidden scroll-mt-24"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(87,145,110,0.07)_0%,_transparent_60%)]" />
      <div className="relative max-w-6xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-ink/65 text-sm tracking-widest uppercase mb-4 text-center"
        >
          {DASHBOARD.label}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display text-4xl md:text-6xl text-ink tracking-tight text-center mb-14 md:mb-20"
        >
          {DASHBOARD.heading}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <ImpactStats />
        </motion.div>
      </div>
    </section>
  )
}
