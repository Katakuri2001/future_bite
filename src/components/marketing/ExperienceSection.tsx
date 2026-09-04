"use client"
import { motion } from "framer-motion";
import { Utensils, Flame, Wine } from "lucide-react";
import { OptimizedImage } from "@/components/motion/OptimizedImage";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";

const experiences = [
  {
    icon: Utensils,
    title: "The Room",
    description:
      "Atmosphere designed around light, sound and space. Every corner tells a story through architecture and ambient design.",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
  },
  {
    icon: Flame,
    title: "The Kitchen",
    description:
      "Precision-driven cuisine prepared in real time. Watch our chefs transform ingredients into edible art before your eyes.",
    image:
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80",
  },
  {
    icon: Wine,
    title: "The Table",
    description:
      "An intimate dining experience tailored to your evening. From wine pairings to personalized tasting menus.",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
  },
];

export default function ExperienceSection() {
  return (
    <section className="section-padding bg-bg">
      <div className="container-wide mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 md:mb-20"
        >
          <p className="text-label mb-4">The Experience</p>
          <h2 className="text-display-md text-ivory mb-6">
            More Than a Meal
          </h2>
          <p className="text-body-lg max-w-xl mx-auto">
            Every detail is designed to be remembered.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer(0.12, 0.15)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6"
        >
          {experiences.map((exp) => {
            const Icon = exp.icon;
            return (
              <motion.article
                key={exp.title}
                variants={staggerItem()}
                whileHover={{ scale: 1.03, y: -6 }}
                transition={{ duration: 0.4 }}
                className="group cursor-pointer"
              >
                <div className="img-zoom mb-6 aspect-[4/5] overflow-hidden bg-surface">
                  <OptimizedImage
                    src={exp.image}
                    alt={exp.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <Icon
                    size={18}
                    className="text-gold"
                    strokeWidth={1.5}
                  />
                  <h3 className="text-display text-xl text-ivory group-hover:text-gold transition-colors duration-300">
                    {exp.title}
                  </h3>
                </div>
                <p className="text-ivory-muted text-sm leading-relaxed">
                  {exp.description}
                </p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
