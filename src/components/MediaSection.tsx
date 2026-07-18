import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Clapperboard, Image } from 'lucide-react'
import { MEDIA } from '../content'

export default function MediaSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="media" ref={ref} className="bg-black py-20 md:py-28 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex items-end justify-between mb-12"
        >
          <div>
            <p className="text-white/40 text-sm tracking-widest uppercase mb-4">{MEDIA.label}</p>
            <h2 className="font-display text-3xl md:text-5xl text-white tracking-tight">
              {MEDIA.heading}
            </h2>
          </div>
          <p className="hidden md:block text-white/40 text-sm">{MEDIA.intro}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MEDIA.items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              className="liquid-glass rounded-3xl p-6 md:p-8 group cursor-pointer hover:bg-white/5 transition-colors"
            >
              <span className="liquid-glass rounded-full p-3 text-white/70 inline-block mb-6">
                {item.type === 'Clip' ? <Clapperboard size={20} /> : <Image size={20} />}
              </span>
              <p className="text-white/40 text-xs tracking-widest uppercase mb-2">{item.type}</p>
              <h3 className="text-white text-lg tracking-tight">{item.title}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
