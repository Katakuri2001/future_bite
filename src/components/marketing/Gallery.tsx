"use client";

import { useState } from "react";
import { galleryImages } from "@/lib/data";
import { X } from "lucide-react";

export default function Gallery() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section className="section-padding bg-bg">
      <div className="container-wide mx-auto">
        <div className="text-center mb-16 md:mb-20">
          <p className="text-label mb-4">Gallery</p>
          <h2 className="text-display-md text-ivory mb-6">A Glimpse Inside</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {galleryImages.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setSelected(img.url)}
              className={`img-zoom overflow-hidden bg-surface cursor-pointer group ${
                i === 0 || i === 5
                  ? "col-span-2 row-span-2"
                  : ""
              }`}
              aria-label={`View ${img.alt}`}
            >
              <div className="relative w-full h-full min-h-[200px] md:min-h-[250px]">
                <img
                  src={img.url}
                  alt={img.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-bg/0 group-hover:bg-bg/30 transition-all duration-500 flex items-center justify-center">
                  <span className="text-ivory text-xs tracking-[0.15em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    View
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-[100] bg-bg/95 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-label="Image lightbox"
        >
          <button
            className="absolute top-6 right-6 text-ivory hover:text-gold transition-colors"
            onClick={() => setSelected(null)}
            aria-label="Close lightbox"
          >
            <X size={24} />
          </button>
          <img
            src={selected}
            alt="Gallery image"
            className="max-w-full max-h-[85vh] object-contain"
          />
        </div>
      )}
    </section>
  );
}
