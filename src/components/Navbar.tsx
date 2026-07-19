import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Leaf, Menu, X } from 'lucide-react'
import { HERO, NAV_LINKS, SITE_NAME } from '../content'

// nav แบบ fixed ค้างอยู่บนสุดตลอด ไม่ว่าจะเลื่อนหน้าไปถึงไหน
// ใช้ liquid-glass-nav (ผิวทึบกว่าปกติ) เพราะต้องอ่านง่ายทั้งตอนลอยทับภาพ hero และตอนอยู่บนพื้น canvas เรียบๆ
export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 py-6">
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
  )
}
