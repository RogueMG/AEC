import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { imageSrcSet, imageUrl } from "@/lib/content/image";
import type { ContentImage } from "@/lib/content/types";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

type SlantedPhotoProps = {
  image: ContentImage;
  /** Which side carries the slanted edge. */
  edge: "left" | "right";
  /** Horizontal width of the slant in px; use cutFor(height) from @/lib/cut. */
  cut: number;
  /** Narrower cut while `lifted` is true (hover / focus). */
  liftedCut?: number;
  lifted?: boolean;
  /** Extra delay before the reveal, in seconds. */
  delay?: number;
  /** Seconds added per grid column, so a row of photos reveals left to right. */
  columnStagger?: number;
  /** Reveal on first scroll into view, or straight away on mount. */
  revealOn?: "view" | "mount";
  widths?: number[];
  sizes?: string;
  className?: string;
  loading?: "lazy" | "eager";
};

// A full-bleed photo with one edge on the site's cut angle. The tile colour wipes off it
// along that diagonal when it is revealed; while lifted, the edge slides out and the photo eases in.
function SlantedPhoto({
  image,
  edge,
  cut,
  liftedCut = cut,
  lifted = false,
  delay = 0,
  columnStagger = 0,
  revealOn = "view",
  widths = [480, 800, 1200],
  sizes = "100vw",
  className,
  loading = "lazy",
}: SlantedPhotoProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const revealed = revealOn === "mount" || inView;

  // progress: 0 = hidden behind the surface colour, 1 = fully revealed.
  const progress = useMotionValue(reduced ? 1 : 0);
  const slant = useMotionValue(cut);
  const reach = useTransform(progress, (p) => `${(p * 100).toFixed(2)}%`);
  const from = useTransform(progress, (p) => `${(100 - p * 100).toFixed(2)}%`);
  // Right edge: wipes in left to right. Left edge: wipes in right to left. Both lean like the bands.
  const rightEdge = useMotionTemplate`polygon(0 0, ${reach} 0, calc(${reach} - ${slant}px) 100%, 0 100%)`;
  const leftEdge = useMotionTemplate`polygon(calc(${from} + ${slant}px) 0, 100% 0, 100% 100%, ${from} 100%)`;
  const clipPath = edge === "right" ? rightEdge : leftEdge;

  useEffect(() => {
    const el = ref.current;
    if (!revealed || reduced || !el) return;
    const rect = el.getBoundingClientRect();
    const column = rect.width > 0 ? Math.round(rect.left / rect.width) : 0;
    const controls = animate(progress, 1, {
      duration: 1.1,
      ease: ease.inOut,
      delay: delay + column * columnStagger,
    });
    return () => controls.stop();
  }, [revealed, reduced, delay, columnStagger, progress]);

  useEffect(() => {
    const controls = animate(slant, lifted ? liftedCut : cut, {
      duration: duration.base,
      ease: ease.out,
    });
    return () => controls.stop();
  }, [lifted, cut, liftedCut, slant]);

  // The wrapper is what gets observed: browsers count an element's own clip-path when measuring
  // visibility, so a fully clipped photo would never register as in view.
  return (
    <div ref={ref} className={cn("relative", className)}>
      <motion.div className="absolute inset-0 overflow-hidden" style={{ clipPath }}>
        <motion.img
          src={imageUrl(image, widths[widths.length - 1])}
          srcSet={imageSrcSet(image, widths)}
          sizes={sizes}
          alt={image.alt}
          loading={loading}
          className="absolute inset-0 h-full w-full object-cover"
          animate={{ scale: lifted ? 1.05 : 1 }}
          transition={{ duration: duration.slow, ease: ease.out }}
        />
      </motion.div>
    </div>
  );
}

export default SlantedPhoto;
