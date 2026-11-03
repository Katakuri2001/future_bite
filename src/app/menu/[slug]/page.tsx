import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Clock, Leaf, Wheat, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import Navigation from "@/components/marketing/Navigation";
import Footer from "@/components/marketing/Footer";
import MotionProvider from "@/components/motion/MotionProvider";
import { FadeIn } from "@/components/motion";
import { getDishBySlug, listDishes } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getDishBySlug(slug);

  if (!item) return { title: "Not Found" };

  return {
    title: item.name,
    description: item.description,
    openGraph: { images: [{ url: item.imageUrl }] },
  };
}

export default async function MenuItemPage({ params }: PageProps) {
  const { slug } = await params;
  const item = await getDishBySlug(slug);

  if (!item) {
    notFound();
  }

  const all = await listDishes();
  const related = all
    .filter((i: any) => i.categorySlug === item.categorySlug && i.id !== item.id)
    .slice(0, 3);

  const category = item.category;

  return (
    <MotionProvider>
      <Navigation />
      <main className="min-h-screen pt-28 pb-16">
        <div className="container-wide mx-auto">
          <FadeIn>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 text-ivory-dim hover:text-gold transition-colors text-sm mb-8"
            >
              <ArrowRight size={14} className="rotate-180" />
              Back to Menu
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>

              <div>
                <p className="text-label mb-2">{item.category}</p>
                <h1 className="text-display-lg text-ivory mb-4">
                  {item.name}
                </h1>
                <p className="text-body-lg mb-6">{item.description}</p>

                <div className="flex items-center gap-4 mb-6">
                  <span className="text-display-md text-gold">
                    {formatPrice(item.price)}
                  </span>
                  {item.preparationTime && (
                    <span className="flex items-center gap-1 text-ivory-dim text-sm">
                      <Clock size={14} />
                      {item.preparationTime} min
                    </span>
                  )}
                </div>

                {/* Dietary */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {item.dietary.map((d: string) => (
                    <span
                      key={d}
                      className="text-xs px-3 py-1 bg-surface-elevated border border-border-light text-ivory-dim"
                    >
                      {d}
                    </span>
                  ))}
                  {item.dietary.length === 0 && item.ingredients?.length > 0 && (
                    <span className="text-xs px-3 py-1 bg-surface-elevated border border-border-light text-ivory-dim">
                      Standard
                    </span>
                  )}
                </div>

                {/* Allergens — surfaced from the database, not mock data */}
                {item.allergens && item.allergens.length > 0 && (
                  <div className="mb-6 p-3 bg-warning/10 border border-warning/30 text-warning text-sm flex items-start gap-2">
                    <CircleAlert size={14} className="mt-0.5 shrink-0" />
                    <span>
                      Contains: {item.allergens.join(", ")}. Please inform our
                      team of any allergies before ordering.
                    </span>
                  </div>
                )}

                <div className="flex gap-3">
                  <Link
                    href="/order"
                    className={cn(
                      "btn-primary inline-flex items-center",
                      !item.isAvailable && "opacity-50 pointer-events-none"
                    )}
                  >
                    {item.isAvailable ? "Add to Order" : "Currently Unavailable"}
                  </Link>
                </div>
              </div>
            </div>

            {/* Related */}
            {related.length > 0 && (
              <section className="mt-16">
                <h2 className="text-display-md text-ivory mb-6">
                  You might also enjoy
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {related.map((r: any) => (
                    <Link
                      key={r.id}
                      href={`/menu/${r.slug}`}
                      className="group"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden mb-3">
                        <Image
                          src={r.imageUrl}
                          alt={r.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                      <h3 className="text-ivory font-medium group-hover:text-gold transition-colors">
                        {r.name}
                      </h3>
                      <p className="text-gold text-sm">{formatPrice(r.price)}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </FadeIn>
        </div>
      </main>
      <Footer />
    </MotionProvider>
  );
}