import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Globe, Leaf, Mail, Menu, Phone, X } from 'lucide-react'
import { useVideoCrossfade } from '../hooks/useVideoCrossfade'
import { HERO, NAV_LINKS, SITE_NAME, VIDEO_URLS, IMAGE_URLS, USE_STATIC_IMAGES } from '../content'
import MediaBackground from './MediaBackground'
import LiveEnvWidget from './LiveEnvWidget'

export default function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  useVideoCrossfade(videoRef)
  const [menuOpen, setMenuOpen] = useState(false)

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

      {/* Navbar */}
      <header className="relative z-30 px-4 sm:px-6 py-6">
        <nav className="liquid-glass liquid-glass-nav rounded-full max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center min-w-0">
            <a href="#" className="flex items-center gap-2 min-w-0">
              <Leaf size={24} className="text-accent-deep shrink-0" />
              <span className="text-ink font-bold text-lg truncate">{SITE_NAME}</span>
            </a>
            <div className="hidden md:flex items-center gap-8 ml-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-ink/70 hover:text-ink text-sm font-medium transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <a
            href="#contact"
            className="hidden md:inline-block liquid-glass liquid-glass-nav rounded-full px-6 py-2 text-ink text-sm font-medium hover:bg-ink/5 transition-colors shrink-0"
          >
            {HERO.contactLabel}
          </a>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
            aria-expanded={menuOpen}
            className="md:hidden liquid-glass liquid-glass-nav rounded-full p-2.5 text-ink shrink-0"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="liquid-glass liquid-glass-nav md:hidden max-w-5xl mx-auto mt-3 rounded-3xl p-3 flex flex-col"
            >
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-ink/80 hover:text-ink text-sm font-medium px-4 py-3 rounded-xl hover:bg-ink/5 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#contact"
                onClick={() => setMenuOpen(false)}
                className="text-ink/80 hover:text-ink text-sm font-medium px-4 py-3 rounded-xl hover:bg-ink/5 transition-colors"
              >
                {HERO.contactLabel}
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 text-center -translate-y-[15%] sm:-translate-y-[20%]">
        <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-ink tracking-tight leading-[1.15] mb-8">
          {HERO.headingMain} <em className="italic text-accent-deep">{HERO.headingAccent}</em>
        </h1>

        <a
          href={HERO.ctaHref}
          className="liquid-glass rounded-full pl-6 pr-2 py-2 flex items-center gap-3 mb-6 group"
        >
          <span className="text-ink text-sm font-medium">{HERO.ctaLabel}</span>
          <span className="bg-accent rounded-full p-3 text-white transition-transform group-hover:translate-x-0.5">
            <ArrowRight size={20} />
          </span>
        </a>

        <p className="text-ink/70 text-sm leading-relaxed px-2 sm:px-4 max-w-xl mb-8">
          {HERO.subtitle}
        </p>

        <a
          href="#about"
          className="liquid-glass rounded-full px-8 py-3 text-ink text-sm font-medium hover:bg-ink/5 transition-colors mb-10"
        >
          {HERO.manifestoLabel}
        </a>

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
