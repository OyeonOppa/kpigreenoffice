import { useEffect, useRef, useState } from 'react'
import { LIVE_GAME } from '../../content'
import { GOOGLE_CLIENT_ID } from '../../game'
import { renderGoogleButton } from '../../game/googleAuth'
import { signInWithGoogleToken } from '../../game/cloudflareBackend'

interface GoogleSignInProps {
  /** ใช้ตอนยังไม่ได้ตั้ง Client ID — ล็อกอินด้วยชื่ออย่างเดียวสำหรับทดสอบ */
  onDevSignIn: (name: string) => void
  devDefaultName?: string
}

/**
 * ปุ่มเข้าสู่ระบบ
 * - ตั้ง VITE_GOOGLE_CLIENT_ID แล้ว → ปุ่ม Google ของจริง
 * - ยังไม่ได้ตั้ง → กล่องกรอกชื่อสำหรับทดสอบ (Worker ต้องเปิด DEV_ALLOW_FAKE_AUTH ด้วย)
 */
export default function GoogleSignIn({ onDevSignIn, devDefaultName = '' }: GoogleSignInProps) {
  const holder = useRef<HTMLDivElement>(null)
  const [name, setName] = useState(devDefaultName)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !holder.current) return
    renderGoogleButton(
      holder.current,
      GOOGLE_CLIENT_ID,
      LIVE_GAME.allowedDomain,
      signInWithGoogleToken,
    ).catch((err: Error) => setError(err.message))
  }, [])

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-left">
        <p className="text-amber-900 text-xs leading-relaxed mb-2">
          ยังไม่ได้ตั้งค่า Google (VITE_GOOGLE_CLIENT_ID) — โหมดทดสอบ พิมพ์ชื่อแล้วกดเข้าสู่ระบบได้เลย
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อที่จะแสดงในเกม"
          className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent mb-2"
        />
        <button
          type="button"
          onClick={() => onDevSignIn(name)}
          className="pop-btn bg-accent text-white w-full py-2.5 text-sm font-medium"
        >
          เข้าสู่ระบบ (โหมดทดสอบ)
        </button>
      </div>
    )
  }

  return (
    <div>
      <div ref={holder} className="flex justify-center" />
      {error && <p className="text-rose-700 text-xs mt-2">{error}</p>}
    </div>
  )
}
