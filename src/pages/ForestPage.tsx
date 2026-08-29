import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Home, Shuffle, Sprout, Trees, Users } from 'lucide-react'
import { FOREST, LIVE_GAME } from '../content'
import { lookFromSeed, randomLook } from '../game/avatar'
import { sfx } from '../game/sfx'
import type { AvatarLook } from '../game'
import PlayerAvatar from '../components/live/PlayerAvatar'
import ForestScene from '../components/forest/ForestScene'
import GrowingTree from '../components/forest/GrowingTree'
import MyTreeMarker from '../components/forest/MyTreeMarker'
import { buildTree, type TreeShape } from '../components/forest/treeGeometry'
import {
  DAILY_CAP,
  FOREST_REHEARSAL,
  FULL_POINTS,
  STAGES,
  forestBackend,
  stageOf,
  type ActivityId,
  type ForestMember,
  type ForestSnapshot,
  type ForestUser,
  type LogEntry,
} from '../forest'
import { useForest, useForestAuth } from '../forest/hooks'

/**
 * หน้าป่า 3R — ต้นไม้ของฉัน + สวนของสำนัก
 *
 * ข้อจำกัดของ WebGL ที่หน้านี้ต้องเคารพ (ได้มาจากการวัดจริงตอนทำ #/tree-lab):
 * 1. Canvas เดียวต่อหน้า — สลับมุมมองด้วยการเปลี่ยนเนื้อหาข้างใน ห้าม unmount Canvas
 *    (unmount แล้ว mount ใหม่ทำให้ WebGL context หลุด จอขาวทั้งหน้า)
 * 2. สวนใช้ LOD 'low' เสมอ ต้นเดี่ยวถึงจะใช้ 'high' ได้
 * 3. จำนวนต้นในสวนตัดที่ GARDEN_MAX — 250 ต้นพร้อมกันคือล้านกว่าสามเหลี่ยม มือถือไม่ไหว
 */

const GARDEN_GAP_X = 4
const GARDEN_GAP_Z = 3.8

/**
 * จำนวนคอลัมน์ของสวน — จอแนวตั้งใช้สวนแคบและลึก จอแนวนอนใช้สวนกว้าง
 *
 * ถ้าใช้ 8 คอลัมน์เท่ากันทุกจอ บนมือถือกล้องต้องถอยไกลมากเพื่อให้เห็นครบทั้งแถว
 * ผลคือต้นไม้กลายเป็นแถบเล็กๆ กลางจอ มีฟ้าโล่งข้างบนกับสนามหญ้าเปล่าข้างล่าง
 */
function gardenColumns(wide: boolean) {
  return wide ? 8 : 4
}

/** จอกว้างพอสำหรับสวนแบบเต็มแถวไหม — เกณฑ์เดียวกับ breakpoint sm: ของ Tailwind */
function useWideScreen() {
  const [wide, setWide] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(min-width: 640px)')
    const onChange = () => setWide(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return wide
}

/**
 * ตำแหน่งต้นในสวน — รับลิสต์ที่เรียงแต้มมากไปน้อยมาแล้ว
 * ต้นแต้มเยอะ (ต้นใหญ่) ไปอยู่แถวหลัง ต้นเล็กอยู่แถวหน้า ไม่งั้นต้นใหญ่บังต้นเล็กจนมองไม่เห็น
 */
function gardenPositions(count: number, cols: number): [number, number, number][] {
  const rows = Math.max(1, Math.ceil(count / cols))
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / cols)
    const col = i % cols
    // เยื้องแบบคงที่ตาม index (ไม่ใช่สุ่ม) — ตำแหน่งต้นจะได้ไม่ขยับทุกครั้งที่วาดใหม่
    const jitterX = (((i * 37) % 100) / 100 - 0.5) * 1.5
    const jitterZ = (((i * 61) % 100) / 100 - 0.5) * 1.3
    return [
      (col - (cols - 1) / 2) * GARDEN_GAP_X + jitterX,
      0,
      -(rows - 1 - row) * GARDEN_GAP_Z + jitterZ,
    ]
  })
}

