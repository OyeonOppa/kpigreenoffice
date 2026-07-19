import { useState } from 'react'

interface BinImageProps {
  src: string
  color: string
  /** Tailwind responsive width classes เช่น "w-28 sm:w-36 lg:w-64" — ทำให้กำหนดขนาดตาม breakpoint ได้ */
  className: string
}

// รูปถังขยะจริง — ไม่มีกรอบ/พื้นหลัง ให้ดูเหมือนลอยออกมาจากเว็บ
// ใช้ mix-blend-mode: multiply เพื่อให้พื้นหลังสีขาวของรูปถ่าย "หายไป" กลืนกับสีพื้นหลังเว็บ
// (ได้ผลดีเพราะพื้นเว็บเป็นโทนสว่างใกล้ขาว ถ้าไฟล์เป็นรูปตัดขอบโปร่งใสจริงจะยิ่งสวยขึ้นไปอีก)
// ถ้าไฟล์ยังไม่มี (หรือโหลดไม่สำเร็จ) จะ fallback กลับไปเป็นวงกลมสีเล็กๆ แทน
export default function BinImage({ src, color, className }: BinImageProps) {
  const [failed, setFailed] = useState(false)

  return (
    <div className={`relative ${className} aspect-square flex items-end justify-center`}>
      {failed ? (
        <span
          className="relative rounded-full border border-ink/15 shrink-0"
          style={{ backgroundColor: color, width: '55%', height: '55%' }}
        />
      ) : (
        <img
          src={src}
          alt=""
          onError={() => setFailed(true)}
          className="relative w-full h-full object-contain"
          style={{
            mixBlendMode: 'multiply',
            WebkitMaskImage:
              'radial-gradient(ellipse 62% 66% at center 45%, black 60%, transparent 94%)',
            maskImage: 'radial-gradient(ellipse 62% 66% at center 45%, black 60%, transparent 94%)',
          }}
        />
      )}
    </div>
  )
}
