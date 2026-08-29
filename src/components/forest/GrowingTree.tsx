import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Tree3D from './Tree3D'
import type { TreeShape } from './treeGeometry'

interface GrowingTreeProps {
  /** รูปทรงที่สร้างไว้แล้ว — หน้าที่เรียกเป็นคนสร้างเอง เพราะต้องรู้ความสูงไปตั้งกล้องด้วย */
  shape: TreeShape
  position?: [number, number, number]
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/** ระยะเวลาเด้งตอนต้นโต (วินาที) */
const POP_SECONDS = 0.55

/**
 * ต้นไม้ที่ "เด้ง" ให้เห็นตอนโตขึ้น
 *
 * ไม่ได้ไล่ค่า growth ทีละเฟรม เพราะ buildTree แตกกิ่งใหม่ทั้งต้นแล้ว merge geometry
 * ทำแบบนั้นทุกเฟรมคือสร้าง-ทิ้ง geometry 60 ครั้งต่อวินาที มือถือค้างแน่
 * แทนที่ด้วยการสลับไปทรงใหม่ทันทีแล้วย่อ-ขยายกลับเข้าที่ ซึ่งอ่านออกว่า "เพิ่งโต" เหมือนกัน
 * และเสียแค่การคูณ scale ต่อเฟรม
 */
export default function GrowingTree({ shape, position = [0, 0, 0] }: GrowingTreeProps) {
  const group = useRef<THREE.Group>(null)
  const progress = useRef(1)
  // ทรงที่วาดอยู่ตอนนี้ — เปลี่ยนเมื่อไรแปลว่าแต้มขยับ (seed กับ lod ของต้นเดิมไม่เคยเปลี่ยน)
  const drawn = useRef(shape)

  useEffect(() => {
    if (drawn.current === shape) return // ครั้งแรกที่ mount ไม่ต้องเด้ง
    drawn.current = shape
    if (!prefersReducedMotion()) progress.current = 0
  }, [shape])

  useFrame((_, delta) => {
    if (progress.current >= 1 || !group.current) return
    progress.current = Math.min(1, progress.current + delta / POP_SECONDS)
    const eased = 1 - Math.pow(1 - progress.current, 3)
    // ขึ้นจาก 82% เลย 100% ไปนิดหนึ่งแล้วกลับเข้าที่ — จังหวะเดียวกับปุ่มเด้งในหน้าเกม
    group.current.scale.setScalar(0.82 + 0.18 * eased + Math.sin(eased * Math.PI) * 0.06)
    if (progress.current >= 1) group.current.scale.setScalar(1)
  })

  return (
    <group ref={group} position={position}>
      <Tree3D shape={shape} />
    </group>
  )
}
