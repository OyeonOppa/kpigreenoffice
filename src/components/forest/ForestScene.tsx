import { Suspense, useEffect, type ReactNode } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * ตั้งกล้องให้พอดีกับความสูงของสิ่งที่อยู่ในฉาก
 * จำเป็นเพราะต้นไม้โตขึ้นเรื่อยๆ ถ้าตั้งกล้องค่าเดียวตายตัว พอต้นโตจะหลุดเฟรม
 */
function FitCamera({
  height,
  width = 0,
  padding = 1.55,
}: {
  height: number
  width?: number
  padding?: number
}) {
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    const h = Math.max(height, 0.6)
    // ถ้ามีของวางเรียงกันเป็นแนวกว้าง (สวน) ต้องถอยกล้องให้พอเห็นทั้งแถว
    const dist = Math.max(h * padding + 1.1, width * 0.62)
    // มีของเรียงเป็นแถวกว้าง ให้กล้องเยื้องน้อยลง ไม่งั้นต้นปลายแถวจะเล็ก/ใหญ่ผิดสัดส่วน
    // จนเทียบขนาดกันไม่ได้ ต้นเดี่ยวเยื้องได้เต็มที่เพื่อให้เห็นมิติ
    camera.position.set(dist * (width > 0 ? 0.14 : 0.62), h * 0.72 + width * 0.1, dist)
    camera.lookAt(0, h * 0.42, 0)
    camera.updateProjectionMatrix()
  }, [height, width, padding, camera])
  return null
}

interface ForestSceneProps {
  children: ReactNode
  /** ความสูงของสิ่งที่ต้องการให้อยู่ในเฟรม (ใช้ shape.height ของต้นไม้) */
  fitHeight: number
  /** ความกว้างของแถว/สวน ถ้ามีต้นไม้หลายต้นเรียงกัน */
  fitWidth?: number
  className?: string
  /** ปิดเงาบนเครื่องที่ช้า — เงาเป็นตัวกินแรงที่สุดในฉาก */
  shadows?: boolean
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
  className = '',
  shadows = true,
}: ForestSceneProps) {
  return (
    <div className={className}>
      <Canvas
        shadows={shadows}
        dpr={[1, 1.8]}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        camera={{ fov: 42 }}
        onCreated={({ scene }) => {
          scene.fog = new THREE.Fog('#cfe3f0', 14, 42)
        }}
      >
        <color attach="background" args={['#dcecf7']} />
        <FitCamera height={fitHeight} width={fitWidth} />

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
          shadow-camera-far={30}
          shadow-camera-left={-Math.max(8, fitWidth * 0.7)}
          shadow-camera-right={Math.max(8, fitWidth * 0.7)}
          shadow-camera-top={Math.max(8, fitWidth * 0.7)}
          shadow-camera-bottom={-Math.max(8, fitWidth * 0.7)}
        />

        {/* พื้นหญ้า */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <circleGeometry args={[26, 48]} />
          <meshStandardMaterial color="#7a9455" roughness={1} metalness={0} />
        </mesh>

        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  )
}
