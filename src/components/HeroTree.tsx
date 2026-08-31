interface HeroTreeProps {
  /** 0–1 — สัดส่วนคาร์บอนที่ลดได้เทียบกับเป้า กำหนดความสูงและความฟูของต้นไม้ */
  growth: number
}

// ต้นไม้ SVG ที่โตตามค่า growth — เบา ไม่ต้องโหลด three.js เข้าหน้าแรก
// growth 0 = ต้นกล้าเตี้ย ๆ, growth 1 = ไม้ใหญ่ทรงพุ่มเต็ม
// ขนาดต้นสื่อความหมายเอง (ยิ่งลดคาร์บอนได้มาก ต้นยิ่งโต) จึงวาดที่ขนาดจริงเสมอ
// ไม่ใส่อนิเมชันตอนโหลด — hero ต้องเห็นต้นไม้ทันทีแม้เบราว์เซอร์บล็อกอนิเมชัน
export default function HeroTree({ growth }: HeroTreeProps) {
  const g = Math.max(0, Math.min(1, growth))

  const groundY = 250
  const trunkH = 34 + g * 96
  const trunkTop = groundY - trunkH
  const trunkW = 12 + g * 16
  const canopyR = 30 + g * 62
  const canopyCY = trunkTop - canopyR * 0.35

  // พุ่มใบ — [dx, dy, r-scale, โผล่เมื่อ growth ≥]
  const blobs: Array<[number, number, number, number]> = [
    [0, 0, 1, 0],
    [-canopyR * 0.72, canopyR * 0.28, 0.78, 0.12],
    [canopyR * 0.72, canopyR * 0.28, 0.78, 0.12],
    [-canopyR * 0.38, -canopyR * 0.62, 0.7, 0.4],
    [canopyR * 0.38, -canopyR * 0.62, 0.7, 0.4],
    [0, -canopyR * 0.95, 0.62, 0.7],
  ]

  // viewBox กระชับตามขนาดต้นจริง — ต้นเล็กจะไม่มีที่ว่างเยอะด้านบน
  const topY = Math.round(canopyCY - canopyR * 1.65 - 12)
  const vbH = groundY + 32 - topY

  return (
    <div className="relative w-full max-w-xs sm:max-w-sm">
      <svg
        viewBox={`0 ${topY} 300 ${vbH}`}
        className="w-full h-auto"
        role="img"
        aria-label={`ต้นไม้ขององค์กร เติบโต ${Math.round(g * 100)} เปอร์เซ็นต์`}
      >
        <defs>
          <radialGradient id="heroLeaf" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#8fd39a" />
            <stop offset="60%" stopColor="#57916e" />
            <stop offset="100%" stopColor="#3f7256" />
          </radialGradient>
          <linearGradient id="heroTrunk" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9a6a45" />
            <stop offset="55%" stopColor="#7c5236" />
            <stop offset="100%" stopColor="#5f3f2a" />
          </linearGradient>
        </defs>

        {/* เนินหญ้าอ่อน ๆ ใต้ต้น */}
        <ellipse cx="150" cy={groundY + 6} rx={70 + g * 40} ry={20 + g * 6} fill="#c7e0c4" opacity="0.55" />
        {/* เงาใต้ต้น */}
        <ellipse cx="150" cy={groundY + 10} rx={44 + g * 40} ry={9 + g * 4} fill="#3f7256" opacity="0.18" />

        {/* ลำต้น */}
        <path
          d={`M${150 - trunkW / 2} ${groundY}
              Q${150 - trunkW / 2 - 3} ${trunkTop + trunkH * 0.4} ${150 - trunkW * 0.28} ${trunkTop}
              L${150 + trunkW * 0.28} ${trunkTop}
              Q${150 + trunkW / 2 + 3} ${trunkTop + trunkH * 0.4} ${150 + trunkW / 2} ${groundY} Z`}
          fill="url(#heroTrunk)"
        />

        {/* พุ่มใบ — ชั้นนอกโผล่เมื่อ growth มากพอ */}
        {blobs.map(([dx, dy, rs, show], i) =>
          g >= show ? (
            <circle key={i} cx={150 + dx} cy={canopyCY + dy} r={canopyR * rs} fill="url(#heroLeaf)" />
          ) : null,
        )}

        {/* ไฮไลต์บนพุ่ม */}
        <circle
          cx={150 - canopyR * 0.3}
          cy={canopyCY - canopyR * 0.3}
          r={canopyR * 0.28}
          fill="#ffffff"
          opacity="0.14"
        />
      </svg>
    </div>
  )
}
