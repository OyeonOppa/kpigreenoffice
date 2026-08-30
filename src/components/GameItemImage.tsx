import { useState } from 'react'

interface GameItemImageProps {
  src: string
  emoji: string
  className?: string
}

// รูปไอเท็มในเกมแยกขยะ — พื้นหลังตัดออกจริง (โปร่งใส) แล้ว จึงวางทับพื้นสีอะไรก็ได้ตรงๆ
// ไม่ใช้ mix-blend-mode: multiply อีกต่อไป (เคยใช้กลืนพื้นขาวตอนรูปยังมีพื้นหลังทึบอยู่ —
// ถ้าใส่ไว้กับรูปโปร่งใสจะทำให้สีวัตถุมืดคล้ำลงตามสีพื้นหลังการ์ด ไม่ใช่ประโยชน์อีกแล้ว)
// ถ้าไฟล์ยังไม่มี (หรือโหลดไม่สำเร็จ) จะ fallback กลับไปแสดง emoji เดิม
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
    />
  )
}
