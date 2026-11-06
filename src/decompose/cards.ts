// การ์ด "ย่อยนานแค่ไหน?" — เวลาย่อยสลายของขยะที่หลุดลงทะเล
// ที่มา: US EPA (Gulf of Mexico Program), US NPS (Tonto NM), NOAA/Mote/NPS 2018 (Our World in Data), Mote ผ่าน MARLISCO (EU)
// ทุกค่าเป็นเวลาโดยประมาณตามเอกสารต้นฉบับ เกมตัดสินด้วย "ระดับ" (tier) เท่านั้น

export interface Tier { n: number; color: string; name: string }
export const TIERS: Tier[] = [
  {
    "n": 1,
    "color": "#16a34a",
    "name": "ไม่ถึง 2 เดือน"
  },
  {
    "n": 2,
    "color": "#65a30d",
    "name": "2 เดือน – ไม่ถึง 1 ปี"
  },
  {
    "n": 3,
    "color": "#ca8a04",
    "name": "1 – ไม่ถึง 10 ปี"
  },
  {
    "n": 4,
    "color": "#ea580c",
    "name": "10 – ไม่ถึง 100 ปี"
  },
  {
    "n": 5,
    "color": "#dc2626",
    "name": "100 – ไม่ถึง 1,000 ปี"
  },
  {
    "n": 6,
    "color": "#57534e",
    "name": "นานจนประเมินไม่ได้"
  }
]

export interface Item {
  id: number
  name: string
  emoji?: string
  svg?: keyof typeof SVGS
  badge?: string
  tier: number
  time: string
  note?: string
  src: string
  why: string
  tip: string
}

