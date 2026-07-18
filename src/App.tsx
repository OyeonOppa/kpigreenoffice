import HeroSection from './components/HeroSection'
import QuickActionsSection from './components/QuickActionsSection'
import AboutSection from './components/AboutSection'
import FeaturedVideoSection from './components/FeaturedVideoSection'
import ClimateSection from './components/ClimateSection'
import WasteSection from './components/WasteSection'
import GamesPromoSection from './components/GamesPromoSection'
import PhilosophySection from './components/PhilosophySection'
import ServicesSection from './components/ServicesSection'
import NewsSection from './components/NewsSection'
import PartnersSection from './components/PartnersSection'
import DashboardSection from './components/DashboardSection'
import Footer from './components/Footer'

export default function App() {
  return (
    <main className="bg-canvas min-h-screen">
      <HeroSection />
      <QuickActionsSection />
      <AboutSection />
      <FeaturedVideoSection />
      <ClimateSection />
      <WasteSection />
      <GamesPromoSection />
      <PhilosophySection />
      <ServicesSection />
      <NewsSection />
      <PartnersSection />
      <DashboardSection />
      <Footer />
    </main>
  )
}
