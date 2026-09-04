import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { menuItems } from "@/lib/data";
import { formatPrice } from "@/lib/utils";

export default function SignatureMenu() {
  const featured = menuItems.filter((item) => item.isFeatured).slice(0, 4);

  return (
    <section className="section-padding bg-bg-elevated">
      <div className="container-wide mx-auto">
        <div className="text-center mb-16 md:mb-20">
          <p className="text-label mb-4">The Menu</p>
          <h2 className="text-display-md text-ivory mb-6">
            Ingredients Without Compromise
          </h2>
          <p className="text-body-lg max-w-xl mx-auto">
            Each dish is a meditation on flavor, crafted from the finest ingredients sourced with intention.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 mb-16">
          {featured.map((dish) => (
            <Link
              key={dish.id}
              href={`/menu/${dish.slug}`}
              className="group flex flex-col sm:flex-row gap-6 p-6 bg-surface hover:bg-surface-elevated border border-border/50 hover:border-border-light transition-all duration-500"
            >
              <div className="img-zoom w-full sm:w-40 h-40 flex-shrink-0 overflow-hidden bg-bg">
                <img
                  src={dish.imageUrl}
                  alt={dish.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-display text-lg text-ivory group-hover:text-gold transition-colors duration-300">
                    {dish.name}
                  </h3>
                  <span className="text-gold font-medium text-sm whitespace-nowrap">
                    {formatPrice(dish.price)}
                  </span>
                </div>
                <p className="text-ivory-muted text-sm leading-relaxed mb-3 line-clamp-2">
                  {dish.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {dish.dietary.map((d) => (
                    <span
                      key={d}
                      className="text-[10px] tracking-[0.1em] uppercase text-accent-light border border-accent px-2 py-0.5"
                    >
                      {d}
                    </span>
                  ))}
                  {dish.allergens.length > 0 && (
                    <span className="text-[10px] tracking-[0.1em] uppercase text-ivory-dim">
                      Contains {dish.allergens.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link href="/menu" className="btn-outline group">
            Explore Full Menu
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
