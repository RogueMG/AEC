// Shared admin form styles and small list helpers.

export const inputClass =
  "w-full border border-line bg-surface px-3 py-2.5 text-[0.9375rem] text-ink placeholder:text-steel/60 focus-visible:border-teal disabled:opacity-60";

export const iconButton =
  "grid size-9 shrink-0 place-items-center border border-line bg-surface text-ink transition-colors hover:border-ink disabled:pointer-events-none disabled:opacity-35 [&_svg]:size-4";

export function moveItem<T>(list: T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
