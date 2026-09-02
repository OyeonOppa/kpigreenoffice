import Navbar from '../components/Navbar'
import HeroSection from '../components/HeroSection'
import QuickActionsSection from '../components/QuickActionsSection'
import AboutSection from '../components/AboutSection'
import FeaturedVideoSection from '../components/FeaturedVideoSection'
import ClimateSection from '../components/ClimateSection'
import ThreeRSection from '../components/ThreeRSection'
import WasteSection from '../components/WasteSection'
import GamesPromoSection from '../components/GamesPromoSection'
import PhilosophySection from '../components/PhilosophySection'
import ServicesSection from '../components/ServicesSection'
import MediaSection from '../components/MediaSection'
import PartnersSection from '../components/PartnersSection'
import DashboardSection from '../components/DashboardSection'
import Footer from '../components/Footer'
import BackToTop from '../components/BackToTop'

// ลำดับ section ตรงกับลำดับเมนูใน NAV_LINKS:
//   นโยบาย (#about → #goals → #actions) · Knowledge (#climate → #three-r → #waste → #media)
//   Game (#games) · ความร่วมมือ (#partners) · ผลลัพธ์ (#dashboard)
export default function HomePage() {
  return (
    <main className="bg-canvas min-h-screen">
      <Navbar />
      <HeroSection />
      <QuickActionsSection />
      <AboutSection />
      <FeaturedVideoSection />
      <ClimateSection />
      <ThreeRSection />
      <WasteSection />
      <GamesPromoSection />
      <PhilosophySection />
      <ServicesSection />
      <MediaSection />
      <PartnersSection />
      <DashboardSection />
      <Footer />
      <BackToTop />
    </main>
  )
}
