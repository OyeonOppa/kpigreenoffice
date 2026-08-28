import { useCallback, useEffect, useRef, useState } from 'react'
import { backend } from './index'
import type { AuthUser, RoomSnapshot } from './types'

/** บัญชีผู้ใช้ปัจจุบัน */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => backend.currentUser())
  const [busy, setBusy] = useState(false)

  useEffect(() => backend.onAuthChanged(setUser), [])

  const signIn = useCallback(async (name?: string) => {
    setBusy(true)
    try {
      return await backend.signIn({ name })
    } finally {
      setBusy(false)
    }
  }, [])

  return { user, busy, signIn, signOut: backend.signOut }
}

/** สถานะห้องแบบสด — คืน null ถ้ายังไม่มีห้องนี้ */
export function useRoom(pin: string | null) {
  const [room, setRoom] = useState<RoomSnapshot | null>(null)

  useEffect(() => {
    if (!pin) {
      setRoom(null)
      return
    }
    return backend.subscribeRoom(pin, setRoom)
  }, [pin])

  return room
}

/**
 * เวลาปัจจุบันแบบลื่น — ใช้กับตัวนับถอยหลังและวงแหวนเวลา
 * หยุดเองเมื่อ active = false เพื่อไม่ให้กิน CPU ตอนไม่ได้นับเวลา
 */
export function useNow(active = true) {
  const [now, setNow] = useState(() => Date.now())
  const raf = useRef(0)

  useEffect(() => {
    if (!active) return
    const tick = () => {
      setNow(Date.now())
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [active])

  return now
}

/** เวลาที่เหลือของเฟสปัจจุบัน (มิลลิวินาที) และสัดส่วนที่เหลือ 0–1 */
export function useCountdown(endsAt: number, totalMs: number, active = true) {
  const now = useNow(active && Number.isFinite(endsAt))
  const remaining = Math.max(0, Math.min(totalMs, endsAt - now))
  return { remaining, fraction: totalMs > 0 ? remaining / totalMs : 0 }
}

/**
 * เส้นทางแบบ hash — `#/live` = หน้าเกม ส่วน `#waste` เดิมยังเป็น anchor ในหน้าแรกเหมือนเดิม
 * ตัด query string ทิ้งก่อนเทียบเส้นทาง (`#/live?pin=123456` ยังนับเป็น `/live`)
 */
export function useHashRoute(): string {
  const read = () => {
    const hash = typeof window === 'undefined' ? '' : window.location.hash
    if (!hash.startsWith('#/')) return '/'
    return hash.slice(1).split('?')[0].replace(/\/+$/, '') || '/'
  }
  const [route, setRoute] = useState(read)

  useEffect(() => {
    const onChange = () => setRoute(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}

/** อ่านค่าจาก query string ต่อท้าย hash เช่น `#/live?pin=123456` → "123456" */
export function useHashQueryParam(key: string): string | null {
  const read = useCallback(() => {
    if (typeof window === 'undefined') return null
    const hash = window.location.hash
    const q = hash.split('?')[1]
    if (!q) return null
    return new URLSearchParams(q).get(key)
  }, [key])
  const [value, setValue] = useState(read)

  useEffect(() => {
    const onChange = () => setValue(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [read])

  return value
}
