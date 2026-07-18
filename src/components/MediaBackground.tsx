import { forwardRef, useState } from 'react'
import { ImageOff } from 'lucide-react'
import { USE_STATIC_IMAGES } from '../content'

interface MediaBackgroundProps {
  videoSrc: string
  imageSrc: string
  className?: string
  loop?: boolean
  autoPlay?: boolean
  style?: React.CSSProperties
}

// สลับระหว่างวิดีโอกับรูปนิ่งจาก flag USE_STATIC_IMAGES ใน content.ts จุดเดียว
// ref จะถูกส่งต่อเฉพาะตอนเป็น video (ใช้กับ useVideoCrossfade)
const MediaBackground = forwardRef<HTMLVideoElement, MediaBackgroundProps>(
  ({ videoSrc, imageSrc, className, loop = false, autoPlay = true, style }, ref) => {
    const [imageFailed, setImageFailed] = useState(false)

    if (USE_STATIC_IMAGES) {
      if (imageFailed) {
        return (
          <div
            className={`${className ?? ''} flex flex-col items-center justify-center gap-2 bg-white/5 text-white/30`}
            style={style}
          >
            <ImageOff size={28} />
            <span className="text-xs">ยังไม่มีรูปภาพ</span>
          </div>
        )
      }
      return (
        <img
          src={imageSrc}
          alt=""
          className={className}
          style={style}
          onError={() => setImageFailed(true)}
        />
      )
    }

    return (
      <video
        ref={ref}
        className={className}
        src={videoSrc}
        muted
        autoPlay={autoPlay}
        loop={loop}
        playsInline
        preload="auto"
        style={style}
      />
    )
  },
)

export default MediaBackground
