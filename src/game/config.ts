// ค่าตั้งของเกมแยกขยะแข่งสด — ปรับจังหวะเกมและสูตรคะแนนได้ที่ไฟล์นี้ไฟล์เดียว

export const LIVE_CONFIG = {
  /** จำนวนข้อต่อหนึ่งเกม (สุ่มจากคลังคำถามใน content.ts) */
  totalRounds: 10,

  // ---- ความยาวแต่ละเฟส (มิลลิวินาที) ----
  /** นับถอยหลัง 3-2-1 ก่อนขึ้นโจทย์ — กันคนตั้งตัวไม่ทัน */
  countdownMs: 3000,
  /** เวลาตอบต่อข้อ */
  answerMs: 10_000,
  /** ผ่อนผันเวลาเน็ตหน่วง — คำตอบที่ถึงช้ากว่านี้ถือว่าไม่ทัน */
  graceMs: 500,
  /** เฉลยว่าถังไหนถูก + กราฟการกระจายคำตอบ */
  revealMs: 4000,
  /** การ์ดคำอธิบายว่าทำไมต้องทิ้งถังนี้ */
  explainMs: 6000,
  /** ลีดเดอร์บอร์ดย่อยระหว่างข้อ */
  boardMs: 5000,
  /** ความถี่ในการเฉลยอันดับตอนจบ (10 → 1) */
  finaleStepMs: 2500,

  // ---- คะแนน ----
  /** จำนวนอันดับที่ประกาศ */
  boardSize: 10,
  /** คะแนนพื้นฐานเมื่อตอบถูก (ต่อให้ตอบวินาทีสุดท้ายก็ได้เท่านี้) */
  baseScore: 500,
  /** คะแนนโบนัสความไวสูงสุด — ตอบทันทีได้เต็ม ตอบช้าลดลงเป็นเส้นตรง */
  speedScore: 500,
  /** โบนัสตอบถูกติดกัน (ต่อข้อ) */
  streakBonus: 100,
  /** เริ่มได้โบนัสเมื่อถูกติดกันครบกี่ข้อ */
  streakStart: 3,
  /** จำนวนขั้นโบนัสสูงสุด (3 ขั้น = +300) */
  streakMaxSteps: 3,
} as const

/** คะแนนเต็มต่อข้อ (ไม่รวมโบนัสถูกติดกัน) */
export const MAX_ROUND_SCORE = LIVE_CONFIG.baseScore + LIVE_CONFIG.speedScore

/**
 * คะแนนของข้อหนึ่ง — ใช้เฉพาะกรณีตอบถูกเท่านั้น (ตอบผิด/ไม่ตอบ = 0)
 * @param elapsedMs เวลาที่ใช้ตอบ นับจากเวลาที่ข้อเริ่ม (ใช้เวลาฝั่งเซิร์ฟเวอร์เสมอ)
 * @param streak จำนวนข้อที่ตอบถูกติดกัน "รวมข้อนี้แล้ว"
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

/** ความยาวของเฟสหนึ่งๆ ใช้ตอนเปลี่ยนเฟสใน host loop */
export const PHASE_DURATION = {
  countdown: LIVE_CONFIG.countdownMs,
  answering: LIVE_CONFIG.answerMs + LIVE_CONFIG.graceMs,
  reveal: LIVE_CONFIG.revealMs,
  explain: LIVE_CONFIG.explainMs,
  board: LIVE_CONFIG.boardMs,
  finale: LIVE_CONFIG.finaleStepMs,
} as const