/** ไอคอนวาดเอง (SVG คงที่ในโค้ด) สำหรับของที่ไม่มีอีโมจิตรงชื่อ */
export const SVGS = {
  "alcan": "<svg class=\"ico\" viewBox=\"0 0 100 100\"><g stroke=\"#4b5563\" stroke-width=\"3\" stroke-linejoin=\"round\"><path d=\"M31 15h38l5 9v53l-5 9H31l-5-9V24z\" fill=\"#d1d5db\"/><path d=\"M26 37h48v29H26z\" fill=\"#ef4444\"/></g><path d=\"M33 26v50\" stroke=\"#fff\" stroke-width=\"5\" stroke-linecap=\"round\" opacity=\".75\"/><path d=\"M42 51.5h22\" stroke=\"#fff\" stroke-width=\"4\" stroke-linecap=\"round\"/><ellipse cx=\"50\" cy=\"15\" rx=\"19\" ry=\"4.5\" fill=\"#e5e7eb\" stroke=\"#4b5563\" stroke-width=\"3\"/><rect x=\"44\" y=\"11.5\" width=\"12\" height=\"5\" rx=\"2.5\" fill=\"#9ca3af\"/></svg>",
  "rings": "<svg class=\"ico\" viewBox=\"0 0 100 100\"><rect x=\"8\" y=\"25\" width=\"84\" height=\"50\" rx=\"16\" fill=\"#bfe3f5\" fill-opacity=\".6\" stroke=\"#2b7bb0\" stroke-width=\"3\"/><g fill=\"#fff\" stroke=\"#2b7bb0\" stroke-width=\"3\"><circle cx=\"27\" cy=\"40\" r=\"9.5\"/><circle cx=\"50\" cy=\"40\" r=\"9.5\"/><circle cx=\"73\" cy=\"40\" r=\"9.5\"/><circle cx=\"27\" cy=\"60\" r=\"9.5\"/><circle cx=\"50\" cy=\"60\" r=\"9.5\"/><circle cx=\"73\" cy=\"60\" r=\"9.5\"/></g></svg>",
  "diaper": "<svg class=\"ico\" viewBox=\"0 0 100 100\"><g stroke=\"#4a6fa5\" stroke-width=\"3\" stroke-linejoin=\"round\"><path d=\"M12 22h76l-10 26c-5 16-14 30-28 30S27 64 22 48z\" fill=\"#f8fafc\"/><path d=\"M12 22h76v11H12z\" fill=\"#93c5fd\"/><rect x=\"4\" y=\"21\" width=\"15\" height=\"13\" rx=\"4\" fill=\"#fcd34d\"/><rect x=\"81\" y=\"21\" width=\"15\" height=\"13\" rx=\"4\" fill=\"#fcd34d\"/></g><circle cx=\"40\" cy=\"47\" r=\"3.2\" fill=\"#93c5fd\"/><circle cx=\"60\" cy=\"47\" r=\"3.2\" fill=\"#93c5fd\"/><circle cx=\"50\" cy=\"60\" r=\"3.2\" fill=\"#93c5fd\"/></svg>",
  "plywood": "<svg class=\"ico\" viewBox=\"0 0 100 100\"><g stroke=\"#7c4a1c\" stroke-width=\"3\" stroke-linejoin=\"round\"><path d=\"M4 46 58 24 96 42 42 64z\" fill=\"#f1cf98\"/><path d=\"M4 46 42 64v18L4 64z\" fill=\"#d9a35e\"/><path d=\"M42 64 96 42v18L42 82z\" fill=\"#c08646\"/></g><path d=\"M4 52 42 70M4 58 42 76M42 70 96 48M42 76 96 54\" stroke=\"#7c4a1c\" stroke-width=\"1.8\" fill=\"none\"/><path d=\"M28 43q12-5 24 2t22 0M20 51q14-6 30 1\" stroke=\"#c99a5b\" stroke-width=\"2.4\" fill=\"none\" stroke-linecap=\"round\"/></svg>",
  "carton": "<svg class=\"ico\" viewBox=\"0 0 100 100\"><g stroke=\"#2f5d8a\" stroke-width=\"3\" stroke-linejoin=\"round\"><path d=\"M18 42h40v52H18z\" fill=\"#fff\"/><path d=\"M58 42 82 30v52L58 94z\" fill=\"#dbe7f4\"/><path d=\"M18 42 38 20 58 42z\" fill=\"#eef4fb\"/><path d=\"M38 20 62 8 82 30 58 42z\" fill=\"#c7dcf2\"/><path d=\"M18 62h40v18H18z\" fill=\"#3b82f6\"/><path d=\"M58 62 82 50v18L58 80z\" fill=\"#2563eb\"/></g><path d=\"M36 21 61 8.5\" stroke=\"#2f5d8a\" stroke-width=\"6\" stroke-linecap=\"round\"/><text x=\"38\" y=\"76.5\" font-size=\"15\" font-weight=\"800\" fill=\"#fff\" text-anchor=\"middle\" font-family=\"Noto Sans Thai, sans-serif\">นม</text></svg>",
  "foamcup": "<svg class=\"ico\" viewBox=\"0 0 100 100\"><g stroke=\"#64748b\" stroke-width=\"3\" stroke-linejoin=\"round\"><path d=\"M22 20h56l-8 72H30z\" fill=\"#fff\"/><path d=\"M18 13h64v9H18z\" fill=\"#f1f5f9\"/></g><path d=\"M28 40h44M30 56h40M32 72h36\" stroke=\"#cbd5e1\" stroke-width=\"2.6\" stroke-linecap=\"round\"/></svg>",
  "bag": "<svg class=\"ico\" viewBox=\"0 0 100 100\"><path d=\"M16 89 19 37q1-8 5-12V9h13v11q0 12 13 12t13-12V9h13v16q4 4 5 12l3 52q0 4-4 4H20q-4 0-4-4z\" fill=\"#f8fafc\" stroke=\"#64748b\" stroke-width=\"3\" stroke-linejoin=\"round\"/><rect x=\"27\" y=\"13\" width=\"7\" height=\"8\" rx=\"3\" fill=\"#fff\" stroke=\"#94a3b8\" stroke-width=\"2\"/><rect x=\"66\" y=\"13\" width=\"7\" height=\"8\" rx=\"3\" fill=\"#fff\" stroke=\"#94a3b8\" stroke-width=\"2\"/><path d=\"M31 50l7 9M60 62l10-7M40 79l13 3\" stroke=\"#cbd5e1\" stroke-width=\"2.6\" stroke-linecap=\"round\"/></svg>",
  "pet": "<svg class=\"ico\" viewBox=\"0 0 100 100\"><g stroke=\"#2563eb\" stroke-width=\"3\" stroke-linejoin=\"round\"><rect x=\"40\" y=\"3\" width=\"20\" height=\"10\" rx=\"2\" fill=\"#3b82f6\"/><path d=\"M43 13h14v8c0 4 10 8 10 16v51a6 6 0 0 1-6 6H39a6 6 0 0 1-6-6V37c0-8 10-12 10-16z\" fill=\"#dbeafe\"/><path d=\"M33 48h34v20H33z\" fill=\"#60a5fa\"/></g><path d=\"M40 40v42\" stroke=\"#fff\" stroke-width=\"4\" stroke-linecap=\"round\" opacity=\".85\"/></svg>",
  "glassbottle": "<svg class=\"ico\" viewBox=\"0 0 100 100\"><g stroke=\"#15803d\" stroke-width=\"3\" stroke-linejoin=\"round\"><rect x=\"40\" y=\"4\" width=\"20\" height=\"8\" rx=\"2\" fill=\"#bbf7d0\"/><path d=\"M42 12h16v18c0 6 12 10 12 22v36a6 6 0 0 1-6 6H36a6 6 0 0 1-6-6V52c0-12 12-16 12-22z\" fill=\"#86efac\" fill-opacity=\".75\"/><path d=\"M30 54h40v22H30z\" fill=\"#f0fdf4\"/></g><path d=\"M39 36v50\" stroke=\"#fff\" stroke-width=\"4\" stroke-linecap=\"round\" opacity=\".85\"/></svg>"
} as const

