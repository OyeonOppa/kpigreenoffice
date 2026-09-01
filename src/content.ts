// เนื้อหาทั้งหมดของเว็บ — แก้ที่ไฟล์นี้ไฟล์เดียว
// TODO: ข้อมูลจริงจากหน่วยงาน — ชื่อหน่วยงาน, เป้าหมาย/ปีเป้าหมาย, ช่องทางติดต่อ

export const SITE_NAME = 'Green Office' // TODO: ข้อมูลจริงจากหน่วยงาน

// true = ใช้รูปนิ่งแทนวิดีโอทุกจุด (ยังไม่มีไฟล์วิดีโอจริง)
// false = กลับไปใช้วิดีโอ (VIDEO_URLS) ตามปกติ
export const USE_STATIC_IMAGES = true

// วิดีโอ placeholder จากเทมเพลตเดิม (CloudFront ภายนอก อาจถูกลบได้)
// TODO: เปลี่ยนเป็นวิดีโอของหน่วยงานเอง
export const VIDEO_URLS = {
  hero: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_074625_a81f018a-956b-43fb-9aee-4d1508e30e6a.mp4',
  featured:
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260402_054547_9875cfc5-155a-4229-8ec8-b7ba7125cbf8.mp4',
  philosophy:
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4',
  serviceEnergy:
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4',
  serviceWaste:
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4',
}

// รูปนิ่ง placeholder — ใช้ตอน USE_STATIC_IMAGES = true
// วางไฟล์จริงไว้ที่ public/images/<ชื่อไฟล์> แล้วแก้ path ด้านล่างนี้
// TODO: เปลี่ยนเป็นรูปของหน่วยงานเอง
// แนวภาพที่แนะนำต่อไฟล์ (ดูรายละเอียดเพิ่มในคำตอบแชท):
//  hero            — ท้องฟ้าโปร่งใส/ตึกสำนักงานสีเขียว มุมกว้าง โทนสว่างมีความหวัง
//  featured        — คนทำงานในออฟฟิศที่มีต้นไม้/แสงธรรมชาติ กำลังทำพฤติกรรมลดคาร์บอน
//  philosophy      — แผงโซลาร์เซลล์บนหลังคา หรือมุมสูงพื้นที่สีเขียวผสมเมือง
//  serviceEnergy   — หลอดไฟ/มิเตอร์ไฟฟ้า/คนกดปิดสวิตช์ สื่อการประหยัดพลังงาน
//  serviceWaste    — ถังขยะแยกสีจัดเรียงเป็นระเบียบ หรือมือกำลังแยกขยะรีไซเคิล
export const IMAGE_URLS = {
  hero: '/images/hero.webp',
  featured: '/images/featured.webp',
  philosophy: '/images/philosophy.webp',
  serviceEnergy: '/images/service-energy.webp',
  serviceWaste: '/images/service-waste.webp',
}

export type NavChild = {
  label: string
  href: string
  children?: { label: string; href: string }[]
}

export type NavLink = {
  label: string
  href: string
  children?: NavChild[]
}

export const NAV_LINKS: NavLink[] = [
  { label: 'นโยบาย', href: '#about' },
  {
    label: 'Knowledge',
    href: '#climate',
    children: [
      {
        label: 'Climate Change',
        href: '#climate',
        children: [{ label: 'Carbon Footprint Calculator', href: '#calculator' }],
      },
      { label: '3R', href: '#waste' },
      { label: 'จัดการขยะ', href: '#waste' },
      {
        label: 'ผลงานของสำนัก / วิทยาลัย',
        href: '#media',
        children: [
          { label: 'ข่าวสาร', href: '#media' },
          { label: 'วิดีโอ', href: '#media' },
          { label: 'อินโฟกราฟิก', href: '#media' },
        ],
      },
    ],
  },
  {
    label: 'Game',
    href: '#waste-game',
    children: [{ label: 'เกมแยกขยะลงถัง', href: '#waste-game' }],
  },
  { label: 'ความร่วมมือ', href: '#partners' },
  { label: 'ผลลัพธ์', href: '#dashboard' },
]

export const HERO = {
  headingMain: 'องค์กรคาร์บอนต่ำ',
  headingAccent: 'เริ่มที่เรา',
  subtitle:
    'แนวทางการลดการปล่อยก๊าซเรือนกระจกของหน่วยงาน ตั้งแต่การใช้พลังงานในสำนักงาน ไปจนถึงเป้าหมายระยะยาวที่วัดผลได้จริง',
  ctaLabel: 'ดูนโยบายของเรา',
  ctaHref: '#about',
  contactLabel: 'ติดต่อเรา',
}

