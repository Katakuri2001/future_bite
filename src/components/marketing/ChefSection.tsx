"use client"
import { motion } from "framer-motion";
import { OptimizedImage } from "@/components/motion/OptimizedImage";

export default function ChefSection() {
  return (
    <section className="section-padding bg-bg-elevated">
      <div className="container-wide mx-auto">
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.15 },
            },
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center"
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              show: { opacity: 1, scale: 1, transition: { duration: 1 } },
            }}
            className="relative"
          >
            <div className="aspect-[3/4] overflow-hidden bg-surface">
              <OptimizedImage
                src="https://images.unsplash.com/photo-1577219491135-ce398739595b?w=800&q=80"
                alt="Head Chef Kenji Nakamura"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 border border-gold/30" />
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, x: 40 },
              show: { opacity: 1, x: 0, transition: { duration: 0.8 } },
            }}
          >
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
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
