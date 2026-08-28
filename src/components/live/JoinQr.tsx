import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface JoinQrProps {
  url: string
  size?: number
  className?: string
}

// QR code สำหรับสแกนเข้าห้อง — เรนเดอร์เป็น data URL ในเครื่อง ไม่มีการยิงไปเซิร์ฟเวอร์ภายนอก
// (บาง service QR ออนไลน์แอบล็อก URL ที่คนสแกน อันนี้เจนฝั่งไคลเอนต์ล้วน ไม่มีใครเห็น)
export default function JoinQr({ url, size = 220, className = '' }: JoinQrProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(url, {
      width: size,
      margin: 1,
      color: { dark: '#1c2a20', light: '#ffffff' },
    })
      .then((result) => {
        if (!cancelled) setDataUrl(result)
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [url, size])

  if (!dataUrl) {
    return (
      <div
        className={`bg-ink/5 rounded-2xl animate-pulse ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
      />
    )
  }

  return (
    <img
      src={dataUrl}
      alt={`สแกนเพื่อเข้าห้องแข่งที่ ${url}`}
      width={size}
      height={size}
      className={`rounded-2xl ${className}`}
    />
  )
}