// ผลรวมการลดคาร์บอนของทั้งหน่วยงาน — ต้นไม้ใน hero โตตามสัดส่วน carbonSavedKg / carbonGoalKg
// TODO: ข้อมูลจริงจากคณะทำงาน Green Office — ตอนนี้เป็นตัวเลขตั้งต้นไว้ดูโครงหน้าเว็บ
export const ORG_IMPACT = {
  label: 'ผลรวมของทั้งองค์กร',
  heading: 'ต้นไม้ของเราโตขึ้นทุกครั้งที่ช่วยกันลดคาร์บอน',
  intro:
    'ทุกพฤติกรรมเล็ก ๆ ของคนในหน่วยงานถูกนับรวมกันที่นี่ ยิ่งลดได้มาก ต้นไม้ก็ยิ่งโต',
  note: 'ตัวเลขสะสมตั้งแต่เริ่มโครงการ · อัปเดตรายเดือน',

  /** คาร์บอนที่ลดได้สะสม และเป้าหมายปีนี้ (kg CO₂e) */
  carbonSavedKg: 4820,
  carbonGoalKg: 12000,
  /** ให้เห็นภาพว่าคาร์บอนที่ลดได้เทียบเท่าอะไร */
  equivalent: 'เทียบเท่าการปลูกต้นไม้ราว 220 ต้น ให้ดูดซับคาร์บอนหนึ่งปี',

  /** สถิติรายมิติ ฝั่งขวาของ hero — icon อ้างชื่อใน HeroStats.tsx */
  stats: [
    {
      id: 'energy',
      icon: 'energy',
      label: 'ไฟฟ้าที่ประหยัดได้',
      value: 18600,
      unit: 'kWh',
      caption: 'ปิดไฟ–ปรับแอร์ตามเวลา เปลี่ยนเป็นหลอด LED',
    },
    {
      id: 'paper',
      icon: 'paper',
      label: 'กระดาษที่ลดลง',
      value: 92000,
      unit: 'แผ่น',
      caption: 'พิมพ์สองหน้า ใช้ระบบเอกสารดิจิทัล',
    },
    {
      id: 'waste',
      icon: 'recycle',
      label: 'ขยะที่นำกลับไปใช้ใหม่',
      value: 1350,
      unit: 'กก.',
      caption: 'คัดแยกตั้งแต่ต้นทาง ส่งรีไซเคิลและทำปุ๋ย',
    },
    {
      id: 'people',
      icon: 'people',
      label: 'คนที่ร่วมลงมือ',
      value: 214,
      unit: 'คน',
      caption: 'จากทุกสำนัก/กองในหน่วยงาน',
    },
  ],
} as const

// พิกัดสำหรับ widget สภาพอากาศ/ฝุ่น (Open-Meteo — ฟรี ไม่ต้องใช้ API key)
// TODO: เปลี่ยนเป็นพิกัดที่ตั้งจริงของหน่วยงาน
export const AIR_WIDGET = {
  latitude: 13.7563,
  longitude: 100.5018,
  locationLabel: 'กรุงเทพมหานคร',
  sourceLabel: 'ข้อมูล: Open-Meteo (CAMS)',
}

// การ์ดทางลัดใต้ hero — icon กำหนดใน QuickActionsSection ตาม id
export const QUICK_ACTIONS = [
  { id: 'policy', label: 'นโยบายของเรา', href: '#about' },
  { id: 'calculator', label: 'คำนวณคาร์บอน', href: '#calculator' },
  { id: 'game', label: 'เกมแยกขยะ', href: '#waste-game' },
  { id: 'bins', label: 'ถังขยะ 4 สี', href: '#waste' },
  { id: 'actions', label: 'มาตรการหลัก', href: '#actions' },
  { id: 'media', label: 'บทความความรู้', href: '#media' },
  { id: 'partners', label: 'ความร่วมมือ', href: '#partners' },
  { id: 'dashboard', label: 'ผลลัพธ์', href: '#dashboard' },
] as const

// การ์ดโปรโมทกิจกรรม interactive ในเว็บ
export const GAMES_PROMO = {
  label: 'ลองเล่นดู',
  heading: 'เรียนรู้ผ่านการลงมือทำ',
  items: [
    {
      emoji: '🌳',
      title: 'ป่า 3R ปลูกต้นไม้ด้วยการลงมือทำ',
      description:
        'ทุกคนมีต้นไม้ของตัวเองคนละต้น บันทึกกิจกรรมลดใช้/ใช้ซ้ำ/แยกขยะแล้วได้แต้ม แต้มทำให้ต้นโตขึ้น และไปรวมเป็นสวนของสำนัก',
      href: '#/forest',
      cta: 'ดูต้นของฉัน',
      featured: true,
    },
    {
      emoji: '🏆',
      title: 'แยกขยะแข่งสด เล่นพร้อมกันทั้งหน่วยงาน',
      description:
        'ลากขยะลงถังให้ถูกและให้ไว 10 ข้อ ข้อละ 10 วินาที ตอบไวได้คะแนนเยอะกว่า จบเกมประกาศ 10 อันดับ (สแกน QR หรือกรอก PIN เข้าเล่นได้เลย)',
      href: '#/live',
      cta: 'เข้าห้องแข่ง',
      featured: true,
    },
    {
      emoji: '🗑️',
      title: 'เกมแยกขยะ ทิ้งให้ถูกถัง',
      description: 'ทดสอบว่าคุณแยกขยะถูกถังแค่ไหนใน 8 ข้อ เล่นคนเดียวได้ทุกเมื่อ',
      href: '#waste-game',
      cta: 'เล่นเลย',
    },
    {
      emoji: '🌍',
      title: 'เครื่องคำนวณคาร์บอนฟุตพรินต์',
      description: 'ตอบ 6 คำถาม รู้ทันทีว่าปีนึงคุณปล่อยคาร์บอนกี่ตัน',
      href: '#calculator',
      cta: 'คำนวณเลย',
    },
  ],
}

