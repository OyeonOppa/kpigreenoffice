import { useCallback, useEffect, useState } from 'react'
import { forestBackend } from './index'
import type { ForestSnapshot, ForestUser } from './types'

/** ตัวตนของคนที่กำลังใช้หน้าป่า — แยกจากการล็อกอินของเกมแข่งสด (ดูเหตุผลใน forest/backend.ts) */
export function useForestAuth() {
  const [user, setUser] = useState<ForestUser | null>(() => forestBackend.currentUser())
  const [busy, setBusy] = useState(false)

  useEffect(() => forestBackend.onAuthChanged(setUser), [])

  const signIn = useCallback(async (name: string) => {
    setBusy(true)
    try {
      return await forestBackend.signIn(name)
    } finally {
      setBusy(false)
    }
  }, [])

  return { user, busy, signIn, signOut: forestBackend.signOut }
}

/**
 * ข้อมูลป่าของคนที่กำลังดูอยู่ — null คือยังไม่ล็อกอิน
 * อัปเดตเองเมื่อคนอื่นในสำนักได้แต้ม (สวนเป็นข้อมูลร่วม)
 */
export function useForest(uid: string | null): ForestSnapshot | null {
  const [snapshot, setSnapshot] = useState<ForestSnapshot | null>(null)

  useEffect(() => {
    if (!uid) {
      setSnapshot(null)
      return
    }
    return forestBackend.subscribeForest(uid, setSnapshot)
  }, [uid])

  return snapshot
}
