import { useState } from 'react'

interface GameItemImageProps {
  src: string
  emoji: string
  className?: string
}

// รูปไอเท็มในเกมแยกขยะ — ถ้าไฟล์ยังไม่มี (หรือโหลดไม่สำเร็จ) จะ fallback กลับไปแสดง emoji เดิม
export default function GameItemImage({
  src,
  emoji,
  className = 'w-24 sm:w-28',
}: GameItemImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className={`${className} aspect-square flex items-center justify-center mx-auto mb-3`}>
        <span className="text-7xl md:text-8xl">{emoji}</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className={`${className} aspect-square object-contain mx-auto mb-3`}
      style={{ mixBlendMode: 'multiply' }}
    />
  )
}
