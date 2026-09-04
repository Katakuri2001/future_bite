import { MapPin, Phone, Mail, Clock, ArrowUpRight } from "lucide-react";
import { restaurant } from "@/lib/data";

export default function Location() {
  return (
    <section className="section-padding bg-bg">
      <div className="container-narrow mx-auto">
        <div className="text-center mb-16 md:mb-20">
          <p className="text-label mb-4">Find Us</p>
          <h2 className="text-display-md text-ivory mb-6">Visit FutureBite</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Map placeholder */}
          <div className="aspect-[4/3] bg-surface border border-border/50 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(201,169,110,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,110,0.3) 1px, transparent 1px)",
                  backgroundSize: "50px 50px",
                }}
              />
            </div>
            <div className="text-center z-10">
              <MapPin size={32} className="text-gold mx-auto mb-4" strokeWidth={1} />
              <p className="text-ivory-muted text-sm">Interactive map coming soon</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-8">
            <div>
              <h3 className="text-display text-2xl text-ivory mb-1">
                {restaurant.name}
              </h3>
              <p className="text-ivory-muted">{restaurant.city}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <MapPin size={16} className="text-gold mt-1 flex-shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-ivory text-sm">{restaurant.address}</p>
                  <p className="text-ivory-muted text-sm">{restaurant.city}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Clock size={16} className="text-gold mt-1 flex-shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-ivory text-sm font-medium mb-1">OPEN</p>
                  {restaurant.openingHours.slice(0, 5).map((h) => (
                    <p key={h.day} className="text-ivory-muted text-sm">
                      {h.day} — {h.open} – {h.close}
                    </p>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone size={16} className="text-gold mt-1 flex-shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-ivory text-sm">{restaurant.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Mail size={16} className="text-gold mt-1 flex-shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-ivory text-sm">{restaurant.email}</p>
                </div>
              </div>
            </div>

            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(
                restaurant.address + ", " + restaurant.city
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline group inline-flex"
            >
              Get Directions
              <ArrowUpRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
