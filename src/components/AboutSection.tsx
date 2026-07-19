import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ABOUT } from '../content'

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
      </div>
    </section>
  )
}
