#!/usr/bin/env node
'use strict';
/* ============================================================
   VẼ BẢN PHÁC THẢO "CÔ GÁI ÔM HOA GIỮA ĐÀ LẠT"
   Chạy:  node tools/ve-phac-thao.js
   Kết quả: phac-thao.html (một file, mở offline được)

   Toàn bộ tranh là SVG sinh từ code, không dùng ảnh.
   Muốn chỉnh: sửa toạ độ / màu trong các hàm bên dưới rồi chạy lại.
   ============================================================ */
const fs = require('fs');
const path = require('path');

const W = 900, H = 1280;
const INK = '#3B4560';
const GAI = { x: 425, y: 350, s: 1.12 }; // vị trí + cỡ cô gái trong tranh

/* ---------- số ngẫu nhiên có hạt giống (để lần nào vẽ cũng ra y hệt) ---------- */
let seed = 20261122;
const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const R = (a, b) => a + (b - a) * rnd();
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const f = (n) => Math.round(n * 10) / 10;
const g = (x, c, w) => Math.exp(-(((x - c) / w) ** 2));

/* ---------- hình học ---------- */
function smoothClosed(pts) {
  const n = pts.length;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  let d = `M${f(m0[0])},${f(m0[1])}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i], m = mid(p, pts[(i + 1) % n]);
    d += `Q${f(p[0])},${f(p[1])} ${f(m[0])},${f(m[1])}`;
  }
  return d + 'Z';
}
function smoothOpen(pts) {
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i], q = pts[i + 1];
    const m = i === pts.length - 2 ? q : [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    d += `Q${f(p[0])},${f(p[1])} ${f(m[0])},${f(m[1])}`;
  }
  return d;
}
function blob(cx, cy, rx, ry, n = 10, j = 0.15, rot = 0) {
  const pts = [];
  const c = Math.cos(rot), s = Math.sin(rot);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + R(-j, j);
    const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
    pts.push([cx + x * c - y * s, cy + x * s + y * c]);
  }
  return smoothClosed(pts);
}
const cubic = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
};

/* ============================================================
   NỀN: TRỜI, NÚI, ĐỒI THÔNG, HỒ
   ============================================================ */
const DINH = [[694, 50], [812, 45]]; // hai đỉnh LangBiang
const langbiang = (x) => 562 - 122 * g(x, DINH[0][0], DINH[0][1]) - 100 * g(x, DINH[1][0], DINH[1][1]) - 36 * g(x, 750, 150)
  - 26 * g(x, 180, 230) - 14 * g(x, 430, 130) + 3 * Math.sin(x / 23);
const ridge2 = (x) => 604 + 15 * Math.sin(x / 95 + 1) + 8 * Math.sin(x / 41 + 2) - 26 * g(x, 110, 150) - 16 * g(x, 830, 120);
const doi3T = (x) => 642 + 96 * (1 - g(x, 0, 330)) + 6 * Math.sin(x / 37);
const doi3P = (x) => 656 + 88 * (1 - g(x, 900, 300)) + 6 * Math.sin(x / 31 + 1);
const HO_Y = 744;
const dongCo = (x) => 874 - 20 * Math.sin(x / 170 + 0.6) + 5 * Math.sin(x / 47) + 24 * g(x, 450, 260);

function doi(fn, bottom, fill, extra = '') {
  let d = `M-12,${f(fn(-12))}`;
  for (let x = 0; x <= W + 12; x += 10) d += `L${x},${f(fn(x))}`;
  d += `L${W + 12},${bottom}L-12,${bottom}Z`;
  return `<path d="${d}" fill="${fill}" ${extra}/>`;
}

function thongXa(fn, x0, x1, hMin, hMax, fill) {
  let d = '';
  for (let x = x0; x < x1; x += R(7, 15)) {
    const y = fn(x) + 2, h = R(hMin, hMax), w = h * 0.28;
    d += `M${f(x - w)},${f(y)}L${f(x - w * 0.5)},${f(y - h * 0.45)}L${f(x - w * 0.75)},${f(y - h * 0.45)}`
      + `L${f(x)},${f(y - h)}L${f(x + w * 0.75)},${f(y - h * 0.45)}L${f(x + w * 0.5)},${f(y - h * 0.45)}L${f(x + w)},${f(y)}Z`;
  }
  return `<path d="${d}" fill="${fill}"/>`;
}

function thongVua(x, y, h, la, la2, than) {
  let s = `<path d="M${f(x)},${f(y)}L${f(x)},${f(y - h * 0.8)}" stroke="${than}" stroke-width="${f(Math.max(1.4, h * 0.035))}" stroke-linecap="round"/>`;
  for (let i = 0; i < 4; i++) {
    const t = i / 3;
    const cy = y - h * (0.95 - t * 0.42), rx = h * (0.09 + t * 0.11), ry = h * 0.085;
    s += `<path d="${blob(x + R(-1, 1) * h * 0.03, cy, rx, ry, 7, 0.2)}" fill="${i % 2 ? la2 : la}"/>`;
  }
  return s;
}

function rungThong(fn, x0, x1, n, la, la2, than) {
  const cay = [];
  for (let i = 0; i < n; i++) {
    const x = R(x0, x1);
    const y = Math.min(HO_Y - 2, fn(x) + R(6, 70));
    cay.push([x, y, R(30, 52) * (0.75 + (y - 640) / 260)]);
  }
  cay.sort((a, b) => a[1] - b[1]);
  return cay.map(([x, y, h]) => thongVua(x, y, h, la, la2, than)).join('');
}

function thongLon(x, y, h, lean = 0) {
  const topX = x + lean, topY = y - h, w = h * 0.028;
  let s = `<path class="n" d="M${f(x - w)},${f(y)}L${f(topX - w * 0.25)},${f(topY + h * 0.1)}L${f(topX + w * 0.25)},${f(topY + h * 0.1)}L${f(x + w)},${f(y)}Z" fill="#6B5348"/>`;
  // vài vệt vỏ cây
  for (let i = 0; i < 5; i++) {
    const yy = y - h * R(0.05, 0.42);
    s += `<path class="nm" d="M${f(x + R(-w, w) * 0.5)},${f(yy)}l${f(R(-1, 1))},${f(-R(8, 16))}"/>`;
  }
  // tán thông ba lá: từng tầng cành vươn ngang, đầu cành là một đệm lá có kim tua tủa
  const tx = (k) => x + lean * (1 - k);
  const tan = (cx, cy, rx, ry, fill) => {
    let p = '';
    for (let j = 0; j < 6; j++) {
      const q = (j / 5 - 0.5) * 2;
      p += kim(cx + q * rx * 0.88, cy - ry * 0.5 * (1 - q * q * 0.7), h * 0.036, -90 + q * 38, 62, 9, '#2B5450');
    }
    p += `<path class="n nh" d="${blob(cx, cy, rx, ry, 13, 0.16)}" fill="${fill}"/>`;
    p += `<path d="${blob(cx - rx * 0.3, cy - ry * 0.28, rx * 0.5, ry * 0.36, 8, 0.2)}" fill="#5F958A" opacity=".65"/>`;
    for (let j = 0; j < 4; j++) {
      const q = (j / 3 - 0.5) * 2;
      p += kim(cx + q * rx * 0.7, cy + ry * 0.7, h * 0.026, 90 + q * 30, 55, 6, '#2B5450');
    }
    return p;
  };
  const tiers = 6;
  let canh = '', dem = '';
  for (let i = 0; i < tiers; i++) {
    const t = i / (tiers - 1);
    const k = 0.05 + t * 0.44;
    const side = i === 0 ? 0 : (i % 2 ? 1 : -1);
    const rx = h * (0.07 + t * 0.075) * R(0.9, 1.12), ry = h * 0.034 * R(0.92, 1.2);
    const cx = tx(k) + side * rx * 0.62, cy = topY + h * k;
    canh += `<path d="M${f(tx(k + 0.06))},${f(cy + h * 0.06)} Q${f((tx(k) + cx) / 2)},${f(cy + ry * 1.4)} ${f(cx)},${f(cy)}" stroke="#6B5348" stroke-width="${f(h * 0.011)}" fill="none" stroke-linecap="round"/>`;
    dem += tan(cx, cy, rx, ry, i % 2 ? '#3A6B64' : '#2F5C56');
    if (i > 0) {
      const rx2 = rx * R(0.5, 0.68), cx2 = tx(k + 0.04) - side * rx2 * 0.95, cy2 = cy + h * 0.045;
      canh += `<path d="M${f(tx(k + 0.09))},${f(cy2 + h * 0.05)} Q${f((tx(k) + cx2) / 2)},${f(cy2 + ry)} ${f(cx2)},${f(cy2)}" stroke="#6B5348" stroke-width="${f(h * 0.009)}" fill="none" stroke-linecap="round"/>`;
      dem += tan(cx2, cy2, rx2, ry * 0.85, i % 2 ? '#2F5C56' : '#3A6B64');
    }
  }
  return s + canh + dem;
}

function may(cx, cy, w, op = 0.8) {
  let s = `<g opacity="${op}" fill="#FFFFFF">`;
  s += `<ellipse cx="${cx}" cy="${cy}" rx="${f(w * 0.5)}" ry="${f(w * 0.09)}"/>`;
  s += `<ellipse cx="${f(cx - w * 0.18)}" cy="${f(cy - w * 0.07)}" rx="${f(w * 0.2)}" ry="${f(w * 0.1)}"/>`;
  s += `<ellipse cx="${f(cx + w * 0.1)}" cy="${f(cy - w * 0.1)}" rx="${f(w * 0.24)}" ry="${f(w * 0.12)}"/>`;
  s += `<ellipse cx="${f(cx + w * 0.3)}" cy="${f(cy - w * 0.04)}" rx="${f(w * 0.14)}" ry="${f(w * 0.07)}"/>`;
  return s + '</g>';
}

function nhaTho(x, y) {
  // Nhà thờ nhỏ có tháp chuông, nhìn từ xa
  return `<g transform="translate(${x},${y})">
    <path class="nx" fill="#F7E7D4" d="M-4,0 L-4,-17 L26,-17 L26,0 Z"/>
    <path class="nx" fill="#C4877A" d="M-7,-17 L11,-29 L29,-17 Z"/>
    <path class="nx" fill="#F7E7D4" d="M-15,0 L-15,-34 L-4,-34 L-4,0 Z"/>
    <path class="nx" fill="#C4877A" d="M-17,-34 L-9.5,-56 L-2,-34 Z"/>
    <path d="M-9.5,-56 v-9 M-12.5,-62 h6" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M-9.5,-27 v6 M3,-11 v6 M11,-11 v6 M19,-11 v6" stroke="#8C6E66" stroke-width="2" stroke-linecap="round"/>
  </g>`;
}
function bietThu(x, y, s = 1) {
  return `<g transform="translate(${x},${y}) scale(${s})">
    <path class="nx" fill="#F6E9DA" d="M0,0 L0,-11 L22,-11 L22,0 Z"/>
    <path class="nx" fill="#C9766A" d="M-3,-11 L5,-21 L19,-21 L25,-11 Z"/>
    <path class="nx" fill="#C9766A" d="M15,-21 v-6 h4 v6"/>
    <path d="M6,-7 v4 M15,-7 v4" stroke="#8C6E66" stroke-width="1.8" stroke-linecap="round"/>
  </g>`;
}

/* ---------- lá thông tiền cảnh ---------- */
function kim(cx, cy, r, dir, spread, n, col) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (dir + R(-spread, spread)) * Math.PI / 180;
    const l = r * R(0.65, 1.1);
    d += `M${f(cx)},${f(cy)}L${f(cx + Math.cos(a) * l)},${f(cy + Math.sin(a) * l)}`;
  }
  return `<path d="${d}" fill="none" stroke="${col}" stroke-width="1.6" stroke-linecap="round"/>`;
}
function canhThong(pts, w, fans) {
  // pts: đường đi của cành; fans: số chùm lá dọc cành
  let s = `<path d="${smoothOpen(pts)}" fill="none" stroke="#5C4840" stroke-width="${w}" stroke-linecap="round"/>`;
  const n = pts.length;
  for (let i = 0; i < fans; i++) {
    const t = 0.25 + 0.75 * (i / (fans - 1 || 1));
    const idx = Math.min(n - 2, Math.floor(t * (n - 1)));
    const lt = t * (n - 1) - idx;
    const x = pts[idx][0] + (pts[idx + 1][0] - pts[idx][0]) * lt;
    const y = pts[idx][1] + (pts[idx + 1][1] - pts[idx][1]) * lt;
    const dir = Math.atan2(pts[idx + 1][1] - pts[idx][1], pts[idx + 1][0] - pts[idx][0]) * 180 / Math.PI;
    s += kim(x, y, R(34, 48), dir + pick([-55, 50, 0, -30, 35]), 62, 20, '#2B5450');
    s += kim(x + R(-6, 6), y + R(-6, 6), R(26, 38), dir + pick([-40, 40, 10]), 70, 14, '#40736B');
  }
  return s;
}

/* ---------- hoa cỏ ---------- */
function la(x, y, len, rot, fill) {
  return `<g transform="translate(${f(x)},${f(y)}) rotate(${f(rot)})">`
    + `<path class="n" fill="${fill}" d="M0,0 C${f(len * 0.3)},${f(-len * 0.38)} ${f(len * 0.78)},${f(-len * 0.3)} ${f(len)},0 C${f(len * 0.78)},${f(len * 0.3)} ${f(len * 0.3)},${f(len * 0.38)} 0,0Z"/>`
    + `<path class="nm" d="M${f(len * 0.08)},0 L${f(len * 0.9)},0"/></g>`;
}
const TU_CAU = {
  xanh: ['#A9C4EE', '#8FB0E4', '#C2D5F5', '#7B9FD9'],
  tim: ['#C9BDEB', '#B3A3E0', '#DAD0F3', '#9F8FD4'],
  hong: ['#F3C6D6', '#EBAFC5', '#F9DCE6', '#DF98B4'],
  trang: ['#E6EEF9', '#D3E0F4', '#F4F8FD', '#BFD0EC'],
};
function tuCau(cx, cy, r, pal) {
  let s = `<path class="n" d="${blob(cx, cy, r, r * 0.86, 12, 0.1)}" fill="${pal[1]}"/>`;
  const n = Math.round(r * r / 52);
  for (let i = 0; i < n; i++) {
    const a = R(0, 6.283), d = Math.sqrt(rnd()) * r * 0.8;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.86;
    s += `<use href="#h4" transform="translate(${f(x)},${f(y)}) rotate(${Math.round(R(0, 90))}) scale(${f(R(0.85, 1.3))})" fill="${pick(pal)}"/>`;
  }
  return s;
}
function daQuy(x, y, s, rot) {
  return `<use href="#dq" transform="translate(${f(x)},${f(y)}) rotate(${f(rot)}) scale(${f(s)})"/>`;
}

/* ============================================================
   ĐOÁ HOA: lily xanh, hồng kem, hồng môn xanh, hoa sao nhỏ
   ============================================================ */
function lily(x, y, size, rot, mau = 'xanh') {
  // lily kép: hai tầng sáu cánh mép lượn + cụm cánh nhỏ ở tâm
  const petal = (len, w, k) =>
    `M0,0 C${f(w * 0.55)},${f(-len * 0.06)} ${f(w * 1.08)},${f(-len * 0.28)} ${f(w * 0.96)},${f(-len * 0.5)}`
    + ` C${f(w * 1.12)},${f(-len * 0.62)} ${f(w * 0.7)},${f(-len * 0.8)} ${f(w * 0.4)},${f(-len * 0.88)}`
    + ` Q${f(w * 0.2 + k)},${f(-len * 1.06)} ${f(k)},${f(-len)}`
    + ` Q${f(-w * 0.2 + k)},${f(-len * 1.04)} ${f(-w * 0.42)},${f(-len * 0.87)}`
    + ` C${f(-w * 0.74)},${f(-len * 0.78)} ${f(-w * 1.14)},${f(-len * 0.6)} ${f(-w * 0.94)},${f(-len * 0.48)}`
    + ` C${f(-w * 1.06)},${f(-len * 0.28)} ${f(-w * 0.55)},${f(-len * 0.06)} 0,0Z`;
  const M = mau === 'xanh'
    ? { ngoai: 'url(#cx2)', trong: 'url(#cx1)', tam: '#E8F4FD', gan: '#F3FAFF' }
    : { ngoai: 'url(#ct2)', trong: 'url(#ct1)', tam: '#FFFDF0', gan: '#DCE5EF' };
  let s = `<g transform="translate(${f(x)},${f(y)}) rotate(${f(rot)})">`;
  for (const [off, k, wk, fill] of [[30, 1, 0.31, M.ngoai], [0, 0.9, 0.33, M.trong]]) {
    for (let i = 0; i < 6; i++) {
      const a = off + i * 60 + R(-6, 6);
      const len = size * k * R(0.93, 1.05), w = size * wk;
      s += `<g transform="rotate(${f(a)})"><path class="nf" d="${petal(len, w, R(-2, 2))}" fill="${fill}"/>`
        + `<path d="M0,${f(-len * 0.16)} Q${f(w * 0.12)},${f(-len * 0.5)} 0,${f(-len * 0.86)}" fill="none" stroke="${M.gan}" stroke-width="1.5" stroke-linecap="round" opacity=".9"/></g>`;
    }
  }
  for (let i = 0; i < 5; i++) {
    const a = 14 + i * 72 + R(-8, 8), len = size * R(0.4, 0.5), w = size * 0.17;
    s += `<g transform="rotate(${f(a)})"><path class="nf" d="${petal(len, w, 0)}" fill="${M.tam}"/></g>`;
  }
  s += `<circle r="${f(size * 0.07)}" fill="#F6E7B4" stroke="#5B7BA6" stroke-width=".8"/>`;
  return s + '</g>';
}
function rose(x, y, r, rot) {
  // hồng kem: viền ngoài năm cánh, bên trong là các lớp cánh xếp so le
  let s = `<g transform="translate(${f(x)},${f(y)}) rotate(${f(rot)})">`;
  const vien = [];
  for (let i = 0; i < 40; i++) {
    const a = i / 40 * 6.2832, k = 1 + 0.06 * Math.cos(5 * a);
    vien.push([Math.cos(a) * r * k, Math.sin(a) * r * k]);
  }
  s += `<path class="nf" d="${smoothClosed(vien)}" fill="#FFFDF5"/>`;
  for (const [k, fill, n, off] of [[0.8, '#FFFAEA', 3, 20], [0.6, '#FBF3DA', 3, 80], [0.4, '#F7EAC6', 2, 140], [0.22, '#F1DFAE', 2, 30]]) {
    const rr = r * k;
    s += `<circle r="${f(rr)}" fill="${fill}"/>`;
    for (let i = 0; i < n; i++) {
      const a0 = (off + i * (360 / n)) * Math.PI / 180, a1 = a0 + (360 / n - 24) * Math.PI / 180;
      s += `<path class="nk" d="M${f(Math.cos(a0) * rr)},${f(Math.sin(a0) * rr)} A${f(rr)},${f(rr)} 0 0 1 ${f(Math.cos(a1) * rr * 0.84)},${f(Math.sin(a1) * rr * 0.84)}"/>`;
    }
  }
  s += `<path class="nk" d="M${f(-r * 0.08)},${f(r * 0.03)} q${f(r * 0.08)},${f(-r * 0.2)} ${f(r * 0.2)},${f(-r * 0.05)}"/>`;
  return s + '</g>';
}
function hongMon(x, y, s, rot) {
  // hoa hồng môn nhuộm xanh: mo hình tim + lõi kem
  return `<g transform="translate(${f(x)},${f(y)}) rotate(${f(rot)})">`
    + `<path class="nf" fill="url(#cx1)" d="M0,0 C${f(-s * 0.35)},${f(s * 0.35)} ${f(-s * 0.95)},${f(s * 0.05)} ${f(-s * 0.8)},${f(-s * 0.5)}`
    + ` C${f(-s * 0.65)},${f(-s * 0.95)} ${f(-s * 0.2)},${f(-s * 1.1)} 0,${f(-s * 1.38)}`
    + ` C${f(s * 0.2)},${f(-s * 1.1)} ${f(s * 0.65)},${f(-s * 0.95)} ${f(s * 0.8)},${f(-s * 0.5)}`
    + ` C${f(s * 0.95)},${f(s * 0.05)} ${f(s * 0.35)},${f(s * 0.35)} 0,0Z"/>`
    + `<path d="M${f(-s * 0.55)},${f(-s * 0.3)} C${f(-s * 0.5)},${f(-s * 0.7)} ${f(-s * 0.2)},${f(-s * 0.92)} ${f(-s * 0.04)},${f(-s * 1.2)}" fill="none" stroke="#EAF5FD" stroke-width="2.6" stroke-linecap="round" opacity=".95"/>`
    + `<path d="M0,${f(-s * 0.12)} L0,${f(-s * 1.2)} M0,${f(-s * 0.3)} Q${f(s * 0.4)},${f(-s * 0.4)} ${f(s * 0.62)},${f(-s * 0.62)} M0,${f(-s * 0.3)} Q${f(-s * 0.4)},${f(-s * 0.4)} ${f(-s * 0.62)},${f(-s * 0.62)}" fill="none" stroke="#7FAFDD" stroke-width="1" stroke-linecap="round" opacity=".8"/>`
    + `<path d="M0,${f(-s * 0.08)} Q${f(s * 0.14)},${f(-s * 0.42)} ${f(s * 0.08)},${f(-s * 0.74)}" fill="none" stroke="#5B7BA6" stroke-width="${f(s * 0.2 + 2)}" stroke-linecap="round"/>`
    + `<path d="M0,${f(-s * 0.08)} Q${f(s * 0.14)},${f(-s * 0.42)} ${f(s * 0.08)},${f(-s * 0.74)}" fill="none" stroke="#F8EDC4" stroke-width="${f(s * 0.2)}" stroke-linecap="round"/>`
    + '</g>';
}
function tulip(x, y, s, rot) {
  // nụ tulip trắng
  return `<g transform="translate(${f(x)},${f(y)}) rotate(${f(rot)})">`
    + `<path class="nf" fill="url(#ct1)" d="M0,0 C${f(-s * 0.55)},${f(-s * 0.1)} ${f(-s * 0.62)},${f(-s * 0.8)} ${f(-s * 0.14)},${f(-s * 1.28)} Q0,${f(-s * 1.02)} ${f(s * 0.14)},${f(-s * 1.28)} C${f(s * 0.62)},${f(-s * 0.8)} ${f(s * 0.55)},${f(-s * 0.1)} 0,0Z"/>`
    + `<path class="nk" d="M${f(-s * 0.14)},${f(-s * 1.22)} Q${f(s * 0.06)},${f(-s * 0.6)} 0,${f(-s * 0.06)} M${f(s * 0.14)},${f(-s * 1.22)} Q${f(s * 0.34)},${f(-s * 0.6)} ${f(s * 0.14)},${f(-s * 0.1)}"/>`
    + '</g>';
}
function cumSao(x, y, n, spread) {
  // chùm hoa sao xanh nhỏ: vài nụ + các bông năm cánh
  let s = '';
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.2832 + R(-0.5, 0.5), d = spread * (i === 0 ? 0.1 : R(0.55, 1));
    pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d]);
  }
  s += `<path d="${pts.map((p) => `M${f(x)},${f(y)}L${P(p)}`).join('')}" stroke="#7FA98A" stroke-width="1.2" fill="none"/>`;
  for (let i = 0; i < 3; i++) {
    const a = R(0, 6.2832), d = spread * R(0.9, 1.25);
    s += `<ellipse cx="${f(x + Math.cos(a) * d)}" cy="${f(y + Math.sin(a) * d)}" rx="2.6" ry="3.8" transform="rotate(${f(R(0, 180))} ${f(x + Math.cos(a) * d)} ${f(y + Math.sin(a) * d)})" fill="#B9D3C4" stroke="#5B7BA6" stroke-width=".7"/>`;
  }
  for (const p of pts) s += hoaSao(p[0], p[1], R(1.1, 1.45), R(0, 72));
  return s;
}
function ren(x, y, r, rot) {
  return `<use href="#ren" transform="translate(${f(x)},${f(y)}) rotate(${f(rot)}) scale(${f(r / 7)})"/>`;
}
function hatDa(x, y, r) {
  // hạt đá nhỏ đính trên cánh hoa
  return `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="#E4F6FF" stroke="#6FB2DA" stroke-width=".8"/><circle cx="${f(x - r * 0.3)}" cy="${f(y - r * 0.3)}" r="${f(r * 0.35)}" fill="#FFFFFF"/>`;
}
function hoaSao(x, y, s, rot) {
  return `<use href="#sao5" transform="translate(${f(x)},${f(y)}) rotate(${f(rot)}) scale(${f(s)})"/>`;
}
function lapLanh(x, y, r) {
  const k = r * 0.22;
  return `<path class="ll" style="animation-delay:${f(R(0, 3.2))}s" d="M${f(x)},${f(y - r)} Q${f(x + k)},${f(y - k)} ${f(x + r)},${f(y)} Q${f(x + k)},${f(y + k)} ${f(x)},${f(y + r)} Q${f(x - k)},${f(y + k)} ${f(x - r)},${f(y)} Q${f(x - k)},${f(y - k)} ${f(x)},${f(y - r)}Z"/>`;
}

