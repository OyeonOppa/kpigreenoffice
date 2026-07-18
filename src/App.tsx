import HeroSection from './components/HeroSection'
import AboutSection from './components/AboutSection'
import FeaturedVideoSection from './components/FeaturedVideoSection'
import ClimateSection from './components/ClimateSection'
import WasteSection from './components/WasteSection'
import PhilosophySection from './components/PhilosophySection'
import ServicesSection from './components/ServicesSection'
import MediaSection from './components/MediaSection'
import PartnersSection from './components/PartnersSection'
import DashboardSection from './components/DashboardSection'

export default function App() {
  return (
    <main className="bg-black min-h-screen">
      <HeroSection />
      <AboutSection />
      <FeaturedVideoSection />
      <ClimateSection />
      <WasteSection />
      <PhilosophySection />
      <ServicesSection />
      <MediaSection />
      <PartnersSection />
      <DashboardSection />
    </main>
  )
}
