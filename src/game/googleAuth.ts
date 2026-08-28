// เข้าสู่ระบบด้วย Google Identity Services — โหลดสคริปต์ของ Google แบบ lazy
// ได้ ID token (JWT) กลับมาแล้วส่งต่อให้ Worker ตรวจ เว็บไม่ได้ตรวจเอง เชื่อไม่ได้อยู่แล้ว

interface CredentialResponse {
  credential: string
}

interface GoogleIdApi {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string
        callback: (res: CredentialResponse) => void
        hd?: string
        auto_select?: boolean
challenge?: string
      }) => void
      prompt: () => void
      renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void
      cancel: () => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdApi
  }
}

const SCRIPT_URL = 'https://accounts.google.com/gsi/client'

let scriptPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }
    const el = document.createElement('script')
    el.src = SCRIPT_URL
    el.async = true
    el.defer = true
    el.onload = () => resolve()
    el.onerror = () => reject(new Error('โหลดสคริปต์ของ Google ไม่สำเร็จ'))
    document.head.appendChild(el)
  })
  return scriptPromise
}

/**
 * วาดปุ่ม "Sign in with Google" ของจริงลงในกล่องที่ให้มา
 * ใช้ปุ่มของ Google เพราะ One Tap ถูกบล็อกบ่อยและปุ่มจริงเสถียรกว่าบนมือถือ
 *
 * @param hd โดเมนที่อยากให้ขึ้นในตัวเลือกบัญชี — เป็นแค่คำใบ้ ตัวบังคับจริงอยู่ฝั่ง Worker
 */
export async function renderGoogleButton(
  container: HTMLElement,
  clientId: string,
  hd: string,
  onToken: (token: string) => void,
): Promise<void> {
  await loadScript()
  const api = window.google
  if (!api) throw new Error('ไม่พบ Google Identity Services')

  api.accounts.id.initialize({
    client_id: clientId,
    hd,
    callback: (res) => onToken(res.credential),
  })
  api.accounts.id.renderButton(container, {
    theme: 'outline',
    size: 'large',
    width: container.clientWidth || 320,
    text: 'signin_with',
    shape: 'pill',
    locale: 'th',
  })
}