/* Toạ độ đoá hoa (theo hệ của cô gái): tay cầm ở T, tâm bông ở F */
const BO = (() => {
  const T = [-13, 351], F = [98, 226];
  const len = Math.hypot(F[0] - T[0], F[1] - T[1]);
  const u = [(F[0] - T[0]) / len, (F[1] - T[1]) / len];
  const v = [-u[1], u[0]];
  const bp = (a, b) => [F[0] + a * u[0] + b * v[0], F[1] + a * u[1] + b * v[1]];
  const goc = Math.atan2(u[0], -u[1]) * 180 / Math.PI; // góc để "hướng lên" trùng trục bó hoa
  return { T, F, u, v, bp, goc, len };
})();
const P = (pt) => `${f(pt[0])},${f(pt[1])}`;

function boHoa() {
  const { T, bp, goc, u, v } = BO;
  const Tl = [T[0] - 9 * v[0], T[1] - 9 * v[1]], Tr = [T[0] + 9 * v[0], T[1] + 9 * v[1]];
  const gocV = Math.atan2(v[1], v[0]);
  // hướng (độ) của vectơ (a,b) trong hệ bó hoa, để xoay lá chĩa ra ngoài
  const huong = (a, b) => Math.atan2(a * u[1] + b * v[1], a * u[0] + b * v[0]) * 180 / Math.PI;
  const cham = (d, w = 6, gap = 8.5) => `<path d="${d}" fill="none" stroke="#FFFFFF" stroke-width="${w}" stroke-dasharray="0.1 ${gap}" stroke-linecap="round"/>`;
  let s = '<g id="bo-hoa">';

  // --- cán hoa (thò ra dưới bàn tay)
  s += `<path d="M${P(T)} L-58,400" stroke="${INK}" stroke-width="18" stroke-linecap="round"/>`;
  s += `<path d="M${P(T)} L-58,400" stroke="#F1F6FA" stroke-width="14" stroke-linecap="round"/>`;
  s += `<path d="M-40,374 l10,9 M-48,383 l10,9" stroke="#9FD5EA" stroke-width="3" stroke-linecap="round"/>`;

  // --- giấy gói phía sau: hai lớp xoè như quạt, mép ren vỏ sò
  const sau = `M${P(Tl)} L${P(bp(18, -124))} Q${P(bp(58, -94))} ${P(bp(112, -84))} Q${P(bp(114, -38))} ${P(bp(148, 2))} Q${P(bp(110, 44))} ${P(bp(104, 98))} Q${P(bp(48, 102))} ${P(bp(6, 128))} L${P(Tr)}Z`;
  s += `<path class="n" d="${sau}" fill="#E4EDF5"/>` + cham(sau);
  const sau2 = `M${P(Tl)} L${P(bp(38, -106))} Q${P(bp(72, -70))} ${P(bp(126, -40))} Q${P(bp(106, 10))} ${P(bp(130, 56))} Q${P(bp(68, 78))} ${P(bp(28, 112))} L${P(Tr)}Z`;
  s += `<path class="n nh" d="${sau2}" fill="#F5F9FC"/>` + cham(sau2, 4.5, 7);
  // ren thêu dọc mép giấy
  for (const [a, b, r] of [[44, -108, 7], [74, -92, 6], [100, -78, 7], [124, -60, 6], [138, -22, 7], [140, 10, 6], [124, 38, 7], [112, 72, 6], [86, 92, 7], [54, 104, 6], [24, 116, 6]]) {
    s += ren(...bp(a, b), r, R(0, 60));
  }

  // --- nền hoa cho đầy, không hở giấy
  s += `<path d="${blob(...bp(28, -4), 90, 80, 14, 0.07, gocV)}" fill="#CFE3F3"/>`;
  s += `<path d="${blob(...bp(30, -4), 80, 62, 12, 0.1, gocV)}" fill="#B7D5EF" opacity=".85"/>`;
  // lá đệm thò ra quanh mép
  for (const [a, b, len, lech] of [[104, -44, 30, 0], [114, 34, 28, 10], [124, -6, 26, -8], [44, -100, 30, 12], [70, 88, 28, -10], [18, 110, 30, 0], [-24, -86, 28, 20], [-40, 84, 28, -10], [88, 70, 24, 14]]) {
    s += la(...bp(a - 14, b * 0.86), len, huong(a - 20, b) + lech, pick(['#8FB79A', '#7FAA8C', '#9CC2A4']));
  }

  // --- hoa, vẽ từ sau ra trước
  s += hongMon(...bp(88, -30), 36, goc - 12);
  for (const [a, b, r] of [[50, 104, goc + 66], [60, 96, goc + 48], [74, 88, goc + 30]]) s += tulip(...bp(a, b), 17, r);
  s += lily(...bp(64, -82), 30, goc - 60, 'trang');
  s += cumSao(...bp(102, 62), 7, 19);
  s += rose(...bp(100, 20), 18, 10);
  s += lily(...bp(6, 96), 30, goc + 70, 'trang');
  s += cumSao(...bp(30, 108), 5, 13);
  s += rose(...bp(14, -80), 20, -20);
  s += rose(...bp(56, 52), 20, 40);
  s += lily(...bp(44, -14), 52, goc + 8);
  s += hongMon(...bp(-20, -84), 30, goc - 112);
  s += cumSao(...bp(-10, -50), 7, 17);
  s += lily(...bp(-12, 30), 50, goc + 50);
  s += rose(...bp(-38, 66), 18, 70);
  s += rose(...bp(-46, -16), 23, 0);
  s += cumSao(...bp(-54, 28), 4, 10);
  s += cumSao(...bp(78, -66), 4, 11);
  // hạt đá đính trên cánh
  for (const [a, b] of [[62, 4], [30, -36], [10, 46], [-30, 12], [72, -30], [-2, -66], [42, 72], [-44, 52], [90, 30], [22, 8], [-40, -30], [60, -56]]) {
    s += hatDa(...bp(a, b), R(1.8, 2.6));
  }

  // --- giấy gói phía trước: hai vạt chéo nhau, khoét sâu để lộ nhiều hoa
  const phaiMep = `M${P(bp(-10, 122))} Q${P(bp(-30, 64))} ${P(bp(-74, -6))}`;
  s += `<path class="n" d="M${P(Tr)} L${P(bp(-10, 122))} Q${P(bp(-30, 64))} ${P(bp(-74, -6))} L${P(Tl)}Z" fill="#EEF4F9"/>` + cham(phaiMep);
  const traiMep = `M${P(bp(-24, -120))} Q${P(bp(-50, -52))} ${P(bp(-82, 26))}`;
  s += `<path class="n" d="M${P(Tl)} L${P(bp(-24, -120))} Q${P(bp(-50, -52))} ${P(bp(-82, 26))} L${P(Tr)}Z" fill="#F8FBFD"/>` + cham(traiMep);
  s += `<path d="M${P(bp(-35, -108))} Q${P(bp(-60, -46))} ${P(bp(-92, 22))}" fill="none" stroke="#B4C6DB" stroke-width="1" stroke-dasharray="3 4"/>`;
  s += `<path d="M${P(bp(-24, 110))} Q${P(bp(-42, 58))} ${P(bp(-84, 0))}" fill="none" stroke="#B4C6DB" stroke-width="1" stroke-dasharray="3 4"/>`;
  // ren thêu trên vạt trước
  for (const [a, b, r] of [[-50, -84, 7], [-70, -52, 6], [-92, -22, 6], [-112, 2, 5], [-62, 86, 7], [-78, 52, 6], [-100, 26, 5], [-128, -8, 4.5]]) {
    s += ren(...bp(a, b), r, R(0, 60));
  }
  // nếp gấp giấy
  s += `<path class="nm" d="M${P(T)} Q${P(bp(-104, -34))} ${P(bp(-44, -86))}"/>`;
  s += `<path class="nm" d="M${P(T)} Q${P(bp(-96, 42))} ${P(bp(-46, 92))}"/>`;
  // nơ ruy băng xanh buộc ở cổ bó hoa
  const [nx, ny] = bp(-(BO.len - 26), 0);
  s += `<g transform="translate(${f(nx)},${f(ny)}) rotate(${f(goc)}) scale(.82)">`
    + `<path class="n nh" fill="#9FD8EC" d="M0,0 C-8,-16 -30,-18 -32,-4 C-33,8 -12,10 0,0Z"/>`
    + `<path class="n nh" fill="#9FD8EC" d="M0,0 C8,-16 30,-18 32,-4 C33,8 12,10 0,0Z"/>`
    + `<path d="M-6,-3 C-14,-10 -24,-10 -27,-4 M6,-3 C14,-10 24,-10 27,-4" fill="none" stroke="#D5F0F8" stroke-width="1.6" stroke-linecap="round"/>`
    + `<rect class="n nh" x="-5" y="-6" width="10" height="11" rx="3.5" fill="#86CBE3"/></g>`;
  return s + '</g>';
}

