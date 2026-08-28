// จังหวะเกมและสูตรคะแนน — **เซิร์ฟเวอร์เป็นเจ้าของค่าพวกนี้**
// ฝั่งเว็บมีสำเนาไว้แค่เพื่อวาดวงแหวนนับถอยหลัง แก้ฝั่งนั้นไม่มีผลกับคะแนนจริง
// ถ้าแก้ที่นี่ ต้องแก้ src/game/config.ts ให้ตรงกันด้วย ไม่งั้นวงแหวนจะเดินไม่ตรงกับเวลาจริง

export const LIVE_CONFIG = {
  totalRounds: 15,

  countdownMs: 3000,
  answerMs: 10_000,
  /** ผ่อนผันเน็ตหน่วง — คำตอบที่มาช้ากว่านี้ไม่นับ */
  graceMs: 500,
  revealMs: 4000,
  explainMs: 6000,
  boardMs: 5000,
  finaleStepMs: 2500,

  boardSize: 10,
  baseScore: 500,
  speedScore: 500,
  streakBonus: 100,
  streakStart: 3,
  streakMaxSteps: 3,
} as const

export const PHASE_DURATION = {
  countdown: LIVE_CONFIG.countdownMs,
  answering: LIVE_CONFIG.answerMs + LIVE_CONFIG.graceMs,
  reveal: LIVE_CONFIG.revealMs,
  explain: LIVE_CONFIG.explainMs,
  board: LIVE_CONFIG.boardMs,
  finale: LIVE_CONFIG.finaleStepMs,
} as const

/**
 * คะแนนของข้อหนึ่ง — ใช้เฉพาะกรณีตอบถูก (ตอบผิด/ไม่ตอบ = 0)
 * @param elapsedMs เวลาที่ใช้ตอบ วัดจากนาฬิกาของเซิร์ฟเวอร์เท่านั้น
 * @param streak จำนวนข้อที่ตอบถูกติดกัน รวมข้อนี้แล้ว
 */
export function roundScore(elapsedMs: number, streak: number): number {
  const ratio = Math.max(0, Math.min(1, 1 - elapsedMs / LIVE_CONFIG.answerMs))
  const base = LIVE_CONFIG.baseScore + Math.round(LIVE_CONFIG.speedScore * ratio)
  const steps = Math.min(
    Math.max(streak - LIVE_CONFIG.streakStart + 1, 0),
    LIVE_CONFIG.streakMaxSteps,
  )
  return base + steps * LIVE_CONFIG.streakBonus
}