// บทความ mock — รอเนื้อหาจริงจากหน่วยงาน
// TODO: แทนที่ด้วยบทความจริง (title, date, tag, image, ลิงก์)
// แนวภาพที่แนะนำ:
//  news-1 — สำนักงาน/โต๊ะทำงาน มีคนกำลังปิดไฟหรือถอดปลั๊ก สื่อการประหยัดไฟ
//  news-2 — กลุ่มคนทำกิจกรรมอาสา ปลูกต้นไม้ หรือรวมตัวถ่ายภาพหมู่กลางแจ้ง
//  news-3 — กราฟ/ธรรมชาติเติบโต หรือทีมงานยิ้มดีใจกับผลงาน สื่อความสำเร็จ
export const NEWS = {
  label: 'บทความและข่าวสาร',
  heading: 'อัปเดตล่าสุด',
  posts: [
    {
      tag: 'ความรู้',
      title: '(ตัวอย่าง) 5 วิธีลดใช้ไฟฟ้าในสำนักงานที่เริ่มได้วันนี้',
      date: '19 ก.ค. 2569',
      image: '/images/news-1.webp',
    },
    {
      tag: 'กิจกรรม',
      title: '(ตัวอย่าง) เปิดรับสมัครอาสาสมัครสำนักงานสีเขียวรุ่นที่ 1',
      date: '15 ก.ค. 2569',
      image: '/images/news-2.webp',
    },
    {
      tag: 'ข่าว',
      title: '(ตัวอย่าง) สรุปผลการลดคาร์บอนครึ่งปีแรก เกินเป้า 12%',
      date: '10 ก.ค. 2569',
      image: '/images/news-3.webp',
    },
  ],
}

export const FOOTER = {
  about:
    'เว็บไซต์นโยบายคาร์บอนต่ำของหน่วยงาน รวมความรู้ มาตรการ และเครื่องมือช่วยลดการปล่อยก๊าซเรือนกระจก',
  // TODO: ข้อมูลจริงจากหน่วยงาน — ที่อยู่ เบอร์โทร อีเมล โซเชียลจริง
  contact: {
    address: 'ที่อยู่หน่วยงาน (รอข้อมูลจริง)',
    phone: '0-0000-0000',
    email: 'contact@example.org',
  },
  copyright: `© ${new Date().getFullYear()} ${'Green Office'} — สงวนลิขสิทธิ์`,
}

export const ABOUT = {
  label: 'นโยบายของเรา',
  // TODO: ข้อมูลจริงจากหน่วยงาน — กรอบเวลา/เป้าหมายที่ประกาศจริง
  headingParts: {
    before: 'มุ่งสู่',
    accent: 'ความเป็นกลางทางคาร์บอน',
    after: 'ด้วยการลงมือทำจริงในทุกวัน ทุกระดับขององค์กร',
  },
}

export const FEATURED = {
  label: 'แนวทางของเรา',
  body: 'การลดคาร์บอนไม่ได้เริ่มจากโครงการใหญ่ แต่เริ่มจากพฤติกรรมประจำวันในสำนักงาน ทั้งการใช้ไฟฟ้า น้ำ กระดาษ และการเดินทาง เมื่อทุกคนปรับพร้อมกัน ผลลัพธ์จึงวัดได้จริง',
  buttonLabel: 'ดูเป้าหมาย',
  buttonHref: '#goals',
}

export const PHILOSOPHY = {
  headingMain: 'ลดคาร์บอน',
  headingAccent: 'x',
  headingEnd: 'ยั่งยืน',
  blocks: [
    {
      label: 'ลดการใช้พลังงาน',
      body: 'ปรับปรุงระบบไฟฟ้าและเครื่องปรับอากาศในอาคาร เลือกใช้อุปกรณ์ประหยัดพลังงาน และติดตามการใช้พลังงานรายเดือนเพื่อหาจุดที่ลดได้เพิ่ม',
    },
    {
      label: 'สู่เป้าหมายระยะยาว',
      body: 'จัดทำแผนงานลดก๊าซเรือนกระจกพร้อมตัวชี้วัดที่ชัดเจน วัดผลการปล่อยคาร์บอนขององค์กรอย่างสม่ำเสมอ และรายงานความคืบหน้าอย่างโปร่งใส',
    },
  ],
}

