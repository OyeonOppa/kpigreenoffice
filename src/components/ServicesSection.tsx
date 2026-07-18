import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { SERVICES } from '../content'
import MediaBackground from './MediaBackground'

export default function ServicesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="actions"
      ref={ref}
      className="relative bg-canvas py-28 md:py-40 px-6 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(87,145,110,0.05)_0%,_transparent_60%)]" />
      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex items-end justify-between mb-12 md:mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl text-ink tracking-tight">
            {SERVICES.heading}
          </h2>
          <p className="hidden md:block text-ink/65 text-sm">{SERVICES.label}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {SERVICES.cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: i * 0.15 }}
              className="liquid-glass rounded-3xl overflow-hidden group"
            >
              <div className="relative aspect-video overflow-hidden bg-ink/5">
                <MediaBackground
                  videoSrc={card.video}
                  imageSrc={card.image}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loop
                />
              </div>
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-ink/65 text-xs tracking-widest uppercase">{card.tag}</p>
                  <span className="liquid-glass rounded-full p-2 text-accent-deep">
                    <ArrowUpRight size={16} />
                  </span>
                </div>
                <h3 className="text-ink text-xl md:text-2xl mb-3 tracking-tight">
                  {card.title}
                </h3>
                <p className="text-ink/65 text-sm leading-relaxed">{card.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
