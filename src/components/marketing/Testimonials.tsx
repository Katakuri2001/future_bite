import { Star } from "lucide-react";
import { testimonials } from "@/lib/data";

export default function Testimonials() {
  return (
    <section className="section-padding bg-bg-elevated">
      <div className="container-narrow mx-auto">
        <div className="text-center mb-16 md:mb-20">
          <p className="text-label mb-4">Testimonials</p>
          <h2 className="text-display-md text-ivory mb-6">
            What Our Guests Say
          </h2>
        </div>

        {/* Featured testimonial */}
        <div className="text-center mb-16">
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                className="text-gold fill-gold"
              />
            ))}
          </div>
          <blockquote className="text-display text-xl md:text-2xl text-ivory mb-8 max-w-2xl mx-auto leading-relaxed">
            &ldquo;{testimonials[0].text}&rdquo;
          </blockquote>
          <p className="text-xs tracking-[0.15em] uppercase text-gold">
            {testimonials[0].name}
          </p>
        </div>

        {/* Additional testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {testimonials.slice(1).map((t) => (
            <div
              key={t.id}
              className="p-6 border border-border/50"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className="text-gold fill-gold"
                  />
                ))}
              </div>
              <p className="text-ivory-muted text-sm leading-relaxed mb-4">
                &ldquo;{t.text}&rdquo;
              </p>
              <p className="text-xs tracking-[0.15em] uppercase text-ivory-dim">
                {t.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