// ---------- Climate Change ----------

export const CLIMATE = {
  label: 'Climate Change',
  heading: 'รู้จักการเปลี่ยนแปลงสภาพภูมิอากาศ',
  intro:
    'ก๊าซเรือนกระจกที่มนุษย์ปล่อยออกมา ทำให้อุณหภูมิเฉลี่ยของโลกสูงขึ้นต่อเนื่อง การเข้าใจสาเหตุและผลกระทบคือจุดเริ่มต้นของการลงมือแก้',
  causes: {
    title: 'สาเหตุหลัก',
    items: [
      'การเผาไหม้เชื้อเพลิงฟอสซิล — ไฟฟ้า การเดินทาง อุตสาหกรรม',
      'การตัดไม้ทำลายป่า ทำให้แหล่งดูดซับคาร์บอนลดลง',
      'ภาคเกษตรและปศุสัตว์ ปล่อยก๊าซมีเทนปริมาณมาก',
      'ขยะและของเสียที่ย่อยสลายแบบไร้อากาศ',
    ],
  },
  impacts: {
    title: 'ผลกระทบ',
    items: [
      'อุณหภูมิเฉลี่ยสูงขึ้น คลื่นความร้อนถี่และรุนแรงขึ้น',
      'ระดับน้ำทะเลสูงขึ้น กระทบพื้นที่ชายฝั่ง',
      'สภาพอากาศสุดขั้ว — น้ำท่วม ภัยแล้ง พายุรุนแรง',
      'ระบบนิเวศและความมั่นคงทางอาหารถูกคุกคาม',
    ],
  },
}

export const CALCULATOR = {
  label: 'Carbon Footprint Calculator',
  heading: 'คำนวณคาร์บอนฟุตพรินต์ของคุณ',
  disclaimer:
    'ผลลัพธ์เป็นค่าประมาณจากค่าเฉลี่ยที่เผยแพร่โดย TGO / DEFRA เพื่อการเรียนรู้เท่านั้น ไม่ใช่การประเมินอย่างเป็นทางการ',
  transportOptions: [
    { id: 'walk', label: 'เดิน' },
    { id: 'bike', label: 'จักรยาน' },
    { id: 'public', label: 'รถสาธารณะ' },
    { id: 'car', label: 'รถยนต์' },
  ] as const,
}

// ค่าสัมประสิทธิ์การปล่อยก๊าซเรือนกระจก (kgCO2e) — ค่าเฉลี่ยโดยประมาณ
// ที่มา: DEFRA GHG Conversion Factors (รถยนต์/รถโดยสาร/เที่ยวบิน),
// Poore & Nemecek 2018 (อาหาร ต่อมื้อ ~150g), TGO Grid Emission Factor (ไฟฟ้าไทย)
export const EMISSION_FACTORS = {
  carPerKm: 0.192, // รถยนต์ส่วนตัวเฉลี่ย ต่อ กม.
  publicPerKm: 0.103, // รถโดยสารประจำทางเฉลี่ย ต่อ กม.
  workDaysPerYear: 240,
  flightDomestic: 150, // ต่อทริปไป-กลับในประเทศ (เฉลี่ย)
  flightInternational: 1000, // ต่อทริปไป-กลับต่างประเทศ (เฉลี่ย)
  beefPerMeal: 4.0,
  chickenPerMeal: 1.0,
  porkPerMeal: 1.8,
  gridKgPerKwh: 0.4999, // TGO grid emission factor
  thbPerKwh: 4.4, // ค่าไฟเฉลี่ยโดยประมาณ บาท/หน่วย
  kgPerTreePerYear: 9.5, // การดูดซับ CO2 ของต้นไม้ยืนต้น 1 ต้น/ปี (TGO)
}

// ---------- การจัดการขยะ ----------

