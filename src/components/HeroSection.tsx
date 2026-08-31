import { useRef } from 'react'
import { ArrowRight, Globe, Mail, Phone } from 'lucide-react'
import { useVideoCrossfade } from '../hooks/useVideoCrossfade'
import { HERO, ORG_IMPACT, VIDEO_URLS, IMAGE_URLS, USE_STATIC_IMAGES } from '../content'
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

      {/* Hero content — เผื่อพื้นที่ด้านบนให้ navbar แบบ fixed ที่ลอยอยู่เสมอ (ดู Navbar.tsx) */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-4 sm:px-6 pt-24 sm:pt-28 pb-12">
        {/* หัวเรื่อง + CTA */}
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-10">
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-ink tracking-tight leading-[1.15] mb-5">
            {HERO.headingMain} <em className="italic text-accent-deep">{HERO.headingAccent}</em>
          </h1>
          <p className="text-ink/70 text-sm sm:text-base leading-relaxed px-2 sm:px-4 max-w-xl mx-auto mb-6">
            {HERO.subtitle}
          </p>
          <a
            href={HERO.ctaHref}
            className="liquid-glass rounded-full pl-6 pr-2 py-2 inline-flex items-center gap-3 group"
          >
            <span className="text-ink text-sm font-medium">{HERO.ctaLabel}</span>
            <span className="bg-accent rounded-full p-3 text-white transition-transform group-hover:translate-x-0.5">
              <ArrowRight size={20} />
            </span>
          </a>
        </div>

        {/* สองคอลัมน์: ต้นไม้ที่โตตามการลดคาร์บอน | สถิติรายมิติ */}
        <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* ซ้าย — ต้นไม้ + ตัวเลขคาร์บอนที่ลดได้ */}
          <div className="flex flex-col items-center text-center">
            <HeroTree growth={pct} />
            <div className="mt-2 w-full max-w-sm">
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="font-display text-3xl sm:text-4xl text-ink leading-none tabular">
                  {nf.format(ORG_IMPACT.carbonSavedKg)}
                </span>
                <span className="text-ink/60 text-sm">kg CO₂e</span>
              </div>
              <p className="text-ink/60 text-sm mt-1">คาร์บอนที่ทั้งองค์กรลดได้แล้ว</p>

              <div className="mt-3 h-2 rounded-full bg-ink/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-out"
                  style={{ width: `${pct * 100}%` }}
                />
              </div>
              <p className="text-ink/55 text-xs mt-1.5">
                {Math.round(pct * 100)}% ของเป้าปีนี้ ({nf.format(ORG_IMPACT.carbonGoalKg)} kg CO₂e)
              </p>
              <p className="text-accent-deep text-xs mt-2">{ORG_IMPACT.equivalent}</p>
            </div>
          </div>

          {/* ขวา — สถิติรายมิติ */}
          <HeroStats />
        </div>

        {/* ข้อมูลอากาศสด */}
        <div className="w-full max-w-3xl mx-auto mt-10 md:mt-14">
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
