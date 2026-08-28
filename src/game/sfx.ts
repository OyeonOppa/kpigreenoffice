// เสียงประกอบเกม — สังเคราะห์ด้วย Web Audio ทั้งหมด ไม่ต้องมีไฟล์เสียงสักไฟล์
// เบราว์เซอร์บล็อกเสียงจนกว่าผู้ใช้จะกดอะไรสักอย่าง จึงสร้าง AudioContext ตอนเล่นเสียงครั้งแรก

const MUTE_KEY = 'kpi-live:muted'

let ctx: AudioContext | null = null
let muted = false

try {
  muted = localStorage.getItem(MUTE_KEY) === '1'
} catch {
  muted = false
}

function audio(): AudioContext | null {
  if (muted) return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

interface ToneOptions {
  freq: number
  /** วินาที */
  duration?: number
  delay?: number
  type?: OscillatorType
  gain?: number
  /** ไล่ระดับเสียงไปที่ความถี่นี้ (ใช้ทำเสียงพุ่ง/ตก) */
  slideTo?: number
}

function tone({ freq, duration = 0.12, delay = 0, type = 'sine', gain = 0.05, slideTo }: ToneOptions) {
  const ac = audio()
  if (!ac) return
  const t0 = ac.currentTime + delay
  const osc = ac.createOscillator()
  const vol = ac.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t0 + duration)

  vol.gain.setValueAtTime(0.0001, t0)
  vol.gain.exponentialRampToValueAtTime(gain, t0 + 0.012)
  vol.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)

  osc.connect(vol).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

function noise(duration = 0.25, gain = 0.05, delay = 0) {
  const ac = audio()
  if (!ac) return
  const frames = Math.floor(ac.sampleRate * duration)
  const buffer = ac.createBuffer(1, frames, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
  const src = ac.createBufferSource()
  const vol = ac.createGain()
  vol.gain.value = gain
  src.buffer = buffer
  src.connect(vol).connect(ac.destination)
  src.start(ac.currentTime + delay)
}

export const sfx = {
  /** มีคนเข้าห้อง */
  join: () => tone({ freq: 660, duration: 0.1, type: 'triangle', gain: 0.04 }),
  /** เสียงนับถอยหลัง 3-2-1 */
  countdown: (step: number) =>
    tone({ freq: step === 0 ? 880 : 520, duration: 0.16, type: 'square', gain: 0.045 }),
  /** เข็มวินาทีช่วง 3 วินาทีสุดท้าย */
  tick: () => tone({ freq: 1200, duration: 0.045, type: 'square', gain: 0.028 }),
  /** ปล่อยขยะลงถัง */
  drop: () => {
    tone({ freq: 420, duration: 0.14, type: 'triangle', gain: 0.05, slideTo: 200 })
    noise(0.12, 0.02)
  },
  correct: () => {
    tone({ freq: 784, duration: 0.12, type: 'triangle', gain: 0.05 })
    tone({ freq: 1047, duration: 0.18, delay: 0.09, type: 'triangle', gain: 0.05 })
  },
  wrong: () => tone({ freq: 220, duration: 0.3, type: 'sawtooth', gain: 0.035, slideTo: 110 }),
  /** ก่อนประกาศอันดับ */
  drumroll: () => {
    for (let i = 0; i < 14; i++) noise(0.05, 0.025, i * 0.055)
  },
  /** ประกาศอันดับหนึ่ง */
  fanfare: () => {
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) =>
      tone({ freq, duration: 0.35, delay: i * 0.13, type: 'triangle', gain: 0.05 }),
    )
  },

  get muted() {
    return muted
  },

  toggleMute(): boolean {
    muted = !muted
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
    } catch {
      // ไม่เป็นไร
    }
    return muted
  },
}
