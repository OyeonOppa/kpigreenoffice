import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react'
import { MEDIA, type MediaItem } from '../content'

/**
 * ผลงานของสำนัก / วิทยาลัย — สามหมวดตรงกับเมนูย่อยใน NAV_LINKS แบบ 1:1
 *
 * หมวดที่ยังไม่มีของจะขึ้นข้อความบอกตรง ๆ ว่ายังไม่มี ไม่ใส่รายการตัวอย่างไว้ก่อน
 * หมวด "อินโฟกราฟิก" แสดงเป็นแกลเลอรีรูปเต็ม (ไม่ crop) คลิกเปิด lightbox
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
              ) : group.id === 'media-infographic' ? (
                <InfographicGallery items={group.items} />
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

/**
 * แกลเลอรีอินโฟกราฟิก — masonry (CSS columns) รูปแสดงเต็มตามสัดส่วนจริง
 * แนวตั้ง/แนวนอนปนกันได้ คลิกรูปเปิด lightbox เลื่อนดูทีละรูปด้วยปุ่มหรือลูกศรคีย์บอร์ด
 */
function InfographicGallery({ items }: { items: MediaItem[] }) {
  const pics = items.filter((it) => it.image)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const close = useCallback(() => setOpenIndex(null), [])
  const prev = useCallback(
    () => setOpenIndex((i) => (i === null ? i : (i - 1 + pics.length) % pics.length)),
    [pics.length],
  )
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? i : (i + 1) % pics.length)),
    [pics.length],
  )

  useEffect(() => {
    if (openIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [openIndex, close, prev, next])

  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-5 [column-fill:_balance]">
        {pics.map((item, i) => (
          <button
            key={item.title}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="mb-4 md:mb-5 block w-full break-inside-avoid overflow-hidden rounded-2xl liquid-glass p-1.5 group cursor-zoom-in"
          >
            <img
              src={item.image}
              alt={item.title}
              loading="lazy"
              className="w-full h-auto rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4 md:p-10"
            onClick={close}
          >
            <button
              type="button"
              aria-label="ปิด"
              onClick={close}
              className="absolute right-4 top-4 md:right-6 md:top-6 rounded-full bg-canvas/90 p-2 text-ink hover:bg-canvas"
            >
              <X size={20} />
            </button>

            {pics.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="รูปก่อนหน้า"
                  onClick={(e) => {
                    e.stopPropagation()
                    prev()
                  }}
                  className="absolute left-3 md:left-6 rounded-full bg-canvas/90 p-2 text-ink hover:bg-canvas"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  aria-label="รูปถัดไป"
                  onClick={(e) => {
                    e.stopPropagation()
                    next()
                  }}
                  className="absolute right-3 md:right-6 rounded-full bg-canvas/90 p-2 text-ink hover:bg-canvas"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}

            <motion.img
              key={openIndex}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              src={pics[openIndex].image}
              alt={pics[openIndex].title}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[88vh] max-w-full w-auto rounded-lg object-contain shadow-2xl"
            />

            {pics.length > 1 && (
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-canvas/90 px-3 py-1 text-ink text-xs">
                {openIndex + 1} / {pics.length}
              </span>
            )}
          </motion.div>
        </>
      )}
    </>
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
