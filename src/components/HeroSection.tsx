import { useRef } from 'react'
import { ArrowRight, Globe, Mail, Phone } from 'lucide-react'
import { useVideoCrossfade } from '../hooks/useVideoCrossfade'
import { HERO, VIDEO_URLS, IMAGE_URLS, USE_STATIC_IMAGES } from '../content'
import MediaBackground from './MediaBackground'
import LiveEnvWidget from './LiveEnvWidget'

export default function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  useVideoCrossfade(videoRef)

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
      <div className="absolute inset-0 bg-gradient-to-b from-canvas/70 via-canvas/30 to-canvas/80" />

      {/* Hero content — เผื่อพื้นที่ด้านบนให้ navbar แบบ fixed ที่ลอยอยู่เสมอ (ดู Navbar.tsx) */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-28 sm:pt-24 pb-12 text-center -translate-y-[8%] sm:-translate-y-[12%]">
        <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-ink tracking-tight leading-[1.15] mb-8">
          {HERO.headingMain} <em className="italic text-accent-deep">{HERO.headingAccent}</em>
        </h1>

        <a
          href={HERO.ctaHref}
          className="liquid-glass rounded-full pl-6 pr-2 py-2 flex items-center gap-3 mb-8 group"
        >
          <span className="text-ink text-sm font-medium">{HERO.ctaLabel}</span>
          <span className="bg-accent rounded-full p-3 text-white transition-transform group-hover:translate-x-0.5">
            <ArrowRight size={20} />
          </span>
        </a>

        <p className="text-ink/70 text-sm leading-relaxed px-2 sm:px-4 max-w-xl mb-10">
          {HERO.subtitle}
        </p>

        <div className="w-full max-w-3xl">
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
