import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Flame, Waves } from 'lucide-react'
import { CLIMATE } from '../content'
import CarbonCalculator from './CarbonCalculator'

export default function ClimateSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const cards = [
    { icon: Flame, ...CLIMATE.causes },
    { icon: Waves, ...CLIMATE.impacts },
  ]

  return (
    <section
      id="climate"
      ref={ref}
      className="relative bg-canvas py-28 md:py-40 px-6 overflow-hidden scroll-mt-24"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(87,145,110,0.06)_0%,_transparent_70%)]" />
      <div className="relative max-w-6xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-ink/65 text-sm tracking-widest uppercase mb-6"
        >
          {CLIMATE.label}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display text-4xl md:text-6xl text-ink leading-[1.2] tracking-tight mb-6"
        >
          {CLIMATE.heading}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-ink/65 text-base md:text-lg leading-relaxed max-w-2xl mb-14 md:mb-20"
        >
          {CLIMATE.intro}
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-20 md:mb-28">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.15 }}
              className="liquid-glass rounded-3xl p-6 md:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="liquid-glass rounded-full p-3 text-accent-deep">
                  <card.icon size={20} />
                </span>
                <h3 className="text-ink text-xl md:text-2xl tracking-tight">{card.title}</h3>
              </div>
              <ul className="flex flex-col gap-3">
                {card.items.map((item) => (
                  <li key={item} className="flex gap-3 text-ink/65 text-sm leading-relaxed">
                    <span className="text-ink/30 mt-0.5">—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <CarbonCalculator />
      </div>
    </section>
  )
}
