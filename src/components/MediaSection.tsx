import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { CalendarDays, ImageOff } from 'lucide-react'
import { MEDIA, type MediaItem } from '../content'

/**
 * ผลงานของสำนัก / วิทยาลัย — สามหมวดตรงกับเมนูย่อยใน NAV_LINKS แบบ 1:1
 * (เดิมเมนูย่อยทั้งสามชี้มาที่ #media จุดเดียว และหน้านี้มีแต่ข่าวตัวอย่าง 3 ใบ)
 *
 * หมวดที่ยังไม่มีของจะขึ้นข้อความบอกตรง ๆ ว่ายังไม่มี ไม่ใส่รายการตัวอย่างไว้ก่อน
 */
export default function MediaSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="media"
      ref={ref}
      className="bg-canvas py-20 md:py-28 px-6 overflow-hidden scroll-mt-24"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-12"
        >
          <p className="text-ink/65 text-sm tracking-widest uppercase mb-4">{MEDIA.label}</p>
          <h2 className="font-display text-3xl md:text-5xl text-ink tracking-tight mb-4">
            {MEDIA.heading}
          </h2>
          <p className="text-ink/65 text-base leading-relaxed max-w-2xl">{MEDIA.intro}</p>
        </motion.div>

        <div className="flex flex-col gap-12 md:gap-16">
          {MEDIA.groups.map((group, gi) => (
            <motion.div
              key={group.id}
              id={group.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1 + gi * 0.1 }}
              className="scroll-mt-28"
            >
              <div className="flex items-baseline gap-3 mb-5">
                <h3 className="text-ink text-xl md:text-2xl tracking-tight">{group.label}</h3>
                {group.items.length > 0 && (
                  <span className="text-ink/50 text-sm">{group.items.length} รายการ</span>
                )}
              </div>

              {group.items.length === 0 ? (
                <p className="liquid-glass rounded-2xl px-5 py-6 text-ink/55 text-sm leading-relaxed">
                  {group.emptyText}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {group.items.map((item) => (
                    <MediaCard key={item.title} item={item} tag={group.label} />
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function MediaCard({ item, tag }: { item: MediaItem; tag: string }) {
  const Wrapper = item.href ? 'a' : 'article'
  return (
    <Wrapper
      {...(item.href ? { href: item.href, target: '_blank', rel: 'noreferrer' } : {})}
      className="liquid-glass rounded-3xl overflow-hidden group block"
    >
      <div className="aspect-[16/10] overflow-hidden bg-ink/5">
        <MediaImage src={item.image} />
      </div>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="bg-accent/10 text-accent-deep text-xs font-medium rounded-full px-3 py-1">
            {tag}
          </span>
          {item.date && (
            <span className="text-ink/65 text-xs inline-flex items-center gap-1">
              <CalendarDays size={12} /> {item.date}
            </span>
          )}
        </div>
        <h4 className="text-ink text-base md:text-lg leading-snug tracking-tight">{item.title}</h4>
      </div>
    </Wrapper>
  )
}

function MediaImage({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
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
