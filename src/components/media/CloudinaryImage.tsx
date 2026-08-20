"use client";

import Image, { type ImageProps } from "next/image";
import {
  cloudinaryImageLoader,
  mediaUrl,
  type MediaKey,
  type MediaUrlOptions,
} from "@/lib/media";

type Props = Omit<ImageProps, "src" | "loader"> & {
  media: MediaKey;
  /** Max delivery width hint for Cloudinary (defaults from sizes when possible). */
  deliveryWidth?: number;
  mediaOptions?: MediaUrlOptions;
};

/**
 * next/image wrapper that serves static brand assets from Cloudinary
 * with f_auto,q_auto,dpr_auto. Falls back to /public when cloud name is unset.
 */
export function CloudinaryImage({
  media,
  deliveryWidth = 1600,
  mediaOptions,
  alt,
  ...rest
}: Props) {
  const src = mediaUrl(media, {
    width: mediaOptions?.width ?? deliveryWidth,
    height: mediaOptions?.height,
    quality: mediaOptions?.quality ?? "auto",
    crop: mediaOptions?.crop,
  });

  const isRemote = src.startsWith("https://res.cloudinary.com");

  return (
    <Image
      {...rest}
      alt={alt}
      src={src}
      loader={isRemote ? cloudinaryImageLoader : undefined}
      // Cloudinary already compresses + format-negotiates; skip Next double-encode.
      unoptimized={isRemote}
    />
  );
}
