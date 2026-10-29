/* Small browser helpers for the landing page's canvases and animation loops. */

// Deterministic random numbers, so the illustrations look the same on every visit.
export const rng = (seed = 1) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Run fn(t, dt) on every animation frame, but only while `el` is on screen. Returns a function that stops it.
export const loop = (el: Element, fn: (t: number, dt: number) => void) => {
  let raf = 0;
  let on = false;
  let last = 0;
  const tick = (t: number) => {
    const dt = Math.min(64, t - (last || t));
    last = t;
    fn(t / 1000, dt / 1000);
    if (on) raf = requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting && !on) {
        on = true;
        last = 0;
        raf = requestAnimationFrame(tick);
      } else if (!e.isIntersecting && on) {
        on = false;
        cancelAnimationFrame(raf);
      }
    },
    { rootMargin: '120px' },
  );
  io.observe(el);
  return () => {
    on = false;
    cancelAnimationFrame(raf);
    io.disconnect();
  };
};

export interface FittedCanvas {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  dpr: number;
  onfit?: () => void;
  dispose: () => void;
}

// A canvas that tracks its CSS size at the device pixel ratio.
export const fitCanvas = (cnv: HTMLCanvasElement): FittedCanvas | null => {
  const ctx = cnv.getContext('2d');
  if (!ctx) return null;
  const s: FittedCanvas = { ctx, w: 0, h: 0, dpr: 1, dispose: () => ro.disconnect() };
  const fit = () => {
    const r = cnv.getBoundingClientRect();
    s.dpr = Math.min(2, window.devicePixelRatio || 1);
    s.w = Math.max(1, r.width);
    s.h = Math.max(1, r.height);
    cnv.width = Math.round(s.w * s.dpr);
    cnv.height = Math.round(s.h * s.dpr);
    ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
    s.onfit?.();
  };
  const ro = new ResizeObserver(fit);
  ro.observe(cnv);
  fit();
  return s;
};

// Calls cb(true/false) as `el` enters and leaves the viewport. Returns a function that stops it.
export const inView = (el: Element, cb: (on: boolean) => void, threshold = 0.35) => {
  const io = new IntersectionObserver((es) => es.forEach((e) => cb(e.isIntersecting)), { threshold });
  io.observe(el);
  return () => io.disconnect();
};