export const ITEMS: Item[] = [
  {
    "id": 1,
    "name": "กระดาษทิชชู่",
    "emoji": "🧻",
    "tier": 1,
    "time": "ราว 2 – 4 สัปดาห์",
    "src": "EPA · NPS",
    "why": "กระดาษบางทำจากเส้นใยพืช จุลินทรีย์ย่อยได้เร็ว",
    "tip": "ใช้เท่าที่จำเป็น ใช้แล้วทิ้งถังน้ำเงิน"
  },
  {
    "id": 2,
    "name": "เปลือกกล้วย",
    "emoji": "🍌",
    "tier": 1,
    "time": "ราว 2 – 5 สัปดาห์",
    "src": "NPS",
    "why": "เปลือกผลไม้นุ่มและชื้น เป็นอาหารชั้นดีของจุลินทรีย์",
    "tip": "ถังเขียว หรือหมักเป็นปุ๋ย"
  },
  {
    "id": 3,
    "name": "เปลือกส้ม",
    "emoji": "🍊",
    "tier": 1,
    "time": "ราว 2 – 5 สัปดาห์",
    "src": "NPS",
    "why": "ย่อยเร็วก็จริง แต่ถ้าทิ้งปนขยะอื่นจะเน่าเหม็นและแยกยาก",
    "tip": "ถังเขียว หรือหมักเป็นปุ๋ย"
  },
  {
    "id": 4,
    "name": "หนังสือพิมพ์",
    "emoji": "📰",
    "tier": 1,
    "time": "ราว 6 สัปดาห์",
    "src": "EPA · NPS · Mote",
    "why": "เป็นกระดาษเหมือนทิชชู่ แต่หนากว่า จึงใช้เวลานานกว่า",
    "tip": "ถังเหลือง (ถ้าสะอาดและแห้ง)"
  },
  {
    "id": 5,
    "name": "แกนแอปเปิล",
    "emoji": "🍎",
    "tier": 2,
    "time": "ราว 2 – 6 เดือน",
    "note": "EPA และ Mote ระบุ 2 เดือน · NPS ระบุ 6 เดือน",
    "src": "EPA · NPS · Mote",
    "why": "เนื้อผลไม้แน่นกว่าเปลือกบางๆ จึงย่อยช้ากว่า",
    "tip": "ถังเขียว หรือหมักเป็นปุ๋ย"
  },
  {
    "id": 6,
    "name": "กล่องนมเคลือบไข",
    "svg": "carton",
    "tier": 2,
    "time": "ราว 3 เดือน",
    "src": "EPA · NPS · NOAA",
    "why": "ไขที่เคลือบกันน้ำ ทำให้ย่อยช้ากว่าหนังสือพิมพ์",
    "tip": "ล้าง พับแบน แยกตามที่จุดรับกำหนด"
  },
  {
    "id": 7,
    "name": "ห่วงรัดกระป๋อง แบบย่อยด้วยแสง",
    "svg": "rings",
    "badge": "☀️",
    "tier": 2,
    "time": "ราว 6 เดือน",
    "src": "EPA · NOAA",
    "why": "ผลิตให้เปราะและแตกเมื่อโดนแดด ต่างจากห่วงธรรมดาที่อยู่ได้ราว 400 ปี",
    "tip": "ตัดห่วงทุกวงก่อนทิ้ง ถังน้ำเงิน"
  },
  {
    "id": 8,
    "name": "ถุงมือขนสัตว์",
    "emoji": "🧤",
    "tier": 3,
    "time": "ราว 1 ปี",
    "src": "EPA · Mote",
    "why": "ผ้าจากธรรมชาติย่อยได้ แต่ใช้เวลานานกว่ากระดาษมาก",
    "tip": "ใช้ซ้ำ ซ่อม หรือบริจาค"
  },
  {
    "id": 9,
    "name": "ถุงเท้าขนสัตว์",
    "emoji": "🧦",
    "tier": 3,
    "time": "ราว 1 – 5 ปี",
    "src": "NPS",
    "why": "เส้นใยธรรมชาติก็ย่อยได้ แต่ต้องรอเป็นปี",
    "tip": "ใช้ซ้ำ ซ่อม หรือบริจาค"
  },
  {
    "id": 10,
    "name": "ไม้อัด",
    "svg": "plywood",
    "tier": 3,
    "time": "ราว 1 – 3 ปี",
    "src": "EPA · NPS · Mote",
    "why": "ไม้แผ่นบางหลายชั้นที่อัดติดกันด้วยกาว",
    "tip": "ใช้ซ้ำ หรือขายร้านรับซื้อของเก่า"
  },
  {
    "id": 11,
    "name": "ก้นบุหรี่",
    "emoji": "🚬",
    "tier": 3,
    "time": "ราว 1 – 5 ปี",
    "src": "NPS · NOAA",
    "why": "ไส้กรองไม่ใช่สำลี แต่ทำจากพลาสติกชนิดหนึ่ง (เซลลูโลสอะซิเตต)",
    "tip": "ดับให้สนิท ทิ้งถังน้ำเงิน ห้ามทิ้งลงพื้นหรือท่อ"
  },
  {
    "id": 12,
    "name": "ผ้าอ้อมแบบย่อยสลายได้",
    "svg": "diaper",
    "badge": "🌱",
    "tier": 3,
    "time": "ราว 1 ปี",
    "src": "EPA",
    "why": "เทียบกับผ้าอ้อมสำเร็จรูปทั่วไปที่ใช้เวลาราว 450 ปี",
    "tip": "ห่อให้มิดชิด ทิ้งถังน้ำเงิน"
  },
  {
    "id": 13,
    "name": "ถุงพลาสติกหูหิ้ว",
    "svg": "bag",
    "tier": 4,
    "time": "ราว 10 – 20 ปี",
    "src": "NPS · NOAA",
    "why": "พลาสติกไม่ได้ย่อยหายไป แต่แตกเป็นชิ้นเล็กลงเรื่อยๆ จนเป็นไมโครพลาสติก",
    "tip": "พกถุงผ้า ใช้ถุงเดิมซ้ำให้นานที่สุด"
  },
  {
    "id": 14,
    "name": "รองเท้าหนัง",
    "emoji": "👞",
    "tier": 4,
    "time": "ราว 50 ปี",
    "note": "แหล่งข้อมูลระบุเป็น “หนัง”",
    "src": "NPS",
    "why": "หนังผ่านการฟอกด้วยสารเคมีให้ทนทาน จึงย่อยช้า",
    "tip": "ซ่อม ใช้ซ้ำ หรือบริจาค"
  },
  {
    "id": 15,
    "name": "กระป๋องอาหาร (เหล็ก)",
    "emoji": "🥫",
    "tier": 4,
    "time": "ราว 50 ปี",
    "src": "EPA · NPS · NOAA · Mote",
    "why": "เหล็กค่อยๆ เป็นสนิมและผุกร่อนไปตามเวลา",
    "tip": "ล้างให้สะอาด ทิ้งถังเหลือง"
  },
  {
    "id": 16,
    "name": "แก้วน้ำโฟม",
    "svg": "foamcup",
    "tier": 4,
    "time": "ราว 50 ปี",
    "src": "EPA · NPS · NOAA",
    "why": "โฟมคือพลาสติกที่เป่าให้พอง เบา ลอยน้ำ และแตกเป็นเม็ดเล็ก",
    "tip": "พกแก้วส่วนตัว ถ้าใช้แล้วทิ้งถังน้ำเงิน"
  },
  {
    "id": 17,
    "name": "พื้นรองเท้าบูทยาง",
    "emoji": "🥾",
    "tier": 4,
    "time": "ราว 50 – 80 ปี",
    "src": "NPS",
    "why": "ยางสังเคราะห์ทนต่อการย่อยสลายตามธรรมชาติ",
    "tip": "ซ่อม ใช้ให้นาน ทิ้งถังน้ำเงิน"
  },
  {
    "id": 18,
    "name": "ทุ่นลอยน้ำทำจากโฟม",
    "emoji": "🛟",
    "tier": 4,
    "time": "ราว 50 – 80 ปี",
    "note": "EPA และ NPS ระบุ 80 ปี · NOAA ระบุ 50 ปี",
    "src": "EPA · NPS · NOAA",
    "why": "โฟมก้อนใหญ่แตกเป็นเม็ดเล็ก ที่สัตว์ทะเลกินเข้าไปได้",
    "tip": "เก็บกลับเมื่อชำรุด อย่าปล่อยลอยทิ้ง"
  },
  {
    "id": 19,
    "name": "กระป๋องอะลูมิเนียม",
    "svg": "alcan",
    "tier": 5,
    "time": "ราว 200 ปี",
    "note": "NPS และ Mote ระบุ 80 – 200 ปี",
    "src": "EPA · NOAA · NPS · Mote",
    "why": "ไม่เป็นสนิมผุพังแบบเหล็ก จึงอยู่นานกว่ากระป๋องเหล็ก",
    "tip": "ทิ้งถังเหลือง รีไซเคิลได้"
  },
  {
    "id": 20,
    "name": "ห่วงพลาสติกรัดกระป๋อง",
    "svg": "rings",
    "tier": 5,
    "time": "ราว 400 ปี",
    "src": "EPA · NOAA",
    "why": "ห่วงพลาสติกพันคอ ปาก และครีบสัตว์ทะเลได้",
    "tip": "ตัดห่วงทุกวงก่อนทิ้ง ถังน้ำเงิน"
  },
  {
    "id": 21,
    "name": "ผ้าอ้อมสำเร็จรูป",
    "svg": "diaper",
    "tier": 5,
    "time": "ราว 450 ปี",
    "src": "EPA · NPS · NOAA",
    "why": "มีพลาสติกหลายชั้นและสารดูดซับน้ำอยู่ข้างใน",
    "tip": "ห่อให้มิดชิด ทิ้งถังน้ำเงิน"
  },
  {
    "id": 22,
    "name": "ขวดน้ำพลาสติก",
    "svg": "pet",
    "tier": 5,
    "time": "ราว 450 ปี",
    "src": "EPA · NPS · NOAA",
    "why": "ขวดพลาสติกเพิ่งใช้แพร่หลายราว 60 ปี จึงยังไม่มีใครเห็นขวดย่อยหมดจริง ตัวเลขนี้จึงเป็นการประมาณ",
    "tip": "ล้าง บีบแบน ทิ้งถังเหลือง"
  },
  {
    "id": 23,
    "name": "เอ็นตกปลา",
    "emoji": "🎣",
    "tier": 5,
    "time": "ราว 600 ปี",
    "src": "EPA · NPS · NOAA",
    "why": "เส้นเอ็นใสมองเห็นยาก พันตัวสัตว์น้ำได้",
    "tip": "เก็บเศษเอ็นกลับบ้านทุกครั้ง ทิ้งถังน้ำเงิน"
  },
  {
    "id": 24,
    "name": "ขวดแก้ว",
    "svg": "glassbottle",
    "tier": 6,
    "time": "นานจนประเมินไม่ได้",
    "note": "NPS ประมาณว่านับล้านปี",
    "src": "EPA · NPS · NOAA · Mote",
    "why": "จุลินทรีย์ย่อยแก้วไม่ได้ แต่แก้วไม่เป็นอันตรายแบบพลาสติก",
    "tip": "ทิ้งถังเหลือง ระวังเศษแตก"
  },
  {
    "id": 25,
    "name": "โหลแก้ว",
    "emoji": "🫙",
    "tier": 6,
    "time": "นานจนประเมินไม่ได้",
    "note": "แหล่งข้อมูลจัด “ขวดและโหลแก้ว” ไว้ด้วยกัน",
    "src": "EPA · Mote",
    "why": "อยู่ได้นานที่สุดในชุดนี้ แต่นำไปหลอมรีไซเคิลได้",
    "tip": "ล้างแล้วใช้ซ้ำ หรือทิ้งถังเหลือง"
  }
]
