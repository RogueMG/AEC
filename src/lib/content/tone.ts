import type { Tone } from "./types";

const cycle: Tone[] = ["coral", "yellow", "teal", "navy"];

// "auto" (or no choice) cycles coral, yellow, teal, navy by position in the category order.
export function resolveTone(choice: string | null | undefined, index: number): Tone {
  return cycle.includes(choice as Tone) ? (choice as Tone) : cycle[index % cycle.length];
}
