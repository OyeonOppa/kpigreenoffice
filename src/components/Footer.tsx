import { Mail, MapPin, Phone } from 'lucide-react'
import { FOOTER, NAV_LINKS, SITE_NAME } from '../content'

export default function Footer() {
  return (
    <footer id="contact" className="bg-canvas border-t border-line px-6 pt-16 pb-8 scroll-mt-24">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/images/low carbon logo.webp"
                alt=""
                className="h-7 w-7 shrink-0 object-contain"
              />
              <img src="/images/low carbon text.webp" alt={SITE_NAME} className="h-5 w-auto" />
            </div>
            <p className="text-ink/65 text-sm leading-relaxed max-w-xs">{FOOTER.about}</p>
          </div>

          <div>
            <p className="text-ink font-medium text-sm mb-4">เมนู</p>
            <ul className="flex flex-col gap-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-ink/65 hover:text-ink text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-ink font-medium text-sm mb-4">ติดต่อเรา</p>
            <ul className="flex flex-col gap-2.5 text-ink/65 text-sm">
              <li className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0" /> {FOOTER.contact.address}
              </li>
              <li className="flex items-center gap-2">
                <Phone size={15} className="shrink-0" /> {FOOTER.contact.phone}
              </li>
              <li className="flex items-center gap-2">
                <Mail size={15} className="shrink-0" /> {FOOTER.contact.email}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-line pt-6">
          <p className="text-ink/65 text-xs text-center">{FOOTER.copyright}</p>
        </div>
      </div>
    </footer>
  )
}