/* ============================================================
   VÁY (hai phương án, bấm nút để đổi)
   ============================================================ */
function vienRen(y0, dy) {
  // viền ren chân váy: dải trắng lượn vỏ sò
  const p0 = [-90, y0], p1 = [-44, y0 + 11], p2 = [44, y0 + 11], p3 = [90, y0];
  const N = 11;
  let d = `M${P(p0)} C${P(p1)} ${P(p2)} ${P(p3)}`;
  const pts = [];
  for (let i = 0; i <= N; i++) pts.push(cubic(p0, p1, p2, p3, i / N));
  d += ` L${f(pts[N][0] + 1)},${f(pts[N][1] + dy)}`;
  for (let i = N - 1; i >= 0; i--) {
    const a = pts[i + 1], b = pts[i];
    d += ` Q${f((a[0] + b[0]) / 2)},${f((a[1] + b[1]) / 2 + dy + 11)} ${f(b[0] - (i === 0 ? 1 : 0))},${f(b[1] + dy)}`;
  }
  d += 'Z';
  let s = `<path class="n nh" d="${d}" fill="#FFFFFF"/>`;
  for (let i = 0; i < N; i++) {
    const a = pts[i], b = pts[i + 1];
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    s += `<circle cx="${f(mx)}" cy="${f(my + dy * 0.55)}" r="2.6" fill="none" stroke="#AFC3DC" stroke-width="1"/>`
      + `<path d="M${f(mx - 5)},${f(my + dy * 0.2)} q5,-4 10,0" fill="none" stroke="#AFC3DC" stroke-width="1"/>`;
  }
  return s;
}

