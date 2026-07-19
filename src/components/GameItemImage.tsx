import { useState } from 'react'

interface GameItemImageProps {
  src: string
  emoji: string
}

// รูปไอเท็มในเกมแยกขยะ — ถ้าไฟล์ยังไม่มี (หรือโหลดไม่สำเร็จ) จะ fallback กลับไปแสดง emoji เดิม
export default function GameItemImage({ src, emoji }: GameItemImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <div className="text-6xl mb-3">{emoji}</div>
  }

  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className="w-24 h-24 sm:w-28 sm:h-28 object-contain mx-auto mb-3"
      style={{ mixBlendMode: 'multiply' }}
    />
  )
}
