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

export const NAV_LINKS = [
  { label: 'นโยบาย', href: '#about' },
  { label: 'Climate Change', href: '#climate' },
  { label: 'จัดการขยะ', href: '#waste' },
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
      emoji: '🗑️',
      title: 'เกมแยกขยะ ทิ้งให้ถูกถัง',
      description: 'ทดสอบว่าคุณแยกขยะถูกถังแค่ไหนใน 8 ข้อ',
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
