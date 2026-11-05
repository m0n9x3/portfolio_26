/** Every animation in the app defers to this: true means render the rest state. */
export const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
