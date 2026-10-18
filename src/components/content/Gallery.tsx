import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { imageSrcSet, imageUrl } from "@/lib/content/image";
import type { ContentImage } from "@/lib/content/types";
import { duration } from "@/lib/motion";
import { cn } from "@/lib/utils";

type GalleryProps = { images: ContentImage[]; accent: string };

function Gallery({ images, accent }: GalleryProps) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0];
  if (!current) return <div className="aspect-[4/3] bg-paper" />;

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden bg-paper">
        <AnimatePresence initial={false}>
          <motion.img
            key={current.src}
            src={imageUrl(current, 1400)}
            srcSet={imageSrcSet(current, [700, 1000, 1400, 2000])}
            sizes="(min-width: 1024px) 55vw, 100vw"
            alt={current.alt}
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.quick }}
          />
        </AnimatePresence>
        {/* A strip of the category colour ties the photo to its category. */}
        <span aria-hidden className={cn("absolute inset-x-0 bottom-0 h-1.5", accent)} />
      </div>

      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5" aria-label="Product images">
          {images.map((image, i) => (
            <li key={image.src}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1} of ${images.length}: ${image.alt}`}
                aria-pressed={i === index}
                className={cn(
                  "block aspect-square w-full overflow-hidden bg-paper transition-opacity duration-150",
                  i === index ? "outline-2 outline-offset-2 outline-ink" : "opacity-60 hover:opacity-100",
                )}
              >
                <img
                  src={imageUrl(image, 240)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Gallery;
