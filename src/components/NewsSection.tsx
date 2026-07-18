import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { CalendarDays, ImageOff } from 'lucide-react'
import { NEWS } from '../content'

function ArticleImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-accent/[0.06] text-accent-deep/75">
        <ImageOff size={24} />
        <span className="text-xs">ยังไม่มีรูปภาพ</span>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt=""
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      onError={() => setFailed(true)}
    />
  )
}

// บทความ/ข่าวสาร — ตอนนี้เป็น mock รอเนื้อหาจริง (ดู NEWS ใน content.ts)
export default function NewsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="media" ref={ref} className="bg-canvas py-20 md:py-28 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex items-end justify-between mb-12"
        >
          <div>
            <p className="text-ink/65 text-sm tracking-widest uppercase mb-4">{NEWS.label}</p>
            <h2 className="font-display text-3xl md:text-5xl text-ink tracking-tight">
              {NEWS.heading}
            </h2>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {NEWS.posts.map((post, i) => (
            <motion.article
              key={post.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              className="liquid-glass rounded-3xl overflow-hidden group cursor-pointer"
            >
              <div className="aspect-[16/10] overflow-hidden bg-ink/5">
                <ArticleImage src={post.image} />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-accent/10 text-accent-deep text-xs font-medium rounded-full px-3 py-1">
                    {post.tag}
                  </span>
                  <span className="text-ink/65 text-xs inline-flex items-center gap-1">
                    <CalendarDays size={12} /> {post.date}
                  </span>
                </div>
                <h3 className="text-ink text-base md:text-lg leading-snug tracking-tight">
                  {post.title}
                </h3>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
