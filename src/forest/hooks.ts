import { useCallback, useEffect, useState } from 'react'
import { forestBackend } from './index'
import type { ForestSnapshot, ForestUser, OrgSnapshot } from './types'

/** ตัวตนของคนที่กำลังใช้หน้าป่า — แยกจากการล็อกอินของเกมแข่งสด (ดูเหตุผลใน forest/backend.ts) */
export function useForestAuth() {
  const [user, setUser] = useState<ForestUser | null>(() => forestBackend.currentUser())
  const [busy, setBusy] = useState(false)

  useEffect(() => forestBackend.onAuthChanged(setUser), [])

  const signIn = useCallback(async (username: string, password: string) => {
    setBusy(true)
    try {
      return await forestBackend.signIn(username, password)
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

/**
 * ยอดรวมทั้งหน่วยงานสำหรับต้นไม้องค์กรในหน้าแรก — ใช้ได้โดยไม่ต้องล็อกอิน
 * null = ยังไม่ได้ค่าแรก หน้าจอควรวาดต้นเล็กสุดไว้ก่อน ไม่ใช่ปล่อยว่าง
 */
export function useOrgForest(): OrgSnapshot | null {
  const [org, setOrg] = useState<OrgSnapshot | null>(null)
  useEffect(() => forestBackend.subscribeOrg(setOrg), [])
  return org
}
