/* LiDAR: a transmission corridor as a point cloud, drawn straight into pixels. */
import { fitCanvas, loop, rng } from './helpers';

interface Cloud {
  P: Float32Array;
  L: number;
  trees: Array<[number, number, number]>;
}

let cloud: Cloud | null = null;

// Built once, the first time a LiDAR canvas starts (about 50,000 points).
const getCloud = (): Cloud => {
  if (cloud) return cloud;
  const R = rng(11);
  const L = 480;
  const H = 34;
  const P: number[] = [];
  const trees: Array<[number, number, number]> = [];
  const ground = (x: number, z: number) => 2.2 * Math.sin(z * 0.021) + 1.6 * Math.sin(x * 0.06 + z * 0.013) + 0.6 * Math.sin(x * 0.21 + z * 0.05);
  const add = (x: number, y: number, z: number, k: number) => P.push(x, y, z, k);

  for (let i = 0; i < 40000; i++) {
    const x = (R() * 2 - 1) * 70;
    const z = R() * L;
    add(x, ground(x, z) + R() * 0.25, z, 0);
  }
  for (let i = 0; i < 1800; i++) {
    const z = R() * L;
    const x = -22 + R() * 3.4;
    add(x, ground(x, z) + 0.05, z, 5);
  }
  const towers: number[] = [];
  for (let z = 20; z < L; z += 80) towers.push(z);
  towers.forEach((tz) => {
    const g = ground(0, tz);
    for (let i = 0; i < 360; i++) {
      const t = Math.pow(R(), 0.8);
      const half = 4.4 * (1 - t) + 0.7;
      const leg = (R() * 4) | 0;
      add((leg & 1 ? 1 : -1) * half, g + t * H, tz + (leg & 2 ? 1 : -1) * half, 2);
    }
    for (let b = 0; b < 7; b++) {
      const y0 = (b * H) / 8;
      const y1 = y0 + H / 8;
      for (let i = 0; i < 26; i++) {
        const t = R();
        const y = y0 + (y1 - y0) * t;
        const half = 4.4 * (1 - y / H) + 0.7;
        add(-half + 2 * half * t, g + y, tz - half, 2);
        add(-half + 2 * half * t, g + y, tz + half, 2);
      }
    }
    for (const ay of [H * 0.72, H * 0.86]) for (let i = 0; i < 90; i++) add((R() * 2 - 1) * 9, g + ay, tz + (R() - 0.5) * 0.8, 2);
  });
  const wires: Array<[number, number]> = [[-9, 0.72], [9, 0.72], [-9, 0.86], [9, 0.86], [-3, 0.86], [3, 0.72]];
  towers.forEach((tz) => {
    const nz = tz + 80;
    const g0 = ground(0, tz);
    const g1 = ground(0, nz % L);
    wires.forEach(([wx, f]) => {
      for (let t = 0; t <= 1; t += 0.0035) add(wx, g0 + (g1 - g0) * t + H * f - 7 * 4 * t * (1 - t), (tz + t * 80) % L, 3);
    });
  });
  for (let k = 0; k < 190; k++) {
    const near = k < 14;
    const side = R() < 0.5 ? -1 : 1;
    const x = near ? side * (9 + R() * 6) : side * (14 + R() * 50);
    const z = R() * L;
    const h = near ? 19 + R() * 6 : 6 + R() * 16;
    const r = 2 + R() * 3.4;
    const g = ground(x, z);
    for (let i = 0; i < 9; i++) add(x, g + (h - r) * (i / 9), z, 1);
    for (let i = 0; i < 120; i++) {
      const u = R() * 2 - 1;
      const th = R() * 6.283;
      const s = Math.cbrt(R());
      const q = Math.sqrt(1 - u * u) * s;
      add(x + r * q * Math.cos(th), g + h - r + r * 1.3 * u * s, z + r * q * Math.sin(th), near ? 4 : 1);
    }
    if (near) trees.push([x, g + h - r, z]);
  }
  cloud = { P: new Float32Array(P), L, trees };
  return cloud;
};

// Colour and brightness for each kind of point: ground, canopy, steel, wire, vegetation in the clearance zone, track.
const COL = [[150, 150, 144], [150, 156, 146], [241, 240, 236], [255, 255, 255], [227, 24, 55], [190, 188, 180]];
const GAIN = [0.75, 0.95, 1.1, 1.3, 1.9, 0.95];

export interface LidarOptions {
  speed: number;
  x: number;
  y: number;
  pitch: number;
  yaw: number;
  fov: number;
  horizon: number;
  far: number;
  hud?: boolean;
}

interface View {
  camX: number;
  camY: number;
  camZ: number;
  cy: number;
  sy: number;
  cp: number;
  sp: number;
  f: number;
  hx: number;
  hy: number;
  far: number;
}

