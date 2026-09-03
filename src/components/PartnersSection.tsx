import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Building2, Handshake, Check } from 'lucide-react'
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

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-ink/65 text-sm tracking-widest uppercase mt-20 mb-4"
        >
          {PARTNERS.mouLabel}
        </motion.p>
        <motion.h3
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="font-display text-2xl md:text-4xl text-ink tracking-tight mb-10"
        >
          {PARTNERS.mouHeading}
        </motion.h3>

        <div className="flex flex-col gap-8 md:gap-12">
          {PARTNERS.mous.map((mou, i) => (
            <motion.article
              key={mou.partner}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 + i * 0.15 }}
              className="liquid-glass rounded-3xl overflow-hidden"
            >
              <div className="relative bg-ink/5">
                <img
                  src={mou.image}
                  alt={mou.imageAlt}
                  loading="lazy"
                  className="w-full object-cover object-center aspect-[3/2] md:aspect-[2/1]"
                />
                <span className="absolute left-4 top-4 md:left-6 md:top-6 flex items-center gap-2 rounded-full bg-canvas/85 backdrop-blur px-3 py-1.5 text-accent-deep text-xs font-medium tracking-wide">
                  <Handshake size={14} />
                  MOU {String(i + 1).padStart(2, '0')}
                </span>
              </div>

              <div className="p-6 md:p-10">
                <h4 className="font-display text-ink text-lg md:text-2xl tracking-tight mb-6 md:mb-8">
                  {mou.partner}
                </h4>

                <div
                  className={`grid gap-x-10 gap-y-6 ${
                    mou.outcomes ? 'md:grid-cols-2' : 'max-w-3xl'
                  }`}
                >
                  <div>
                    <p className="flex items-center gap-2 text-ink/55 text-xs tracking-widest uppercase mb-3">
                      <span className="h-px w-6 bg-accent-deep/50" />
                      ความร่วมมือและเทคโนโลยีที่จะนำมาใช้
                    </p>
                    <ul className="space-y-2.5">
                      {mou.cooperation.map((c) => (
                        <li key={c} className="flex gap-2.5 text-ink/70 text-sm leading-relaxed">
                          <Check size={16} className="mt-0.5 shrink-0 text-accent-deep" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {mou.outcomes && (
                    <div>
                      <p className="flex items-center gap-2 text-ink/55 text-xs tracking-widest uppercase mb-3">
                        <span className="h-px w-6 bg-accent-deep/50" />
                        ผลลัพธ์ที่คาดว่าจะได้รับ
                      </p>
                      <ul className="space-y-2.5">
                        {mou.outcomes.map((o) => (
                          <li key={o} className="flex gap-2.5 text-ink/70 text-sm leading-relaxed">
                            <Check size={16} className="mt-0.5 shrink-0 text-accent-deep" />
                            <span>{o}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
