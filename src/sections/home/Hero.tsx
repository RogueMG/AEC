import { motion } from "motion/react";
import GearDrawing from "@/components/brand/GearDrawing";
import { Button } from "@/components/ui/button";
import { duration, ease } from "@/lib/motion";
import { publicAsset } from "@/lib/publicAsset";
import { cn } from "@/lib/utils";

type Band = { key: string; className: string; photo?: boolean };

// Left to right. The photo band is the only one that isn't a flat colour.
const bands: Band[] = [
  { key: "coral", className: "basis-[8%] bg-coral" },
  { key: "photo", className: "basis-[29%] bg-ink-raised", photo: true },
  { key: "signal", className: "basis-[9%] bg-signal" },
  { key: "teal", className: "flex-1 bg-teal" },
];

// Bands rise along the cut first; the copy follows once they have landed.
const BAND_STAGGER = 0.09;
const COPY_DELAY = 0.45;

function Bands({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("cut flex origin-bottom-left", className)}>
      {bands.map((band, i) => (
        <motion.div
          key={band.key}
          className={cn("relative h-full overflow-hidden", band.className)}
          initial={{ y: "101%" }}
          animate={{ y: 0 }}
          transition={{ duration: duration.slow, ease: ease.out, delay: i * BAND_STAGGER }}
        >
          {band.photo && (
            <img
              src={publicAsset("images/hero-sparks.jpg")}
              alt=""
              className="cut-inverse absolute inset-y-0 -left-28 h-full w-[calc(100%+14rem)] max-w-none object-cover"
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-surface text-ink">
      {/* Small screens: the bands sit above the copy as a strip. */}
      <div className="h-52 overflow-hidden pt-(--spacing-header) sm:h-64 lg:hidden">
        <Bands className="-mr-[30%] ml-[12%] h-full" />
      </div>

      {/* A faint line drawing of the gear, centred just off the bottom-left corner so only its
          teeth rise behind the copy and the centre lines stay clear of the text. */}
      <GearDrawing
        delay={COPY_DELAY}
        className="pointer-events-none absolute -bottom-[16rem] -left-[17.5rem] w-[34rem] text-line lg:-bottom-[25.5rem] lg:-left-[30.5rem] lg:w-[56rem]"
      />

      {/* Large screens: the bands fill the right half, full height. */}
      <Bands className="absolute inset-y-0 -right-[22%] left-[55%] hidden lg:flex" />

      <div className="page relative flex flex-col justify-center py-14 lg:min-h-[min(46rem,100svh)] lg:pt-[calc(var(--spacing-header)+4rem)] lg:pb-20">
        <div className="lg:max-w-[50%]">
          <motion.h1
            className="type-display"
            initial={{ clipPath: "inset(0 0 100% 0)", y: 32 }}
            animate={{ clipPath: "inset(-10% -5% -10% -5%)", y: 0 }}
            transition={{ duration: duration.slow, ease: ease.out, delay: COPY_DELAY }}
          >
            Industrial products for <span className="whitespace-nowrap">real-world</span> work
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration.base, ease: ease.out, delay: COPY_DELAY + 0.25 }}
          >
            <p className="type-lead measure mt-6 text-steel">
              We knit industrial gloves and make PPE at our own factory in Sriperumbudur, and supply
              tools, consumables and MRO products to manufacturers across South India. Since 1999.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild variant="ink">
                <a href="#products">View products</a>
              </Button>
              <Button asChild variant="outline-on-light">
                <a href="#contact">Enquire now</a>
              </Button>
            </div>

            <p className="type-small mt-9 text-steel">
              Authorized dealer for Stanley, Bosch, Karam and{" "}
              <a href="#brands" className="link-rule text-ink">
                seven more brands
              </a>
              .
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