// รูปถังขยะจริง — วางไฟล์ที่ public/images/<ชื่อไฟล์> แล้วขึ้นลอยเหนือการ์ดอัตโนมัติ (ไม่มีกรอบ/พื้นหลัง)
// ต้องเป็นไฟล์ "พื้นหลังโปร่งใส" (ตัดขอบถังออกจากพื้นหลัง) ไม่งั้นจะเห็นเป็นสี่เหลี่ยม/วงกลมทึบแทนที่จะลอย
// ถ้ายังไม่มีไฟล์ จะ fallback กลับไปแสดงวงกลมสี (bin.color) แทนโดยอัตโนมัติ
// TODO: ถ่ายรูปถังขยะจริงของหน่วยงาน (ตัดพื้นหลังออก) หรือใช้ภาพประกอบตัดขอบที่ตรงกับสีจริงที่ใช้
export const WASTE = {
  label: 'Waste Management',
  heading: 'การจัดการขยะ',
  intro: 'แยกขยะถูกถัง ลดปริมาณขยะที่ต้องนำไปกำจัด และเพิ่มโอกาสนำกลับมาใช้ใหม่',
  bins: [
    {
      id: 'organic',
      color: '#22c55e',
      image: '/images/bin-organic.webp',
      name: 'ถังสีเขียว',
      type: 'ขยะอินทรีย์',
      examples: 'เศษอาหาร เปลือกผลไม้ ใบไม้',
    },
    {
      id: 'recycle',
      color: '#eab308',
      image: '/images/bin-recycle.webp',
      name: 'ถังสีเหลือง',
      type: 'ขยะรีไซเคิล',
      examples: 'ขวดพลาสติก กระดาษ กระป๋อง แก้ว',
    },
    {
      id: 'general',
      color: '#3b82f6',
      image: '/images/bin-general.webp',
      name: 'ถังสีน้ำเงิน',
      type: 'ขยะทั่วไป',
      examples: 'ซองขนม โฟม ทิชชูใช้แล้ว',
    },
    {
      id: 'hazard',
      color: '#ef4444',
      image: '/images/bin-hazard.webp',
      name: 'ถังสีแดง',
      type: 'ขยะอันตราย',
      examples: 'ถ่านไฟฉาย หลอดไฟ กระป๋องสเปรย์',
    },
  ] as const,
}

// ไอเทมในเกมแยกขยะ — bin ต้องตรงกับ id ของ WASTE.bins
// รูปไอเท็มในเกม — วางไฟล์ที่ public/images/<ชื่อไฟล์> แล้วขึ้นแทน emoji อัตโนมัติ
// ถ้ายังไม่มีไฟล์ (หรือโหลดไม่สำเร็จ) จะ fallback กลับไปแสดง emoji เดิมแทน
// แนะนำใช้ไฟล์พื้นหลังโปร่งใส (แบบเดียวกับรูปถังขยะ) จะได้ผลลัพธ์ลอยสวยที่สุด
export const WASTE_GAME_ITEMS = [
  { emoji: '🍌', image: '/images/item-banana-peel.webp', name: 'เปลือกกล้วย', bin: 'organic' },
  { emoji: '🍚', image: '/images/item-food-scraps.webp', name: 'เศษอาหาร', bin: 'organic' },
  { emoji: '🍃', image: '/images/item-dry-leaves.webp', name: 'ใบไม้แห้ง', bin: 'organic' },
  { emoji: '🥤', image: '/images/item-plastic-bottle.webp', name: 'ขวดพลาสติก', bin: 'recycle' },
  { emoji: '📰', image: '/images/item-newspaper.webp', name: 'กระดาษหนังสือพิมพ์', bin: 'recycle' },
  { emoji: '🥫', image: '/images/item-aluminum-can.webp', name: 'กระป๋องอะลูมิเนียม', bin: 'recycle' },
  { emoji: '🍾', image: '/images/item-glass-bottle.webp', name: 'ขวดแก้ว', bin: 'recycle' },
  { emoji: '🍬', image: '/images/item-snack-wrapper.webp', name: 'ซองขนม', bin: 'general' },
  { emoji: '🧻', image: '/images/item-used-tissue.webp', name: 'ทิชชูใช้แล้ว', bin: 'general' },
  { emoji: '🍱', image: '/images/item-foam-box.webp', name: 'กล่องโฟม', bin: 'general' },
  { emoji: '🔋', image: '/images/item-battery.webp', name: 'ถ่านไฟฉาย', bin: 'hazard' },
  { emoji: '💡', image: '/images/item-broken-bulb.webp', name: 'หลอดไฟเสีย', bin: 'hazard' },
  { emoji: '🧴', image: '/images/item-spray-can.webp', name: 'กระป๋องสเปรย์', bin: 'hazard' },
  { emoji: '📱', image: '/images/item-old-phone.webp', name: 'มือถือเก่า', bin: 'hazard' },
] as const

// ---------- Media Center ----------

export const MEDIA = {
  label: 'Media Center',
  heading: 'คลังความรู้',
  intro: 'อินโฟกราฟิกและคลิปความรู้ด้านคาร์บอนต่ำ',
  // TODO: ข้อมูลจริงจากหน่วยงาน — ลิงก์ infographic / คลิปจริง
  items: [
    { type: 'Infographic', title: 'คาร์บอนฟุตพรินต์ในชีวิตประจำวัน' },
    { type: 'Infographic', title: 'แยกขยะถูกถัง เริ่มยังไง' },
    { type: 'Clip', title: 'สำนักงานคาร์บอนต่ำใน 3 นาที' },
  ],
}

