export default function ChefSection() {
  return (
    <section className="section-padding bg-bg-elevated">
      <div className="container-wide mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image */}
          <div className="relative">
            <div className="aspect-[3/4] overflow-hidden bg-surface">
              <img
                src="https://images.unsplash.com/photo-1577219491135-ce398739595b?w=800&q=80"
                alt="Head Chef Kenji Nakamura"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 border border-gold/30" />
          </div>

          {/* Content */}
          <div>
            <p className="text-label mb-6">The Kitchen</p>
            <blockquote className="text-display text-2xl md:text-3xl text-ivory mb-8 leading-snug">
              &ldquo;We don&apos;t cook for the moment. We cook for the memory.&rdquo;
            </blockquote>

            <div className="mb-8">
              <h3 className="text-display text-xl text-ivory mb-1">
                Chef Kenji Nakamura
              </h3>
              <p className="text-xs tracking-[0.15em] uppercase text-gold">
                Executive Chef
              </p>
            </div>

            <div className="space-y-4 text-ivory-muted text-sm leading-relaxed">
              <p>
                With over two decades of culinary mastery spanning Tokyo, Paris, and
                Singapore, Chef Nakamura brings a philosophy rooted in precision,
                seasonality, and reverence for ingredients.
              </p>
              <p>
                His approach blends traditional Japanese techniques with modern
                European sensibility, creating dishes that honor the essence of each
                ingredient while pushing the boundaries of what dining can be.
              </p>
              <p>
                At FutureBite, every plate is a canvas, every flavor a deliberate
                brushstroke in a larger narrative of taste and memory.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
