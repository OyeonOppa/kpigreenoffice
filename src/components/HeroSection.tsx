import { useRef } from 'react'
import { ArrowRight, Globe, Leaf, Mail, Phone } from 'lucide-react'
import { useVideoCrossfade } from '../hooks/useVideoCrossfade'
import { HERO, NAV_LINKS, SITE_NAME, VIDEO_URLS, IMAGE_URLS, USE_STATIC_IMAGES } from '../content'
import MediaBackground from './MediaBackground'

export default function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  useVideoCrossfade(videoRef)

  return (
    <section className="min-h-screen overflow-hidden relative flex flex-col">
      <MediaBackground
        ref={videoRef}
        videoSrc={VIDEO_URLS.hero}
        imageSrc={IMAGE_URLS.hero}
        className="absolute inset-0 w-full h-full object-cover object-bottom"
        style={USE_STATIC_IMAGES ? undefined : { opacity: 0 }}
      />

      {/* Navbar */}
      <header className="relative z-20 px-6 py-6">
        <nav className="liquid-glass rounded-full max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <a href="#" className="flex items-center gap-2">
              <Leaf size={24} className="text-white" />
              <span className="text-white font-semibold text-lg">{SITE_NAME}</span>
            </a>
            <div className="hidden md:flex items-center gap-8 ml-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-white/80 hover:text-white text-sm font-medium transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <a
            href="#actions"
            className="liquid-glass rounded-full px-6 py-2 text-white text-sm font-medium hover:bg-white/5 transition-colors"
          >
            {HERO.contactLabel}
          </a>
        </nav>
      </header>

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center -translate-y-[20%]">
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-white tracking-tight leading-[1.15] mb-8">
          {HERO.headingMain} <em className="italic text-white/60">{HERO.headingAccent}</em>
        </h1>

        <a
          href={HERO.ctaHref}
          className="liquid-glass rounded-full pl-6 pr-2 py-2 flex items-center gap-3 mb-6 group"
        >
          <span className="text-white text-sm font-medium">{HERO.ctaLabel}</span>
          <span className="bg-white rounded-full p-3 text-black transition-transform group-hover:translate-x-0.5">
            <ArrowRight size={20} />
          </span>
        </a>

        <p className="text-white text-sm leading-relaxed px-4 max-w-xl mb-8">{HERO.subtitle}</p>

        <a
          href="#about"
          className="liquid-glass rounded-full px-8 py-3 text-white text-sm font-medium hover:bg-white/5 transition-colors"
        >
          {HERO.manifestoLabel}
        </a>
      </div>

      {/* Social icons */}
      <div className="relative z-10 flex justify-center gap-4 pb-12">
        {[Phone, Mail, Globe].map((Icon, i) => (
          <a
            key={i}
            href="#"
            className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all"
          >
            <Icon size={20} />
          </a>
        ))}
      </div>
    </section>
  )
}
