import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, LogIn, Menu, Sprout, X } from 'lucide-react'
import { FOREST, HERO, NAV_LINKS, SITE_NAME, type NavLink } from '../content'
import { lookFromSeed } from '../game/avatar'
import { useForestAuth } from '../forest/hooks'
import PlayerAvatar from './live/PlayerAvatar'
import SignInDialog from './SignInDialog'

// nav แบบ fixed ค้างอยู่บนสุดตลอด ไม่ว่าจะเลื่อนหน้าไปถึงไหน
// ใช้ liquid-glass-nav (ผิวทึบกว่าปกติ) เพราะต้องอ่านง่ายทั้งตอนลอยทับภาพ hero และตอนอยู่บนพื้น canvas เรียบๆ
export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  // เมนูย่อยบน desktop ที่เปิดค้างอยู่ (hover/click) — เก็บ label ของ top-level ที่เปิด
  const [openDesktop, setOpenDesktop] = useState<string | null>(null)
  // เมนูย่อยบน mobile ที่ถูกกางออก
  const [openMobile, setOpenMobile] = useState<string | null>(null)
  const [signInOpen, setSignInOpen] = useState(false)

  const { user, signOut } = useForestAuth()

  const closeAll = () => {
    setMenuOpen(false)
    setOpenMobile(null)
    setOpenDesktop(null)
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 py-6">
      <nav className="liquid-glass liquid-glass-nav rounded-full max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center min-w-0">
          <a href="#" className="flex items-center gap-2 min-w-0" aria-label={SITE_NAME}>
            <img
              src="/images/low carbon logo.webp"
              alt=""
              className="h-7 w-7 shrink-0 object-contain"
            />
            <img
              src="/images/low carbon text.webp"
              alt={SITE_NAME}
              className="h-5 w-auto shrink-0"
            />
          </a>
          <div className="hidden lg:flex items-center gap-6 ml-8">
            {NAV_LINKS.map((link) => (
              <DesktopNavItem
                key={link.label}
                link={link}
                open={openDesktop === link.label}
                onOpen={() => setOpenDesktop(link.label)}
                onClose={() => setOpenDesktop((v) => (v === link.label ? null : v))}
                onNavigate={closeAll}
              />
            ))}
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {user ? (
            <AccountMenu
              name={user.name}
              uid={user.uid}
              open={openDesktop === '__account'}
              onOpen={() => setOpenDesktop('__account')}
              onClose={() => setOpenDesktop((v) => (v === '__account' ? null : v))}
              onSignOut={() => {
                signOut()
                closeAll()
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setSignInOpen(true)}
              className="liquid-glass liquid-glass-nav rounded-full px-4 py-2 text-ink text-sm font-medium hover:bg-ink/5 transition-colors inline-flex items-center gap-1.5"
            >
              <LogIn size={15} />
              เข้าสู่ระบบ
            </button>
          )}

          <a
            href="#contact"
            className="liquid-glass liquid-glass-nav rounded-full px-5 py-2 text-ink text-sm font-medium hover:bg-ink/5 transition-colors"
          >
            {HERO.contactLabel}
          </a>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
          aria-expanded={menuOpen}
          className="lg:hidden liquid-glass liquid-glass-nav rounded-full p-2.5 text-ink shrink-0"
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
            className="liquid-glass liquid-glass-nav lg:hidden max-w-5xl mx-auto mt-3 rounded-3xl p-3 flex flex-col"
          >
            {NAV_LINKS.map((link) => (
              <MobileNavItem
                key={link.label}
                link={link}
                expanded={openMobile === link.label}
                onToggle={() =>
                  setOpenMobile((v) => (v === link.label ? null : link.label))
                }
                onNavigate={closeAll}
              />
            ))}
            <a
              href="#contact"
              onClick={closeAll}
              className="text-ink/80 hover:text-ink text-sm font-medium px-4 py-3 rounded-xl hover:bg-ink/5 transition-colors"
            >
              {HERO.contactLabel}
            </a>

            <div className="border-t border-ink/10 mt-2 pt-2">
              {user ? (
                <>
                  <a
                    href={FOREST.path}
                    onClick={closeAll}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl hover:bg-ink/5 transition-colors"
                  >
                    <PlayerAvatar look={lookFromSeed(user.uid)} size={26} />
                    <span className="text-ink text-sm font-medium truncate flex-1">
                      {user.name}
                    </span>
                    <Sprout size={16} className="text-accent shrink-0" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      signOut()
                      closeAll()
                    }}
                    className="w-full text-left text-ink/60 hover:text-ink text-sm px-4 py-3 rounded-xl hover:bg-ink/5 transition-colors"
                  >
                    ออกจากระบบ
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    closeAll()
                    setSignInOpen(true)
                  }}
                  className="w-full flex items-center gap-2 text-ink/80 hover:text-ink text-sm font-medium px-4 py-3 rounded-xl hover:bg-ink/5 transition-colors"
                >
                  <LogIn size={16} />
                  เข้าสู่ระบบ
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SignInDialog open={signInOpen} onClose={() => setSignInOpen(false)} />
    </header>
  )
}