function vayLua() {
  const c = '#C3DBF3', sh = '#A3C4E8', hi = '#E8F2FC';
  let s = '<g id="vay-lua">';
  s += `<path d="M-38,146 L-45,197 M38,146 L45,197" fill="none" stroke="${INK}" stroke-width="4.8" stroke-linecap="round"/>`;
  s += `<path d="M-38,146 L-45,197 M38,146 L45,197" fill="none" stroke="${hi}" stroke-width="2.4" stroke-linecap="round"/>`;
  const than = 'M-45,195 C-56,204 -68,212 -73,224 C-71,252 -60,280 -56,304 C-66,340 -82,380 -86,424 L-90,478 C-44,489 44,489 90,478 L86,424 C82,380 66,340 56,304 C60,280 71,252 73,224 C68,212 56,204 45,195 L5,247 Q0,253 -5,247 Z';
  s += `<path class="n" fill="${c}" d="${than}"/>`;
  // mảng tối bên phải (nắng chiếu từ trái)
  s += `<path fill="${sh}" opacity=".75" d="M14,252 C34,300 46,380 42,486 C60,484 78,481 90,478 L86,424 C82,380 66,340 56,304 C60,280 71,252 73,224 C60,236 34,250 14,252Z"/>`;
  // vệt sáng lụa
  s += `<path fill="${hi}" opacity=".85" d="M-56,330 C-66,380 -74,430 -76,474 L-62,478 C-60,430 -54,380 -46,332Z"/>`;
  s += `<path fill="${hi}" opacity=".8" d="M-62,226 C-56,246 -40,254 -24,250 C-38,244 -48,232 -52,212Z"/>`;
  // đường ráp dưới ngực + nụ hồng nhỏ
  s += `<path class="nm" d="M-71,238 C-44,264 -14,258 0,251 C14,258 44,264 71,238"/>`;
  s += `<circle cx="0" cy="251" r="4" fill="#F2A9B5" stroke="${INK}" stroke-width="1"/>`;
  // vạt đắp chéo
  s += `<path fill="${sh}" opacity=".5" d="M-88,452 C-38,446 32,420 85,386 L86,400 C34,432 -36,458 -89,466Z"/>`;
  s += `<path class="nm" d="M-88,452 C-38,446 32,420 85,386"/>`;
  s += vienRen(478, 20);
  return s + '</g>';
}