// Bracket the nearest vegetation inside the clearance zone.
const drawHud = (g: CanvasRenderingContext2D, cw: number, ch: number, v: View, c: Cloud, count: HTMLElement | null) => {
  let best: { sx: number; sy: number; zc: number } | null = null;
  let seen = 0;
  for (const [x, y, z] of c.trees) {
    let dz = z - v.camZ;
    dz = ((dz % c.L) + c.L) % c.L;
    const xr = (x - v.camX) * v.cy - dz * v.sy;
    const zr = (x - v.camX) * v.sy + dz * v.cy;
    const yy = y - v.camY;
    const yc = yy * v.cp + zr * v.sp;
    const zc = -yy * v.sp + zr * v.cp;
    if (zc < 25 || zc > v.far * 0.75) continue;
    seen++;
    const sx = v.hx + (xr * v.f) / zc;
    const sy = v.hy - (yc * v.f) / zc;
    if (sx < 40 || sx > cw - 160 || sy < 40 || sy > ch - 90) continue;
    if (!best || zc < best.zc) best = { sx, sy, zc };
  }
  if (count) count.textContent = seen + ' trees';
  if (!best) return;
  const s = Math.max(16, 900 / best.zc);
  g.strokeStyle = '#E31837';
  g.lineWidth = 1.5;
  g.beginPath();
  const L2 = s * 0.45;
  const x0 = best.sx - s;
  const y0 = best.sy - s;
  const x1 = best.sx + s;
  const y1 = best.sy + s;
  g.moveTo(x0, y0 + L2); g.lineTo(x0, y0); g.lineTo(x0 + L2, y0);
  g.moveTo(x1 - L2, y0); g.lineTo(x1, y0); g.lineTo(x1, y0 + L2);
  g.moveTo(x1, y1 - L2); g.lineTo(x1, y1); g.lineTo(x1 - L2, y1);
  g.moveTo(x0 + L2, y1); g.lineTo(x0, y1); g.lineTo(x0, y1 - L2);
  g.stroke();
  g.font = '500 10.5px "DM Mono", monospace';
  g.fillStyle = '#F1F0EC';
  g.fillText('VEGETATION · INSIDE CLEARANCE', x1 + 10, y0 + 10);
  g.fillStyle = 'rgba(241,240,236,.55)';
  g.fillText(best.zc.toFixed(0) + ' M AHEAD', x1 + 10, y0 + 26);
};

/** Starts a LiDAR fly-through on `cnv`. Returns a function that stops it. `still` draws one frame only (reduced motion). */
export function startLidar(cnv: HTMLCanvasElement, o: LidarOptions, still: boolean, count: HTMLElement | null): () => void {
  const c = fitCanvas(cnv);
  if (!c) return () => {};
  const W = getCloud();
  let img: ImageData;
  let d: Uint8ClampedArray;
  let b32: Uint32Array;
  const fit = () => {
    img = c.ctx.createImageData(cnv.width, cnv.height);
    d = img.data;
    b32 = new Uint32Array(d.buffer);
  };
  c.onfit = fit;
  fit();
  const BG = (255 << 24) | (15 << 16) | (14 << 8) | 14;
  const { P, L } = W;

  const draw = (t: number) => {
    const w = cnv.width;
    const h = cnv.height;
    if (!img || img.width !== w || img.height !== h) fit();
    b32.fill(BG);
    const camZ = (t * o.speed) % L;
    const camY = o.y + Math.sin(t * 0.21) * 1.2;
    const camX = o.x + Math.sin(t * 0.13) * 2;
    const yaw = o.yaw + Math.sin(t * 0.09) * 0.07;
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(o.pitch);
    const sp = Math.sin(o.pitch);
    const f = h * o.fov;
    const hx = w / 2;
    const hy = h * o.horizon;
    const far = o.far;
    const back = 20;
    const big = c.dpr > 1.5 ? 2 : 1;
    for (let i = 0; i < P.length; i += 4) {
      const x = P[i] - camX;
      const y = P[i + 1] - camY;
      let dz = P[i + 2] - camZ;
      dz = ((dz % L) + L) % L;
      if (dz > L - back) dz -= L;
      const xr = x * cy - dz * sy;
      const zr = x * sy + dz * cy;
      const yc = y * cp + zr * sp;
      const zc = -y * sp + zr * cp;
      if (zc < 2 || zc > far) continue;
      const sx = (hx + (xr * f) / zc) | 0;
      const syy = (hy - (yc * f) / zc) | 0;
      if (sx < 0 || syy < 0 || sx >= w - 1 || syy >= h - 1) continue;
      const k = P[i + 3];
      const fade = zc < far * 0.5 ? 1 : 1 - (zc - far * 0.5) / (far * 0.5);
      const a = fade * GAIN[k] * (zc < 40 ? 0.85 : 0.62);
      const col = COL[k];
      let p = (syy * w + sx) * 4;
      d[p] += col[0] * a; d[p + 1] += col[1] * a; d[p + 2] += col[2] * a;
      if (zc < (big > 1 ? 90 : 60)) {
        p += 4; d[p] += col[0] * a; d[p + 1] += col[1] * a; d[p + 2] += col[2] * a;
        p += w * 4; d[p] += col[0] * a; d[p + 1] += col[1] * a; d[p + 2] += col[2] * a;
      }
    }
    c.ctx.putImageData(img, 0, 0);
    if (o.hud) drawHud(c.ctx, c.w, c.h, { camX, camY, camZ, cy, sy, cp, sp, f: f / c.dpr, hx: hx / c.dpr, hy: hy / c.dpr, far }, W, count);
  };

  if (still) {
    draw(4);
    return c.dispose;
  }
  const stop = loop(cnv, (t) => draw(t + 6));
  return () => {
    stop();
    c.dispose();
  };
}
