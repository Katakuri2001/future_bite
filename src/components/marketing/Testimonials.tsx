"use client";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";

interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  createdAt: string;
}

export default function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) setReviews(d.data);
      })
      .catch(() => {});
  }, []);

  if (reviews.length === 0) {
    return (
      <section className="section-padding bg-bg-elevated">
        <div className="container-narrow mx-auto text-center">
          <p className="text-label mb-4">Testimonials</p>
          <h2 className="text-display-md text-ivory mb-6">
            What Our Guests Say
          </h2>
          <p className="text-ivory-dim text-sm">
            Be the first to share your experience.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding bg-bg-elevated">
      <div className="container-narrow mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 md:mb-20"
        >
          <p className="text-label mb-4">Testimonials</p>
          <h2 className="text-display-md text-ivory mb-6">
            What Our Guests Say
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(reviews[0].rating)].map((_, i) => (
              <Star key={i} size={16} className="text-gold fill-gold" />
            ))}
          </div>
          <blockquote className="text-display text-xl md:text-2xl text-ivory mb-8 max-w-2xl mx-auto leading-relaxed">
            &ldquo;{reviews[0].text}&rdquo;
          </blockquote>
          <p className="text-xs tracking-[0.15em] uppercase text-gold">
            {reviews[0].name}
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer(0.1, 0.15)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto"
        >
          {reviews.slice(1).map((t) => (
            <motion.div
              key={t.id}
              variants={staggerItem()}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
              className="bg-surface border border-border/50 p-6"
            >
              <div className="flex gap-1 mb-3">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} size={12} className="text-gold fill-gold" />
                ))}
              </div>
              <p className="text-ivory-dim text-sm leading-relaxed mb-4">
                &ldquo;{t.text}&rdquo;
              </p>
              <p className="text-xs tracking-[0.15em] uppercase text-gold">
                {t.name}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}