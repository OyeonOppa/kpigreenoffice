import { useRef } from 'react'
import { Globe, Mail, Phone } from 'lucide-react'
import { useVideoCrossfade } from '../hooks/useVideoCrossfade'
import { ORG_IMPACT, VIDEO_URLS, IMAGE_URLS, USE_STATIC_IMAGES } from '../content'
import MediaBackground from './MediaBackground'
import LiveEnvWidget from './LiveEnvWidget'
import HeroTree from './HeroTree'
import HeroStats from './HeroStats'

const nf = new Intl.NumberFormat('th-TH')

export default function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  useVideoCrossfade(videoRef)

  const pct = Math.min(1, ORG_IMPACT.carbonSavedKg / ORG_IMPACT.carbonGoalKg)

  return (
    <section className="min-h-screen overflow-hidden relative flex flex-col bg-canvas">
      <MediaBackground
        ref={videoRef}
        videoSrc={VIDEO_URLS.hero}
        imageSrc={IMAGE_URLS.hero}
        className="absolute inset-0 w-full h-full object-cover object-bottom"
        style={USE_STATIC_IMAGES ? undefined : { opacity: 0 }}
      />
      {/* สกรีนบางๆ ให้ตัวหนังสือเข้มอ่านง่าย ไม่ว่าภาพพื้นหลังจะสว่างหรือมืด */}
      <div className="absolute inset-0 bg-gradient-to-b from-canvas/75 via-canvas/45 to-canvas/85" />

      {/* Hero content — เผื่อพื้นที่ด้านบนให้ navbar แบบ fixed ที่ลอยอยู่เสมอ (ดู Navbar.tsx)
          ตัดหัวเรื่อง/CTA เดิมออก ให้ต้นไม้ + ผลรวมทั้งองค์กรเป็นตัวเด่นของ hero */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-4 sm:px-6 pt-28 sm:pt-32 pb-12">
        {/* สองคอลัมน์: ต้นไม้ที่โตตามการลดคาร์บอน | สถิติรายมิติ */}
        <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* ซ้าย — ต้นไม้ + ตัวเลขคาร์บอนที่ลดได้ */}
          <div className="flex flex-col items-center text-center">
            <HeroTree growth={pct} />
            <div className="mt-1 w-full max-w-sm">
              <div className="flex items-baseline justify-center gap-2">
                <span className="font-display text-4xl sm:text-5xl text-ink leading-none tabular">
                  {nf.format(ORG_IMPACT.carbonSavedKg)}
                </span>
                <span className="text-ink/60 text-base">kg CO₂e</span>
              </div>
              <p className="text-ink/65 text-sm mt-1.5">คาร์บอนที่ทั้งองค์กรลดได้แล้ว</p>

              <div className="mt-4 h-2.5 rounded-full bg-ink/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-out"
                  style={{ width: `${pct * 100}%` }}
                />
              </div>
              <p className="text-ink/55 text-xs mt-2">
                {Math.round(pct * 100)}% ของเป้าปีนี้ ({nf.format(ORG_IMPACT.carbonGoalKg)} kg CO₂e)
              </p>
              <p className="text-accent-deep text-xs mt-2.5">{ORG_IMPACT.equivalent}</p>
            </div>
          </div>

          {/* ขวา — สถิติรายมิติ */}
          <HeroStats />
        </div>

        {/* ข้อมูลอากาศสด */}
        <div className="w-full max-w-3xl mx-auto mt-12 md:mt-16">
          <LiveEnvWidget />
        </div>
      </div>

      {/* Social icons */}
      <div className="relative z-10 flex justify-center gap-4 pb-12">
        {[Phone, Mail, Globe].map((Icon, i) => (
          <a
            key={i}
            href="#contact"
            className="liquid-glass rounded-full p-4 text-ink/70 hover:text-ink hover:bg-ink/5 transition-all"
          >
            <Icon size={20} />
          </a>
        ))}
      </div>
    </section>
  )
}
