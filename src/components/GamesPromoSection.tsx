import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { GAMES_PROMO } from '../content'

export default function GamesPromoSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="bg-canvas py-20 md:py-28 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-ink/65 text-sm tracking-widest uppercase mb-4"
        >
          {GAMES_PROMO.label}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display text-3xl md:text-5xl text-ink tracking-tight mb-12"
        >
          {GAMES_PROMO.heading}
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {GAMES_PROMO.items.map((item, i) => (
            <motion.a
              key={item.title}
              href={item.href}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: i * 0.15 }}
              className={`liquid-glass rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 group hover:bg-ink/5 transition-colors ${
                'featured' in item && item.featured ? 'md:col-span-2 ring-2 ring-accent/40' : ''
              }`}
            >
              <span className="text-5xl md:text-6xl shrink-0" aria-hidden>
                {item.emoji}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-ink text-lg md:text-xl font-medium tracking-tight mb-1">
                  {'featured' in item && item.featured && (
                    <span className="align-middle bg-accent text-white text-[11px] rounded-full px-2 py-0.5 mr-2">
                      ใหม่
                    </span>
                  )}
                  {item.title}
                </span>
                <span className="block text-ink/65 text-sm leading-relaxed">
                  {item.description}
                </span>
              </span>
              <span className="bg-accent text-white rounded-full px-5 py-2.5 text-sm font-medium inline-flex items-center gap-1.5 shrink-0 transition-transform group-hover:translate-x-0.5 self-stretch sm:self-auto justify-center">
                {item.cta} <ArrowRight size={15} />
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
