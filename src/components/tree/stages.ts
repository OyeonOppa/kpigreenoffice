/**
 * ระยะการเติบโตของต้นไม้ — ป้ายชื่อกับสิ่งที่วาดจริงอยู่ไฟล์เดียวกันโดยตั้งใจ
 *
 * `treeArt.ts` อ่านค่า growth ของระยะพวกนี้ไปใช้เป็นจุดสลับรูปร่างจริง (เมล็ด → หน่อ → ต้น → ดอก → ผล)
 * ถ้าแยกกันอยู่คนละไฟล์ วันหนึ่งจะมีป้ายว่า "ออกดอก" ทั้งที่บนจอยังไม่มีดอก
 *
 * แคมเปญป่า 3R เอาไปใช้ต่อผ่าน `forest/config.ts` ซึ่งแปลง growth เป็นแต้มด้วย FULL_POINTS
 */
export const TREE_STAGES = [
  { id: 'seed', label: 'เมล็ด', growth: 0 },
  { id: 'sprout', label: 'หน่ออ่อน', growth: 0.05 },
  { id: 'seedling', label: 'ต้นกล้า', growth: 0.12 },
  { id: 'young', label: 'ต้นอ่อน', growth: 0.22 },
  { id: 'branching', label: 'แตกกิ่ง', growth: 0.34 },
  { id: 'leafy', label: 'ใบแก่เต็มต้น', growth: 0.46 },
  { id: 'canopy', label: 'ทรงพุ่มเต็ม', growth: 0.58 },
  { id: 'flowering', label: 'ออกดอก', growth: 0.7 },
  { id: 'fruiting', label: 'ติดผล', growth: 0.84 },
  { id: 'shade', label: 'ไม้ใหญ่ให้ร่มเงา', growth: 1 },
] as const

export type TreeStageId = (typeof TREE_STAGES)[number]['id']
export type TreeStage = (typeof TREE_STAGES)[number]

/** ค่า growth ที่ระยะหนึ่งเริ่มต้น — ใช้เป็นจุดสลับรูปร่างใน treeArt */
export function stageGrowth(id: TreeStageId): number {
  const stage = TREE_STAGES.find((s) => s.id === id)
  return stage ? stage.growth : 0
}

/** ระยะปัจจุบันของค่า growth หนึ่งๆ */
export function stageAt(growth: number): { index: number; stage: TreeStage } {
  const g = Math.max(0, Math.min(1, growth))
  let index = 0
  for (let i = 0; i < TREE_STAGES.length; i++) {
    if (g >= TREE_STAGES[i].growth) index = i
  }
  return { index, stage: TREE_STAGES[index] }
}
