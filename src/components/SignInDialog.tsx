import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sprout, X } from 'lucide-react'
import { FOREST } from '../content'
import { FOREST_REHEARSAL } from '../forest'
import { useForestAuth } from '../forest/hooks'

/**
 * กล่องเข้าสู่ระบบด้วยชื่อผู้ใช้ + รหัสพนักงาน
 *
 * บัญชีถูกสร้างไว้ล่วงหน้าจากรายชื่อในองค์กร ไม่มีการสมัครเอง
 * เซิร์ฟเวอร์ตรวจรหัสแล้วคืนโทเคน — navbar/hero ฟังจาก onAuthChanged อยู่แล้ว ไม่ต้องแก้
 */
export default function SignInDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { busy, signIn } = useForestAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // เก็บ onClose ไว้ใน ref เพราะพ่อส่งฟังก์ชันใหม่มาทุกรอบที่วาด
  // ถ้าใส่ไว้ใน deps ตรงๆ effect จะรันใหม่ทุกครั้งที่ navbar วาด แล้วตั้ง timer โฟกัสซ้ำไม่จบ
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    // โฟกัสหลังอนิเมชันเข้าเริ่ม ไม่งั้นบางเบราว์เซอร์เลื่อนหน้าตามช่องที่ยังไม่เข้าที่
    const timer = setTimeout(() => inputRef.current?.focus(), 120)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const submit = async () => {
    if (!username.trim() || !password) return
    setError(null)
    const result = await signIn(username, password)
    if (result.ok) {
      setUsername('')
      setPassword('')
      setError(null)
      onClose()
    } else {
      setError(result.reason ?? 'เข้าสู่ระบบไม่สำเร็จ')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/35 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="signin-title"
            onClick={(e) => e.stopPropagation()}
            className="pop-card w-full max-w-sm p-6 relative"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="ปิด"
              className="absolute right-3 top-3 rounded-full p-2 text-ink/45 hover:text-ink hover:bg-ink/5 transition-colors"
            >
              <X size={18} />
            </button>

            <Sprout size={34} className="text-accent mx-auto mb-2" />
            <h2 id="signin-title" className="font-display text-xl text-ink text-center mb-1">
              {FOREST.auth.title}
            </h2>
            <p className="text-ink/60 text-sm text-center mb-5">{FOREST.auth.intro}</p>

            <label className="block text-ink/70 text-sm mb-1" htmlFor="signin-username">
              ชื่อผู้ใช้
            </label>
            <input
              ref={inputRef}
              id="signin-username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void submit()}
              placeholder="เช่น somchai.j"
              className="w-full rounded-2xl border-2 border-line bg-surface px-4 py-2.5 outline-none focus:border-accent"
            />

            <label className="block text-ink/70 text-sm mb-1 mt-3" htmlFor="signin-password">
              รหัสผ่าน (รหัสพนักงาน)
            </label>
            <input
              id="signin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void submit()}
              className="w-full rounded-2xl border-2 border-line bg-surface px-4 py-2.5 outline-none focus:border-accent"
            />

            {error && <p className="text-red-600 text-xs mt-2">{error}</p>}

            <button
              type="button"
              onClick={() => void submit()}
              disabled={busy || !username.trim() || !password}
              className="pop-btn w-full bg-accent-deep text-white py-3 font-medium mt-4 disabled:opacity-50"
            >
              {busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
            </button>

            {FOREST_REHEARSAL && (
              <p className="text-ink/45 text-xs text-center mt-4 leading-relaxed">
                {FOREST.auth.mockHint}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
