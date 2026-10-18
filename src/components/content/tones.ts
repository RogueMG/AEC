import type { Tone } from "@/lib/content/types";

// Surface classes per category colour. The brights carry ink text; navy carries paper text.
export const tones: Record<
  Tone,
  { surface: string; rule: string; chip: string; muted: string; dot: string }
> = {
  coral: { surface: "bg-coral text-ink", rule: "border-ink/25", chip: "bg-ink text-coral", muted: "text-ink/75", dot: "bg-coral" },
  yellow: { surface: "bg-signal text-ink", rule: "border-ink/25", chip: "bg-ink text-signal", muted: "text-ink/75", dot: "bg-signal" },
  teal: { surface: "bg-teal text-ink", rule: "border-ink/25", chip: "bg-ink text-teal", muted: "text-ink/75", dot: "bg-teal" },
  navy: {
    surface: "bg-ink-raised text-surface",
    rule: "border-surface/25",
    chip: "bg-surface text-ink",
    muted: "text-ink-muted",
    dot: "bg-ink",
  },
};
