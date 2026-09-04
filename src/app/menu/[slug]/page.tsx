import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Clock, Leaf, Wheat, CircleAlert } from "lucide-react";
import Navigation from "@/components/marketing/Navigation";
import Footer from "@/components/marketing/Footer";
import MotionProvider from "@/components/motion/MotionProvider";
import { FadeIn } from "@/components/motion";
import { menuItems, menuCategories } from "@/lib/data";
import { formatPrice } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return menuItems.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = menuItems.find((i) => i.slug === slug);

  if (!item) return { title: "Not Found" };

  return {
    title: item.name,
    description: item.description,
    openGraph: { images: [{ url: item.imageUrl }] },
  };
}

export default async function MenuItemPage({ params }: PageProps) {
  const { slug } = await params;
  const item = menuItems.find((i) => i.slug === slug);

  if (!item) {
    notFound();
  }

  const related = menuItems
    .filter((i) => i.categorySlug === item.categorySlug && i.id !== item.id)
    .slice(0, 3);

  const category = menuCategories.find(
    (c) => c.slug === item.categorySlug
  );

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
              <ArrowRight className="rotate-180" size={16} />
              Back to Menu
            </Link>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <FadeIn>
              <div className="relative aspect-[4/3] overflow-hidden bg-bg-elevated">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            </FadeIn>

            <div>
              <FadeIn>
                <p className="text-label mb-3">{category?.name || item.category}</p>
                <h1 className="text-display-md text-ivory mb-4">{item.name}</h1>
                <p className="text-gold text-2xl font-display mb-6">
                  {formatPrice(item.price)}
                </p>
                <p className="text-ivory-muted leading-relaxed mb-8">
                  {item.description}
                </p>
              </FadeIn>

              <FadeIn delay={0.1}>
                <div className="flex flex-wrap gap-3 mb-8">
                  <span className="inline-flex items-center gap-1.5 text-xs text-ivory-dim bg-surface border border-border/50 px-3 py-1.5">
                    <Clock size={12} /> {item.preparationTime} min prep
                  </span>
                  {item.dietary.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1.5 text-xs text-success bg-success/10 border border-success/30 px-3 py-1.5"
                    >
                      <Leaf size={12} /> {d}
                    </span>
                  ))}
                  {item.allergens.map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1.5 text-xs text-warning bg-warning/10 border border-warning/30 px-3 py-1.5"
                    >
                      <CircleAlert size={12} /> {a}
                    </span>
                  ))}
                </div>
              </FadeIn>

              <FadeIn delay={0.2}>
                <div className="bg-surface border border-border/50 p-6 mb-8">
                  <h2 className="text-display text-sm text-ivory uppercase tracking-[0.2em] mb-4">
                    Ingredients
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {item.ingredients.map((ing) => (
                      <span
                        key={ing}
                        className="text-sm text-ivory-dim bg-bg px-3 py-1.5 border border-border/30"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                  {item.allergens.length > 0 && (
                    <p className="text-xs text-ivory-dim mt-4">
                      <Wheat size={12} className="inline mr-1" />
                      Contains: {item.allergens.join(", ")}. Please inform our
                      team of any dietary requirements.
                    </p>
                  )}
                </div>
              </FadeIn>

              <FadeIn delay={0.3}>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/reserve"
                    className="btn-primary text-sm text-center"
                  >
                    Reserve a Table <ArrowRight size={16} className="inline" />
                  </Link>
                  <Link
                    href="/menu"
                    className="btn-outline text-sm text-center"
                  >
                    Explore More Dishes
                  </Link>
                </div>
              </FadeIn>
            </div>
          </div>

          {related.length > 0 && (
            <section className="mt-24">
              <FadeIn>
                <h2 className="text-display-md text-ivory mb-8">
                  More from {category?.name}
                </h2>
              </FadeIn>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {related.map((dish, i) => (
                  <FadeIn key={dish.id} delay={i * 0.1}>
                    <Link
                      href={`/menu/${dish.slug}`}
                      className="group block bg-surface border border-border/50 hover:border-border-light transition-all duration-500 overflow-hidden"
                    >
                      <div className="img-zoom aspect-[4/3] overflow-hidden bg-bg relative">
                        <Image
                          src={dish.imageUrl}
                          alt={dish.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-ivory font-display">
                            {dish.name}
                          </h3>
                          <span className="text-gold text-sm">
                            {formatPrice(dish.price)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </FadeIn>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </MotionProvider>
  );
}