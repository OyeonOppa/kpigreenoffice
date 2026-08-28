// คลังคำถามอยู่ที่ worker/src/questions.ts เพราะมีคำเฉลย
//
// ไฟล์นี้เป็นแค่ทางผ่านสำหรับ **โหมดจำลอง** เท่านั้น
// พอสลับไปใช้ cloudflareBackend แล้ว mockBackend จะไม่ถูก import
// ไฟล์นี้กับคำเฉลยทั้งหมดจึงหลุดออกจาก bundle ไปด้วย (ตรวจได้ด้วย npm run check:answers)
//
// ห้าม import ไฟล์นี้จากหน้าจอหรือจาก cloudflareBackend เด็ดขาด

export type { Question } from '../../worker/src/questions'
export { QUESTIONS, getQuestion, pickQuestions } from '../../worker/src/questions'
