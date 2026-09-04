"use client";

import Image from "next/image";
import type { ImageProps } from "next/image";

interface OptimizedImageProps extends ImageProps {
  alt: string;
  src: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes = "100vw",
  ...props
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width || 800}
      height={height || 600}
      className={className}
      priority={priority}
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      {...props}
    />
  );
}
