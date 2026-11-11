import { lazy, Suspense, useEffect, type ComponentType, type LazyExoticComponent } from 'react'
import { useHashRoute } from './game/hooks'
import HomePage from './pages/HomePage'
import { normalizePath } from './seo/pages'

// โหลดแยกก้อน — คนที่มาอ่านหน้าแรกเฉยๆ ไม่ต้องโหลดหน้าพวกนี้ติดไปด้วย
// (เดิมแยกเพราะ three.js หนัก ตอนนี้ต้นไม้เป็น SVG แล้ว เหลือแค่เหตุผลเรื่องโค้ดที่ไม่ได้ใช้)
const LiveHostPage = lazy(() => import('./pages/LiveHostPage'))
const LivePlayerPage = lazy(() => import('./pages/LivePlayerPage'))
const ForestPage = lazy(() => import('./pages/ForestPage'))
const TreeLabPage = lazy(() => import('./pages/TreeLabPage'))
const ForestStaffPage = lazy(() => import('./pages/ForestStaffPage'))
const PassTrashPage = lazy(() => import('./pages/PassTrashPage'))
const BarrierPage = lazy(() => import('./pages/BarrierPage'))
const DecomposePage = lazy(() => import('./pages/DecomposePage'))
const OfficeEnergyPage = lazy(() => import('./pages/OfficeEnergyPage'))

const WasteDecompositionPage = lazy(() => import('./pages/knowledge/WasteDecompositionPage'))
const FoodCarbonPage = lazy(() => import('./pages/knowledge/FoodCarbonPage'))
const WasteSortingPage = lazy(() => import('./pages/knowledge/WasteSortingPage'))
const ThreeRPage = lazy(() => import('./pages/knowledge/ThreeRPage'))
const CarbonCalculatorPage = lazy(() => import('./pages/CarbonCalculatorPage'))
const KnowledgeHubPage = lazy(() => import('./pages/HubPages').then((m) => ({ default: m.KnowledgeHubPage })))
const GamesHubPage = lazy(() => import('./pages/HubPages').then((m) => ({ default: m.GamesHubPage })))
const NotFoundPage = lazy(() => import('./pages/HubPages').then((m) => ({ default: m.NotFoundPage })))

// หน้าที่ต้องค้นหาเจอใช้ URL จริง เพราะ Google ไม่นับส่วนหลัง # เป็นคนละหน้า (ทะเบียนอยู่ที่ seo/pages.ts)
const PATH_ROUTES: Record<string, LazyExoticComponent<ComponentType>> = {
  '/knowledge/': KnowledgeHubPage,
  '/knowledge/waste-decomposition-time/': WasteDecompositionPage,
  '/knowledge/food-carbon-footprint/': FoodCarbonPage,
  '/knowledge/waste-sorting/': WasteSortingPage,
  '/knowledge/3r/': ThreeRPage,
  '/carbon-calculator/': CarbonCalculatorPage,
  '/games/': GamesHubPage,
  '/games/decompose/': DecomposePage,
  '/games/pass-trash/': PassTrashPage,
  '/games/barrier/': BarrierPage,
  '/games/office-energy/': OfficeEnergyPage,
}

// ลิงก์เก่าที่แชร์หรือพิมพ์ไปแล้ว พาไปหน้าใหม่ — #/live และ #/forest ยังใช้แบบเดิมเพราะมี QR ที่พิมพ์ไปแล้ว
const LEGACY_HASH: Record<string, string> = {
  '/decompose': '/games/decompose/',
  '/pass-trash': '/games/pass-trash/',
  '/barrier': '/games/barrier/',
  '/office-energy': '/games/office-energy/',
}

const fallback = <div className="min-h-dvh bg-canvas" />

export default function App({ initialPath }: { initialPath?: string }) {
  const route = useHashRoute()
  const path = normalizePath(initialPath ?? (typeof window === 'undefined' ? '/' : window.location.pathname))

  useEffect(() => {
    if (LEGACY_HASH[route]) {
      window.location.replace(LEGACY_HASH[route])
      return
    }
    // เข้าหน้าเกมแล้วให้เริ่มที่บนสุดเสมอ ไม่ค้างตำแหน่งเดิมจากหน้าแรก
    if (route !== '/') window.scrollTo(0, 0)
  }, [route])

  if (path !== '/') {
    const Page = PATH_ROUTES[path] ?? NotFoundPage
    return (
      <Suspense fallback={fallback}>
        <Page />
      </Suspense>
    )
  }

  if (route === '/live' || route === '/live/host') {
    return <Suspense fallback={fallback}>{route === '/live' ? <LivePlayerPage /> : <LiveHostPage />}</Suspense>
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
