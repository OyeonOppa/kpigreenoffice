interface MyTreeMarkerProps {
  position: [number, number, number]
}

/**
 * วงแหวนบนพื้นใต้ต้นของตัวเอง
 *
 * สวนหนึ่งมีได้ถึง 60 ต้นที่หน้าตาไม่ซ้ำกัน ถ้าไม่มีอะไรชี้ คนหาต้นตัวเองไม่เจอ
 * วางสูงจากพื้น 3 ซม. กัน z-fighting กับพื้นหญ้า
 */
export default function MyTreeMarker({ position }: MyTreeMarkerProps) {
  return (
    <mesh position={[position[0], 0.03, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.15, 1.5, 40]} />
      <meshBasicMaterial color="#f7c948" transparent opacity={0.9} />
    </mesh>
  )
}