/**
 * รูปทรงต้นไม้ที่สร้างไว้แล้ว เก็บไว้ข้ามการวาดหน้าใหม่
 *
 * อยู่นอกคอมโพเนนต์เพราะเป็นของหนัก (แตกกิ่ง + merge geometry) ที่ไม่ควรผูกกับรอบการวาด
 * ต้องล้างตอนออกจากหน้า เพราะ Tree3D dispose geometry ให้ตอน unmount — ถ้าไม่ล้าง
 * แล้วกลับเข้าหน้านี้อีก จะหยิบ geometry ที่ถูก dispose ไปแล้วมาวาด
 */
const shapeCache = new Map<string, { points: number; shape: TreeShape }>()

/**
 * สร้างรูปทรงต้นไม้ของทั้งสวน โดยสร้างใหม่เฉพาะต้นที่แต้มเปลี่ยน
 *
 * จำเป็นเพราะ snapshot เป็นอ็อบเจกต์ก้อนใหม่ทุกครั้งที่มีใครในสำนักได้แต้ม
 * ถ้าสร้างใหม่ทั้งสวนตามไปด้วย จะเป็นการแตกกิ่ง+merge geometry 60 ต้นทุกครั้งที่มีคนกดปุ่ม
 */
function useGardenShapes(garden: ForestMember[]) {
  useEffect(() => () => shapeCache.clear(), [])

  return useMemo(() => {
    const out = garden.map((member) => {
      const hit = shapeCache.get(member.uid)
      const shape =
        hit && hit.points === member.points ? hit.shape : buildTree(member.uid, member.growth, 'low')
      shapeCache.set(member.uid, { points: member.points, shape })
      return { member, shape }
    })

    // ทิ้งต้นของคนที่หลุดออกจากสวนไปแล้ว (แต้มตกจนไม่ติด GARDEN_MAX หรือย้ายสำนัก)
    // Tree3D dispose geometry ให้ตอน unmount ถ้าเก็บไว้ในนี้แล้วเขากลับเข้าสวนอีก จะได้ของที่ dispose แล้ว
    const present = new Set(garden.map((m) => m.uid))
    for (const uid of shapeCache.keys()) {
      if (!present.has(uid)) shapeCache.delete(uid)
    }

    return out
  }, [garden])
}

export default function ForestPage() {
  const { user, busy, signIn } = useForestAuth()
  const forest = useForest(user?.uid ?? null)

  if (user && !forest) {
    return (
      <Shell>
        <p className="text-ink/60 text-center pt-16">กำลังโหลด…</p>
      </Shell>
    )
  }

  // ยังไม่มีตัวตน หรือมีแล้วแต่ยังไม่ได้ปลูก — ใช้การ์ดเดียวกัน กรอกครั้งเดียวจบ
  if (!user || !forest?.me) {
    return (
      <Shell>
        <StartCard user={user} busy={busy} onSignIn={signIn} />
      </Shell>
    )
  }

  return (
    <Shell>
      <ForestView uid={user.uid} forest={forest} me={forest.me} />
    </Shell>
  )
}

// ---------- กรอบหน้า ----------

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="game-bg min-h-dvh flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 shrink-0">
        <a
          href="#"
          className="inline-flex items-center gap-1.5 text-ink/60 hover:text-ink text-sm transition-colors"
        >
          <Home size={16} /> หน้าแรก
        </a>
        {FOREST_REHEARSAL && (
          <span className="rounded-full bg-amber-100 text-amber-900 text-[11px] px-2.5 py-1 border border-amber-300">
            โหมดจำลอง — ข้อมูลอยู่ในเครื่องนี้เท่านั้น
          </span>
        )}
      </div>
      <div className="flex-1 px-4 sm:px-6 pb-10">{children}</div>
    </div>
  )
}

// ---------- เริ่มต้น: ตัวตน + ปลูกต้นแรก ----------