function vayBacHa() {
  const c = '#C6E7DC', sh = '#A4D4C4', hi = '#E6F5EF', no = '#96CDBA';
  let s = '<g id="vay-bac-ha">';
  // đuôi nơ xếp ly thả sau lưng (bên phải)
  s += `<path class="n" fill="${no}" d="M48,300 L112,304 C120,368 116,436 110,498 L64,500 C62,434 58,366 48,300Z"/>`;
  for (let i = 1; i < 7; i++) {
    const t = i / 7;
    s += `<path class="nm" d="M${f(50 + t * 60)},302 C${f(56 + t * 60)},370 ${f(60 + t * 54)},440 ${f(64 + t * 46)},499"/>`;
  }
  // lớp voan trắng ló dưới gấu
  let voan = 'M-98,468';
  for (let x = -98; x < 98; x += 28) voan += ` q14,34 28,0`;
  voan += ' L98,452 L-98,452Z';
  s += `<path class="n" fill="#FFFFFF" d="${voan}"/>`;
  // chân váy chữ A phồng
  s += `<path class="n" fill="${c}" d="M-57,304 C-70,350 -96,410 -102,456 C-104,476 -92,484 -76,482 C-30,490 30,490 76,482 C92,484 104,476 102,456 C96,410 70,350 57,304 Z"/>`;
  s += `<path fill="${sh}" opacity=".75" d="M20,312 C44,360 60,430 58,486 C66,485 72,484 76,482 C92,484 104,476 102,456 C96,410 70,350 57,304Z"/>`;
  s += `<path fill="${hi}" opacity=".85" d="M-58,330 C-72,380 -86,430 -88,468 L-72,474 C-70,430 -60,380 -46,332Z"/>`;
  s += `<path class="nm" d="M-20,314 C-26,370 -30,430 -30,484 M24,314 C30,370 34,430 34,484"/>`;
  // thân trên cúp ngực, cổ khoét chữ V
  s += `<path class="n" fill="${c}" d="M-73,224 C-66,210 -56,194 -42,190 C-28,188 -14,208 0,240 C14,208 28,188 42,190 C56,194 66,210 73,224 C71,252 63,282 59,306 L-59,306 C-63,282 -71,252 -73,224 Z"/>`;
  s += `<path fill="${sh}" opacity=".75" d="M12,222 C30,250 40,280 40,306 L59,306 C63,282 71,252 73,224 C66,210 56,194 42,190 C30,190 20,204 12,222Z"/>`;
  s += `<path fill="${hi}" opacity=".8" d="M-62,226 C-58,206 -50,196 -40,196 C-46,206 -50,220 -50,238Z"/>`;
  s += `<path class="nm" d="M-34,196 C-30,236 -30,270 -32,300 M34,196 C30,236 30,270 32,300"/>`;
  // đai eo
  s += `<path class="n nh" fill="${sh}" d="M-59,299 L59,299 L57,313 L-57,313Z"/>`;
  // nơ lớn sau eo
  s += `<path class="n" fill="${no}" d="M56,300 C72,268 108,262 124,280 C132,292 126,312 110,318 C92,322 70,316 56,304Z"/>`;
  for (let i = 0; i < 5; i++) s += `<path class="nm" d="M60,${f(301 + i * 0.6)} Q${f(92 + i * 2)},${f(272 + i * 9)} ${f(122 - i * 2)},${f(282 + i * 8)}"/>`;
  s += `<rect class="n nh" x="50" y="294" width="13" height="18" rx="4" fill="${c}"/>`;
  return s + '</g>';
}

/* ============================================================
   CÔ GÁI (không vẽ mắt) — gốc toạ độ: đỉnh đầu, trục giữa người
   ============================================================ */
function coGai() {
  const da = '#F8D9C6', daBong = '#EDBDA6', toc = '#7A4230', tocDam = '#512A1F', tocSang = '#AD6844';
  let s = '';

  // --- chân + giày
  s += `<path class="n" fill="${da}" d="M-64,470 C-66,516 -58,552 -52,584 C-56,618 -50,668 -44,712 L-22,712 C-16,668 -10,618 -14,584 C-10,552 -5,516 -3,470 Z"/>`;
  s += `<path class="n" fill="${da}" d="M3,470 C5,516 10,552 14,584 C10,618 16,668 22,712 L44,712 C50,668 56,618 52,584 C58,552 66,516 64,470 Z"/>`;
  s += `<path fill="${daBong}" opacity=".7" d="M-62,474 L-5,474 L-7,516 C-24,523 -44,521 -60,512Z"/>`;
  s += `<path fill="${daBong}" opacity=".7" d="M5,474 L62,474 L60,512 C44,521 24,523 7,516Z"/>`;
  s += `<path fill="${daBong}" opacity=".5" d="M34,520 C44,570 46,640 40,710 L44,712 C50,668 56,618 52,584 C57,556 62,534 62,514Z"/>`;
  s += `<path class="nm" d="M-42,580 q8,6 17,0 M25,580 q8,6 17,0"/>`;
  s += `<path class="n" fill="#F5F8FB" d="M-50,706 C-57,724 -52,740 -33,740 C-16,740 -11,724 -16,706 Z"/>`;
  s += `<path class="n" fill="#F5F8FB" d="M16,706 C11,724 16,740 33,740 C52,740 57,724 50,706 Z"/>`;

  // --- cổ, vai, ngực
  s += `<path class="n" fill="${da}" d="M-15,96 C-15,118 -17,130 -23,139 C-42,146 -62,148 -80,158 C-90,166 -92,180 -88,200 L-72,226 L72,226 L88,200 C92,180 90,166 80,158 C62,148 42,146 23,139 C17,130 15,118 15,96 Z"/>`;
  s += `<path fill="${daBong}" opacity=".7" d="M-15,101 C-6,113 6,113 15,101 C12,120 -12,120 -15,101Z"/>`;
  s += `<path class="nm" d="M-46,160 Q-28,167 -12,162 M46,160 Q28,167 12,162"/>`;

  // --- váy
  s += vayLua();
  s += vayBacHa();

  // --- cánh tay bên phải tranh: phải vẽ SAU váy để cẳng tay nằm trước váy
  //     (bắp tay sẽ bị bó hoa che, cẳng tay đỡ dưới bó hoa rồi vòng ra nắm cổ bó)
  s += `<path class="n" fill="${da}" d="M70,152 C86,152 98,164 100,184 C106,226 124,272 128,308 C130,328 122,344 108,348 C80,356 46,366 14,374 L8,344 C40,338 72,326 96,312 C90,280 78,240 72,204 C70,186 70,168 70,152 Z"/>`;
  s += `<path fill="${daBong}" opacity=".4" d="M122,334 C102,347 62,358 16,368 L14,374 C46,366 80,356 108,348 C116,346 121,341 122,334Z"/>`;

  // --- ruy băng thả từ chỗ buộc
  const ruy = (pts, w) => {
    const d = smoothOpen(pts);
    return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 2.6}" stroke-linecap="butt"/>`
      + `<path d="${d}" fill="none" stroke="#9FD8EC" stroke-width="${w}" stroke-linecap="butt"/>`
      + `<path d="${d}" fill="none" stroke="#D5F0F8" stroke-width="${f(w * 0.25)}" stroke-linecap="butt" opacity=".9"/>`;
  };
  s += ruy([[-30, 372], [-40, 410], [-30, 450], [-44, 496]], 9);
  s += ruy([[-16, 368], [-8, 420], [-16, 470], [-2, 528]], 10);
  s += ruy([[-22, 370], [-22, 400], [-12, 440], [-24, 478]], 8);

  // --- cánh tay bên trái tranh
  s += `<path class="n" fill="${da}" d="M-70,152 C-86,152 -98,164 -100,184 C-106,226 -114,262 -114,292 C-114,306 -106,316 -94,318 C-82,334 -68,354 -56,374 L-38,358 C-50,342 -64,322 -78,300 C-80,270 -76,236 -72,204 C-70,186 -70,168 -70,152 Z"/>`;
  s += `<path fill="${daBong}" opacity=".28" d="M-78,300 C-80,270 -76,236 -72,204 L-80,206 C-86,240 -90,270 -90,298Z"/>`;
  // xoá nét nối vai để cánh tay liền với vai
  s += `<path fill="${da}" d="M-75,155 C-70,153.8 -66,154.4 -65.5,160 L-66,190 L-76,194 C-81,180 -81,166 -75,155Z"/>`;

  // --- đầu (nghiêng nhẹ về phía bó hoa)
  s += '<g transform="rotate(4 0 118)">';
  // búi tóc
  s += `<path class="n" fill="${toc}" d="${blob(8, -38, 31, 27, 11, 0.07)}"/>`;
  s += `<path d="M-12,-44 C-2,-62 24,-62 32,-42 M-6,-30 C6,-48 26,-46 30,-28 M2,-56 C10,-50 16,-42 16,-30" fill="none" stroke="${tocDam}" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`;
  s += `<path d="M-14,-52 C-22,-58 -28,-56 -32,-50 M30,-56 C38,-62 44,-58 46,-52 M12,-66 C12,-72 16,-76 20,-76" fill="none" stroke="${toc}" stroke-width="2" stroke-linecap="round"/>`;
  // tai
  s += `<path class="n" fill="${da}" d="M-41,56 C-50,52 -52,66 -47,76 C-45,80 -42,80 -40,76Z"/>`;
  s += `<path class="n" fill="${da}" d="M41,56 C50,52 52,66 47,76 C45,80 42,80 40,76Z"/>`;
  // mặt
  s += `<path class="n" fill="${da}" d="M-42,48 C-43,14 -26,-4 0,-4 C26,-4 43,14 42,48 C42,74 28,98 10,107 C4,110 -4,110 -10,107 C-28,98 -42,74 -42,48 Z"/>`;
  // má hồng + nụ cười nhỏ (không vẽ mắt)
  s += `<ellipse cx="-22" cy="74" rx="11" ry="7" fill="#F2A39C" opacity=".5"/>`;
  s += `<ellipse cx="22" cy="74" rx="11" ry="7" fill="#F2A39C" opacity=".5"/>`;
  s += `<path id="mieng" d="M-7,89 Q0,95 7,89" fill="none" stroke="#D2706E" stroke-width="2.2" stroke-linecap="round"/>`;
  // tóc phủ đỉnh đầu + mái thưa
  s += `<path fill="${toc}" d="M-46,62 C-55,30 -51,-6 -22,-18 C-8,-23 12,-23 24,-17 C51,-5 55,30 46,62`
    + ` C45,50 42,41 37,32 C28,23 14,19 2,21 C-12,19 -27,23 -37,32 C-42,41 -45,50 -46,62 Z"/>`;
  s += `<path class="n" fill="none" d="M-46,62 C-55,30 -51,-6 -22,-18 C-8,-23 12,-23 24,-17 C51,-5 55,30 46,62"/>`;
  // mái thưa: một lớp tóc mỏng nhìn xuyên thấy trán, thêm vài sợi rõ nét rẽ nhẹ sang hai bên
  s += `<path fill="${toc}" opacity=".5" d="M37,32 C39,38 38,43 35,46 C30,50 24,51 18,49 C13,51 8,50 5,46 C3,43 1,43 -1,46`
    + ` C-5,50 -11,51 -17,49 C-23,51 -29,50 -34,46 C-38,43 -39,38 -37,32 C-27,23 -12,19 2,21 C14,19 28,23 37,32Z"/>`;
  const mai = [
    [5, 21, 8, 34, 6, 47, 1.8], [10, 21, 15, 33, 14, 50, 2.2], [16, 22, 22, 33, 23, 49, 1.7], [22, 23, 29, 33, 31, 47, 2.2], [29, 26, 35, 33, 36, 43, 1.8],
    [-1, 21, -5, 34, -3, 47, 1.8], [-6, 21, -12, 33, -11, 50, 2.2], [-12, 22, -19, 33, -20, 49, 1.7], [-19, 23, -26, 33, -28, 47, 2.2], [-26, 26, -33, 33, -34, 43, 1.8],
  ];
  for (const [x0, y0, cx, cy, x1, y1, w] of mai) {
    s += `<path d="M${x0},${y0} Q${cx},${cy} ${x1},${y1}" fill="none" stroke="${toc}" stroke-width="${w}" stroke-linecap="round"/>`;
  }
  // lọn tóc mai hai bên
  s += `<path d="M-41,36 C-49,50 -50,66 -46,80 C-45,84 -46,88 -48,90 M-44,44 C-48,56 -48,66 -47,74" fill="none" stroke="${toc}" stroke-width="2.4" stroke-linecap="round"/>`;
  s += `<path d="M41,36 C49,50 50,66 46,80 C45,84 46,88 48,90 M44,44 C48,56 48,66 47,74" fill="none" stroke="${toc}" stroke-width="2.4" stroke-linecap="round"/>`;
  // nếp tóc chải lên búi
  s += `<path d="M-32,22 C-26,0 -8,-14 4,-17 M32,22 C28,2 16,-12 8,-17 M-2,26 C-2,6 2,-8 6,-17 M-42,34 C-40,8 -22,-10 -8,-16 M42,34 C42,10 30,-8 18,-15" fill="none" stroke="${tocDam}" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`;
  s += `<path d="M-22,14 C-16,0 -6,-8 2,-11 M20,10 C18,2 14,-4 10,-8" fill="none" stroke="${tocSang}" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>`;
  // hoa tai ngọc trai
  s += `<circle cx="-45" cy="82" r="3.4" fill="#FFFFFF" stroke="${INK}" stroke-width="1.2"/>`;
  s += `<circle cx="45" cy="82" r="3.4" fill="#FFFFFF" stroke="${INK}" stroke-width="1.2"/>`;
  s += '</g>';

  // --- bó hoa
  s += boHoa();

  // --- hai bàn tay ôm bó hoa
  s += `<path class="n" fill="${da}" d="M16,343 C4,337 -14,337 -25,343 C-34,349 -33,365 -24,371 C-10,377 4,377 16,374 Z"/>`;
  s += `<path fill="${da}" d="M10,346 L20,345 L20,372 L10,373Z"/>`;
  s += `<path class="nm" d="M-26,349 q8,3 15,0 M-29,357 q9,3 17,0 M-26,365 q8,2 14,0"/>`;
  s += `<path class="n" fill="${da}" d="M-57,366 C-60,380 -52,391 -39,391 C-28,391 -19,384 -19,375 C-19,366 -28,359 -39,357 Z"/>`;
  s += `<path class="nm" d="M-25,369 q-8,1 -12,6 M-22,376 q-8,2 -13,7 M-27,384 q-6,0 -10,4"/>`;
  return s;
}

