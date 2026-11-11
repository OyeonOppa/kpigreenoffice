// ก๊าซเรือนกระจกต่ออาหาร 1 กิโลกรัม (kgCO2e) — สร้างจากไฟล์ CSV ต้นฉบับ อย่าแก้ตัวเลขด้วยมือ
// ที่มา: Poore & Nemecek (2018), Science 360(6392) ผ่าน Our World in Data (ghg-per-kg-poore, CC BY 4.0)
export interface FoodCarbon {
  name: string
  en: string
  kg: number
}

export const FOOD_CARBON: FoodCarbon[] = [
  { name: "เนื้อวัว (วัวเลี้ยงเพื่อเอาเนื้อ)", en: "Beef (beef herd)", kg: 99.48 },
  { name: "ช็อกโกแลตเข้ม", en: "Dark Chocolate", kg: 46.65 },
  { name: "เนื้อแกะ", en: "Lamb & Mutton", kg: 39.72 },
  { name: "เนื้อวัว (จากฝูงวัวนม)", en: "Beef (dairy herd)", kg: 33.3 },
  { name: "กาแฟ", en: "Coffee", kg: 28.53 },
  { name: "กุ้งเลี้ยง", en: "Prawns (farmed)", kg: 26.87 },
  { name: "ชีส", en: "Cheese", kg: 23.88 },
  { name: "ปลาเลี้ยง", en: "Fish (farmed)", kg: 13.63 },
  { name: "เนื้อหมู", en: "Pig Meat", kg: 12.31 },
  { name: "เนื้อไก่และสัตว์ปีก", en: "Poultry Meat", kg: 9.87 },
  { name: "ไข่", en: "Eggs", kg: 4.67 },
  { name: "ข้าว", en: "Rice", kg: 4.45 },
  { name: "ถั่วลิสง", en: "Groundnuts", kg: 3.23 },
  { name: "น้ำตาลอ้อย", en: "Cane Sugar", kg: 3.2 },
  { name: "เต้าหู้", en: "Tofu", kg: 3.16 },
  { name: "นมวัว", en: "Milk", kg: 3.15 },
  { name: "ข้าวโอ๊ต", en: "Oatmeal", kg: 2.48 },
  { name: "มะเขือเทศ", en: "Tomatoes", kg: 2.09 },
  { name: "น้ำตาลหัวบีต", en: "Beet Sugar", kg: 1.81 },
  { name: "ถั่วเมล็ดแห้งอื่น ๆ", en: "Other Pulses", kg: 1.79 },
  { name: "ไวน์", en: "Wine", kg: 1.79 },
  { name: "ข้าวโพด", en: "Maize", kg: 1.7 },
  { name: "ข้าวสาลีและข้าวไรย์", en: "Wheat & Rye", kg: 1.57 },
  { name: "เบอร์รีและองุ่น", en: "Berries & Grapes", kg: 1.53 },
  { name: "มันสำปะหลัง", en: "Cassava", kg: 1.32 },
  { name: "ข้าวบาร์เลย์", en: "Barley", kg: 1.18 },
  { name: "ผลไม้อื่น ๆ", en: "Other Fruit", kg: 1.05 },
  { name: "ถั่วลันเตา", en: "Peas", kg: 0.98 },
  { name: "นมถั่วเหลือง", en: "Soy milk", kg: 0.98 },
  { name: "กล้วย", en: "Bananas", kg: 0.86 },
  { name: "ผักอื่น ๆ", en: "Other Vegetables", kg: 0.53 },
  { name: "ผักตระกูลกะหล่ำ", en: "Brassicas", kg: 0.51 },
  { name: "หอมใหญ่และต้นกระเทียม", en: "Onions & Leeks", kg: 0.5 },
  { name: "มันฝรั่ง", en: "Potatoes", kg: 0.46 },
  { name: "แอปเปิล", en: "Apples", kg: 0.43 },
  { name: "ถั่วเปลือกแข็ง", en: "Nuts", kg: 0.43 },
  { name: "ผักประเภทหัว", en: "Root Vegetables", kg: 0.43 },
  { name: "ส้มและผลไม้ตระกูลส้ม", en: "Citrus Fruit", kg: 0.39 },
]
