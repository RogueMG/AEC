import { motion, useReducedMotion } from "motion/react";
import { duration, ease } from "@/lib/motion";

// The AEC gear drawn as a line drawing: eight teeth, root circle, bore and centre lines.
const TEETH = 8;
const OUTER = 100;
const ROOT = 82;
const BORE = 64;
const TIP_HALF = 8; // degrees either side of a tooth's centre, at the tip
const BASE_HALF = 12; // degrees either side of a tooth's centre, at the root

function polar(radius: number, degrees: number): string {
  const rad = (degrees * Math.PI) / 180;
  return `${(radius * Math.cos(rad)).toFixed(2)} ${(radius * Math.sin(rad)).toFixed(2)}`;
}

function gearPath(): string {
  const step = 360 / TEETH;
  let d = "";
  for (let i = 0; i < TEETH; i++) {
    const c = -90 + i * step;
    d += `${i === 0 ? "M" : "L"} ${polar(ROOT, c - BASE_HALF)} `;
    d += `L ${polar(OUTER, c - TIP_HALF)} L ${polar(OUTER, c + TIP_HALF)} `;
    d += `L ${polar(ROOT, c + BASE_HALF)} `;
    d += `A ${ROOT} ${ROOT} 0 0 1 ${polar(ROOT, c + step - BASE_HALF)} `;
  }
  return `${d}Z`;
}

const outline = gearPath();

type GearDrawingProps = { className?: string; delay?: number };

function GearDrawing({ className, delay = 0 }: GearDrawingProps) {
  const reduced = useReducedMotion();
  const draw = (extraDelay: number) => ({
    initial: reduced ? false : { pathLength: 0 },
    animate: { pathLength: 1 },
    transition: { duration: 1.8, ease: ease.inOut, delay: delay + extraDelay },
  });

  return (
    <svg
      aria-hidden
      viewBox="-124 -124 248 248"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      className={className}
    >
      <motion.path d={outline} vectorEffect="non-scaling-stroke" {...draw(0)} />
      <motion.circle r={BORE} vectorEffect="non-scaling-stroke" {...draw(0.3)} />
      <motion.g
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: duration.slow, delay: delay + 1.2 }}
        strokeDasharray="14 4 2 4"
      >
        <line x1={-122} y1={0} x2={122} y2={0} vectorEffect="non-scaling-stroke" />
        <line x1={0} y1={-122} x2={0} y2={122} vectorEffect="non-scaling-stroke" />
      </motion.g>
    </svg>
  );
}

export default GearDrawing;