/** ปุ่มบัญชีบน desktop — อวาตาร์กดแล้วกางเมนูสั้นๆ ไม่กินที่ใน nav ที่มี 5 เมนูอยู่แล้ว */
function AccountMenu({
  name,
  uid,
  open,
  onOpen,
  onClose,
  onSignOut,
}: {
  name: string
  uid: string
  open: boolean
  onOpen: () => void
  onClose: () => void
  onSignOut: () => void
}) {
  return (
    <div className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <button
        type="button"
        onClick={() => (open ? onClose() : onOpen())}
        aria-expanded={open}
        aria-label="บัญชีของฉัน"
        className="liquid-glass liquid-glass-nav rounded-full p-1 flex items-center"
      >
        <PlayerAvatar look={lookFromSeed(uid)} size={30} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="liquid-glass liquid-glass-nav absolute right-0 top-full mt-3 w-56 rounded-2xl p-2 flex flex-col"
          >
            <p className="text-ink text-sm font-medium px-3 pt-1 pb-2 truncate">{name}</p>
            <a
              href={FOREST.path}
              className="flex items-center gap-2 text-ink/80 hover:text-ink text-sm font-medium px-3 py-2 rounded-xl hover:bg-ink/5 transition-colors"
            >
              <Sprout size={15} className="text-accent" />
              ต้นไม้และกิจกรรมของฉัน
            </a>
            <button
              type="button"
              onClick={onSignOut}
              className="text-left text-ink/60 hover:text-ink text-sm px-3 py-2 rounded-xl hover:bg-ink/5 transition-colors"
            >
              ออกจากระบบ
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DesktopNavItem({
  link,
  open,
  onOpen,
  onClose,
  onNavigate,
}: {
  link: NavLink
  open: boolean
  onOpen: () => void
  onClose: () => void
  onNavigate: () => void
}) {
  if (!link.children?.length) {
    return (
      <a
        href={link.href}
        className="text-ink/70 hover:text-ink text-sm font-medium transition-colors"
      >
        {link.label}
      </a>
    )
  }

  return (
    <div
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <button
        type="button"
        onClick={() => (open ? onClose() : onOpen())}
        aria-expanded={open}
        className="flex items-center gap-1 text-ink/70 hover:text-ink text-sm font-medium transition-colors"
      >
        {link.label}
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="liquid-glass liquid-glass-nav absolute left-0 top-full mt-3 w-64 rounded-2xl p-2 flex flex-col"
          >
            {link.children.map((child) => (
              <div key={child.label} className="flex flex-col">
                <a
                  href={child.href}
                  onClick={onNavigate}
                  className="text-ink/80 hover:text-ink text-sm font-medium px-3 py-2 rounded-xl hover:bg-ink/5 transition-colors"
                >
                  {child.label}
                </a>
                {child.children?.map((sub) => (
                  <a
                    key={sub.label}
                    href={sub.href}
                    onClick={onNavigate}
                    className="text-ink/60 hover:text-ink text-xs font-medium pl-7 pr-3 py-1.5 rounded-xl hover:bg-ink/5 transition-colors"
                  >
                    {sub.label}
                  </a>
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MobileNavItem({
  link,
  expanded,
  onToggle,
  onNavigate,
}: {
  link: NavLink
  expanded: boolean
  onToggle: () => void
  onNavigate: () => void
}) {
  if (!link.children?.length) {
    return (
      <a
        href={link.href}
        onClick={onNavigate}
        className="text-ink/80 hover:text-ink text-sm font-medium px-4 py-3 rounded-xl hover:bg-ink/5 transition-colors"
      >
        {link.label}
      </a>
    )
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex items-center justify-between text-ink/80 hover:text-ink text-sm font-medium px-4 py-3 rounded-xl hover:bg-ink/5 transition-colors"
      >
        {link.label}
        <ChevronDown
          size={16}
          className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden flex flex-col pl-3"
          >
            {link.children.map((child) => (
              <div key={child.label} className="flex flex-col">
                <a
                  href={child.href}
                  onClick={onNavigate}
                  className="text-ink/75 hover:text-ink text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-ink/5 transition-colors"
                >
                  {child.label}
                </a>
                {child.children?.map((sub) => (
                  <a
                    key={sub.label}
                    href={sub.href}
                    onClick={onNavigate}
                    className="text-ink/60 hover:text-ink text-xs font-medium pl-8 pr-4 py-2 rounded-xl hover:bg-ink/5 transition-colors"
                  >
                    {sub.label}
                  </a>
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
