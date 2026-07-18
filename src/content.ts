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
export const IMAGE_URLS = {
  hero: '/images/hero.jpg',
  featured: '/images/featured.jpg',
  philosophy: '/images/philosophy.jpg',
  serviceEnergy: '/images/service-energy.jpg',
  serviceWaste: '/images/service-waste.jpg',
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
  manifestoLabel: 'อ่านประกาศนโยบาย',
  contactLabel: 'ติดต่อเรา',
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

export const WASTE = {
  label: 'Waste Management',
  heading: 'การจัดการขยะ',
  intro: 'แยกขยะถูกถัง ลดปริมาณขยะที่ต้องนำไปกำจัด และเพิ่มโอกาสนำกลับมาใช้ใหม่',
  bins: [
    {
      id: 'organic',
      color: '#22c55e',
      name: 'ถังสีเขียว',
      type: 'ขยะอินทรีย์',
      examples: 'เศษอาหาร เปลือกผลไม้ ใบไม้',
    },
    {
      id: 'recycle',
      color: '#eab308',
      name: 'ถังสีเหลือง',
      type: 'ขยะรีไซเคิล',
      examples: 'ขวดพลาสติก กระดาษ กระป๋อง แก้ว',
    },
    {
      id: 'general',
      color: '#3b82f6',
      name: 'ถังสีน้ำเงิน',
      type: 'ขยะทั่วไป',
      examples: 'ซองขนม โฟม ทิชชูใช้แล้ว',
    },
    {
      id: 'hazard',
      color: '#ef4444',
      name: 'ถังสีแดง',
      type: 'ขยะอันตราย',
      examples: 'ถ่านไฟฉาย หลอดไฟ กระป๋องสเปรย์',
    },
  ] as const,
}

// ไอเทมในเกมแยกขยะ — bin ต้องตรงกับ id ของ WASTE.bins
export const WASTE_GAME_ITEMS = [
  { emoji: '🍌', name: 'เปลือกกล้วย', bin: 'organic' },
  { emoji: '🍚', name: 'เศษอาหาร', bin: 'organic' },
  { emoji: '🍃', name: 'ใบไม้แห้ง', bin: 'organic' },
  { emoji: '🥤', name: 'ขวดพลาสติก', bin: 'recycle' },
  { emoji: '📰', name: 'กระดาษหนังสือพิมพ์', bin: 'recycle' },
  { emoji: '🥫', name: 'กระป๋องอะลูมิเนียม', bin: 'recycle' },
  { emoji: '🍾', name: 'ขวดแก้ว', bin: 'recycle' },
  { emoji: '🍬', name: 'ซองขนม', bin: 'general' },
  { emoji: '🧻', name: 'ทิชชูใช้แล้ว', bin: 'general' },
  { emoji: '🍱', name: 'กล่องโฟม', bin: 'general' },
  { emoji: '🔋', name: 'ถ่านไฟฉาย', bin: 'hazard' },
  { emoji: '💡', name: 'หลอดไฟเสีย', bin: 'hazard' },
  { emoji: '🧴', name: 'กระป๋องสเปรย์', bin: 'hazard' },
  { emoji: '📱', name: 'มือถือเก่า', bin: 'hazard' },
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
