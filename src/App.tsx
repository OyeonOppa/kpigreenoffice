import { lazy, Suspense, useEffect } from 'react'
import { useHashRoute } from './game/hooks'
import HomePage from './pages/HomePage'
import LiveHostPage from './pages/LiveHostPage'
import LivePlayerPage from './pages/LivePlayerPage'

// โหลดแยกก้อน — คนที่มาอ่านหน้าแรกเฉยๆ ไม่ต้องโหลดหน้าพวกนี้ติดไปด้วย
// (เดิมแยกเพราะ three.js หนัก ตอนนี้ต้นไม้เป็น SVG แล้ว เหลือแค่เหตุผลเรื่องโค้ดที่ไม่ได้ใช้)
const ForestPage = lazy(() => import('./pages/ForestPage'))
const TreeLabPage = lazy(() => import('./pages/TreeLabPage'))
const ForestStaffPage = lazy(() => import('./pages/ForestStaffPage'))
const PassTrashPage = lazy(() => import('./pages/PassTrashPage'))
const BarrierPage = lazy(() => import('./pages/BarrierPage'))
const DecomposePage = lazy(() => import('./pages/DecomposePage'))

// เส้นทางแบบ hash — โฮสต์แบบ static ไฟล์เดียวใช้ได้เลย ไม่ต้องตั้ง rewrite ที่เซิร์ฟเวอร์
// `#/live` = หน้าเกม ส่วน `#waste` `#calculator` เดิมยังเป็น anchor ในหน้าแรกเหมือนเดิม
export default function App() {
  const route = useHashRoute()

  useEffect(() => {
    // เข้าหน้าเกมแล้วให้เริ่มที่บนสุดเสมอ ไม่ค้างตำแหน่งเดิมจากหน้าแรก
    if (route !== '/') window.scrollTo(0, 0)
  }, [route])

  if (route === '/live') return <LivePlayerPage />
  if (route === '/live/host') return <LiveHostPage />
  if (route === '/pass-trash') {
    return (
      <Suspense fallback={<div className="min-h-dvh bg-canvas" />}>
        <PassTrashPage />
      </Suspense>
    )
  }
  if (route === '/decompose') {
    return (
      <Suspense fallback={<div className="min-h-dvh bg-canvas" />}>
        <DecomposePage />
      </Suspense>
    )
  }
  if (route === '/barrier') {
    return (
      <Suspense fallback={<div className="min-h-dvh bg-canvas" />}>
        <BarrierPage />
      </Suspense>
    )
  }
  if (route === '/forest' || route === '/forest/staff' || route === '/tree-lab') {
    return (
      <Suspense fallback={<div className="min-h-dvh bg-canvas" />}>
        {route === '/forest' && <ForestPage />}
        {route === '/forest/staff' && <ForestStaffPage />}
        {route === '/tree-lab' && <TreeLabPage />}
      </Suspense>
    )
  }
  return <HomePage />
}
