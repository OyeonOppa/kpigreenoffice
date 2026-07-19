import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Building2, Handshake } from 'lucide-react'
import { PARTNERS } from '../content'

const icons = [Handshake, Building2]

export default function PartnersSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="partners" ref={ref} className="bg-canvas py-20 md:py-28 px-6 overflow-hidden scroll-mt-24">
      <div className="max-w-6xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-ink/65 text-sm tracking-widest uppercase mb-4"
        >
          {PARTNERS.label}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display text-3xl md:text-5xl text-ink tracking-tight mb-12"
        >
          {PARTNERS.heading}
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {PARTNERS.items.map((item, i) => {
            const Icon = icons[i % icons.length]
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: i * 0.15 }}
                className="liquid-glass rounded-3xl p-6 md:p-8"
              >
                <span className="liquid-glass rounded-full p-3 text-accent-deep inline-block mb-6">
                  <Icon size={20} />
                </span>
                <h3 className="text-ink text-xl md:text-2xl tracking-tight mb-3">
                  {item.title}
                </h3>
                <p className="text-ink/65 text-sm leading-relaxed">{item.body}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