// ---------- Projects & Partnerships ----------

export const PARTNERS = {
  label: 'Projects & Partnerships',
  heading: 'โครงการและความร่วมมือ',
  items: [
    {
      title: 'ความร่วมมือ MOU',
      // TODO: ข้อมูลจริงจากหน่วยงาน — รายละเอียด/วันที่ลงนามจริง
      body: 'กิจกรรมลงนามความร่วมมือกับ ธพส. และ ปตท. เพื่อขับเคลื่อนเป้าหมายคาร์บอนต่ำร่วมกัน',
    },
    {
      title: 'อาคารต้นแบบ',
      body: 'พัฒนาอาคารต้นแบบตามแนวทาง Fitwel และ Green Building เป็นตัวอย่างอาคารประหยัดพลังงานที่ใช้งานได้จริง',
    },
  ],
}

// ---------- Dashboard ----------

export const DASHBOARD = {
  label: 'Dashboard',
  heading: 'ผลลัพธ์ที่ทำได้แล้ว',
  note: 'นำจากการที่ทุกคนทำทุกครั้งมากขึ้น',
  // TODO: ข้อมูลจริงจากหน่วยงาน — อัปเดตตัวเลขตามรอบรายงาน
  stats: [
    { emoji: '🌱', value: 52.8, decimals: 1, unit: 'ตัน CO₂e', label: 'ลดการปล่อยคาร์บอนสะสม' },
    { emoji: '🌳', value: 5200, decimals: 0, unit: 'ต้น', label: 'เทียบเท่าการปลูกต้นไม้' },
    { emoji: '💧', value: 18500, decimals: 0, unit: 'ขวด', label: 'ลดขวดพลาสติก' },
  ],
}

export const SERVICES = {
  heading: 'สิ่งที่เราทำ',
  label: 'มาตรการหลัก',
  cards: [
    {
      video: VIDEO_URLS.serviceEnergy,
      image: IMAGE_URLS.serviceEnergy,
      tag: 'พลังงาน',
      title: 'ประหยัดพลังงานและทรัพยากร',
      description:
        'มาตรการลดการใช้ไฟฟ้า น้ำ และกระดาษในสำนักงาน ตั้งแต่การปิดอุปกรณ์เมื่อไม่ใช้งาน ไปจนถึงการปรับระบบให้ทำงานอัตโนมัติ',
    },
    {
      video: VIDEO_URLS.serviceWaste,
      image: IMAGE_URLS.serviceWaste,
      tag: 'สิ่งแวดล้อม',
      title: 'จัดการขยะและลดของเสีย',
      description:
        'แยกขยะตั้งแต่ต้นทาง ลดพลาสติกใช้ครั้งเดียว และนำวัสดุกลับมาใช้ซ้ำ เพื่อลดปริมาณขยะที่ต้องนำไปกำจัด',
    },
  ],
}

// ---------- เกมแยกขยะแข่งสด (Live Quiz) ----------
// เกมแข่งพร้อมกันทั้งหน่วยงานแบบ Kahoot — เข้าเล่นที่ #/live (ผู้เล่น) และ #/live/host (จอกลาง)
// ค่าเวลาและสูตรคะแนน แก้ที่ src/game/config.ts

export const LIVE_GAME = {
  label: 'Live Quiz',
  heading: 'แยกขยะแข่งสด',
  intro:
    'แข่งแยกขยะพร้อมกันทั้งหน่วยงาน 10 ข้อ ลากขยะลงถังให้ถูกและให้ไว ยิ่งไวยิ่งได้คะแนน',
  joinPath: '#/live',
  hostPath: '#/live/host',
  // TODO: ข้อมูลจริงจากหน่วยงาน — โดเมนอีเมลที่อนุญาตให้เข้าเล่น
  allowedDomain: 'kpi.ac.th',
  // TODO: ข้อมูลจริงจากหน่วยงาน — เปลี่ยนเป็นรายชื่อสำนัก/กองจริง (ใช้ทำลีดเดอร์บอร์ดแบบทีม)
  teams: [
    '(ตัวอย่าง) สำนักงานเลขาธิการ',
    '(ตัวอย่าง) สำนักวิจัยและพัฒนา',
    '(ตัวอย่าง) สำนักส่งเสริมวิชาการ',
    '(ตัวอย่าง) สำนักบริการวิชาการ',
    '(ตัวอย่าง) หน่วยงานอื่น',
  ],
} as const

