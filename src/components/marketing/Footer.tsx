import Link from "next/link";
import { Instagram, Facebook, Twitter } from "lucide-react";

const footerLinks = {
  dining: [
    { label: "Menu", href: "/menu" },
    { label: "Reservations", href: "/reserve" },
    { label: "Private Dining", href: "/experience#private" },
    { label: "Gift Cards", href: "/gift-cards" },
  ],
  experience: [
    { label: "Our Story", href: "/about" },
    { label: "The Kitchen", href: "/about#chef" },
    { label: "Gallery", href: "/about#gallery" },
    { label: "Events", href: "/events" },
  ],
  info: [
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
    { label: "Privacy Policy", href: "/privacy" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-bg border-t border-border/50">
      <div className="container-wide mx-auto px-6 lg:px-10 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <span className="text-display text-2xl tracking-wide text-ivory">
                FutureBite
              </span>
            </Link>
            <p className="text-ivory-muted text-sm leading-relaxed max-w-sm mb-6">
              An extraordinary dining experience where precision, atmosphere,
              and cuisine converge to create unforgettable memories.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-ivory-dim hover:text-gold transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={18} strokeWidth={1.5} />
              </a>
              <a
                href="#"
                className="text-ivory-dim hover:text-gold transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={18} strokeWidth={1.5} />
              </a>
              <a
                href="#"
                className="text-ivory-dim hover:text-gold transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={18} strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs tracking-[0.15em] uppercase text-ivory-dim mb-4">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-ivory-muted text-sm hover:text-gold transition-colors duration-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="divider mb-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-ivory-dim text-xs">
            © {new Date().getFullYear()} FutureBite. All rights reserved.
          </p>
          <p className="text-ivory-dim text-xs">
            Yangon, Myanmar
          </p>
        </div>
      </div>
    </footer>
  );
}
