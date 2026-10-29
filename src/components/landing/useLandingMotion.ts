/* All motion on the landing page: smooth scroll, the hero intro, scroll-linked reveals, pinned chapters, counters,
   the film frame, canvases and lazy video. The markup is plain React (see LandingPage.tsx); this hook only drives it.
   Everything it starts is torn down again when the page unmounts or `wide` changes, so the workspace never inherits
   a pinned section, a smooth-scroll loop or a running canvas. */
import { useEffect, type MutableRefObject, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { fitCanvas, inView, loop } from './helpers';
import { startLidar } from './lidar';

gsap.registerPlugin(ScrollTrigger, SplitText);

// The hero intro plays once per mounted page, not again when the layout switches between wide and stacked.
const introPlayed = new WeakSet<Element>();

const all = <T extends Element = HTMLElement>(root: ParentNode, sel: string) => Array.from(root.querySelectorAll<T>(sel));

export function useLandingMotion(root: RefObject<HTMLDivElement | null>, wide: boolean, lenisRef: MutableRefObject<Lenis | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const undo: Array<() => void> = []; // things gsap.context cannot revert on its own
    let dead = false;

    // The hero has an intro; always start a visit at the top of the page.
    const prevRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    undo.push(() => { history.scrollRestoration = prevRestoration; });

    // ---------- smooth scroll ----------
    let lenis: Lenis | null = null;
    let tick: ((t: number) => void) | null = null;
    if (!RM) {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      tick = (t: number) => lenis?.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      lenisRef.current = lenis;
      undo.push(() => {
        if (tick) gsap.ticker.remove(tick);
        lenis?.destroy();
        lenisRef.current = null;
      });
    }

    const ctx = gsap.context((self) => {
      // ---------- lazy video: load near view, pause off screen ----------
      all<HTMLVideoElement>(el, 'video[data-src]').forEach((v) => {
        v.muted = true;
        v.playsInline = true;
        v.loop = true;
        const load = () => {
          if (!v.getAttribute('src') && v.dataset.src) { v.src = v.dataset.src; v.load(); }
        };
        if (v.hasAttribute('data-eager')) load();
        const io = new IntersectionObserver(
          ([e]) => {
            if (e.isIntersecting) { load(); if (!RM) v.play().catch(() => {}); } else v.pause();
          },
          { rootMargin: '200px' },
        );
        io.observe(v);
        const onError = () => v.parentElement?.classList.add('media-fallback');
        v.addEventListener('error', onError);
        undo.push(() => {
          io.disconnect();
          v.removeEventListener('error', onError);
          v.pause();
          v.parentElement?.classList.remove('media-fallback');
          if (v.getAttribute('src')) { v.removeAttribute('src'); v.load(); }
        });
      });

      // ---------- header: logo and shade follow the section underneath ----------
      const nav = el.querySelector<HTMLElement>('[data-nav]');
      if (nav) {
        all(el, '[data-theme]').forEach((s) => {
          ScrollTrigger.create({
            trigger: s, start: 'top 32px', end: 'bottom 32px', refreshPriority: -10,
            onToggle: (self) => { if (self.isActive) nav.classList.toggle('is-light', s.dataset.theme === 'light'); },
          });
        });
        undo.push(() => nav.classList.remove('is-light'));
      }

      // ---------- canvases ----------
      const count = el.querySelector<HTMLElement>('[data-enc]');
      all<HTMLCanvasElement>(el, '[data-lidar="tile"]').forEach((c) =>
        undo.push(startLidar(c, { speed: 9, x: -30, y: 62, pitch: 0.55, yaw: 0.38, fov: 1.0, horizon: 0.26, far: 320 }, RM, null)));
      all<HTMLCanvasElement>(el, '[data-lidar="stage"]').forEach((c) =>
        undo.push(startLidar(c, { speed: 6, x: 46, y: 78, pitch: 0.62, yaw: -0.42, fov: 1.15, horizon: 0.22, far: 360, hud: true }, RM, count)));

      // Speech waveform over the studio mic.
      all<HTMLCanvasElement>(el, '[data-wave]').forEach((cnv) => {
        const c = fitCanvas(cnv);
        if (!c) return;
        const N = 48;
        const draw = (t: number) => {
          const g = c.ctx;
          g.clearRect(0, 0, c.w, c.h);
          const bw = c.w / N;
          const mid = c.h * 0.72;
          g.fillStyle = 'rgba(11,11,12,.35)';
          g.fillRect(0, mid - c.h * 0.16, c.w, c.h * 0.32);
          for (let i = 0; i < N; i++) {
            const env = Math.max(0, Math.sin(t * 1.3 + i * 0.09) * 0.5 + 0.5) * (0.35 + 0.65 * Math.abs(Math.sin(t * 2.7 + i * 0.41)));
            const a = Math.max(1.5, env * c.h * 0.14);
            g.fillStyle = i / N < (t * 0.12) % 1 ? '#F1F0EC' : 'rgba(241,240,236,.4)';
            g.fillRect(i * bw + bw * 0.3, mid - a, Math.max(1, bw * 0.4), a * 2);
          }
        };
        if (RM) { draw(1); undo.push(c.dispose); return; }
        const stop = loop(cnv, draw);
        undo.push(() => { stop(); c.dispose(); });
      });

      // Scrolling synthetic rows in the hero tile.
      all(el, '[data-rows]').forEach((rows) => {
        const track = rows.querySelector<HTMLElement>('.rows__track');
        if (!track || RM) return;
        let half = track.scrollHeight / 2;
        const ro = new ResizeObserver(() => { half = track.scrollHeight / 2; });
        ro.observe(track);
        const stop = loop(rows, (t) => {
          track.style.transform = `translateY(${-((t * 16) % half)}px)`;
        });
        undo.push(() => { stop(); ro.disconnect(); track.style.transform = ''; });
      });

      // ---------- hero ribbon: tiles drift right to left and recycle, no duplicates ----------
      const win = el.querySelector<HTMLElement>('[data-ribbon-window]');
      const rib = el.querySelector<HTMLElement>('[data-ribbon]');
      if (win && rib) {
        const tiles = Array.from(rib.children) as HTMLElement[];
        let baseH = win.offsetHeight;
        let offset = 0;
        let vel = 0;
        let sizedFor = 0; // the tile height the widths below were last written for
        const onResize = () => { if (!win.style.height) baseH = win.offsetHeight; };
        window.addEventListener('resize', onResize);
        const layout = (dt: number) => {
          const wh = win.offsetHeight;
          const th = Math.max(baseH, wh);
          const gap = 6;
          const widths = tiles.map((t) => th * +(t.dataset.ar || 1));
          const total = widths.reduce((a, b) => a + b + gap, 0);
          const resized = th !== sizedFor;
          sizedFor = th;
          const lv = lenis ? Math.abs(lenis.velocity || 0) : 0;
          vel += (26 + lv * 6 - vel) * 0.08;
          offset = (offset + vel * dt) % total;
          let x = -offset;
          tiles.forEach((t, i) => {
            let px = x;
            if (px + widths[i] < -total * 0.25) px += total;
            if (resized) {
              t.style.width = widths[i] + 'px';
              t.style.height = th + 'px';
            }
            t.style.transform = `translate3d(${px}px,${(wh - th) / 2}px,0)`;
            x += widths[i] + gap;
          });
        };
        layout(0);
        const stop = RM ? () => {} : loop(win, (_t, dt) => layout(dt));
        undo.push(() => {
          stop();
          window.removeEventListener('resize', onResize);
          tiles.forEach((t) => { t.style.width = ''; t.style.height = ''; t.style.transform = ''; });
        });
      }

      // ---------- hero: headline rises, parts, and the module's material opens between the lines ----------
      const hero = el.querySelector<HTMLElement>('[data-hero]');
      if (hero && win) {
        const lines = all(hero, '.hero__line > span');
        const stage = hero.querySelector<HTMLElement>('.hero__stage');
        const heroFoot = hero.querySelector<HTMLElement>('.hero__foot');
        const foot = all(hero, '.hero__foot > *');
        const label = hero.querySelector<HTMLElement>('.hero__label');
        const over = hero.querySelector<HTMLElement>('.hero__over');
        const veil = hero.querySelector<HTMLElement>('.hero__veil');
        const scrub = () => {
          if (RM) return;
          gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: hero, start: 'top top', end: '+=110%', pin: true, scrub: 0.6, invalidateOnRefresh: true },
          })
            .to(stage, { top: 0, bottom: 0, duration: 1 }, 0)
            .to(win, { height: () => window.innerHeight, width: () => window.innerWidth, borderRadius: 0, duration: 1 }, 0)
            .to(heroFoot, { opacity: 0, y: -24, duration: 0.35 }, 0)
            .to(all(hero, '[data-hud], .illus, .hero__label'), { opacity: 0, duration: 0.25 }, 0.5)
            .to(veil, { opacity: 1, duration: 0.4 }, 0.55)
            .to(over, { opacity: 1, duration: 0.3 }, 0.7)
            .from(over ? Array.from(over.children) : [], { y: 40, duration: 0.3, stagger: 0.05 }, 0.7);
        };
        if (!RM && !introPlayed.has(el)) {
          lenis?.stop();
          const h = win.offsetHeight;
          gsap.set(lines, { yPercent: 112 });
          gsap.set(win, { height: 0 });
          gsap.set(foot, { opacity: 0, y: 18 });
          if (label) gsap.set(label, { opacity: 0, y: 12 });
          const tl = gsap.timeline({ delay: 0.2 });
          tl.to(lines, { yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: 0.1 });
          if (label) tl.to(label, { opacity: 1, y: 0, duration: 1, ease: 'expo.out' }, 0.15);
          tl.to(win, { height: h, duration: 1.45, ease: 'expo.inOut' }, 0.75)
            .add(() => lenis?.start(), 1.6)
            .to(foot, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }, 1.55)
            .add(() => {
              // Runs later, outside the context function, so register what it creates with the context.
              self.add(() => {
                gsap.set(win, { clearProps: 'height' });
                introPlayed.add(el);
                scrub();
                ScrollTrigger.refresh();
              });
            });
        } else {
          scrub();
        }
      }

      // ---------- statement: words light up as you read down ----------
      // The lighting follows the reader's own scroll, so it stays on with reduced motion too.
      all(el, '[data-lit]').forEach((p) => {
        gsap.to(all(p, '.w'), { opacity: 1, ease: 'none', stagger: 0.08, scrollTrigger: { trigger: p, start: 'top 82%', end: 'bottom 52%', scrub: true } });
      });

      // ---------- chapters: held on screen on wide screens, stacked on small ones ----------
      // The hold is CSS sticky (class and height come from the markup), driven by the native scroll position,
      // so it behaves the same with or without motion.
      all(el, '[data-chapters]').forEach((sec) => {
        if (wide) {
          const texts = all(sec, '.chapters__texts > .ch-text');
          const visuals = all(sec, '.chapters__stage > .ch-visual');
          const idx = all(sec, '.chapters__index li');
          const n = visuals.length;
          let cur = -1;
          let raf = 0;
          const set = (i: number) => {
            if (i === cur) return;
            cur = i;
            texts.forEach((t, k) => t.classList.toggle('is-active', k === i));
            visuals.forEach((v, k) => v.classList.toggle('is-active', k === i));
            idx.forEach((l, k) => l.classList.toggle('is-active', k === i));
          };
          const update = () => {
            raf = 0;
            const r = sec.getBoundingClientRect();
            const prog = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - window.innerHeight)));
            const p = prog * n;
            set(Math.min(n - 1, Math.floor(p)));
            idx.forEach((l, k) => l.style.setProperty('--p', Math.max(0, Math.min(1, p - k)).toFixed(3)));
            visuals.forEach((v, k) => v.style.setProperty('--lp', Math.max(0, Math.min(1, p - k)).toFixed(3)));
          };
          const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
          window.addEventListener('scroll', queue, { passive: true });
          window.addEventListener('resize', queue);
          update();
          undo.push(() => {
            cancelAnimationFrame(raf);
            window.removeEventListener('scroll', queue);
            window.removeEventListener('resize', queue);
            [...texts, ...visuals, ...idx].forEach((x) => { x.classList.remove('is-active'); x.style.removeProperty('--p'); x.style.removeProperty('--lp'); });
          });
        } else {
          // Stacked: the visual plays while its frame is on screen.
          all(sec, '.ch-frame').forEach((frame) => {
            const v = frame.querySelector<HTMLElement>('.ch-visual');
            if (!v) return;
            const stop = inView(frame, (on) => v.classList.toggle('is-active', on), 0.4);
            undo.push(() => { stop(); v.classList.remove('is-active'); });
          });
        }
      });

      // ---------- figures: count up once ----------
      all(el, '[data-count]').forEach((c) => {
        const to = parseFloat(c.dataset.count || '0');
        const dec = +(c.dataset.dec || 0);
        const fmt = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
        const initial = c.textContent;
        undo.push(() => { c.textContent = initial; });
        if (RM) { c.textContent = fmt(to); return; }
        c.textContent = fmt(0);
        const o = { v: 0 };
        gsap.to(o, { v: to, duration: 2, ease: 'expo.out', onUpdate: () => { c.textContent = fmt(o.v); }, scrollTrigger: { trigger: c, start: 'top 88%', once: true } });
      });

      // ---------- film: inset frame opens to full bleed ----------
      all(el, '[data-film]').forEach((sec) => {
        const f = sec.querySelector<HTMLElement>('.film__frame');
        if (!f) return;
        const cx = wide ? '22%' : '6%';
        const ci = wide ? '18%' : '22%';
        if (RM) { gsap.set(f, { '--ci': '0%', '--cx': '0%', '--cr': '0px', '--fs': 1, '--co': 1 }); return; }
        gsap.set(f, { '--ci': ci, '--cx': cx, '--cr': '4px', '--fs': 1.18, '--co': 0 });
        gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.5 } })
          .to(f, { '--ci': '0%', '--cx': '0%', '--cr': '0px', '--fs': 1, ease: 'power2.inOut', duration: 1 })
          .to(f, { '--co': 1, ease: 'power1.out', duration: 0.35 }, 0.72);
      });

      // ---------- reveals (after fonts load, so lines split where they really wrap) ----------
      const reveal = () => {
        if (dead || RM) return;
        all(el, '[data-reveal]').forEach((h) => {
          SplitText.create(h, {
            type: 'lines', mask: 'lines', autoSplit: true, linesClass: 'ln',
            onSplit: (self) => gsap.from(self.lines, { yPercent: 115, duration: 1.15, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: h, start: 'top 88%', once: true } }),
          });
        });
        all(el, '[data-fade]').forEach((f) => {
          gsap.from(f, { y: 28, opacity: 0, duration: 1.1, ease: 'expo.out', delay: +(f.dataset.fade || 0) || 0, scrollTrigger: { trigger: f, start: 'top 90%', once: true } });
        });
        ScrollTrigger.refresh();
      };
      const fonts = document.fonts?.ready ?? Promise.resolve();
      void fonts.then(() => { if (!dead) self.add(reveal); });
    }, el);

    // Positions shift once images and fonts have settled.
    const refresh = () => ScrollTrigger.refresh();
    let raf = 0;
    if (document.readyState === 'complete') raf = requestAnimationFrame(refresh);
    else window.addEventListener('load', refresh);
    undo.push(() => { cancelAnimationFrame(raf); window.removeEventListener('load', refresh); });

    return () => {
      dead = true;
      undo.splice(0).reverse().forEach((f) => f());
      ctx.revert();
    };
  }, [root, wide, lenisRef]);
}
