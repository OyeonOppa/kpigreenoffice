// เสียงประกอบเกม "ฝ่าด่านลดคาร์บอน" — ไฟล์เสียงจากชุด Interface Sounds ของ Kenney (www.kenney.nl) สัญญาอนุญาต CC0
// ดูไฟล์ audio/LICENSE-kenney-interface-sounds.txt · ปิดเสียงใช้ปุ่มเดียวกับเสียงสังเคราะห์ของเกมอื่น (sfx.muted)

import { sfx } from '../game/sfx'
import selectUrl from './audio/select.wav'
import menuUrl from './audio/menu.wav'
import backUrl from './audio/back.wav'
import placeUrl from './audio/place.wav'
import revealUrl from './audio/reveal.wav'
import scoreUrl from './audio/score.wav'
import goodUrl from './audio/good.wav'
import badUrl from './audio/bad.wav'
import loseUrl from './audio/lose.wav'
import openUrl from './audio/open.wav'
import closeUrl from './audio/close.wav'
import startUrl from './audio/start.wav'

const URLS = {
  select: selectUrl, // แตะเลือกการ์ด
  menu: menuUrl, // กดปุ่มในเมนู
  back: backUrl, // ย้อนกลับ
  place: placeUrl, // วางมาตรการลงโต๊ะ
  reveal: revealUrl, // บอทวางการ์ด
  score: scoreUrl, // คะแนนขึ้น
  good: goodUrl, // แก้ด่านสำเร็จ
  bad: badUrl, // มาตรการถูกปิด / ยอมเสีย
  lose: loseUrl, // แพ้
  open: openUrl, // หน้าต่างเด้งขึ้น
  close: closeUrl, // ปิดหน้าต่าง
  start: startUrl, // เริ่มเกม
} as const

export type SoundName = keyof typeof URLS

let ctx: AudioContext | null = null
const buffers = new Map<SoundName, Promise<AudioBuffer | null>>()

function context(): AudioContext | null {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  return ctx
}

function buffer(name: SoundName): Promise<AudioBuffer | null> {
  let p = buffers.get(name)
  if (!p) {
    const ac = context()
    p = ac
      ? fetch(URLS[name])
          .then((r) => r.arrayBuffer())
          .then((d) => ac.decodeAudioData(d))
          .catch(() => null)
      : Promise.resolve(null)
    buffers.set(name, p)
  }
  return p
}

/** โหลดไฟล์เสียงทั้งหมดล่วงหน้า (เรียกตอนเข้าหน้าเกม) */
export function preloadSounds() {
  ;(Object.keys(URLS) as SoundName[]).forEach((n) => void buffer(n))
}

export function play(name: SoundName, gain = 0.7) {
  if (sfx.muted) return
  const ac = context()
  if (!ac) return
  if (ac.state === 'suspended') void ac.resume()
  void buffer(name).then((buf) => {
    if (!buf || sfx.muted) return
    const src = ac.createBufferSource()
    const vol = ac.createGain()
    vol.gain.value = gain
    src.buffer = buf
    src.connect(vol).connect(ac.destination)
    src.start()
  })
}
