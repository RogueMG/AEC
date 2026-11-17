import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { Location } from "@/data/site";

// A location card whose Google map only loads after the visitor asks for it: nothing is
// fetched from Google until then, which keeps the page fast and avoids third-party requests.
export default function MapCard({ location }: { location: Location }) {
  const [showMap, setShowMap] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const query = location.mapQuery ?? location.address;
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;

  // The "Show map" button disappears once clicked, so move focus to the map instead of losing it.
  useEffect(() => {
    if (showMap) frame.current?.focus();
  }, [showMap]);

  return (
    <div className="bg-ink-raised p-6 sm:p-8">
      <h3 className="type-subhead">
        {location.name}, {location.place}
      </h3>
      <address className="type-small mt-3 max-w-[26rem] text-ink-muted not-italic">{location.address}</address>

      <div className="mt-5 aspect-[16/10] w-full overflow-hidden border border-ink-line bg-ink">
        {showMap ? (
          <iframe
            ref={frame}
            src={src}
            title={`Map showing ${location.name}, ${location.place}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block size-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowMap(true)}
            className="group flex size-full flex-col items-center justify-center gap-2 text-ink-muted transition-colors hover:text-surface"
          >
            <MapPin className="size-7 text-teal" aria-hidden />
            <span className="type-label link-rule">Show map</span>
            <span className="type-small">Loads Google Maps</span>
          </button>
        )}
      </div>

      <a
        href={location.mapsHref}
        target="_blank"
        rel="noreferrer"
        className="type-label mt-5 inline-flex items-center gap-1.5 text-signal"
      >
        <span className="link-rule">Open in Google Maps</span>
        <ArrowUpRight className="size-4" aria-hidden />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </div>
  );
}