function StartCard({
  user,
  busy,
  onSignIn,
}: {
  user: ForestUser | null
  busy: boolean
  onSignIn: (name: string) => Promise<ForestUser>
}) {
  const [name, setName] = useState(user?.name ?? '')
  const [look, setLook] = useState<AvatarLook>(() =>
    user ? lookFromSeed(user.uid) : randomLook(),
  )
  const [team, setTeam] = useState(LIVE_GAME.teams[0] as string)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const finalName = name.trim()
    if (!finalName) return
    setSaving(true)
    try {
      // มีตัวตนอยู่แล้วก็ใช้อันเดิม (เคยปลูกแล้วแต่ข้อมูลต้นหาย) จะได้ไม่กลายเป็นคนใหม่
      const account = user ?? (await onSignIn(finalName))
      await forestBackend.saveProfile(account.uid, { name: finalName, look, team })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-md mx-auto pt-6">
      <div className="pop-card p-6">
        <Sprout size={36} className="text-accent mx-auto mb-2" />
        <h1 className="font-display text-xl text-ink text-center mb-1">{FOREST.heading}</h1>
        <p className="text-ink/60 text-sm text-center mb-6">{FOREST.intro}</p>

        <div className="flex items-center gap-3 mb-5">
          <PlayerAvatar look={look} size={56} />
          <button
            type="button"
            onClick={() => setLook(randomLook())}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 text-ink/70 px-3 py-2 text-sm"
          >
            <Shuffle size={14} /> สุ่มตัวละคร
          </button>
        </div>

        <label className="block text-ink/70 text-sm mb-1" htmlFor="forest-name">
          ชื่อที่ให้คนอื่นเห็น
        </label>
        <input
          id="forest-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          placeholder="เช่น พี่ก้อย"
          className="w-full rounded-2xl border-2 border-line bg-surface px-4 py-2.5 mb-4 outline-none focus:border-accent"
        />

        <label className="block text-ink/70 text-sm mb-1" htmlFor="forest-team">
          สำนัก/กอง — ต้นของคุณจะไปยืนรวมในสวนของสำนักนี้
        </label>
        <select
          id="forest-team"
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="w-full rounded-2xl border-2 border-line bg-surface px-4 py-2.5 mb-5 outline-none focus:border-accent"
        >
          {LIVE_GAME.teams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={saving || busy || !name.trim()}
          className="pop-btn w-full bg-accent-deep text-white py-3 font-medium disabled:opacity-50"
        >
          {saving ? 'กำลังปลูก…' : 'ปลูกต้นของฉัน'}
        </button>

        <p className="text-ink/45 text-xs text-center mt-4 leading-relaxed">
          ตอนนี้เป็นโหมดจำลอง ใส่ชื่อแล้วลองได้เลย ข้อมูลเก็บในเครื่องนี้เท่านั้น
          <br />
          ของจริงจะเข้าด้วยบัญชี @{LIVE_GAME.allowedDomain} เหมือนเกมแยกขยะแข่งสด
        </p>
      </div>
    </div>
  )
}


// ---------- หน้าหลัก ----------

function ForestView({
  uid,
  forest,
  me,
}: {
  uid: string
  forest: ForestSnapshot
  me: ForestMember
}) {
  const [view, setView] = useState<'mine' | 'garden'>('mine')
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null)

  const cols = gardenColumns(useWideScreen())
  const myShape = useMemo(() => buildTree(uid, me.growth, 'high'), [uid, me.growth])
  const garden = useGardenShapes(forest.garden)
  const positions = useMemo(() => gardenPositions(garden.length, cols), [garden.length, cols])
  const myIndex = forest.garden.findIndex((m) => m.uid === uid)

  const gardenRows = Math.max(1, Math.ceil(garden.length / cols))
  const gardenHeight = garden.length ? Math.max(...garden.map((g) => g.shape.height)) : 1
  const gardenWidth = Math.min(garden.length, cols) * GARDEN_GAP_X
  const gardenDepth = (gardenRows - 1) * GARDEN_GAP_Z

  const stage = stageOf(me.points)
  const stageStart = Math.round(STAGES[stage.index].growth * FULL_POINTS)
  const stageEnd = stage.next ? Math.round(stage.next.growth * FULL_POINTS) : FULL_POINTS
  const stagePercent =
    stageEnd > stageStart
      ? Math.min(100, ((me.points - stageStart) / (stageEnd - stageStart)) * 100)
      : 100

  const capLeft = Math.max(0, DAILY_CAP - forest.todayPoints)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  const log = async (activityId: ActivityId) => {
    const result = await forestBackend.logActivity(uid, activityId)
    if (result.ok) {
      sfx.correct()
      setToast({ text: `+${result.gained} แต้ม`, ok: true })
    } else {
      sfx.wrong()
      setToast({ text: result.reason ?? 'บันทึกไม่สำเร็จ', ok: false })
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* สรุปต้นของฉัน */}
      <div className="pop-card p-4 sm:p-5 mb-3">
        <div className="flex items-center gap-3">
          <PlayerAvatar look={me.look} size={44} />
          <div className="min-w-0 flex-1">
            <p className="text-ink font-medium truncate">{me.name}</p>
            <p className="text-ink/50 text-xs truncate">{me.team}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="tabular font-display text-2xl text-accent-deep leading-none">
              {me.points}
            </p>
            <p className="text-ink/50 text-xs">แต้มสะสม</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline justify-between mb-1.5">
            <p className="text-ink text-sm font-medium">{stage.stage.label}</p>
            <p className="text-ink/50 text-xs">
              {stage.next ? `อีก ${stage.pointsToNext} แต้ม → ${stage.next.label}` : 'โตเต็มที่แล้ว'}
            </p>
          </div>
          <div className="h-2 rounded-full bg-ink/8 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-accent"
              initial={false}
              animate={{ width: `${stagePercent}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
        </div>
      </div>

      {/* สลับมุมมอง — Canvas ด้านล่างเป็นตัวเดิมตลอด เปลี่ยนแค่ของข้างใน */}
      <div className="flex gap-2 mb-3">
        <ViewTab active={view === 'mine'} onClick={() => setView('mine')} icon={<Sprout size={16} />}>
          ต้นของฉัน
        </ViewTab>
        <ViewTab
          active={view === 'garden'}
          onClick={() => setView('garden')}
          icon={<Trees size={16} />}
        >
          สวนของสำนัก
        </ViewTab>
      </div>

      <div className="pop-card overflow-hidden relative mb-3">
        <ForestScene
          className="h-[19rem] sm:h-[26rem] w-full"
          fitHeight={view === 'mine' ? myShape.height : gardenHeight}
          fitWidth={view === 'mine' ? 0 : gardenWidth}
          fitDepth={view === 'mine' ? 0 : gardenDepth}
          orbit={view === 'mine'}
        >
          {view === 'mine' ? (
            <GrowingTree shape={myShape} />
          ) : (
            <>
              {garden.map((g, i) => (
                <GrowingTree key={g.member.uid} shape={g.shape} position={positions[i]} />
              ))}
              {myIndex >= 0 && <MyTreeMarker position={positions[myIndex]} />}
            </>
          )}
        </ForestScene>

        <div className="absolute left-4 top-4 rounded-2xl bg-surface/85 backdrop-blur px-3 py-2">
          {view === 'mine' ? (
            <>
              <p className="text-ink text-sm font-medium leading-tight">{stage.stage.label}</p>
              <p className="text-ink/55 text-xs">สูง {myShape.height.toFixed(1)} เมตร</p>
            </>
          ) : (
            <>
              <p className="text-ink text-sm font-medium leading-tight">{me.team}</p>
              <p className="text-ink/55 text-xs">
                {forest.teamCount} ต้น
                {forest.teamCount > garden.length && ` · แสดง ${garden.length} ต้นแรก`}
              </p>
            </>
          )}
        </div>

        {view === 'garden' && myIndex >= 0 && (
          <p className="absolute right-4 bottom-4 rounded-full bg-surface/85 backdrop-blur px-3 py-1.5 text-ink/70 text-xs">
            <span className="text-[#c99a00]">◎</span> วงสีทองคือต้นของคุณ
          </p>
        )}
      </div>

      {/* บันทึกกิจกรรม */}
      <div className="pop-card p-4 sm:p-5 mb-3">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="font-display text-lg text-ink">บันทึกวันนี้</h2>
          <p className="tabular text-ink/50 text-xs">
            {forest.todayPoints}/{DAILY_CAP} แต้ม
          </p>
        </div>
        <p className="text-ink/55 text-xs mb-4">
          {capLeft > 0
            ? `ข้อละครั้งต่อวัน วันนี้เหลืออีก ${capLeft} แต้ม`
            : 'วันนี้ครบเพดานแล้ว พรุ่งนี้บันทึกได้อีก'}
        </p>

        <div className="space-y-4">
          {FOREST.kinds.map((kind) => (
            <div key={kind.id}>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white"
                  style={{ backgroundColor: kind.color }}
                >
                  {kind.emoji} {kind.label}
                </span>
                <span className="text-ink/45 text-xs">{kind.hint}</span>
              </div>

              <div className="grid gap-1.5 sm:grid-cols-2">
                {FOREST.activities
                  .filter((a) => a.kind === kind.id)
                  .map((a) => {
                    const done = forest.todayDone.includes(a.id)
                    return (
                      <button
                        key={a.id}
                        type="button"
                        disabled={done || capLeft === 0}
                        onClick={() => void log(a.id)}
                        className={`flex items-center gap-2.5 rounded-2xl border-2 px-3 py-2.5 text-left transition-colors ${
                          done
                            ? 'border-accent/30 bg-accent/8 text-ink/50'
                            : 'border-line bg-surface text-ink hover:border-accent/50 disabled:opacity-45'
                        }`}
                      >
                        <span className="text-lg leading-none shrink-0">{a.emoji}</span>
                        <span className="flex-1 text-sm leading-snug">{a.label}</span>
                        {done ? (
                          <Check size={16} className="text-accent shrink-0" />
                        ) : (
                          <span className="tabular text-accent-deep text-sm font-medium shrink-0">
                            +{a.points}
                          </span>
                        )}
                      </button>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <RecentLog entries={forest.log} />

      <div className="flex items-center justify-center gap-1.5 text-ink/45 text-xs mt-4">
        <Users size={13} />
        ทั้งหน่วยงาน {forest.officeCount} ต้น · รวม {forest.officePoints.toLocaleString('th-TH')} แต้ม
      </div>

      {FOREST_REHEARSAL && (
        <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-center">
          <p className="text-amber-900 text-xs mb-2">
            เครื่องมือซ้อม — สร้างเพื่อนร่วมสวนจำลองไว้ดูหน้าตาสวนตอนยังไม่มีคนใช้จริง
          </p>
          <button
            type="button"
            onClick={() => void forestBackend.seedDemoMembers(12, me.team)}
            className="rounded-full bg-amber-200 text-amber-950 px-4 py-1.5 text-xs"
          >
            เพิ่ม 12 ต้นจำลองในสำนักนี้
          </button>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed inset-x-0 bottom-6 flex justify-center pointer-events-none z-20"
          >
            <span
              className={`rounded-full px-5 py-2.5 text-sm font-medium shadow-lg ${
                toast.ok ? 'bg-accent-deep text-white' : 'bg-ink text-white'
              }`}
            >
              {toast.text}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ViewTab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition-colors ${
        active ? 'bg-accent-deep text-white' : 'bg-ink/5 text-ink/70 hover:bg-ink/10'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

function RecentLog({ entries }: { entries: LogEntry[] }) {
  if (entries.length === 0) return null
  const labelOf = (entry: LogEntry) =>
    entry.activityId
      ? (FOREST.activities.find((a) => a.id === entry.activityId)?.label ?? 'กิจกรรม 3R')
      : (entry.note ?? 'แต้มจากสตาฟ')

  return (
    <div className="pop-card p-4 sm:p-5">
      <h2 className="font-display text-lg text-ink mb-3">ประวัติล่าสุด</h2>
      <ul className="space-y-2">
        {entries.slice(0, 6).map((entry) => (
          <li key={entry.id} className="flex items-center gap-3 text-sm">
            <span className="tabular text-ink/40 text-xs shrink-0">
              {new Date(entry.at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
            </span>
            <span className="flex-1 text-ink/80 truncate">{labelOf(entry)}</span>
            {entry.source === 'staff' && (
              <span className="rounded-full bg-ink/5 text-ink/50 text-[11px] px-2 py-0.5 shrink-0">
                สตาฟให้
              </span>
            )}
            <span className="tabular text-accent-deep shrink-0">+{entry.points}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
