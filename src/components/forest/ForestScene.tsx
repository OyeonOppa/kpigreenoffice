import { Suspense, useEffect, useRef, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/** เรเดียนต่อวินาทีของกล้องที่หมุนรอบต้น — ครบรอบราว 100 วินาที ช้าพอที่จะไม่กวนสายตา */
const ORBIT_SPEED = 0.06

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/** มุมมองแนวตั้งของกล้อง — ใช้ทั้งตอนสร้าง Canvas และตอนคำนวณระยะ ต้องเป็นค่าเดียวกัน */
const CAMERA_FOV = 42

/**
 * ระยะกล้องที่ทำให้ของสูง height กว้าง width อยู่ในเฟรมพอดี
 *
 * ระยะสำหรับความกว้างต้องคิดจากสัดส่วนจอจริง ไม่ใช่ค่าคงที่ —
 * จอมือถือแคบกว่าจอคอมเกือบ 3 เท่า ใช้ระยะเดียวกันแล้วต้นริมสวนโดนตัดหายไปทั้งแถว
 */
function cameraDistance(height: number, width: number, aspect: number, padding: number) {
  const forHeight = Math.max(height, 0.6) * padding + 1.1
  if (width <= 0) return forHeight
  const halfFov = ((CAMERA_FOV * Math.PI) / 180) / 2
  // เผื่อขอบ 8% ไม่ให้ต้นริมสุดชนขอบเฟรมพอดีเป๊ะ
  const forWidth = (width / 2 / (Math.tan(halfFov) * Math.max(aspect, 0.1))) * 1.08
  return Math.max(forHeight, forWidth)
}

/**
 * ตั้งกล้องให้พอดีกับความสูงของสิ่งที่อยู่ในฉาก
 * จำเป็นเพราะต้นไม้โตขึ้นเรื่อยๆ ถ้าตั้งกล้องค่าเดียวตายตัว พอต้นโตจะหลุดเฟรม
 */
function FitCamera({
  height,
  width = 0,
  depth = 0,
  padding = 1.55,
  orbit = false,
}: {
  height: number
  width?: number
  depth?: number
  padding?: number
  orbit?: boolean
}) {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  // วงโคจรที่คำนวณไว้แล้วจากตำแหน่งที่จัดเฟรมได้พอดี — useFrame ใช้ต่อโดยไม่ต้องคิดใหม่ทุกเฟรม
  const path = useRef({ radius: 0, angle: 0, y: 0, lookY: 0, lookZ: 0 })

  const h = Math.max(height, 0.6)
  // ถ้ามีของวางเรียงกันเป็นแนวกว้าง (สวน) ต้องถอยกล้องให้พอเห็นทั้งแถว
  const dist = cameraDistance(h, width, size.width / size.height, padding)

  useEffect(() => {
    // มีของเรียงเป็นแถวกว้าง ให้กล้องเยื้องน้อยลง ไม่งั้นต้นปลายแถวจะเล็ก/ใหญ่ผิดสัดส่วน
    // จนเทียบขนาดกันไม่ได้ ต้นเดี่ยวเยื้องได้เต็มที่เพื่อให้เห็นมิติ
    const x = dist * (width > 0 ? 0.14 : 0.62)
    // สวนที่ลึกต้องเล็งเข้าไปกลางสวน ไม่ใช่แถวหน้าสุด
    // ไม่งั้นครึ่งล่างของเฟรมเป็นสนามหญ้าเปล่าๆ ส่วนต้นไม้ไปกองอยู่แถบบนแคบๆ
    const lookZ = -depth * 0.45
    camera.position.set(x, h * 0.72 + width * 0.1, dist)
    camera.lookAt(0, h * 0.42, lookZ)
    camera.updateProjectionMatrix()
    path.current = {
      radius: Math.hypot(x, dist),
      angle: Math.atan2(x, dist),
      y: camera.position.y,
      lookY: h * 0.42,
      lookZ,
    }
  }, [h, dist, depth, width, camera])

  useFrame((_, delta) => {
    if (!orbit || path.current.radius === 0 || prefersReducedMotion()) return
    const p = path.current
    p.angle += delta * ORBIT_SPEED
    camera.position.set(
      Math.sin(p.angle) * p.radius,
      p.y,
      Math.cos(p.angle) * p.radius + p.lookZ,
    )
    camera.lookAt(0, p.lookY, p.lookZ)
  })

  // หมอกใช้ระยะกล้องชุดเดียวกัน — เริ่มจางก่อนถึงต้นแถวหน้า และหมดหลังแถวหลังสุด
  // ได้ความลึกโดยไม่กลืนต้นแถวหลังหายไปทั้งแถว
  return <fog attach="fog" args={['#cfe3f0', dist * 0.8, dist + depth + 25]} />
}

interface ForestSceneProps {
  children: ReactNode
  /** ความสูงของสิ่งที่ต้องการให้อยู่ในเฟรม (ใช้ shape.height ของต้นไม้) */
  fitHeight: number
  /** ความกว้างของแถว/สวน ถ้ามีต้นไม้หลายต้นเรียงกัน */
  fitWidth?: number
  /**
   * ความลึกของสวน (แถวหน้าถึงแถวหลัง) — ใช้ยืดหมอกกับกรอบเงาให้คลุมถึงแถวหลังสุด
   * ถ้าไม่บอก หมอกจะกลืนต้นแถวหลังหายไปทั้งแถวเมื่อสวนลึกกว่าค่าตั้งต้น
   */
  fitDepth?: number
  className?: string
  /** ปิดเงาบนเครื่องที่ช้า — เงาเป็นตัวกินแรงที่สุดในฉาก */
  shadows?: boolean
  /**
   * ให้กล้องหมุนรอบช้าๆ — ใช้กับมุมมองต้นเดียวเพื่อให้เห็นทรงพุ่มรอบด้าน
   * ไม่ควรเปิดในมุมมองสวน เพราะต้นที่เรียงเป็นแถวจะบังกันไปมาจนดูไม่รู้เรื่อง
   */
  orbit?: boolean
}

/**
 * ฉาก 3D สำหรับต้นไม้/สวน/ป่า
 *
 * ความสมจริงมาจากแสงเป็นหลัก ไม่ใช่จำนวนเหลี่ยม:
 * - แสงอาทิตย์ทิศทางเดียว + เงาจริง ทำให้เห็นปริมาตรของพุ่มใบ
 * - hemisphere light จำลองแสงฟ้าจากบน + แสงสะท้อนจากพื้นด้านล่าง
 *   (ถ้าใช้ ambient เฉยๆ ทุกอย่างจะแบนเหมือนภาพการ์ตูน)
 * - หมอกจางๆ ให้ต้นไกลจางลง เกิดมิติความลึก
 */
export default function ForestScene({
  children,
  fitHeight,
  fitWidth = 0,
  fitDepth = 0,
  className = '',
  shadows = true,
  orbit = false,
}: ForestSceneProps) {
  // กรอบเงาต้องคลุมทั้งสวน ไม่ใช่แค่ความกว้าง ไม่งั้นแถวหลังจะไม่มีเงาให้เห็นเลย
  const shadowExtent = Math.max(8, Math.max(fitWidth, fitDepth) * 0.7)

  return (
    <div className={className}>
      <Canvas
        shadows={shadows}
        dpr={[1, 1.8]}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        camera={{ fov: CAMERA_FOV }}
      >
        <color attach="background" args={['#dcecf7']} />
        <FitCamera height={fitHeight} width={fitWidth} depth={fitDepth} orbit={orbit} />

        {/* แสงฟ้า/แสงสะท้อนพื้น — ตัวที่ทำให้ใบไม่ดำทึบด้านที่ไม่โดนแดด */}
        <hemisphereLight args={['#bcd9ef', '#5b6b3a', 1.1]} />

        {/* ดวงอาทิตย์ + เงา */}
        <directionalLight
          position={[4.5, 8, 3]}
          intensity={2.1}
          color="#fff3d6"
          castShadow={shadows}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0008}
          shadow-camera-near={1}
          shadow-camera-far={30 + fitDepth}
          shadow-camera-left={-shadowExtent}
          shadow-camera-right={shadowExtent}
          shadow-camera-top={shadowExtent}
          shadow-camera-bottom={-shadowExtent}
        />

        {/* พื้นหญ้า — ต้องกว้างพอให้ขอบวงอยู่นอกเฟรมเสมอ ไม่งั้นจะเห็นขอบพื้นลอยอยู่กลางอากาศ */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <circleGeometry args={[Math.max(26, fitWidth * 0.9 + fitDepth), 48]} />
          <meshStandardMaterial color="#7a9455" roughness={1} metalness={0} />
        </mesh>

        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  )
}
