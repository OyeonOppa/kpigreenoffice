import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { FEATURED, VIDEO_URLS, IMAGE_URLS } from '../content'
import MediaBackground from './MediaBackground'

export default function FeaturedVideoSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="bg-canvas pt-6 md:pt-10 pb-20 md:pb-32 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9 }}
          className="relative rounded-3xl overflow-hidden aspect-video bg-ink/5"
        >
          <MediaBackground
            videoSrc={VIDEO_URLS.featured}
            imageSrc={IMAGE_URLS.featured}
            className="w-full h-full object-cover"
            loop
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="liquid-glass rounded-2xl p-6 md:p-8 max-w-md">
              <p className="text-ink/65 text-xs tracking-widest uppercase mb-3">
                {FEATURED.label}
              </p>
              <p className="text-ink text-sm md:text-base leading-relaxed">{FEATURED.body}</p>
            </div>
            <motion.a
              href={FEATURED.buttonHref}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="liquid-glass rounded-full px-8 py-3 text-ink text-sm font-medium self-start md:self-auto"
            >
              {FEATURED.buttonLabel}
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
