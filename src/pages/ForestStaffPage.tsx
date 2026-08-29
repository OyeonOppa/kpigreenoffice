import { useMemo, useState } from 'react'
import { Home, Search } from 'lucide-react'
import { FOREST } from '../content'
import PlayerAvatar from '../components/live/PlayerAvatar'
import { forestBackend, stageOf, type ForestMember } from '../forest'

/**
 * หน้าสตาฟ — กดให้แต้มคนที่มาร่วมกิจกรรม
 *
 * ไม่ได้ลิงก์จากที่ไหน เข้าที่ #/forest/staff เหมือนหน้าจอกลางของเกมแข่งสด
 *
 * ตอนนี้ยังไม่มีการจำกัดสิทธิ์ เพราะหลังบ้านเป็นโหมดจำลองที่อยู่ในเครื่องคนกดเอง
 * ของจริงต้องตรวจสิทธิ์ที่เซิร์ฟเวอร์ ไม่ใช่แค่ซ่อนหน้านี้ — ซ่อน URL ไม่ใช่การป้องกัน
 */

/** แต้มมาตรฐานที่กดให้ได้เร็วๆ พร้อมเหตุผลติดมาด้วย จะได้ไม่ต้องพิมพ์ทุกครั้ง */
const QUICK_AWARDS = [
  { points: 20, note: 'ร่วมกิจกรรมของหน่วยงาน' },
  { points: 30, note: 'ช่วยงานกิจกรรม 3R' },
  { points: 50, note: 'เป็นแกนนำกิจกรรม' },
]

export default function ForestStaffPage() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ForestMember | null>(null)
  const [note, setNote] = useState('')
  const [points, setPoints] = useState(20)
  const [done, setDone] = useState<string | null>(null)
  // นับขึ้นทุกครั้งที่ให้แต้มเสร็จ เพื่อบังคับให้ดึงรายชื่อใหม่ (หลังบ้านนี้ไม่ได้ push ข้อมูลมาเอง)
  const [revision, setRevision] = useState(0)

  const members = useMemo(() => {
    void revision
    const all = forestBackend.listMembers()
    const q = query.trim().toLowerCase()
    if (!q) return all
    return all.filter(
      (m) => m.name.toLowerCase().includes(q) || m.team.toLowerCase().includes(q),
    )
  }, [query, revision])

  const award = async (member: ForestMember, amount: number, reason: string) => {
    const result = await forestBackend.awardPoints(member.uid, amount, reason)
    if (!result.ok) return
    setDone(`ให้ ${member.name} ไป ${result.gained} แต้ม`)
    setSelected(null)
    setNote('')
    setRevision((n) => n + 1)
  }

  return (
    <div className="game-bg min-h-dvh">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
        <a
          href="#"
          className="inline-flex items-center gap-1.5 text-ink/60 hover:text-ink text-sm transition-colors"
        >
          <Home size={16} /> หน้าแรก
        </a>
        <a href={FOREST.path} className="text-accent-deep text-sm underline">
          ไปหน้าป่า
        </a>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-10">
        <h1 className="font-display text-2xl text-ink mb-1">ให้แต้มกิจกรรม</h1>
        <p className="text-ink/60 text-sm mb-5">
          สำหรับสตาฟ — ให้แต้มคนที่มาร่วมกิจกรรมของหน่วยงาน แต้มส่วนนี้ไม่ติดเพดานรายวัน
        </p>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อหรือสำนัก"
            className="w-full rounded-full border-2 border-line bg-surface pl-11 pr-4 py-2.5 outline-none focus:border-accent"
          />
        </div>

        {done && (
          <p className="rounded-2xl bg-accent/10 text-accent-deep text-sm px-4 py-2.5 mb-4">{done}</p>
        )}

        {members.length === 0 && (
          <p className="text-ink/50 text-sm text-center py-10">
            {query ? 'ไม่พบชื่อนี้' : 'ยังไม่มีใครปลูกต้นไม้'}
          </p>
        )}

        <ul className="space-y-2">
          {members.map((member) => {
            const open = selected?.uid === member.uid
            return (
              <li key={member.uid} className="pop-card p-3">
                <button
                  type="button"
                  onClick={() => setSelected(open ? null : member)}
                  className="flex items-center gap-3 w-full text-left"
                >
                  <PlayerAvatar look={member.look} size={38} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-ink text-sm truncate">{member.name}</span>
                    <span className="block text-ink/45 text-xs truncate">{member.team}</span>
                  </span>
                  <span className="text-right shrink-0">
                    <span className="tabular block text-accent-deep font-medium">
                      {member.points}
                    </span>
                    <span className="block text-ink/40 text-[11px]">
                      {stageOf(member.points).stage.label}
                    </span>
                  </span>
                </button>

                {open && (
                  <div className="mt-3 pt-3 border-t border-line">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {QUICK_AWARDS.map((quick) => (
                        <button
                          key={quick.points}
                          type="button"
                          onClick={() => void award(member, quick.points, quick.note)}
                          className="rounded-full bg-accent/10 text-accent-deep px-3 py-1.5 text-xs"
                        >
                          +{quick.points} · {quick.note}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={points}
                        onChange={(e) => setPoints(Number(e.target.value))}
                        className="tabular w-20 rounded-2xl border-2 border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                      />
                      <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="เหตุผล (บันทึกไว้ให้ตรวจย้อนหลังได้)"
                        className="flex-1 min-w-0 rounded-2xl border-2 border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                      />
                      <button
                        type="button"
                        disabled={!note.trim() || points < 1}
                        onClick={() => void award(member, points, note.trim())}
                        className="rounded-2xl bg-accent-deep text-white px-4 py-2 text-sm disabled:opacity-40"
                      >
                        ให้
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
