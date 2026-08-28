// ตรวจว่า bundle ที่ build ออกมา "ไม่มีคำเฉลย" ติดไปด้วย
//
// เหตุผล: จุดขายหลักของการย้ายไป Durable Object คือคำเฉลยไม่เคยออกจากเซิร์ฟเวอร์
// ถ้าวันหนึ่งมีคนเผลอ import คลังคำถามเข้ามาในหน้าจอ คุณสมบัตินี้จะหายไปเงียบๆ
// สคริปต์นี้จับให้ตั้งแต่ตอน build

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'

// ข้อความที่มีอยู่เฉพาะในคลังคำถามฝั่งเซิร์ฟเวอร์เท่านั้น
// อย่าใส่ชื่อ field อย่าง checkLocal ลงไป เพราะหน้าจอใช้ชื่อนั้นตอนแสดงเฉลย
// ที่ต้องจับคือ "เนื้อหาคำเฉลย" ไม่ใช่ชื่อ field
const SECRETS = [
  'insecticide-can',
  'correction-fluid',
  'ยาฆ่าแมลงมีสารกำจัดศัตรูพืช',
  'ซองขนมดูเหมือนพลาสติก',
]

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) out.push(...walk(path))
    else if (/\.(js|css|html)$/.test(name)) out.push(path)
  }
  return out
}

let leaked = false
for (const file of walk(DIST)) {
  const content = readFileSync(file, 'utf8')
  for (const secret of SECRETS) {
    if (content.includes(secret)) {
      console.error(`❌ พบคำเฉลยหลุดใน ${file}: "${secret}"`)
      leaked = true
    }
  }
}

if (leaked) {
  console.error('\nคำเฉลยไม่ควรอยู่ใน bundle ของเว็บ')
  console.error('เช็คว่าหน้าจอไปเผลอ import src/game/questions.ts หรือ mockBackend เข้ามาหรือเปล่า')
  console.error('(ถ้ากำลัง build โหมดจำลองโดยตั้งใจ ไม่ต้องรันสคริปต์นี้)')
  process.exit(1)
}

console.log('✅ ไม่มีคำเฉลยใน bundle — ผู้เล่นเปิด DevTools ก็ไม่เห็นคำตอบล่วงหน้า')
