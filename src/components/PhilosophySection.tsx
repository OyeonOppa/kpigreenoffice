import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { PHILOSOPHY, VIDEO_URLS, IMAGE_URLS } from '../content'
import MediaBackground from './MediaBackground'

export default function PhilosophySection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="goals"
      ref={ref}
      className="bg-canvas py-28 md:py-40 px-6 overflow-hidden scroll-mt-24"
    >
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="font-display text-5xl md:text-7xl lg:text-8xl text-ink tracking-tight leading-[1.15] mb-16 md:mb-24"
        >
          {PHILOSOPHY.headingMain}{' '}
          <em className="italic text-accent-deep">{PHILOSOPHY.headingAccent}</em>{' '}
          {PHILOSOPHY.headingEnd}
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="rounded-3xl overflow-hidden aspect-[4/3] bg-ink/5"
          >
            <MediaBackground
              videoSrc={VIDEO_URLS.philosophy}
              imageSrc={IMAGE_URLS.philosophy}
              className="w-full h-full object-cover"
              loop
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col gap-8"
          >
            {PHILOSOPHY.blocks.map((block, i) => (
              <div key={block.label} className="flex flex-col gap-8">
                {i > 0 && <div className="w-full h-px bg-line" />}
                <div>
                  <p className="text-ink/65 text-xs tracking-widest uppercase mb-4">
                    {block.label}
                  </p>
                  <p className="text-ink/70 text-base md:text-lg leading-relaxed">{block.body}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
