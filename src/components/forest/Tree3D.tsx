import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { buildTree, type TreeShape } from './treeGeometry'

/** สร้างรูปทรงต้นไม้ — แยกเป็น hook เพื่อให้หน้าที่เรียกรู้ความสูงต้นไปตั้งกล้องได้ */
export function useTreeShape(seed: string, growth: number): TreeShape {
  return useMemo(() => buildTree(seed, growth), [seed, growth])
}

interface Tree3DProps {
  shape: TreeShape
  position?: [number, number, number]
}

// วัสดุใช้ร่วมกันทุกต้น — สร้างครั้งเดียวแล้วแชร์ ไม่งั้นสวน 60 ต้นจะสร้าง 120 material
const barkMaterial = new THREE.MeshStandardMaterial({
  color: '#6b5442',
  roughness: 0.92,
  metalness: 0,
})

const leafMaterial = new THREE.MeshStandardMaterial({
  color: '#ffffff', // ใช้สีจริงจาก instanceColor
  roughness: 0.78,
  metalness: 0,
  flatShading: true, // เหลี่ยมเล็กน้อยทำให้แสงตกกระทบเห็นมิติ ดูเป็นมวลใบ
})

// พุ่มใบใช้ทรงหยาบที่สุดที่ยังดูเป็นก้อนใบได้ — 20 สามเหลี่ยมต่อก้อน
// เคยใช้ detail 1 (80 สามเหลี่ยม) แล้ววัดได้ 1.37 ล้านสามเหลี่ยมที่สวน 48 ต้น หนักเกินไปสำหรับมือถือ
// ที่ยังดูดีเพราะ flatShading ทำให้เหลี่ยมกลายเป็นมิติแสงเงา ไม่ใช่ข้อบกพร่อง
const leafGeometry = new THREE.IcosahedronGeometry(1, 0)

export default function Tree3D({ shape, position = [0, 0, 0] }: Tree3DProps) {
  const leafRef = useRef<THREE.InstancedMesh>(null)

  useEffect(() => {
    const mesh = leafRef.current
    if (!mesh) return
    shape.leaves.forEach((m, i) => mesh.setMatrixAt(i, m))
    shape.leafTints.forEach((c, i) => mesh.setColorAt(i, c))
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [shape])

  // คืนหน่วยความจำเมื่อต้นเปลี่ยนรูป (เช่น โตขึ้นระยะ) ไม่งั้น GPU memory รั่วสะสม
  useEffect(() => () => shape.branches.dispose(), [shape])

  return (
    <group position={position}>
      <mesh geometry={shape.branches} material={barkMaterial} castShadow receiveShadow />
      {shape.leaves.length > 0 && (
        <instancedMesh
          key={shape.leaves.length}
          ref={leafRef}
          args={[leafGeometry, leafMaterial, shape.leaves.length]}
          castShadow
          receiveShadow
        />
      )}
    </group>
  )
}