/* ============================================================
   GHÉP CẢNH
   ============================================================ */
function canh() {
  let s = '';

  // trời + nắng
  s += `<rect x="-12" y="-12" width="${W + 24}" height="780" fill="url(#troi)"/>`;
  s += `<circle cx="262" cy="296" r="170" fill="url(#quang)"/>`;
  s += `<circle cx="262" cy="296" r="52" fill="#FFF9E6"/>`;
  s += may(560, 150, 230, 0.75) + may(790, 245, 170, 0.6) + may(120, 420, 190, 0.55) + may(480, 300, 120, 0.5);
  // vài cánh chim
  s += `<path d="M612,214 q8,-9 15,0 q8,-8 15,1 M664,250 q6,-7 11,0 q6,-6 11,1 M560,238 q5,-6 9,0 q5,-5 9,1" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>`;

  // LangBiang hai đỉnh
  s += doi(langbiang, 760, '#BCD1DF', 'stroke="#8CA3B8" stroke-width="1.4"');
  let gach = '';
  for (const [cx, w] of DINH) {
    for (let i = 0; i < 9; i++) {
      const x = cx + 8 + i * (w * 0.2), y = langbiang(x) + 6 + i * 2;
      gach += `M${f(x)},${f(y)}l${f(-10 - i)},${f(22 + i * 2)}`;
    }
  }
  s += `<path d="${gach}" fill="none" stroke="#8CA3B8" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>`;
  s += `<g filter="url(#mo)" fill="#FFFFFF"><ellipse cx="600" cy="560" rx="340" ry="26" opacity=".85"/><ellipse cx="170" cy="578" rx="260" ry="22" opacity=".8"/></g>`;
  s += may(752, 550, 250, 0.85) + may(868, 562, 130, 0.8);

  // dãy đồi xa có rặng thông nhỏ
  s += thongXa(ridge2, -10, W + 10, 12, 24, '#93B5BB');
  s += doi(ridge2, 760, '#A5C3C8');
  s += `<g filter="url(#mo)" fill="#FFFFFF"><ellipse cx="330" cy="646" rx="330" ry="18" opacity=".75"/><ellipse cx="780" cy="640" rx="200" ry="16" opacity=".7"/></g>`;

  // hai sườn đồi thông ôm lấy hồ
  let doi3 = '<g id="doi3">';
  doi3 += thongXa(doi3T, -10, 520, 16, 30, '#5E918E');
  doi3 += doi(doi3T, HO_Y, '#7FAAA6');
  doi3 += thongXa(doi3P, 380, W + 10, 16, 30, '#558986');
  doi3 += doi(doi3P, HO_Y, '#72A09D');
  doi3 += rungThong(doi3T, -10, 500, 34, '#4E817D', '#5C8F8A', '#5B4A44');
  doi3 += rungThong(doi3P, 420, W + 10, 34, '#487A77', '#56898A', '#5B4A44');
  doi3 += bietThu(226, 716, 1) + bietThu(318, 728, 0.8);
  doi3 += nhaTho(276, 700);
  doi3 += thongVua(254, 722, 36, '#4E817D', '#5C8F8A', '#5B4A44') + thongVua(304, 716, 30, '#4E817D', '#5C8F8A', '#5B4A44');
  doi3 += '</g>';
  s += doi3;

  // mặt hồ + bóng đồi in xuống nước
  s += `<rect x="-12" y="${HO_Y}" width="${W + 24}" height="170" fill="url(#ho)"/>`;
  s += `<g clip-path="url(#cat-ho)" opacity=".3"><use href="#doi3" transform="translate(0,${HO_Y * 2}) scale(1,-1)"/></g>`;
  s += `<rect x="-12" y="${HO_Y}" width="${W + 24}" height="170" fill="url(#ho-suong)"/>`;
  let song = '';
  for (let i = 0; i < 26; i++) {
    const y = R(HO_Y + 8, HO_Y + 118), x = R(0, W), l = R(18, 70);
    song += `M${f(x)},${f(y)}h${f(l)}`;
  }
  s += `<path d="${song}" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity=".8" fill="none"/>`;
  s += `<g filter="url(#mo)" fill="#FFFFFF"><ellipse cx="450" cy="${HO_Y + 4}" rx="380" ry="10" opacity=".8"/><ellipse cx="760" cy="790" rx="170" ry="12" opacity=".6"/></g>`;

  // đồng cỏ
  s += doi(dongCo, H + 12, 'url(#co)', `stroke="${INK}" stroke-width="1.6" stroke-opacity=".5"`);
  s += `<ellipse cx="330" cy="1010" rx="330" ry="70" fill="#C4E0B4" opacity=".55" filter="url(#mo)"/>`;
  // thông gần hai bên
  s += thongLon(158, dongCo(158) + 10, 400, 10);
  s += thongLon(752, dongCo(752) + 6, 236, -4);
  s += thongLon(832, dongCo(832) + 12, 318, 6);
  s += thongLon(890, dongCo(890) + 18, 392, -8);
  // dải cỏ hồng tháng mười một ở mép đồng cỏ
  let coHong = '';
  for (let i = 0; i < 150; i++) {
    const x = R(0, W), y = dongCo(x) + R(3, 30);
    coHong += `M${f(x)},${f(y)}q${f(R(-3, 3))},${f(-R(5, 9))} ${f(R(-5, 5))},${f(-R(10, 17))}`;
  }
  s += `<path d="${coHong}" fill="none" stroke="#E7A9C0" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>`;
  // bóng cây đổ trên cỏ
  s += `<g fill="#5E9A7C" opacity=".35" filter="url(#mo)"><ellipse cx="200" cy="892" rx="120" ry="12"/><ellipse cx="800" cy="900" rx="130" ry="13"/></g>`;
  // cỏ + hoa dại
  let co = '', hoaDai = '';
  for (let i = 0; i < 150; i++) {
    const x = R(0, W), y = R(dongCo(x) + 14, 1190), k = 0.6 + (y - 880) / 420;
    co += `M${f(x)},${f(y)}l${f(-3 * k)},${f(-9 * k)}M${f(x + 3 * k)},${f(y)}l${f(1 * k)},${f(-11 * k)}M${f(x + 6 * k)},${f(y)}l${f(4 * k)},${f(-8 * k)}`;
  }
  s += `<path d="${co}" fill="none" stroke="#4F8C6E" stroke-width="1.5" stroke-linecap="round" opacity=".75"/>`;
  for (let i = 0; i < 46; i++) {
    const x = R(0, W), y = R(dongCo(x) + 20, 1150), k = 0.7 + (y - 880) / 500;
    hoaDai += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(2.4 * k)}" fill="${pick(['#FFFFFF', '#FFFFFF', '#FBE7A6', '#F6C9DA'])}"/>`;
  }
  s += hoaDai;

  // bụi dã quỳ bên phải
  s += `<path class="n" d="${blob(820, 1010, 104, 74, 14, 0.14)}" fill="#5F9B72"/>`;
  s += `<path d="${blob(790, 990, 60, 40, 10, 0.2)}" fill="#7DB487" opacity=".8"/>`;
  for (let i = 0; i < 14; i++) s += la(R(730, 890), R(960, 1060), R(22, 34), R(-160, -20), pick(['#4F8C63', '#63A074']));
  for (const [x, y, k] of [[742, 962, 1], [786, 940, 1.15], [836, 950, 1.05], [880, 972, 1.2], [760, 1004, 1.2], [812, 992, 1.3], [862, 1020, 1.25], [724, 1030, 1.05], [796, 1044, 1.35], [846, 1068, 1.2], [896, 1046, 1.1]]) {
    s += daQuy(x, y, k, R(0, 30));
  }

  // bóng đổ dưới chân cô gái
  s += `<ellipse cx="${GAI.x + 34}" cy="${GAI.y + 728 * GAI.s}" rx="112" ry="15" fill="#3F7A60" opacity=".4" filter="url(#mo)"/>`;

  // hàng cẩm tú cầu phía sau (nằm sau lưng cô gái)
  const sau = [
    [44, 1104, 38, 'tim'], [128, 1122, 40, 'xanh'], [212, 1108, 36, 'trang'], [290, 1130, 38, 'xanh'],
    [596, 1128, 38, 'hong'], [676, 1108, 40, 'xanh'], [760, 1124, 38, 'tim'], [846, 1106, 40, 'xanh'],
  ];
  for (let i = 0; i < 22; i++) {
    const x = pick([R(-10, 330), R(560, W + 10)]);
    s += la(x, R(1100, 1160), R(30, 44), R(-170, -10), pick(['#4E8B6A', '#5C9A76', '#437C5E']));
  }
  for (const [x, y, r, p] of sau) s += tuCau(x, y, r, TU_CAU[p]);

  // cô gái
  s += `<g id="co-gai" transform="translate(${GAI.x},${GAI.y}) scale(${GAI.s})">${coGai()}</g>`;

  // cẩm tú cầu tiền cảnh (che bàn chân)
  const cum = [
    [70, 1178, 48, 'xanh'], [166, 1196, 46, 'hong'], [256, 1188, 46, 'xanh'], [336, 1184, 40, 'tim'],
    [410, 1178, 38, 'xanh'], [486, 1176, 38, 'trang'], [566, 1184, 42, 'xanh'], [660, 1184, 46, 'tim'],
    [758, 1198, 48, 'xanh'], [850, 1180, 46, 'hong'],
    [20, 1246, 46, 'trang'], [118, 1262, 48, 'tim'], [214, 1266, 46, 'xanh'], [306, 1262, 44, 'trang'],
    [392, 1266, 42, 'hong'], [476, 1264, 44, 'xanh'], [564, 1262, 46, 'tim'], [660, 1262, 46, 'xanh'],
    [760, 1270, 46, 'trang'], [852, 1256, 48, 'xanh'],
  ];
  let laTC = '';
  for (let i = 0; i < 46; i++) {
    const x = R(-10, W + 10);
    const y = R(1170, 1290);
    laTC += la(x, y, R(34, 52), R(-170, -10), pick(['#4E8B6A', '#5C9A76', '#437C5E']));
  }
  s += laTC;
  for (const [x, y, r, p] of cum) s += tuCau(x, y, r, TU_CAU[p]);

  // gốc thông to sát mép trái + cành rủ phía trên
  s += `<path class="n" fill="#5C4840" d="M10,1300 C26,900 42,500 50,-20 L98,-20 C92,500 98,900 116,1300 Z"/>`;
  s += `<path fill="#7A6358" opacity=".8" d="M30,1300 C40,900 52,500 58,-20 L68,-20 C62,500 56,900 54,1300Z"/>`;
  let vo = '';
  for (let i = 0; i < 26; i++) {
    const y = R(20, 1080), x = 50 + (1080 - y) * 0 + R(-18, 34) + y * 0.01;
    vo += `M${f(x)},${f(y)}q${f(R(-4, 4))},${f(R(14, 26))} ${f(R(-3, 3))},${f(R(30, 52))}`;
  }
  s += `<path d="${vo}" fill="none" stroke="#3E302B" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`;
  s += canhThong([[86, 236], [150, 214], [226, 206], [300, 176], [352, 168]], 7, 6);
  s += canhThong([[84, 92], [150, 70], [230, 76], [300, 48], [380, 52]], 6, 6);
  s += canhThong([[170, 212], [200, 250], [236, 268]], 4, 3);
  s += canhThong([[W + 10, 34], [840, 60], [770, 62], [706, 96], [660, 98]], 6, 5);
  s += canhThong([[W + 10, 150], [860, 158], [820, 190]], 4, 3);
  // tú cầu che gốc thông
  s += tuCau(30, 1200, 44, TU_CAU.trang) + tuCau(104, 1232, 40, TU_CAU.tim);
  return s;
}

