import { Crown, Users } from 'lucide-react'
import { FOREST_BADGES, LEADERBOARD } from '../content'
import type { BadgeId, LeaderboardEntry, LeaderboardSnapshot, TeamStanding } from '../forest'
import PlayerAvatar from './live/PlayerAvatar'

const BADGE_BY_ID = new Map(FOREST_BADGES.map((b) => [b.id as BadgeId, b]))

/**
 * หน้าอันดับคะแนน — แท็บ "อันดับ" ใน #/forest
 *
 * อยู่หลังล็อกอินเสมอ (ต่างจากป่าองค์กรหน้าแรกที่ไม่ต้องล็อกอิน) เพราะมีชื่อคนติดมาด้วย
 * โชว์ Top N + แถบ "อันดับของฉัน" แยกไว้เสมอ ไม่ใช่ทั้งบริษัทเรียงเต็มตาราง — ดูเหตุผลใน content.ts
 */
export default function ForestLeaderboard({
  lb,
  meUid,
}: {
  lb: LeaderboardSnapshot | null
  meUid: string
}) {
  if (!lb) {
    return <p className="text-ink/50 text-sm text-center py-10">กำลังโหลดอันดับ…</p>
  }

  const meInTop = lb.me ? lb.top.some((e) => e.uid === lb.me!.uid) : false

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-lg text-ink">{LEADERBOARD.personalHeading}</h2>
          <p className="text-ink/45 text-xs">{LEADERBOARD.intro}</p>
        </div>

        <div className="pop-card divide-y divide-line overflow-hidden">
          {lb.top.length === 0 ? (
            <p className="text-ink/50 text-sm text-center py-8 px-4">
              ยังไม่มีใครติดอันดับ — ปลูกต้นแล้วเริ่มบันทึกกิจกรรมเป็นคนแรกได้เลย
            </p>
          ) : (
            lb.top.map((entry) => (
              <LeaderboardRow key={entry.uid} entry={entry} isMe={entry.uid === meUid} />
            ))
          )}

          {/* คนที่ยังไม่ติด Top N เห็นแค่อันดับตัวเอง ไม่เห็นว่าใครอยู่ท้ายตาราง */}
          {lb.me && !meInTop && (
            <>
              <div className="px-4 py-2 text-center text-ink/35 text-xs tracking-widest">
                • • •
              </div>
              <LeaderboardRow entry={lb.me} isMe />
            </>
          )}

          {!lb.me && (
            <p className="text-ink/45 text-xs text-center py-3 px-4 border-t border-line">
              คุณยังไม่ติดอันดับ — บันทึกกิจกรรมแรกเพื่อเริ่มสะสมแต้ม
            </p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="font-display text-lg text-ink">{LEADERBOARD.teamHeading}</h2>
        </div>
        <p className="text-ink/45 text-xs mb-3">{LEADERBOARD.teamNote}</p>

        <div className="pop-card divide-y divide-line overflow-hidden">
          {lb.teams.length === 0 ? (
            <p className="text-ink/50 text-sm text-center py-8 px-4">ยังไม่มีสำนักไหนติดอันดับ</p>
          ) : (
            lb.teams.map((team, i) => <TeamRow key={team.team} team={team} rank={i + 1} />)
          )}
        </div>
      </div>
    </div>
  )
}

function LeaderboardRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${isMe ? 'bg-accent/8' : ''}`}>
      <RankBadge rank={entry.rank} />
      <PlayerAvatar look={entry.look} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-ink text-sm font-medium truncate">{entry.name}</p>
          {isMe && (
            <span className="shrink-0 text-accent-deep text-[10px] font-medium bg-accent/15 rounded-full px-1.5 py-0.5">
              คุณ
            </span>
          )}
        </div>
        <p className="text-ink/45 text-xs truncate">{entry.team}</p>
      </div>
      {entry.badges.length > 0 && (
        <div className="hidden sm:flex items-center gap-1 shrink-0" aria-hidden>
          {entry.badges.map((id) => {
            const badge = BADGE_BY_ID.get(id)
            if (!badge) return null
            return (
              <span key={id} title={badge.label} className="text-base leading-none">
                {badge.emoji}
              </span>
            )
          })}
        </div>
      )}
      <p className="tabular text-accent-deep font-display text-lg shrink-0">{entry.points}</p>
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const colors = ['#c99a00', '#9aa5b1', '#b5651d']
    return (
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white"
        style={{ backgroundColor: colors[rank - 1] }}
      >
        <Crown size={14} />
      </span>
    )
  }
  return (
    <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-ink/6 text-ink/60 text-xs font-medium tabular">
      {rank}
    </span>
  )
}

function TeamRow({ team, rank }: { team: TeamStanding; rank: number }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <RankBadge rank={rank} />
      <div className="min-w-0 flex-1">
        <p className="text-ink text-sm font-medium truncate">{team.team}</p>
        <p className="text-ink/45 text-xs inline-flex items-center gap-1">
          <Users size={11} /> {team.memberCount} คน · รวม {team.totalPoints.toLocaleString('th-TH')} แต้ม
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="tabular text-accent-deep font-display text-lg leading-none">
          {team.avgPoints.toFixed(1)}
        </p>
        <p className="text-ink/45 text-[10px]">แต้ม/คน</p>
      </div>
    </div>
  )
}
