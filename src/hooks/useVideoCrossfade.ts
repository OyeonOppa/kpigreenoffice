import { useEffect, type RefObject } from 'react'

// fade opacity ของ video ด้วย rAF เพื่อให้ loop แบบ crossfade กับพื้นดำ
export function useVideoCrossfade(videoRef: RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let rafId = 0
    let fading = false

    const animateOpacity = (from: number, to: number, duration: number, done?: () => void) => {
      cancelAnimationFrame(rafId)
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1)
        video.style.opacity = String(from + (to - from) * t)
        if (t < 1) {
          rafId = requestAnimationFrame(tick)
        } else {
          done?.()
        }
      }
      rafId = requestAnimationFrame(tick)
    }

    const onCanPlay = () => {
      if (video.style.opacity !== '' && video.style.opacity !== '0') return
      video.play().catch(() => {})
      animateOpacity(0, 1, 500)
    }

    const onTimeUpdate = () => {
      if (fading || !video.duration) return
      if (video.duration - video.currentTime <= 0.55) {
        fading = true
        const current = parseFloat(video.style.opacity || '1')
        animateOpacity(current, 0, 500)
      }
    }

    const onEnded = () => {
      video.style.opacity = '0'
      window.setTimeout(() => {
        video.currentTime = 0
        video.play().catch(() => {})
        fading = false
        animateOpacity(0, 1, 500)
      }, 100)
    }

    video.addEventListener('canplay', onCanPlay)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('ended', onEnded)

    // ถ้าวิดีโอพร้อมเล่นก่อน effect ทำงาน canplay จะไม่ยิงอีก ต้องเรียกเอง
    if (video.readyState >= 3) onCanPlay()

    return () => {
      cancelAnimationFrame(rafId)
      video.removeEventListener('canplay', onCanPlay)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('ended', onEnded)
    }
  }, [videoRef])
}