function mepTranh() {
  // mép tranh loang lổ như màu nước dừng trên giấy
  const pts = [], m = 30;
  const step = 46;
  for (let x = m; x < W - m; x += step) pts.push([x + R(-8, 8), m + R(-9, 9)]);
  for (let y = m; y < H - m; y += step) pts.push([W - m + R(-9, 9), y + R(-8, 8)]);
  for (let x = W - m; x > m; x -= step) pts.push([x + R(-8, 8), H - m + R(-9, 9)]);
  for (let y = H - m; y > m; y -= step) pts.push([m + R(-9, 9), y + R(-8, 8)]);
  return smoothClosed(pts);
}

/* ---------- ký hiệu dùng lại ---------- */
function defs() {
  // bông tú cầu 4 cánh
  let h4 = '';
  for (const [x, y] of [[-3.3, -3.3], [3.3, -3.3], [3.3, 3.3], [-3.3, 3.3]]) h4 += `M${x - 3.7},${y}a3.7,3.7 0 1,0 7.4,0a3.7,3.7 0 1,0 -7.4,0`;
  // hoa sao 5 cánh
  let sao = '';
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 - 90) * Math.PI / 180, b = a + 0.55, c = a - 0.55;
    sao += `M0,0 Q${f(Math.cos(c) * 4.6)},${f(Math.sin(c) * 4.6)} ${f(Math.cos(a) * 7)},${f(Math.sin(a) * 7)} Q${f(Math.cos(b) * 4.6)},${f(Math.sin(b) * 4.6)} 0,0`;
  }
  // dã quỳ 13 cánh
  let dq = '';
  for (let i = 0; i < 13; i++) dq += `<ellipse cx="0" cy="-9.5" rx="2.9" ry="6.6" transform="rotate(${f(i * 27.7)})"/>`;
  return `<defs>
    <linearGradient id="troi" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#C6DCEB"/><stop offset=".4" stop-color="#E1ECEF"/><stop offset=".64" stop-color="#FBF0DF"/><stop offset="1" stop-color="#FBF0DF"/>
    </linearGradient>
    <radialGradient id="quang"><stop offset="0" stop-color="#FFF6D8" stop-opacity=".95"/><stop offset=".45" stop-color="#FFF3D6" stop-opacity=".45"/><stop offset="1" stop-color="#FFF3D6" stop-opacity="0"/></radialGradient>
    <linearGradient id="ho" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DCEAF0"/><stop offset="1" stop-color="#BBD7E3"/></linearGradient>
    <linearGradient id="ho-suong" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".1"/><stop offset=".6" stop-color="#E4EFF3" stop-opacity=".55"/><stop offset="1" stop-color="#D5E6EC" stop-opacity=".8"/></linearGradient>
    <linearGradient id="co" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ACD0A8"/><stop offset=".5" stop-color="#93C09B"/><stop offset="1" stop-color="#7BAE8C"/></linearGradient>
    <clipPath id="cat-ho"><rect x="-12" y="${HO_Y}" width="${W + 24}" height="170"/></clipPath>
    <clipPath id="mep"><path d="${mepTranh()}"/></clipPath>
    <filter id="mo" x="-30%" y="-120%" width="160%" height="340%"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="rung" x="-3%" y="-3%" width="106%" height="106%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="7" result="nhieu"/>
      <feDisplacementMap in="SourceGraphic" in2="nhieu" scale="4.5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="loang" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves="3" seed="11"/>
      <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.5 0 0 0 -0.55"/>
    </filter>
    <filter id="hat" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3"/>
      <feColorMatrix values="0 0 0 0 0.24  0 0 0 0 0.27  0 0 0 0 0.38  0 0 0 0.16 0"/>
    </filter>
    <linearGradient id="cx1" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#8FC0EC"/><stop offset=".55" stop-color="#B9DBF6"/><stop offset="1" stop-color="#E6F3FD"/></linearGradient>
    <linearGradient id="cx2" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#7BB0E4"/><stop offset=".6" stop-color="#A3CDF1"/><stop offset="1" stop-color="#D0E7FA"/></linearGradient>
    <linearGradient id="ct1" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#EEF2DC"/><stop offset=".5" stop-color="#FFFFFF"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>
    <linearGradient id="ct2" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#E2ECF4"/><stop offset=".6" stop-color="#F4F8FC"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>
    <g id="ren" fill="none" stroke="#A6BAD4" stroke-width=".9" stroke-linecap="round">
      <circle r="1.4"/>
      <ellipse cx="0" cy="-4.4" rx="2" ry="3"/><ellipse cx="0" cy="-4.4" rx="2" ry="3" transform="rotate(72)"/><ellipse cx="0" cy="-4.4" rx="2" ry="3" transform="rotate(144)"/><ellipse cx="0" cy="-4.4" rx="2" ry="3" transform="rotate(216)"/><ellipse cx="0" cy="-4.4" rx="2" ry="3" transform="rotate(288)"/>
      <path d="M7,6 q5,0 8,4 M7,6 q1,5 6,7"/>
    </g>
    <g id="h4"><path d="${h4}" stroke="${INK}" stroke-width=".7" stroke-opacity=".45"/><circle r="1.2" fill="#FFFFFF" opacity=".9"/></g>
    <g id="sao5"><path d="${sao}" fill="#86AEE2" stroke="${INK}" stroke-width=".8" stroke-opacity=".7"/><circle r="1.5" fill="#FFFFFF"/></g>
    <g id="dq"><g fill="#F4C23C" stroke="${INK}" stroke-width=".7" stroke-opacity=".6">${dq}</g><circle r="4.6" fill="#C9801F" stroke="${INK}" stroke-width=".7" stroke-opacity=".6"/></g>
  </defs>`;
}