// ชิ้นส่วนตัวละครประจำตัวผู้เล่น — ผสมกันได้ 28 × 8 × 6 × 10 = 13,440 ลุค
// หน่วยงาน 250 คนจึงมีลุคของตัวเองได้สบายๆ ไม่ต้องซ้ำกัน
//
// ใช้ emoji ล้วน ไม่ต้องมีไฟล์รูปสักไฟล์ และคนละแพลตฟอร์มก็ยังเห็นเป็นตัวเดียวกัน
// ไม่แปะอะไรทับหน้าสัตว์ (หมวก/แว่นเบี้ยวเพราะ emoji หันคนละทาง) — แต่งที่ "รอบตัว" แทน:
//   ring  = กรอบวงแหวนรอบรูป (CSS ล้วน)
//   badge = เหรียญ emoji มุมขวาล่าง อยู่ในวงกลมของตัวเอง ไม่แตะหน้า
export const AVATAR_PARTS = {
  bases: [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
    '🐧', '🐦', '🐤', '🦆', '🦉', '🐺', '🐗', '🐴',
    '🦄', '🦝', '🐲', '🦥',
  ],
  colors: [
    '#ffd6a5', '#caffbf', '#9bf6ff', '#bdb2ff',
    '#ffc6ff', '#fdffb6', '#ffadad', '#a0c4ff',
  ],
  // '' = ไม่มีกรอบ — ที่เหลือคือชื่อสไตล์ ดูการวาดจริงที่ ringStyle() ใน game/avatar.ts
  rings: ['', 'solid', 'double', 'dashed', 'dotted', 'glow'],
  // '' = ไม่มีเหรียญ — เข้าธีม Green Office
  badges: ['', '🌱', '♻️', '🍃', '💧', '☀️', '⚡', '🌍', '🌳', '🚲'],
} as const

export const AVATAR_COMBOS =
  AVATAR_PARTS.bases.length *
  AVATAR_PARTS.colors.length *
  AVATAR_PARTS.rings.length *
  AVATAR_PARTS.badges.length

// คลังคำถามเกมแยกขยะแข่งสดย้ายไปอยู่ที่ worker/src/questions.ts แล้ว
// เพราะไฟล์นั้นมีคำเฉลย ถ้าเก็บไว้ที่นี่มันจะติดไปกับ bundle ของเว็บ
// แล้วใครก็เปิด DevTools อ่านคำตอบล่วงหน้าได้

