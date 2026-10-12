// Motion tokens. One easing family and three durations, shared by every animation on the site.
export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const;

export const duration = {
  quick: 0.25,
  base: 0.5,
  slow: 0.9,
} as const;