/* ---------- những điểm lấp lánh trên bó hoa (nằm ngoài lớp rung để chớp nhẹ không tốn máy) ---------- */
function lopLapLanh() {
  const { bp } = BO;
  let s = '<g class="lap-lanh">';
  for (const [a, b, r] of [[56, -24, 6], [-2, 40, 5.5], [104, 14, 4.5], [-50, -24, 4.5], [96, -40, 4], [10, 92, 4], [20, -84, 4], [62, 48, 4], [-34, 70, 3.6], [70, -86, 3.6]]) {
    const [x, y] = bp(a, b);
    s += lapLanh(GAI.x + x * GAI.s, GAI.y + y * GAI.s, r * GAI.s);
  }
  return s + '</g>';
}

function svg() {
  const d = defs();
  const scene = canh();
  return `<svg class="tranh" id="tranh" data-vay="lua" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="tranh-ten">
  <title id="tranh-ten">Phác thảo: cô gái búi tóc, không vẽ mắt, ôm đoá hoa xanh trắng, đứng trên đồng cỏ Đà Lạt có đồi thông, mặt hồ sương và đỉnh LangBiang phía xa</title>
  ${d}
  <g filter="url(#rung)"><g clip-path="url(#mep)">
  ${scene}
  <rect x="0" y="0" width="${W}" height="${H}" filter="url(#loang)" opacity=".28"/>
  <rect x="0" y="0" width="${W}" height="${H}" filter="url(#hat)"/>
  </g></g>
  ${lopLapLanh()}
</svg>`;
}

/* ============================================================
   TRANG HTML
   ============================================================ */
const CSS = `
/* Bố cục: một tờ giấy vẽ đặt giữa bàn; chữ nằm ngoài tranh, tranh là nhân vật chính */
:root{
  --ban:#E7EDEB; --muc:#2E384C; --muc-nhat:#5E6B82; --giay:#F9F6EF; --vien:#CBD5D3; --nhan:#2F6F86; --nut:#FFFFFF;
  --chu-de:"Iowan Old Style","Palatino Linotype","Book Antiqua",Palatino,Georgia,serif;
  --chu:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){ --ban:#141A1F; --muc:#E8EDF3; --muc-nhat:#A0ACBD; --giay:#F3EFE6; --vien:#2B343D; --nhan:#8FCBDD; --nut:#1E262E; color-scheme:dark }
}
:root[data-theme="dark"]{ --ban:#141A1F; --muc:#E8EDF3; --muc-nhat:#A0ACBD; --giay:#F3EFE6; --vien:#2B343D; --nhan:#8FCBDD; --nut:#1E262E; color-scheme:dark }
*{box-sizing:border-box}
body{margin:0;background:var(--ban);color:var(--muc);font-family:var(--chu);font-size:16px;line-height:1.55}
.trang{max-width:680px;margin:0 auto;padding-block:clamp(20px,5vw,44px);
  padding-left:max(16px, env(safe-area-inset-left, 0px));padding-right:max(16px, env(safe-area-inset-right, 0px));
  display:flex;flex-direction:column;gap:clamp(16px,3.5vw,26px)}
.dau{display:flex;flex-direction:column;gap:6px}
.nhan{font-size:.75rem;letter-spacing:.16em;text-transform:uppercase;color:var(--nhan);font-weight:600;margin:0}
h1{font-family:var(--chu-de);font-weight:500;font-style:italic;font-size:clamp(1.6rem,6vw,2.3rem);line-height:1.15;margin:0;text-wrap:balance}
.to-giay{margin:0;background:var(--giay);border-radius:3px;padding:clamp(8px,2.2vw,16px) clamp(8px,2.2vw,16px) clamp(12px,3vw,20px);
  box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 18px 40px -22px rgba(20,30,45,.55),0 2px 6px rgba(20,30,45,.12)}
.tranh{display:block;width:100%;height:auto}
.to-giay figcaption{font-family:var(--chu-de);font-style:italic;color:#5A6478;font-size:clamp(.82rem,2.6vw,.95rem);text-align:right;padding:6px clamp(6px,2vw,14px) 0}
.n{stroke:${INK};stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round}
.nh{stroke-width:1.5}
.nm{fill:none;stroke:${INK};stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round;opacity:.72}
.nx{stroke:${INK};stroke-width:1.1;stroke-linejoin:round;stroke-opacity:.75}
.nk{fill:none;stroke:#A39A82;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round}
.nf{stroke:#5B7BA6;stroke-width:1.3;stroke-linejoin:round;stroke-linecap:round}
.tranh[data-vay="lua"] #vay-bac-ha,.tranh[data-vay="bac-ha"] #vay-lua{display:none}
.ll{fill:#FFFFFF;stroke:#9CC4E4;stroke-width:.8;animation:chop 3.4s ease-in-out infinite}
@keyframes chop{0%,100%{opacity:.95}50%{opacity:.25}}
.chon{display:flex;flex-direction:column;gap:10px}
.chon p{margin:0;font-size:.9rem;color:var(--muc-nhat)}
.nut-nhom{display:flex;flex-wrap:wrap;gap:8px}
.nut-nhom button{font:inherit;font-size:.92rem;padding:9px 16px;border-radius:999px;border:1.5px solid var(--vien);background:var(--nut);color:var(--muc);cursor:pointer;display:inline-flex;align-items:center;gap:8px}
.nut-nhom button::before{content:"";width:12px;height:12px;border-radius:50%;background:var(--mau);box-shadow:0 0 0 1px rgba(40,55,80,.35)}
.nut-nhom button[aria-pressed="true"]{border-color:var(--nhan);box-shadow:0 0 0 1.5px var(--nhan)}
.nut-nhom button:focus-visible{outline:3px solid var(--nhan);outline-offset:3px}
.ghi-chu{margin:0;color:var(--muc-nhat);font-size:.9rem;max-width:60ch}
@media (prefers-reduced-motion: reduce){ .ll{animation:none} }
`;

const BODY = `
<main class="trang">
  <header class="dau">
    <p class="nhan">Phác thảo số 01 · thiệp sinh nhật</p>
    <h1>Cô gái ôm hoa giữa Đà Lạt</h1>
  </header>

  <figure class="to-giay">
    ${svg()}
    <figcaption>Đà Lạt, một sáng nhiều sương</figcaption>
  </figure>

  <div class="chon">
    <p>Váy trong tranh</p>
    <div class="nut-nhom" role="group" aria-label="Chọn váy trong tranh">
      <button type="button" id="nut-vay-lua" data-vay="lua" aria-pressed="true" style="--mau:#C3DBF3">Váy lụa xanh viền ren</button>
      <button type="button" id="nut-vay-bac-ha" data-vay="bac-ha" aria-pressed="false" style="--mau:#C6E7DC">Váy bạc hà thắt nơ</button>
    </div>
  </div>

  <p class="ghi-chu">Trong tranh: đỉnh LangBiang hai ngọn, đồi thông, nhà thờ nhỏ bên hồ sương, bụi dã quỳ tháng mười một và cẩm tú cầu dưới chân. Đoá hoa vẽ theo bó thật: lily xanh, hồng kem, hồng môn xanh, hoa sao nhỏ, giấy ren trắng và ruy băng xanh.</p>
</main>

<script>
(function(){
  var tranh=document.getElementById('tranh');
  var nut=document.querySelectorAll('.nut-nhom button');
  nut.forEach(function(b){
    b.addEventListener('click',function(){
      tranh.setAttribute('data-vay', b.getAttribute('data-vay'));
      nut.forEach(function(k){ k.setAttribute('aria-pressed', k===b ? 'true' : 'false'); });
    });
  });
})();
</script>
`;

const TITLE = 'Phác thảo Đà Lạt';

const full = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${TITLE}</title>
<style>${CSS}</style>
</head>
<body>
<!-- ============================================================
     BẢN PHÁC THẢO cho thiệp sinh nhật: cô gái ôm hoa giữa Đà Lạt.
     File này do tools/ve-phac-thao.js vẽ ra. Muốn đổi hình thì sửa
     trong script rồi chạy lại: node tools/ve-phac-thao.js
     ============================================================ -->
${BODY}
</body>
</html>
`;

const artifact = `<title>${TITLE}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>${CSS}</style>
${BODY}`;

const root = path.join(__dirname, '..');
fs.writeFileSync(path.join(root, 'phac-thao.html'), full);
const out2 = process.argv[2];
if (out2) fs.writeFileSync(out2, artifact);
console.log('Đã vẽ xong: phac-thao.html (' + Math.round(full.length / 1024) + ' KB)');