// ---------- แคมเปญป่า 3R ----------
// ทุกคนมีต้นไม้ของตัวเองคนละต้น บันทึกกิจกรรม 3R แล้วได้แต้ม แต้มสะสมทำให้ต้นโตขึ้น
// ต้นของทุกคนในสำนักเดียวกันไปยืนรวมเป็นสวน — ดูได้ที่ #/forest
//
// TODO: ข้อมูลจริงจากหน่วยงาน — รายการกิจกรรมกับแต้ม ต้องให้คณะทำงาน Green Office เคาะก่อนใช้จริง
//       ข้อไหนที่หน่วยงานยังไม่มีจุดรองรับ (จุดรับขยะอันตราย จุดทำปุ๋ย จุดเติมน้ำยา) ให้ตัดออก
//       ไม่งั้นคนกดบันทึกได้แต้มทั้งที่ทำจริงไม่ได้
export const FOREST = {
  label: 'ป่า 3R',
  heading: 'ปลูกป่าด้วยการลงมือทำ',
  intro:
    'ลดใช้ ใช้ซ้ำ แยกขยะ — บันทึกทุกครั้งที่ทำ ได้แต้มสะสมเป็นความสูงของต้นไม้ประจำตัว แล้วไปรวมเป็นสวนของสำนัก',
  path: '#/forest',

  // 3 หมวดของ 3R — สีใช้กับป้ายหมวดและปุ่มบันทึก เลี่ยงสีเดียวกับถังขยะ 4 สี ไม่ให้สับสน
  kinds: [
    { id: 'reduce', label: 'ลดใช้', emoji: '✋', color: '#f59e0b', hint: 'ไม่สร้างขยะตั้งแต่แรก' },
    { id: 'reuse', label: 'ใช้ซ้ำ', emoji: '🔁', color: '#0ea5e9', hint: 'ของที่ยังใช้ได้ ใช้ต่อ' },
    { id: 'recycle', label: 'แยกขยะ', emoji: '♻️', color: '#22c55e', hint: 'แยกให้ถูกที่ ให้เข้าระบบรีไซเคิลได้จริง' },
  ] as const,

  // แต้มต่อครั้ง — ข้อที่ทำยากกว่า/ต้องตั้งใจกว่า ให้แต้มสูงกว่า
  // บันทึกได้ข้อละ 1 ครั้งต่อวัน (กันกดรัวข้อเดียว) และมีเพดานรวมต่อวันที่ forest/config.ts
  //
  // verify = จะรู้ได้ยังไงว่าทำจริง
  //   'qr'   ข้อที่ผูกกับจุดจริงในอาคาร ต้องสแกน QR ที่ติดไว้ตรงจุดนั้นถึงได้แต้ม
  //   'self' ข้อที่ยืนยันไม่ได้ เชื่อคนกด — เก็บไว้เพราะเป็นพฤติกรรมที่อยากส่งเสริมจริง
  //
  // ตอนนี้ยังเป็นโหมดจำลอง กดได้ทุกข้อ ป้าย "สแกนที่จุด" เป็นตัวบอกว่าของจริงข้อไหนต้องเดินไป
  activities: [
    { id: 'own-bottle', kind: 'reduce', emoji: '🥤', label: 'พกแก้ว/ขวดน้ำส่วนตัว', points: 10, verify: 'self' },
    { id: 'no-plastic', kind: 'reduce', emoji: '🛍️', label: 'ปฏิเสธถุง/ช้อนส้อมพลาสติก', points: 10, verify: 'self' },
    { id: 'print-less', kind: 'reduce', emoji: '🖨️', label: 'พิมพ์สองหน้า หรือไม่พิมพ์เลย', points: 8, verify: 'self' },
    { id: 'power-off', kind: 'reduce', emoji: '💡', label: 'ปิดไฟ/แอร์ ตอนพักหรือเลิกใช้ห้อง', points: 8, verify: 'self' },
    { id: 'stairs', kind: 'reduce', emoji: '🪜', label: 'ใช้บันไดแทนลิฟต์', points: 6, verify: 'qr' },

    { id: 'paper-reuse', kind: 'reuse', emoji: '📄', label: 'ใช้กระดาษหน้าหลัง', points: 8, verify: 'self' },
    { id: 'bag-reuse', kind: 'reuse', emoji: '👜', label: 'ใช้ถุงผ้า/กล่องอาหารซ้ำ', points: 10, verify: 'self' },
    { id: 'refill', kind: 'reuse', emoji: '🧴', label: 'เติมน้ำยา/หมึก แทนซื้อใหม่', points: 12, verify: 'qr' },
    { id: 'pass-on', kind: 'reuse', emoji: '🤝', label: 'ส่งต่อของที่ยังใช้ได้ให้คนอื่น', points: 12, verify: 'self' },

    { id: 'sort-bin', kind: 'recycle', emoji: '🗑️', label: 'แยกขยะลงถังให้ถูกสี', points: 10, verify: 'qr' },
    { id: 'drop-recycle', kind: 'recycle', emoji: '🥫', label: 'ส่งขวด/กระป๋องที่จุดรับรีไซเคิล', points: 12, verify: 'qr' },
    { id: 'drop-hazard', kind: 'recycle', emoji: '🔋', label: 'ทิ้งถ่าน/หลอดไฟ ที่จุดรับขยะอันตราย', points: 15, verify: 'qr' },
    { id: 'compost', kind: 'recycle', emoji: '🍂', label: 'แยกเศษอาหารไปทำปุ๋ย/อาหารสัตว์', points: 12, verify: 'qr' },
  ] as const,

  /** ข้อความหน้าล็อกอิน — ของจริงเป็น Google Workspace ของหน่วยงาน */
  auth: {
    title: 'เข้าสู่ระบบด้วยอีเมลองค์กร',
    intro: 'เข้าแล้วจะเห็นต้นไม้ของตัวเอง และบันทึกกิจกรรมเก็บแต้มได้',
    button: 'เข้าสู่ระบบด้วย Google',
    /** เห็นเฉพาะตอนยังเป็นโหมดจำลอง */
    mockHint: 'โหมดจำลอง — พิมพ์อีเมลองค์กรแล้วเข้าได้เลย ยังไม่ได้ต่อ Google จริง',
    signedOut: 'ออกจากระบบแล้ว',
  },
}

/**
 * ต้นไม้ขององค์กรใน hero — โตตามแต้มรวมของทุกคนในแคมเปญป่า 3R
 *
 * แยกเป้าหมายออกจาก ORG_IMPACT.carbonGoalKg เพราะคนละหน่วยคนละเรื่อง:
 * carbonGoalKg คือคาร์บอนที่วัดได้จริงจากคณะทำงาน ส่วนอันนี้คือแต้มกิจกรรมที่คนกดสะสม
 */
export const ORG_TREE = {
  /** แต้มรวมทั้งหน่วยงานที่ทำให้ต้นองค์กรโตเต็ม — 250 คน × 600 แต้ม คือเต็มเพดานจริง จึงตั้งเป้าที่ทำได้ */
  goalPoints: 60000,
  label: 'ป่า 3R ของทั้งองค์กร',
  /** ยังไม่มีใครปลูก — สถานะวันเปิดตัว ไม่ควรแสร้งว่ามีข้อมูลแล้ว */
  emptyTitle: 'ยังไม่มีใครปลูกต้นแรก',
  emptyHint: 'เข้าสู่ระบบด้วยอีเมลองค์กรแล้วเริ่มต้นเป็นคนแรก',
}
