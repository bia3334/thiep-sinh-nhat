#!/usr/bin/env node
'use strict';
/* ============================================================
   VẼ BẢN PHÁC THẢO "CÔ GÁI ÔM HOA GIỮA ĐÀ LẠT"
   Chạy:  node tools/ve-phac-thao.js
   Kết quả: phac-thao.html (cảnh hoàng hôn bên hồ) và phac-thao-la-mozza.html (cảnh sân hiên La Mozza),
            mỗi file mở offline được

   Toàn bộ tranh là SVG sinh từ code, không dùng ảnh.
   Muốn chỉnh: sửa toạ độ / màu trong các hàm bên dưới rồi chạy lại.
   ============================================================ */
const fs = require('fs');
const path = require('path');

const W = 900, H = 1280;
const INK = '#3B4560';
const GAI = { x: 425, y: 350, s: 1.12 }; // vị trí + cỡ cô gái trong tranh
const MT = { x: 250, y: 522 }; // mặt trời lặn, vừa chạm dãy núi bên trái

/* ---------- số ngẫu nhiên có hạt giống (để lần nào vẽ cũng ra y hệt) ---------- */
let seed = 20261122;
const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const R = (a, b) => a + (b - a) * rnd();
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const f = (n) => Math.round(n * 10) / 10;
const g = (x, c, w) => Math.exp(-(((x - c) / w) ** 2));

/* ---------- chuyển động ----------
   lac(...) bọc một phần tranh để nó đung đưa quanh điểm (ox, oy).
   a: biên độ (độ), d: lệch pha (giây), t: chu kỳ (4 hoặc 2 giây để vòng lặp 4 giây khép kín).
   Chỉ chạy khi thẻ <svg> có lớp "dong" (tools/lam-gif.js bật lớp này để chụp GIF).
   Dùng bộ số ngẫu nhiên riêng (R2) để không làm xê dịch bố cục đã vẽ. */
let seed2 = 99;
const R2 = (a, b) => { seed2 = (Math.imul(seed2, 1664525) + 1013904223) >>> 0; return a + (b - a) * (seed2 / 4294967296); };
const lacMo = (ox, oy, a, d = 0, t = 4) => `<g class="lac" style="transform-origin:${f(ox)}px ${f(oy)}px;--a:${a}deg;--d:${f(-d)}s;--t:${t}s">`;
const lac = (inner, ox, oy, a, d = 0, t = 4) => lacMo(ox, oy, a, d, t) + inner + '</g>';

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
  let s = `<path class="n" d="M${f(x - w)},${f(y)}L${f(topX - w * 0.25)},${f(topY + h * 0.1)}L${f(topX + w * 0.25)},${f(topY + h * 0.1)}L${f(x + w)},${f(y)}Z" fill="#33252E"/>`;
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
      p += kim(cx + q * rx * 0.88, cy - ry * 0.5 * (1 - q * q * 0.7), h * 0.036, -90 + q * 38, 62, 9, '#1D2530');
    }
    p += `<path class="n nh" d="${blob(cx, cy, rx, ry, 13, 0.16)}" fill="${fill}"/>`;
    p += `<path d="${blob(cx - rx * 0.2, cy - ry * 0.5, rx * 0.4, ry * 0.16, 8, 0.2)}" fill="#E08A45" opacity=".5"/>`;
    for (let j = 0; j < 4; j++) {
      const q = (j / 3 - 0.5) * 2;
      p += kim(cx + q * rx * 0.7, cy + ry * 0.7, h * 0.026, 90 + q * 30, 55, 6, '#1D2530');
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
    canh += `<path d="M${f(tx(k + 0.06))},${f(cy + h * 0.06)} Q${f((tx(k) + cx) / 2)},${f(cy + ry * 1.4)} ${f(cx)},${f(cy)}" stroke="#33252E" stroke-width="${f(h * 0.011)}" fill="none" stroke-linecap="round"/>`;
    dem += tan(cx, cy, rx, ry, i % 2 ? '#303A47' : '#28313E');
    if (i > 0) {
      const rx2 = rx * R(0.5, 0.68), cx2 = tx(k + 0.04) - side * rx2 * 0.95, cy2 = cy + h * 0.045;
      canh += `<path d="M${f(tx(k + 0.09))},${f(cy2 + h * 0.05)} Q${f((tx(k) + cx2) / 2)},${f(cy2 + ry)} ${f(cx2)},${f(cy2)}" stroke="#33252E" stroke-width="${f(h * 0.009)}" fill="none" stroke-linecap="round"/>`;
      dem += tan(cx2, cy2, rx2, ry * 0.85, i % 2 ? '#28313E' : '#303A47');
    }
  }
  return s + canh + dem;
}

function may(cx, cy, w, op = 0.8, mau = '#FFFFFF') {
  let s = `<g class="troi" style="--d:${f(-R2(0, 4))}s;--dx:${f(R2(4, 9))}px"><g opacity="${op}" fill="${mau}">`;
  s += `<ellipse cx="${cx}" cy="${cy}" rx="${f(w * 0.5)}" ry="${f(w * 0.09)}"/>`;
  s += `<ellipse cx="${f(cx - w * 0.18)}" cy="${f(cy - w * 0.07)}" rx="${f(w * 0.2)}" ry="${f(w * 0.1)}"/>`;
  s += `<ellipse cx="${f(cx + w * 0.1)}" cy="${f(cy - w * 0.1)}" rx="${f(w * 0.24)}" ry="${f(w * 0.12)}"/>`;
  s += `<ellipse cx="${f(cx + w * 0.3)}" cy="${f(cy - w * 0.04)}" rx="${f(w * 0.14)}" ry="${f(w * 0.07)}"/>`;
  return s + '</g></g>';
}

function nhaTho(x, y) {
  // Nhà thờ nhỏ có tháp chuông, nhìn từ xa
  return `<g transform="translate(${x},${y})">
    <path class="nx" fill="#E8B79A" d="M-4,0 L-4,-17 L26,-17 L26,0 Z"/>
    <path class="nx" fill="#6E3644" d="M-7,-17 L11,-29 L29,-17 Z"/>
    <path class="nx" fill="#E8B79A" d="M-15,0 L-15,-34 L-4,-34 L-4,0 Z"/>
    <path class="nx" fill="#6E3644" d="M-17,-34 L-9.5,-56 L-2,-34 Z"/>
    <path d="M-9.5,-56 v-9 M-12.5,-62 h6" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M-9.5,-27 v6 M3,-11 v6 M11,-11 v6 M19,-11 v6" stroke="#FFE07A" stroke-width="2.2" stroke-linecap="round"/>
  </g>`;
}
function bietThu(x, y, s = 1) {
  return `<g transform="translate(${x},${y}) scale(${s})">
    <path class="nx" fill="#E3B196" d="M0,0 L0,-11 L22,-11 L22,0 Z"/>
    <path class="nx" fill="#6E3644" d="M-3,-11 L5,-21 L19,-21 L25,-11 Z"/>
    <path class="nx" fill="#6E3644" d="M15,-21 v-6 h4 v6"/>
    <path d="M6,-7 v4 M15,-7 v4" stroke="#FFE07A" stroke-width="2" stroke-linecap="round"/>
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
  let s = `<path d="${smoothOpen(pts)}" fill="none" stroke="#2E2230" stroke-width="${w}" stroke-linecap="round"/>`;
  const n = pts.length;
  for (let i = 0; i < fans; i++) {
    const t = 0.25 + 0.75 * (i / (fans - 1 || 1));
    const idx = Math.min(n - 2, Math.floor(t * (n - 1)));
    const lt = t * (n - 1) - idx;
    const x = pts[idx][0] + (pts[idx + 1][0] - pts[idx][0]) * lt;
    const y = pts[idx][1] + (pts[idx + 1][1] - pts[idx][1]) * lt;
    const dir = Math.atan2(pts[idx + 1][1] - pts[idx][1], pts[idx + 1][0] - pts[idx][0]) * 180 / Math.PI;
    s += kim(x, y, R(34, 48), dir + pick([-55, 50, 0, -30, 35]), 62, 20, '#1C2A2C');
    s += kim(x + R(-6, 6), y + R(-6, 6), R(26, 38), dir + pick([-40, 40, 10]), 70, 14, '#2F4543');
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

  // --- cán hoa (nằm gọn trong bàn tay)
  s += `<path d="M${P(T)} L-30,370" stroke="${INK}" stroke-width="18" stroke-linecap="round"/>`;
  s += `<path d="M${P(T)} L-30,370" stroke="#F1F6FA" stroke-width="14" stroke-linecap="round"/>`;

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
    s += lac(la(...bp(a - 14, b * 0.86), len, huong(a - 20, b) + lech, pick(['#8FB79A', '#7FAA8C', '#9CC2A4'])), ...bp(a - 44, b * 0.5), 4, 0.35 + R2(0, 0.7));
  }

  // --- hoa, vẽ từ sau ra trước. lay(): mỗi bông ngả nhẹ theo gió quanh một điểm lùi về phía cuống
  const lay = (hinh, a, b, bien) => lac(hinh, ...bp(a - 46, b * 0.55), bien, 0.35 + R2(0, 0.7));
  s += lay(hongMon(...bp(88, -30), 36, goc - 12), 88, -30, 3.6);
  for (const [a, b, r] of [[50, 104, goc + 66], [60, 96, goc + 48], [74, 88, goc + 30]]) s += lay(tulip(...bp(a, b), 17, r), a, b, 4.5);
  s += lay(lily(...bp(64, -82), 30, goc - 60, 'trang'), 64, -82, 2.2);
  s += lay(cumSao(...bp(102, 62), 7, 19), 102, 62, 5.5);
  s += lay(rose(...bp(100, 20), 18, 10), 100, 20, 2.4);
  s += lay(lily(...bp(6, 96), 30, goc + 70, 'trang'), 6, 96, 2.2);
  s += lay(cumSao(...bp(30, 108), 5, 13), 30, 108, 5.5);
  s += lay(rose(...bp(14, -80), 20, -20), 14, -80, 2.4);
  s += lay(rose(...bp(56, 52), 20, 40), 56, 52, 2.4);
  s += lay(lily(...bp(44, -14), 52, goc + 8), 44, -14, 2.2);
  s += lay(hongMon(...bp(-20, -84), 30, goc - 112), -20, -84, 3.6);
  s += lay(cumSao(...bp(-10, -50), 7, 17), -10, -50, 5.5);
  s += lay(lily(...bp(-12, 30), 50, goc + 50), -12, 30, 2.2);
  s += lay(rose(...bp(-38, 66), 18, 70), -38, 66, 2.4);
  s += lay(rose(...bp(-46, -16), 23, 0), -46, -16, 2.4);
  s += lay(cumSao(...bp(-54, 28), 4, 10), -54, 28, 5.5);
  s += lay(cumSao(...bp(78, -66), 4, 11), 78, -66, 5.5);
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
  s += `<g class="vay-gio">${vienRen(478, 20)}</g>`;
  return s + '</g>';
}

/* ============================================================
   BÉ THỎ BÔNG FRANILLA: thỏ bông màu kem, tai dài rủ có thêu chữ, cổ đeo yếm.
   Vẽ làm hai lớp vì cánh tay cô gái nằm xen giữa:
   thoSau() = thân, chân, yếm, đầu  →  cánh tay ôm  →  thoTruoc() = hai tai, hai tay thỏ
   Giữ cho bé MỀM và TRÒN: viền là các múi bông tròn, nét nhạt, không có góc nhọn.
   ============================================================ */
const THO = {
  x: -50,
  to: 'translate(-50 282) scale(1.15) translate(50 -290)', // vị trí + cỡ bé thỏ trong vòng tay
  kem: '#FCF7EE', bong: '#EEE3D2', sang: '#FFFEFA', vien: '#B3A38F', loTai: '#F8EEE0', mui: '#EDA3A6', ma: '#F6B8B4',
  chuTrai: 'Tặng Vê',   // chữ thêu trên tai bên trái tranh
  chuPhai: 'Minh Thư',  // chữ thêu trên tai bên phải tranh
  chiTheu: '#B5823A',   // màu chỉ thêu nâu vàng
};
function xu(cx, cy, rx, ry, n = 16, amp = 0.07) {
  // viền bông mềm: các múi tròn như mây chạy quanh hình bầu dục
  const pt = (a, k) => [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  const off = R(0, 6.2832 / n);
  let d = '';
  for (let i = 0; i < n; i++) {
    const a0 = off + (i / n) * 6.2832, a1 = off + ((i + 1) / n) * 6.2832;
    if (i === 0) d += `M${P(pt(a0, 1))}`;
    d += `Q${P(pt((a0 + a1) / 2, 1 + amp * R(1.7, 2.4)))} ${P(pt(a1, 1))}`;
  }
  return d + 'Z';
}
function bong(cx, cy, rx, ry, n, amp) {
  // một khối bông: quầng mờ phía sau cho cảm giác lông tơ + hình chính viền nhạt
  return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx + 2)}" ry="${f(ry + 2)}" fill="#FFF6E8" opacity=".55" filter="url(#mem)"/>`
    + `<path class="nt" d="${xu(cx, cy, rx, ry, n, amp)}" fill="${THO.kem}"/>`;
}
function longTo(cx, cy, rx, ry, n) {
  // vài nét lông tơ cong nhẹ, màu rất nhạt
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = R(0, 6.2832), k = Math.sqrt(rnd()) * 0.75;
    const x = cx + Math.cos(a) * rx * k, y = cy + Math.sin(a) * ry * k;
    d += `M${f(x - 3)},${f(y)}q3,3 6,0`;
  }
  return `<path d="${d}" fill="none" stroke="#E7DBC9" stroke-width="1.1" stroke-linecap="round"/>`;
}
function taiTho(ben, chu) {
  // ben = 1: tai bên phải tranh, -1: tai bên trái tranh. Tai xoè nhẹ ra ngoài, chữ thêu chạy dọc tai.
  return lacMo(THO.x + ben * 30, 227, -7, ben > 0 ? 0.45 : 0.25) + `<g transform="translate(${THO.x + ben * 30},227) rotate(${-ben * 14})">`
    + bong(0, 44, 15, 50, 18, 0.06)
    + `<ellipse cx="0" cy="46" rx="10.5" ry="40" fill="${THO.loTai}"/>`
    + `<ellipse cx="0" cy="46" rx="10.5" ry="40" fill="none" stroke="#E4D6C1" stroke-width=".8" stroke-dasharray="2 2.4"/>`
    + `<text class="theu" transform="translate(0,46) rotate(${ben * 90})" text-anchor="middle" dy=".33em" font-size="15.5">${chu}</text>`
    + '</g></g>';
}
function thoSau() {
  const cx = THO.x;
  let s = `<g id="tho" transform="${THO.to}">`;
  // thân tròn
  s += bong(cx - 1, 322, 28, 40, 18, 0.06);
  s += `<path d="${blob(cx + 6, 342, 15, 15, 9, 0.08)}" fill="${THO.bong}" opacity=".4"/>`;
  s += longTo(cx - 1, 338, 20, 18, 5);
  // hai chân tròn thõng xuống dưới cánh tay
  s += lac(bong(cx - 20, 366, 13, 10.5, 9, 0.07), cx - 20, 354, -5, 0.3);
  s += lac(bong(cx + 9, 368, 13, 10.5, 9, 0.07), cx + 9, 356, -5, 0.4);
  // yếm đeo cổ: nền trắng, viền chỉ nâu vàng, đường may chấm, một trái tim nhỏ
  s += `<path d="M${cx - 15},274 C${cx - 20},288 ${cx - 16},304 ${cx},306 C${cx + 16},304 ${cx + 20},288 ${cx + 15},274 Q${cx},282 ${cx - 15},274Z" fill="#FFFFFF" stroke="${THO.chiTheu}" stroke-width="1.3" stroke-linejoin="round"/>`;
  s += `<path d="M${cx - 11},281 C${cx - 14},290 ${cx - 11},300 ${cx},301.5 C${cx + 11},300 ${cx + 14},290 ${cx + 11},281" fill="none" stroke="#D2A866" stroke-width=".9" stroke-dasharray="2 2"/>`;
  s += `<path d="M${cx},291.5 C${cx - 1.5},288 ${cx - 7},289 ${cx - 6},293 C${cx - 5.3},296 ${cx - 2},297.5 ${cx},299.5 C${cx + 2},297.5 ${cx + 5.3},296 ${cx + 6},293 C${cx + 7},289 ${cx + 1.5},288 ${cx},291.5Z" fill="${THO.chiTheu}"/>`;
  // đầu bầu, to hơn thân một chút cho đáng yêu
  s += bong(cx, 250, 34, 29, 20, 0.055);
  s += `<path d="${blob(cx, 262, 15, 10, 9, 0.06)}" fill="${THO.sang}"/>`;
  s += longTo(cx, 233, 16, 6, 3);
  // má hồng
  s += `<ellipse cx="${cx - 20}" cy="259" rx="6.5" ry="4.2" fill="${THO.ma}" opacity=".5"/><ellipse cx="${cx + 20}" cy="259" rx="6.5" ry="4.2" fill="${THO.ma}" opacity=".5"/>`;
  // mắt hạt đen tròn có đốm sáng, mũi hồng nhỏ, miệng cười chữ w
  s += `<circle cx="${cx - 13}" cy="251" r="3.5" fill="#3A3238"/><circle cx="${cx + 13}" cy="251" r="3.5" fill="#3A3238"/>`;
  s += `<circle cx="${cx - 14.2}" cy="249.8" r="1.3" fill="#FFFFFF"/><circle cx="${cx + 11.8}" cy="249.8" r="1.3" fill="#FFFFFF"/>`;
  s += `<path d="M${cx - 3.6},257 Q${cx},255.4 ${cx + 3.6},257 Q${cx + 2.6},261 ${cx},261.6 Q${cx - 2.6},261 ${cx - 3.6},257Z" fill="${THO.mui}"/>`;
  s += `<path d="M${cx},261.6 v2 M${cx},263.6 q-2.6,3.2 -5.6,1 M${cx},263.6 q2.6,3.2 5.6,1" fill="none" stroke="#A8968A" stroke-width="1.1" stroke-linecap="round"/>`;
  return s + '</g>';
}
function thoTruoc() {
  const cx = THO.x;
  let s = `<g id="tho-truoc" transform="${THO.to}">`;
  // hai tai thêu chữ, vắt ra ngoài: tai trái tựa lên bắp tay, tai phải phủ lên mép giấy gói
  s += taiTho(-1, THO.chuTrai) + taiTho(1, THO.chuPhai);
  // hai tay thỏ tròn vắt lên cẳng tay
  s += bong(cx - 21, 305, 9.5, 11, 8, 0.07);
  s += bong(cx + 15, 311, 9.5, 11, 8, 0.07);
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
  // miệng giày búp bê lộ cổ chân
  s += `<path d="M-45,707 C-42,723 -24,723 -21,707Z" fill="${da}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
  s += `<path d="M21,707 C24,723 42,723 45,707Z" fill="${da}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;

  // --- cổ, vai, ngực
  s += `<path class="n" fill="${da}" d="M-15,96 C-15,118 -17,130 -23,139 C-42,146 -62,148 -80,158 C-90,166 -92,180 -88,200 L-72,226 L72,226 L88,200 C92,180 90,166 80,158 C62,148 42,146 23,139 C17,130 15,118 15,96 Z"/>`;
  s += `<path fill="${daBong}" opacity=".7" d="M-15,101 C-6,113 6,113 15,101 C12,120 -12,120 -15,101Z"/>`;
  s += `<path class="nm" d="M-46,160 Q-28,167 -12,162 M46,160 Q28,167 12,162"/>`;

  // --- váy
  s += vayLua();

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
  s += lac(ruy([[-18, 372], [-26, 410], [-16, 450], [-28, 496]], 9), -18, 372, -7, 0.45);
  s += lac(ruy([[-4, 370], [4, 422], [-4, 472], [10, 528]], 10), -4, 370, -6, 0.6);
  s += lac(ruy([[-10, 372], [-10, 402], [0, 442], [-10, 478]], 8), -10, 372, -8, 0.5);

  // --- đầu (nghiêng nhẹ về phía bó hoa)
  s += '<g transform="rotate(4 0 118)">';
  // búi tóc
  s += `<path class="n" fill="${toc}" d="${blob(8, -38, 31, 27, 11, 0.07)}"/>`;
  s += `<path d="M-12,-44 C-2,-62 24,-62 32,-42 M-6,-30 C6,-48 26,-46 30,-28 M2,-56 C10,-50 16,-42 16,-30" fill="none" stroke="${tocDam}" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`;
  s += lac(`<path d="M-14,-52 C-22,-58 -28,-56 -32,-50 M30,-56 C38,-62 44,-58 46,-52 M12,-66 C12,-72 16,-76 20,-76" fill="none" stroke="${toc}" stroke-width="2" stroke-linecap="round"/>`, 8, -40, 7, 0.1, 2);
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
  s += lacMo(2, 2, -3, 0.15, 2);
  s += `<path fill="${toc}" opacity=".5" d="M37,32 C39,38 38,43 35,46 C30,50 24,51 18,49 C13,51 8,50 5,46 C3,43 1,43 -1,46`
    + ` C-5,50 -11,51 -17,49 C-23,51 -29,50 -34,46 C-38,43 -39,38 -37,32 C-27,23 -12,19 2,21 C14,19 28,23 37,32Z"/>`;
  const mai = [
    [5, 21, 8, 34, 6, 47, 1.8], [10, 21, 15, 33, 14, 50, 2.2], [16, 22, 22, 33, 23, 49, 1.7], [22, 23, 29, 33, 31, 47, 2.2], [29, 26, 35, 33, 36, 43, 1.8],
    [-1, 21, -5, 34, -3, 47, 1.8], [-6, 21, -12, 33, -11, 50, 2.2], [-12, 22, -19, 33, -20, 49, 1.7], [-19, 23, -26, 33, -28, 47, 2.2], [-26, 26, -33, 33, -34, 43, 1.8],
  ];
  for (const [x0, y0, cx, cy, x1, y1, w] of mai) {
    s += `<path d="M${x0},${y0} Q${cx},${cy} ${x1},${y1}" fill="none" stroke="${toc}" stroke-width="${w}" stroke-linecap="round"/>`;
  }
  s += '</g>';
  // lọn tóc mai hai bên bay theo gió
  s += lac(`<path d="M-41,36 C-49,50 -50,66 -46,80 C-45,84 -46,88 -48,90 M-44,44 C-48,56 -48,66 -47,74" fill="none" stroke="${toc}" stroke-width="2.4" stroke-linecap="round"/>`, -41, 36, -9, 0.2);
  s += lac(`<path d="M41,36 C49,50 50,66 46,80 C45,84 46,88 48,90 M44,44 C48,56 48,66 47,74" fill="none" stroke="${toc}" stroke-width="2.4" stroke-linecap="round"/>`, 41, 36, -11, 0.4);
  s += lac(`<path d="M44,56 C54,61 60,72 71,75 M45,64 C52,73 58,84 67,91" fill="none" stroke="${toc}" stroke-width="1.8" stroke-linecap="round"/>`, 44, 58, -10, 0.55, 2);
  // nếp tóc chải lên búi
  s += `<path d="M-32,22 C-26,0 -8,-14 4,-17 M32,22 C28,2 16,-12 8,-17 M-2,26 C-2,6 2,-8 6,-17 M-42,34 C-40,8 -22,-10 -8,-16 M42,34 C42,10 30,-8 18,-15" fill="none" stroke="${tocDam}" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`;
  s += `<path d="M-22,14 C-16,0 -6,-8 2,-11 M20,10 C18,2 14,-4 10,-8" fill="none" stroke="${tocSang}" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>`;
  // hoa tai ngọc trai
  s += `<circle cx="-45" cy="82" r="3.4" fill="#FFFFFF" stroke="${INK}" stroke-width="1.2"/>`;
  s += `<circle cx="45" cy="82" r="3.4" fill="#FFFFFF" stroke="${INK}" stroke-width="1.2"/>`;
  s += '</g>';

  // --- bó hoa (bó đứng yên, từng bông lay theo gió)
  s += boHoa();

  // --- bàn tay bên phải tranh nắm cổ bó hoa
  s += `<path class="n" fill="${da}" d="M16,343 C4,337 -14,337 -25,343 C-34,349 -33,365 -24,371 C-10,377 4,377 16,374 Z"/>`;
  s += `<path fill="${da}" d="M10,346 L20,345 L20,372 L10,373Z"/>`;
  s += `<path class="nm" d="M-26,349 q8,3 15,0 M-29,357 q9,3 17,0 M-26,365 q8,2 14,0"/>`;

  // --- bé thỏ bông: thân, chân, yếm, đầu (nằm sau cánh tay ôm)
  s += thoSau();

  // --- cánh tay bên trái tranh: gập khuỷu, ôm ngang người bé thỏ (hạ thấp để lộ yếm)
  s += `<path class="n" fill="${da}" d="M-70,152 C-86,152 -98,164 -100,184 C-106,224 -118,262 -120,298 C-121,316 -114,328 -100,330 C-82,334 -64,337 -46,338 L-44,314 C-58,310 -72,304 -82,296 C-80,266 -76,234 -72,204 C-70,186 -70,168 -70,152 Z"/>`;
  s += `<path fill="${daBong}" opacity=".28" d="M-82,296 C-80,266 -76,234 -72,204 L-80,206 C-86,240 -91,270 -93,296Z"/>`;
  s += `<path fill="${daBong}" opacity=".38" d="M-116,316 C-96,326 -68,330 -46,332 L-46,338 C-64,337 -82,334 -100,330 C-108,329 -114,324 -116,316Z"/>`;
  // xoá nét nối vai để cánh tay liền với vai
  s += `<path fill="${da}" d="M-75,155 C-70,153.8 -66,154.4 -65.5,160 L-66,190 L-76,194 C-81,180 -81,166 -75,155Z"/>`;
  // bàn tay ôm lấy sườn bé thỏ
  s += `<path class="n" fill="${da}" d="M-48,312 C-38,308 -26,310 -21,318 C-17,326 -20,337 -28,341 C-36,344 -44,342 -48,339 Z"/>`;
  s += `<path fill="${da}" d="M-51,315 L-43,314 L-43,337 L-51,337.5Z"/>`;
  s += `<path class="nm" d="M-24,319 q-6,1 -10,5 M-21,326 q-7,1 -11,5 M-24,334 q-6,0 -9,3"/>`;

  // --- hai tai thêu chữ và hai tay thỏ vắt lên cánh tay
  s += thoTruoc();
  return s;
}

/* ============================================================
   GHÉP CẢNH
   ============================================================ */
function canh() {
  let s = '';

  // trời hoàng hôn: mây tầng trên sẫm màu gạch, bụng mây hắt nắng vàng
  s += `<rect x="-12" y="-12" width="${W + 24}" height="780" fill="url(#troi)"/>`;
  s += may(300, 96, 560, 0.5, '#A23C2A') + may(720, 60, 440, 0.45, '#A9402A') + may(640, 214, 400, 0.45, '#C24F28') + may(130, 236, 320, 0.4, '#B84828');
  s += may(450, 168, 330, 0.5, '#FFCB6B') + may(760, 300, 260, 0.45, '#FFC766') + may(250, 350, 300, 0.4, '#FFD27A');
  s += `<g fill="#C4532F" opacity=".5"><ellipse cx="610" cy="392" rx="210" ry="9"/><ellipse cx="240" cy="408" rx="170" ry="8"/><ellipse cx="800" cy="470" rx="130" ry="7"/></g>`;
  s += `<g fill="#FFE9A6" opacity=".75"><ellipse cx="420" cy="452" rx="220" ry="7"/><ellipse cx="170" cy="478" rx="150" ry="6"/><ellipse cx="660" cy="430" rx="170" ry="6"/></g>`;
  // quầng sáng chân trời + mặt trời vừa chạm dãy núi
  s += `<ellipse cx="330" cy="545" rx="430" ry="64" fill="#FFE9A0" opacity=".8" filter="url(#mo)"/>`;
  s += `<circle cx="${MT.x}" cy="${MT.y}" r="300" fill="url(#quang)"/>`;
  s += `<circle cx="${MT.x}" cy="${MT.y}" r="44" fill="#FFF4BE"/>`;
  // vài cánh chim bay về tổ
  s += `<path d="M612,214 q8,-9 15,0 q8,-8 15,1 M664,250 q6,-7 11,0 q6,-6 11,1 M560,238 q5,-6 9,0 q5,-5 9,1" class="chim" fill="none" stroke="#4A2A30" stroke-width="1.7" stroke-linecap="round" opacity=".8"/>`;

  // LangBiang hai đỉnh in bóng tím
  s += doi(langbiang, 760, '#5B3F66', 'stroke="#3F2B4B" stroke-width="1.4"');
  let gach = '';
  for (const [cx, w] of DINH) {
    for (let i = 0; i < 9; i++) {
      const x = cx + 8 + i * (w * 0.2), y = langbiang(x) + 6 + i * 2;
      gach += `M${f(x)},${f(y)}l${f(-10 - i)},${f(22 + i * 2)}`;
    }
  }
  s += `<path d="${gach}" fill="none" stroke="#3F2B4B" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>`;
  // sương chiều hắt nắng dưới chân núi
  s += `<g filter="url(#mo)" fill="#FFB870"><ellipse cx="600" cy="562" rx="340" ry="24" opacity=".6"/><ellipse cx="170" cy="580" rx="260" ry="20" opacity=".65"/></g>`;
  s += may(752, 552, 250, 0.7, '#FFB573') + may(868, 564, 130, 0.65, '#F9A066');

  // dãy đồi xa có rặng thông nhỏ
  s += thongXa(ridge2, -10, W + 10, 12, 24, '#3E2A4C');
  s += doi(ridge2, 760, '#4C3459');
  s += `<g filter="url(#mo)" fill="#F59A68"><ellipse cx="330" cy="648" rx="330" ry="16" opacity=".45"/><ellipse cx="780" cy="642" rx="200" ry="14" opacity=".4"/></g>`;

  // hai sườn đồi thông ôm lấy hồ, nhà đã lên đèn
  let doi3 = '<g id="doi3">';
  doi3 += thongXa(doi3T, -10, 520, 16, 30, '#2C1F39');
  doi3 += doi(doi3T, HO_Y, '#3D2B4A');
  doi3 += thongXa(doi3P, 380, W + 10, 16, 30, '#281C35');
  doi3 += doi(doi3P, HO_Y, '#372644');
  doi3 += rungThong(doi3T, -10, 500, 34, '#2E2139', '#3A2A47', '#231A2C');
  doi3 += rungThong(doi3P, 420, W + 10, 34, '#2A1E35', '#362743', '#231A2C');
  doi3 += bietThu(226, 716, 1) + bietThu(318, 728, 0.8);
  doi3 += nhaTho(276, 700);
  doi3 += thongVua(254, 722, 36, '#2E2139', '#3A2A47', '#231A2C') + thongVua(304, 716, 30, '#2E2139', '#3A2A47', '#231A2C');
  doi3 += '</g>';
  s += doi3;

  // mặt hồ nhuộm màu trời + bóng đồi in xuống nước
  s += `<rect x="-12" y="${HO_Y}" width="${W + 24}" height="170" fill="url(#ho)"/>`;
  s += `<g clip-path="url(#cat-ho)" opacity=".5"><use href="#doi3" transform="translate(0,${HO_Y * 2}) scale(1,-1)"/></g>`;
  s += `<rect x="-12" y="${HO_Y}" width="${W + 24}" height="170" fill="url(#ho-suong)"/>`;
  // vệt nắng vàng loang trên mặt nước, ngay dưới mặt trời
  let nang = '';
  for (let i = 0; i < 36; i++) {
    const y = R(HO_Y + 4, HO_Y + 124), k = (y - HO_Y) / 124;
    const l = R(14, 46) * (0.6 + k);
    nang += `M${f(MT.x + R(-1, 1) * (24 + k * 72) - l / 2)},${f(y)}h${f(l)}`;
  }
  s += `<path class="long-lanh" d="${nang}" stroke="#FFF3B5" stroke-width="2.2" stroke-linecap="round" opacity=".9" fill="none"/>`;
  let song = '';
  for (let i = 0; i < 26; i++) {
    const y = R(HO_Y + 8, HO_Y + 118), x = R(0, W), l = R(18, 70);
    song += `M${f(x)},${f(y)}h${f(l)}`;
  }
  s += `<path d="${song}" stroke="#FFD98A" stroke-width="1.6" stroke-linecap="round" opacity=".6" fill="none"/>`;
  s += `<g filter="url(#mo)" fill="#FFD7A0"><ellipse cx="450" cy="${HO_Y + 4}" rx="380" ry="10" opacity=".5"/><ellipse cx="760" cy="790" rx="170" ry="12" opacity=".35"/></g>`;

  // đồng cỏ lúc chạng vạng, còn một vạt nắng cuối ngày
  s += doi(dongCo, H + 12, 'url(#co)', 'stroke="#2B2433" stroke-width="1.6" stroke-opacity=".5"');
  s += `<ellipse cx="300" cy="960" rx="340" ry="80" fill="#FFB25A" opacity=".3" filter="url(#mo)"/>`;
  // thông gần hai bên
  s += lac(thongLon(158, dongCo(158) + 10, 400, 10), 158, dongCo(158) + 10, 0.9, 0.25);
  s += lac(thongLon(752, dongCo(752) + 6, 236, -4), 752, dongCo(752) + 6, 1, 1.25);
  s += lac(thongLon(832, dongCo(832) + 12, 318, 6), 832, dongCo(832) + 12, 0.9, 1.4);
  s += lac(thongLon(890, dongCo(890) + 18, 392, -8), 890, dongCo(890) + 18, 0.8, 1.5);
  // dải cỏ hồng tháng mười một ở mép đồng cỏ, bắt nắng chiều
  let coHong = '';
  for (let i = 0; i < 150; i++) {
    const x = R(0, W), y = dongCo(x) + R(3, 30);
    coHong += `M${f(x)},${f(y)}q${f(R(-3, 3))},${f(-R(5, 9))} ${f(R(-5, 5))},${f(-R(10, 17))}`;
  }
  s += `<path class="gio" d="${coHong}" fill="none" stroke="#F08FA8" stroke-width="1.5" stroke-linecap="round" opacity=".8"/>`;
  // bóng cây đổ dài về bên phải
  s += `<g fill="#1B2626" opacity=".32" filter="url(#mo)"><ellipse cx="290" cy="894" rx="170" ry="11"/><ellipse cx="860" cy="902" rx="120" ry="12"/></g>`;
  // cỏ + hoa dại
  let hoaDai = '';
  const coBang = Array.from({ length: 7 }, () => '');
  for (let i = 0; i < 150; i++) {
    const x = R(0, W), y = R(dongCo(x) + 14, 1190), k = 0.6 + (y - 880) / 420;
    coBang[Math.min(6, Math.max(0, Math.floor((y - 860) / 48)))] += `M${f(x)},${f(y)}l${f(-3 * k)},${f(-9 * k)}M${f(x + 3 * k)},${f(y)}l${f(1 * k)},${f(-11 * k)}M${f(x + 6 * k)},${f(y)}l${f(4 * k)},${f(-8 * k)}`;
  }
  coBang.forEach((d, i) => { if (d) s += `<path class="gio" style="--d:${f(-i * 0.12)}s" d="${d}" fill="none" stroke="#2F4A40" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>`; });
  for (let i = 0; i < 46; i++) {
    const x = R(0, W), y = R(dongCo(x) + 20, 1150), k = 0.7 + (y - 880) / 500;
    hoaDai += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(2.4 * k)}" fill="${pick(['#FFF1D0', '#FFE3A0', '#FFD98A', '#F9B8C4'])}"/>`;
  }
  s += hoaDai;

  // bụi dã quỳ bên phải
  s += `<path class="n" d="${blob(820, 1010, 104, 74, 14, 0.14)}" fill="#4A6B4A"/>`;
  s += `<path d="${blob(790, 990, 60, 40, 10, 0.2)}" fill="#6B8A52" opacity=".8"/>`;
  for (let i = 0; i < 14; i++) s += la(R(730, 890), R(960, 1060), R(22, 34), R(-160, -20), pick(['#3F5F45', '#4F7350']));
  for (const [x, y, k] of [[742, 962, 1], [786, 940, 1.15], [836, 950, 1.05], [880, 972, 1.2], [760, 1004, 1.2], [812, 992, 1.3], [862, 1020, 1.25], [724, 1030, 1.05], [796, 1044, 1.35], [846, 1068, 1.2], [896, 1046, 1.1]]) {
    s += lac(daQuy(x, y, k, R(0, 30)), x, y + 18, 7, x / W * 1.5 + R2(0, 0.4));
  }

  // bóng cô gái đổ dài về bên phải (nắng xiên từ bên trái)
  s += `<ellipse cx="${GAI.x + 120}" cy="${f(GAI.y + 730 * GAI.s)}" rx="190" ry="13" fill="#1B2626" opacity=".42" filter="url(#mo)"/>`;

  // hàng cẩm tú cầu phía sau (nằm sau lưng cô gái)
  const sau = [
    [44, 1104, 38, 'tim'], [128, 1122, 40, 'xanh'], [212, 1108, 36, 'trang'], [290, 1130, 38, 'xanh'],
    [596, 1128, 38, 'hong'], [676, 1108, 40, 'xanh'], [760, 1124, 38, 'tim'], [846, 1106, 40, 'xanh'],
  ];
  for (let i = 0; i < 22; i++) {
    const x = pick([R(-10, 330), R(560, W + 10)]);
    s += la(x, R(1100, 1160), R(30, 44), R(-170, -10), pick(['#3E6A55', '#4A7860', '#35604C']));
  }
  for (const [x, y, r, p] of sau) s += lac(tuCau(x, y, r, TU_CAU[p]), x, y + r, 3.2, x / W * 1.5 + R2(0, 0.4));

  // cô gái
  // cô gái đứng yên; chỉ tóc, hoa, tai thỏ, ruy băng và gấu váy động theo gió
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
    laTC += la(R(-10, W + 10), R(1170, 1290), R(34, 52), R(-170, -10), pick(['#3E6A55', '#4A7860', '#35604C']));
  }
  s += laTC;
  for (const [x, y, r, p] of cum) s += lac(tuCau(x, y, r, TU_CAU[p]), x, y + r, 3.2, x / W * 1.5 + R2(0, 0.4));

  // cánh hoa bị gió cuốn bay ngang tranh (chỉ hiện khi tranh động)
  for (let i = 0; i < 10; i++) {
    const mau = ['#FFFFFF', '#CFE6F8', '#F9C9D8', '#FFE9B0'][Math.floor(R2(0, 4))];
    s += `<g transform="translate(${f(R2(70, 720))},${f(R2(430, 1090))})"><g class="bay" style="--d:${f(-R2(0, 4))}s;--dx:${f(R2(170, 300))}px;--dy:${f(R2(-60, 40))}px">`
      + `<path class="xoay" d="M0,0 C3,-4.5 10,-4.5 13,0 C10,4.5 3,4.5 0,0Z" fill="${mau}" stroke="${INK}" stroke-width=".6" stroke-opacity=".5"/></g></g>`;
  }
  // gốc thông to sát mép trái in bóng sẫm, mép phải bắt một viền nắng; cành rủ phía trên
  s += `<path class="n" fill="#2E2230" d="M10,1300 C26,900 42,500 50,-20 L98,-20 C92,500 98,900 116,1300 Z"/>`;
  s += `<path fill="#C76A35" opacity=".7" d="M89,-20 L98,-20 C92,500 98,900 116,1300 L105,1300 C89,900 83,500 89,-20Z"/>`;
  let vo = '';
  for (let i = 0; i < 26; i++) {
    const y = R(20, 1080), x = 50 + R(-18, 26) + y * 0.01;
    vo += `M${f(x)},${f(y)}q${f(R(-4, 4))},${f(R(14, 26))} ${f(R(-3, 3))},${f(R(30, 52))}`;
  }
  s += `<path d="${vo}" fill="none" stroke="#1A1220" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`;
  s += lac(canhThong([[86, 236], [150, 214], [226, 206], [300, 176], [352, 168]], 7, 6) + canhThong([[170, 212], [200, 250], [236, 268]], 4, 3), 86, 236, 2.2, 0.1);
  s += lac(canhThong([[84, 92], [150, 70], [230, 76], [300, 48], [380, 52]], 6, 6), 84, 92, 2, 0.2);
  s += lac(canhThong([[W + 10, 34], [840, 60], [770, 62], [706, 96], [660, 98]], 6, 5), W + 10, 34, -2, 1.5);
  s += lac(canhThong([[W + 10, 150], [860, 158], [820, 190]], 4, 3), W + 10, 150, -2.6, 1.6);
  // tú cầu che gốc thông
  s += lac(tuCau(30, 1200, 44, TU_CAU.trang), 30, 1244, 3.2, 0.05) + lac(tuCau(104, 1232, 40, TU_CAU.tim), 104, 1272, 3.2, 0.2);
  return s;
}

/* ============================================================
   CẢNH 2: SÂN VƯỜN LA MOZZA LÚC HOÀNG HÔN
   Vẽ theo ảnh chụp thật của quán: ngồi ngoài vườn dưới những tán dù vải kem khung gỗ, nền sỏi,
   bàn bát giác mặt đá trắng chân sắt uốn, ghế sắt đen lưng mắt cáo có nệm kem viền đen,
   hàng cây bụi rậm xen hoa tím, bờ đá hộc bên trái, cây tùng bên phải, lá to ở góc dưới phải,
   nhìn ra khu biệt thự trắng của Đà Lạt trên đồi thông và dãy núi xa. Ánh sáng đổi sang hoàng hôn.
   ============================================================ */
const LM_MT = { x: 128, y: 536 }; // mặt trời lặn sau dãy đồi bên trái
const lmNuiXa = (x) => 566 + 10 * Math.sin(x / 140 + 1) + 5 * Math.sin(x / 53) - 22 * g(x, 560, 220);
const lmDoiT = (x) => 566 + 64 * (1 - g(x, 0, 300)) + 5 * Math.sin(x / 33);       // đồi thông bên trái
const lmDoiP = (x) => 560 + 76 * (1 - g(x, 900, 260)) + 5 * Math.sin(x / 29 + 1); // đồi thông bên phải
const SAN_Y = 892; // mép nền sỏi (chân hàng cây)
const SAT = '#26222C'; // sắt uốn sơn đen
const DA = ['#B79C7C', '#A88D6E', '#C4AA88', '#9A8062', '#BCA07E']; // đá hộc màu nâu vàng

function tuongDa(x0, y0, x1, y1, id) {
  // bờ đá hộc: nền vữa + các viên đá xếp so le
  let s = `<clipPath id="${id}"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"/></clipPath>`;
  s += `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="#8A7359"/><g clip-path="url(#${id})">`;
  for (let y = y0; y < y1;) {
    const h = R(20, 30);
    for (let x = x0 - R(0, 30); x < x1;) {
      const w = R(28, 58);
      s += `<rect x="${f(x)}" y="${f(y)}" width="${f(w - 3)}" height="${f(h - 3)}" rx="8" fill="${pick(DA)}" stroke="${INK}" stroke-width=".8" stroke-opacity=".4"/>`;
      x += w;
    }
    y += h;
  }
  return s + '</g>';
}
function bietThuTrang(x, y, k, mai, sang) {
  // biệt thự trắng mái dốc kiểu Pháp nhìn từ xa; sang = cửa sổ đã lên đèn
  const w = 30 * k, h = 19 * k;
  const cua = sang ? '#FFD98A' : '#9AA3BD';
  return `<g transform="translate(${f(x)},${f(y)})">`
    + `<path class="nx" d="M0,0 V${f(-h)} H${f(w)} V0Z" fill="#F6E6D2"/>`
    + `<path class="nx" d="M${f(-3 * k)},${f(-h)} L${f(w * 0.28)},${f(-h - 15 * k)} L${f(w * 0.78)},${f(-h - 15 * k)} L${f(w + 3 * k)},${f(-h)}Z" fill="${mai}"/>`
    + `<path class="nx" d="M${f(w * 0.54)},0 V${f(-h - 3 * k)} L${f(w * 0.72)},${f(-h - 19 * k)} L${f(w * 0.9)},${f(-h - 3 * k)} V0Z" fill="#FBEEDD"/>`
    + `<path d="M${f(w * 0.5)},${f(-h - 2 * k)} L${f(w * 0.72)},${f(-h - 21 * k)} L${f(w * 0.94)},${f(-h - 2 * k)}" fill="none" stroke="${mai}" stroke-width="${f(2.6 * k)}" stroke-linejoin="round" stroke-linecap="round"/>`
    + `<path d="M${f(w * 0.12)},${f(-h * 0.7)} v${f(h * 0.34)} M${f(w * 0.32)},${f(-h * 0.7)} v${f(h * 0.34)} M${f(w * 0.72)},${f(-h * 0.8)} v${f(h * 0.4)}" stroke="${cua}" stroke-width="${f(3 * k)}" stroke-linecap="round"/>`
    + '</g>';
}
function tanDu(cx, cy, rx, ry) {
  // tán dù vải kem nhìn từ dưới lên: 8 múi, nan gỗ toả từ ổ dù, diềm vải rủ ở mép xa
  const V = [];
  for (let k = 0; k < 8; k++) {
    const a = (22.5 + 45 * k) * Math.PI / 180;
    V.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  const hub = [cx, cy - 8];
  let diem = '';
  for (let k = 0; k < 3; k++) { // ba cạnh ở nửa dưới (mép xa của tán)
    const A = V[k], B = V[k + 1], n = 6;
    let d = `M${P(A)}`;
    for (let i = 1; i <= n; i++) {
      const p0 = [A[0] + (B[0] - A[0]) * (i - 1) / n, A[1] + (B[1] - A[1]) * (i - 1) / n];
      const p1 = [A[0] + (B[0] - A[0]) * i / n, A[1] + (B[1] - A[1]) * i / n];
      d += ` Q${f((p0[0] + p1[0]) / 2)},${f((p0[1] + p1[1]) / 2 + 20)} ${P(p1)}`;
    }
    diem += `<path class="n nh" d="${d}Z" fill="#E6D9BC"/>`;
  }
  let s = `<g class="vay-gio">${diem}</g>`;
  for (let k = 0; k < 8; k++) s += `<path d="M${P(hub)} L${P(V[k])} L${P(V[(k + 1) % 8])}Z" fill="${k % 2 ? '#F7EEDA' : '#EEE2C6'}"/>`;
  s += `<ellipse cx="${cx - rx * 0.25}" cy="${cy + ry * 0.2}" rx="${rx * 0.5}" ry="${ry * 0.6}" fill="#FFD9A0" opacity=".35"/>`;
  s += `<path class="n" d="M${V.map(P).join(' L')}Z" fill="none"/>`;
  let nan = '', chong = '';
  for (let k = 0; k < 8; k++) {
    nan += `M${P(hub)}L${P(V[k])}`;
    chong += `M${cx},${cy + 22}L${f(hub[0] + (V[k][0] - hub[0]) * 0.52)},${f(hub[1] + (V[k][1] - hub[1]) * 0.52)}`;
  }
  s += `<path d="${nan}" fill="none" stroke="${INK}" stroke-width="4.6" stroke-linecap="round"/><path d="${nan}" fill="none" stroke="#B98A55" stroke-width="2.8" stroke-linecap="round"/>`;
  s += `<path d="${chong}" fill="none" stroke="#8A6238" stroke-width="2" stroke-linecap="round"/>`;
  return s + `<circle class="n nh" cx="${hub[0]}" cy="${hub[1]}" r="6" fill="#B98A55"/>`;
}
function tanDuGan() {
  // mép tán dù ngay trên đầu người xem, chiếm dải trên cùng của tranh
  const E = [[-20, 214], [60, 196], [330, 150], [640, 118], [920, 70]];
  const hub = [-70, -120];
  let s = '<path d="M-20,-20 L920,-20 L920,70 L640,118 L330,150 L60,196 L-20,214Z" fill="#F4EAD3"/>';
  for (let i = 0; i < E.length - 1; i += 2) s += `<path d="M${P(hub)} L${P(E[i])} L${P(E[i + 1])}Z" fill="#E9DDC0"/>`;
  s += '<path d="M-20,214 L60,196 L330,150 L640,118 L920,70 L920,40 L-20,150Z" fill="#FFD9A0" opacity=".3"/>';
  let diem = '';
  for (let i = 0; i < E.length - 1; i++) {
    const A = E[i], B = E[i + 1], n = Math.round(Math.hypot(B[0] - A[0], B[1] - A[1]) / 46);
    let d = `M${P(A)}`;
    for (let j = 1; j <= n; j++) {
      const p0 = [A[0] + (B[0] - A[0]) * (j - 1) / n, A[1] + (B[1] - A[1]) * (j - 1) / n];
      const p1 = [A[0] + (B[0] - A[0]) * j / n, A[1] + (B[1] - A[1]) * j / n];
      d += ` Q${f((p0[0] + p1[0]) / 2)},${f((p0[1] + p1[1]) / 2 + 26)} ${P(p1)}`;
    }
    diem += `<path class="n nh" d="${d}Z" fill="#E6D9BC"/>`;
  }
  s += `<g class="vay-gio">${diem}</g>`;
  s += `<path class="n" d="M${E.map(P).join(' L')}" fill="none"/>`;
  let nan = '';
  for (const e of E) nan += `M${P(hub)}L${P(e)}`;
  nan += `M${P(hub)}L920,-20`;
  return s + `<path d="${nan}" fill="none" stroke="${INK}" stroke-width="5.4" stroke-linecap="round"/><path d="${nan}" fill="none" stroke="#B98A55" stroke-width="3.4" stroke-linecap="round"/>`;
}
function hoaTim(cx, baseY, h, n, mau = ['#9B87D6', '#8672C4', '#B09EE6']) {
  // một bụi hoa tím (xô thơm, oải hương): thân xoè hình quạt, đầu mỗi thân là một bông dài
  let than = '', bong = '';
  for (let i = 0; i < n; i++) {
    const a = (-90 + (i / (n - 1) - 0.5) * 72 + R(-6, 6)) * Math.PI / 180;
    const l = h * R(0.72, 1.05);
    const x = cx + Math.cos(a) * l, y = baseY + Math.sin(a) * l;
    than += `M${f(cx + R(-7, 7))},${baseY}Q${f((cx + x) / 2 + R(-5, 5))},${f((baseY + y) / 2)} ${f(x)},${f(y)}`;
    bong += `<g transform="translate(${f(x)},${f(y)}) rotate(${f(a * 180 / Math.PI + 90)})"><ellipse cx="0" cy="-10" rx="4.2" ry="12" fill="${pick(mau)}" stroke="${INK}" stroke-width=".7" stroke-opacity=".5"/>`
      + `<path d="M-3,-4 h6 M-3.6,-10 h7.2 M-2.6,-16 h5.2" stroke="#6C5AAE" stroke-width=".9"/></g>`;
  }
  return `<path d="${than}" fill="none" stroke="#5E8A6A" stroke-width="1.7" stroke-linecap="round"/>` + bong;
}
function hangCay(yDinh, yDay) {
  // hàng cây bụi rậm sau chỗ ngồi: khối nền, mép trên lởm chởm, lá dài mọc chồng lên nhau
  let s = `<rect x="-12" y="${yDinh + 16}" width="${W + 24}" height="${yDay - yDinh}" fill="#3F5F49"/>`;
  for (let x = -10; x < W + 20; x += R(34, 52)) {
    s += `<path d="${blob(x, yDinh + R(8, 24), R(30, 44), R(20, 30), 9, 0.2)}" fill="${pick(['#3F5F49', '#47694F', '#3A5843'])}"/>`;
  }
  for (let c = 0; c < 10; c++) { // chia cụm để mỗi cụm lay riêng theo gió
    const xc = 0 + c * 100;
    let cum = '';
    for (let i = 0; i < 15; i++) {
      cum += la(xc + R(-62, 62), R(yDinh + 6, yDay - 26), R(24, 40), R(-128, -52), pick(['#4F7A55', '#5E8A60', '#6E9A6A', '#456E4D']));
    }
    s += lac(cum, xc, yDay, 1.3, xc / W * 1.5 + R2(0, 0.3));
  }
  return s;
}
function cayTung(x, y) {
  // cây tùng bên phải: thân vặn, tán lá dày xếp thành từng mảng
  let s = `<path d="M${x},${y} C${x - 8},${y - 90} ${x + 16},${y - 150} ${x - 6},${y - 230} C${x - 18},${y - 290} ${x + 4},${y - 330} ${x - 8},${y - 380}" fill="none" stroke="${INK}" stroke-width="18" stroke-linecap="round"/>`;
  s += `<path d="M${x},${y} C${x - 8},${y - 90} ${x + 16},${y - 150} ${x - 6},${y - 230} C${x - 18},${y - 290} ${x + 4},${y - 330} ${x - 8},${y - 380}" fill="none" stroke="#6B4E3A" stroke-width="14" stroke-linecap="round"/>`;
  const mang = [[-4, -500, 62, 44], [-46, -440, 58, 40], [44, -430, 60, 44], [-10, -384, 76, 46], [-58, -330, 56, 40], [52, -318, 62, 44], [0, -280, 70, 42], [-44, -214, 52, 36], [50, -196, 54, 38], [6, -150, 50, 32]];
  for (const [dx, dy, rx, ry] of mang) {
    s += `<path class="n nh" d="${blob(x + dx, y + dy, rx, ry, 12, 0.18)}" fill="${pick(['#2F5140', '#37604A', '#2A4838'])}"/>`;
    s += `<path d="${blob(x + dx - rx * 0.3, y + dy - ry * 0.35, rx * 0.45, ry * 0.3, 8, 0.2)}" fill="#7FA36A" opacity=".55"/>`;
    s += kim(x + dx + R(-10, 10), y + dy + ry * 0.5, 16, 90, 70, 9, '#24402F');
  }
  return s;
}
function laTo(x, y, k, rot, mau) {
  // lá to xẻ thuỳ ở tiền cảnh (góc dưới phải trong ảnh)
  let s = `<g transform="translate(${f(x)},${f(y)}) rotate(${f(rot)})">`;
  for (const a of [-76, -38, 0, 38, 76]) {
    const l = k * (a === 0 ? 1 : Math.abs(a) < 40 ? 0.9 : 0.68);
    s += `<g transform="rotate(${a})"><path class="n nh" d="M0,0 C${f(l * 0.24)},${f(-l * 0.3)} ${f(l * 0.3)},${f(-l * 0.7)} 0,${f(-l)} C${f(-l * 0.3)},${f(-l * 0.7)} ${f(-l * 0.24)},${f(-l * 0.3)} 0,0Z" fill="${mau}"/>`
      + `<path d="M0,${f(-l * 0.08)} V${f(-l * 0.86)}" stroke="#3E6B43" stroke-width="1.3" opacity=".7"/></g>`;
  }
  return s + '</g>';
}
function gheSat(x, y, lat) {
  // ghế sắt đen lưng mắt cáo, nệm kem viền đen. lat = -1 thì lật ngang (ghế quay mặt sang trái)
  const g1 = `<g transform="translate(${x},${y}) scale(${lat},1)">`;
  let s = '';
  // bốn chân + tay vịn
  s += `<path d="M-40,0 C-42,40 -45,80 -48,114 M40,0 C42,40 45,80 48,114 M-30,-6 C-30,36 -28,70 -26,96 M30,-6 C30,36 28,70 26,96" fill="none" stroke="${SAT}" stroke-width="4.6" stroke-linecap="round"/>`;
  s += `<path d="M-45,70 H45" stroke="${SAT}" stroke-width="3.4"/>`;
  // nệm lưng (nhìn từ sau thì nệm nằm sau lớp mắt cáo)
  s += `<rect x="-36" y="-108" width="72" height="94" rx="12" fill="#F1E8D4" stroke="${SAT}" stroke-width="2.4"/>`;
  // khung lưng mắt cáo
  let mat = '';
  for (let i = 1; i < 4; i++) mat += `M${-42 + i * 21},-116V-12`;
  for (let j = 1; j < 5; j++) mat += `M-42,${-116 + j * 21}H42`;
  s += `<path d="${mat}" fill="none" stroke="${SAT}" stroke-width="2.6"/>`;
  s += `<rect x="-42" y="-116" width="84" height="106" rx="10" fill="none" stroke="${SAT}" stroke-width="5"/>`;
  // nệm ngồi + tay vịn uốn
  s += `<path d="M-44,-12 H44 L50,6 H-50Z" fill="#F4ECDB" stroke="${SAT}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<path d="M-42,-60 C-66,-62 -70,-30 -52,-14 M42,-60 C66,-62 70,-30 52,-14" fill="none" stroke="${SAT}" stroke-width="4.2" stroke-linecap="round"/>`;
  return g1 + s + '</g>';
}
function banAn(cx, cy) {
  // bàn bát giác mặt đá trắng lấm tấm, chân sắt uốn
  let s = '';
  // chân sắt uốn hai bên + vòng giằng
  s += `<path d="M${cx - 74},${cy + 12} C${cx - 74},${cy + 66} ${cx - 14},${cy + 62} ${cx - 10},${cy + 96} C${cx - 6},${cy + 134} ${cx - 70},${cy + 140} ${cx - 88},${cy + 190}`
    + ` M${cx + 74},${cy + 12} C${cx + 74},${cy + 66} ${cx + 14},${cy + 62} ${cx + 10},${cy + 96} C${cx + 6},${cy + 134} ${cx + 70},${cy + 140} ${cx + 88},${cy + 190}" fill="none" stroke="${SAT}" stroke-width="5.4" stroke-linecap="round"/>`;
  s += `<ellipse cx="${cx}" cy="${cy + 146}" rx="50" ry="10" fill="none" stroke="${SAT}" stroke-width="4"/>`;
  s += `<path d="M${cx - 40},${cy + 14} C${cx - 36},${cy + 50} ${cx - 8},${cy + 56} ${cx},${cy + 84} C${cx + 8},${cy + 56} ${cx + 36},${cy + 50} ${cx + 40},${cy + 14}" fill="none" stroke="${SAT}" stroke-width="3.6" stroke-linecap="round"/>`;
  // mặt bàn bát giác (nhìn nghiêng nên dẹt) + độ dày
  const V = [];
  for (let k = 0; k < 8; k++) {
    const a = (22.5 + 45 * k) * Math.PI / 180;
    V.push([cx + 132 * Math.cos(a), cy + 31 * Math.sin(a)]);
  }
  s += `<path class="n" d="M${V.map((p) => P([p[0], p[1] + 10])).join(' L')}Z" fill="#CFC8B8"/>`;
  s += `<path class="n" d="M${V.map(P).join(' L')}Z" fill="#F6F2E8"/>`;
  let lam = '';
  for (let i = 0; i < 46; i++) {
    const a = R(0, 6.2832), d = Math.sqrt(rnd()) * 0.86;
    lam += `<circle cx="${f(cx + Math.cos(a) * 132 * d)}" cy="${f(cy + Math.sin(a) * 31 * d)}" r="${f(R(0.8, 1.7))}" fill="${pick(['#B9B2A2', '#D9C7A0', '#9E988C'])}"/>`;
  }
  s += lam;
  // pizza trên đĩa: viền bánh phồng, phô mai, cà chua, lá húng
  s += `<ellipse class="n nh" cx="${cx - 26}" cy="${cy + 6}" rx="62" ry="15" fill="#FBF8F0"/>`;
  s += `<ellipse class="n nh" cx="${cx - 26}" cy="${cy + 4}" rx="54" ry="12.5" fill="#E0AE62"/>`;
  s += `<ellipse cx="${cx - 26}" cy="${cy + 4}" rx="45" ry="9.6" fill="#F3D48A"/>`;
  for (const [dx, dy] of [[-30, -2], [-10, 3], [10, -3], [26, 2], [-20, 5], [2, 6], [30, -4]]) s += `<ellipse cx="${cx - 26 + dx}" cy="${cy + 4 + dy}" rx="5.5" ry="2.6" fill="#C9482F"/>`;
  for (const [dx, dy, r] of [[-22, -4, 20], [-2, -1, -30], [18, 4, 40], [-34, 3, 60]]) s += `<ellipse cx="${cx - 26 + dx}" cy="${cy + 4 + dy}" rx="4.6" ry="2" transform="rotate(${r} ${cx - 26 + dx} ${cy + 4 + dy})" fill="#4F8A4B"/>`;
  // tô mì Ý
  s += `<ellipse class="n nh" cx="${cx + 62}" cy="${cy - 8}" rx="36" ry="10" fill="#FBF8F0"/>`;
  s += `<ellipse cx="${cx + 62}" cy="${cy - 8}" rx="26" ry="6.4" fill="#E9B45A"/>`;
  s += `<path d="M${cx + 42},${cy - 8} q8,-6 16,0 q8,6 16,0 M${cx + 46},${cy - 5} q8,-5 14,0 q7,5 14,0" fill="none" stroke="#C98A32" stroke-width="1.3"/>`;
  // đĩa bánh mì + giá gỗ tam giác
  s += `<ellipse class="n nh" cx="${cx - 96}" cy="${cy - 6}" rx="24" ry="7" fill="#FBF8F0"/><ellipse cx="${cx - 96}" cy="${cy - 8}" rx="14" ry="4.4" fill="#D9A866" stroke="${INK}" stroke-width="1"/>`;
  s += `<path class="n nh" d="M${cx - 60},${cy - 12} L${cx - 46},${cy - 42} L${cx - 34},${cy - 12}Z" fill="#A9784B"/>`;
  // chai dầu ô liu + ly nước
  s += `<path class="n nh" d="M${cx + 4},${cy - 16} V${cy - 44} C${cx + 4},${cy - 50} ${cx + 8},${cy - 50} ${cx + 8},${cy - 56} H${cx + 14} C${cx + 14},${cy - 50} ${cx + 18},${cy - 50} ${cx + 18},${cy - 44} V${cy - 16}Z" fill="#6E8A52"/>`;
  s += `<rect x="${cx + 7}" y="${cy - 61}" width="8" height="6" rx="1.5" fill="${SAT}"/>`;
  s += `<path d="M${cx + 24},${cy - 44} L${cx + 26},${cy - 16} H${cx + 40} L${cx + 42},${cy - 44}Z" fill="#FFE9B8" fill-opacity=".75" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`;
  return s;
}

// Bộ bàn ghế: x, y là chỗ chân bàn chạm đất, k là độ phóng so với nét vẽ gốc.
// Cô gái cao khoảng 830 đơn vị, bàn ăn thật cao gần nửa người nên mặt bàn phải cách đất khoảng 190 * k đơn vị.
const BAN = { x: 684, y: 1136, k: 1.7 };

function canhLaMozza() {
  let s = '';

  // trời hoàng hôn: tím nhạt phía trên, xuống hồng san hô, cam rồi vàng sát chân trời
  s += `<rect x="-12" y="-12" width="${W + 24}" height="800" fill="url(#lm-troi)"/>`;
  s += may(600, 250, 360, 0.5, '#E58FA0') + may(170, 300, 300, 0.45, '#D98BB0') + may(420, 190, 300, 0.35, '#C59AD0');
  s += may(660, 392, 300, 0.6, '#FFD3A0') + may(250, 430, 280, 0.55, '#FFC99A') + may(470, 476, 240, 0.5, '#FFE2A8');
  s += `<g fill="#FFF0B8" opacity=".8"><ellipse cx="540" cy="516" rx="240" ry="7"/><ellipse cx="250" cy="532" rx="160" ry="6"/></g>`;
  // quầng sáng chân trời + mặt trời lặn sau dãy đồi bên trái
  s += `<ellipse cx="380" cy="560" rx="520" ry="72" fill="#FFE9A8" opacity=".85" filter="url(#mo)"/>`;
  s += `<circle cx="${LM_MT.x}" cy="${LM_MT.y}" r="280" fill="url(#quang)"/>`;
  s += `<circle cx="${LM_MT.x}" cy="${LM_MT.y}" r="42" fill="#FFF4BE"/>`;
  s += `<path class="chim" d="M560,330 q8,-9 15,0 q8,-8 15,1 M612,366 q6,-7 11,0 q6,-6 11,1" fill="none" stroke="#5A3F4A" stroke-width="1.7" stroke-linecap="round" opacity=".8"/>`;

  // dãy núi xa + hai sườn đồi thông
  s += doi(lmNuiXa, 760, '#A99BC6');
  s += `<g filter="url(#mo)" fill="#FFE2C2"><ellipse cx="520" cy="600" rx="380" ry="16" opacity=".7"/></g>`;
  s += thongXa(lmDoiT, -10, 520, 14, 26, '#587558') + doi(lmDoiT, 760, '#6E8A68');
  s += thongXa(lmDoiP, 380, W + 10, 14, 26, '#52704F') + doi(lmDoiP, 760, '#668362');

  // khu biệt thự trắng của Đà Lạt nằm giữa hai sườn đồi, vài nhà vừa lên đèn
  const nha = [];
  for (let i = 0; i < 26; i++) {
    const x = R(110, 880);
    nha.push([x, R(Math.max(lmDoiT(x), lmDoiP(x)) - 2, 668), R(0.75, 1.25)]);
  }
  nha.sort((a, b) => a[1] - b[1]);
  for (const [x, y, k] of nha) {
    s += `<path d="${blob(x - 14 * k, y - 8 * k, 13 * k, 12 * k, 8, 0.2)}" fill="${pick(['#4F7354', '#5B8060', '#476A4C'])}"/>`;
    s += bietThuTrang(x, y, k, pick(['#7C7690', '#B5604A', '#8E6E7A', '#6E7C8C']), rnd() < 0.3);
  }
  s += `<g filter="url(#mo)" fill="#FFD3B0"><ellipse cx="450" cy="664" rx="420" ry="12" opacity=".45"/></g>`;

  // mái ngói đất nung của dãy nhà bên dưới, ló lên sau hàng cây
  const ngoi = 'M436,690 H672 V652 H452Z';
  s += `<path class="n nh" d="${ngoi}" fill="#B5604A"/>`;
  let gan = 'M444,671H672';
  for (let x = 458; x < 672; x += 14) gan += `M${x},654V690`;
  s += `<path d="${gan}" stroke="#8E4230" stroke-width="1.1" opacity=".6" fill="none"/>`;

  // hàng cây bụi rậm + các bụi hoa tím xen giữa
  s += hangCay(672, SAN_Y + 10);
  for (const [x, h, n] of [[36, 150, 9], [120, 170, 10], [210, 140, 8], [530, 120, 7], [640, 150, 9], [760, 130, 8]]) {
    s += lac(hoaTim(x, SAN_Y - 30, h, n, ['#9B6FD0', '#8457BE', '#B08AE0']), x, SAN_Y - 30, 4, x / W * 1.5 + R2(0, 0.4));
  }

  // cây tùng bên phải
  s += lac(cayTung(842, SAN_Y + 10), 842, SAN_Y + 10, 0.8, 1.45);

  // nền sỏi
  s += `<rect x="-12" y="${SAN_Y}" width="${W + 24}" height="${H - SAN_Y + 12}" fill="url(#lm-san)"/>`;
  let soi = '';
  for (let i = 0; i < 620; i++) {
    const y = R(SAN_Y + 2, H), k = 0.6 + (y - SAN_Y) / 300;
    soi += `<ellipse cx="${f(R(0, W))}" cy="${f(y)}" rx="${f(R(2.6, 5) * k)}" ry="${f(R(1.6, 3) * k)}" fill="${pick(['#E3D3B4', '#CDB893', '#BBA47E', '#D8C6A2', '#A9906C'])}"/>`;
  }
  s += soi;
  s += `<ellipse cx="300" cy="1010" rx="360" ry="90" fill="#FFB86B" opacity=".22" filter="url(#mo)"/>`;

  // bờ đá hộc bên trái, trên bờ có bụi hoa tím
  s += tuongDa(-12, 884, 168, 1004, 'lm-da');
  s += `<path class="n nh" d="M-12,884 H168 V1004" fill="none"/>`;
  s += lac(hoaTim(60, 890, 120, 9, ['#9B6FD0', '#8457BE', '#B08AE0']), 60, 890, 4, 0.1 + R2(0, 0.3));

  // tán dù vải kem: một tán ngay trên đầu, một tán che bàn ăn
  s += `<path d="M${BAN.x},300 V${BAN.y - 16}" stroke="${INK}" stroke-width="13" stroke-linecap="round"/><path d="M${BAN.x},300 V${BAN.y - 16}" stroke="#B98A55" stroke-width="9.4" stroke-linecap="round"/>`;
  s += `<path d="M${BAN.x - 3},330 V${BAN.y - 26}" stroke="#D9B07A" stroke-width="2" opacity=".7"/>`;
  s += tanDu(BAN.x, 300, 252, 54);
  s += tanDuGan();

  // bàn ghế: ghế sau bàn, bàn bát giác, ghế bên phải quay lưng về phía người xem
  // Cả bộ vẽ quanh chân bàn (716, 1194) rồi phóng theo BAN.k, để mặt bàn cao ngang hông cô gái.
  s += `<ellipse cx="${BAN.x + 44 * BAN.k}" cy="${BAN.y + 4}" rx="${f(210 * BAN.k)}" ry="${f(15 * BAN.k)}" fill="#3A2B3F" opacity=".3" filter="url(#mo)"/>`;
  s += `<g class="ban-ghe" transform="translate(${BAN.x},${BAN.y}) scale(${BAN.k}) translate(-716,-1194)">`;
  s += gheSat(604, 1078, 1);
  s += banAn(716, 1004);
  s += gheSat(852, 1094, -1);
  s += '</g>';

  // bóng cô gái đổ dài về bên phải (nắng xiên từ trái)
  s += `<ellipse cx="${GAI.x + 110}" cy="${f(GAI.y + 732 * GAI.s)}" rx="170" ry="13" fill="#3A2B3F" opacity=".34" filter="url(#mo)"/>`;

  // cô gái đứng yên; tóc, hoa, tai thỏ, ruy băng và gấu váy động theo gió
  s += `<g id="co-gai" transform="translate(${GAI.x},${GAI.y}) scale(${GAI.s})">${coGai()}</g>`;

  // tiền cảnh: lá to xẻ thuỳ ở góc dưới phải, bụi hoa tím ở góc dưới trái
  for (const [x, y, k, rot] of [[792, 1262, 92, -18], [872, 1196, 84, 10], [836, 1300, 100, 30], [742, 1304, 78, -44], [896, 1290, 86, 52]]) {
    s += `<path d="M${x},${y} Q${x + 10},${y + 60} ${x + 4},${H + 20}" fill="none" stroke="#4E7A4A" stroke-width="4" stroke-linecap="round"/>`;
    s += lac(laTo(x, y, k, rot, pick(['#6FA35C', '#5B8F4E', '#7DB068'])), x, y + 40, 3, x / W * 1.5 + R2(0, 0.4));
  }
  for (const [x, h, n] of [[40, 150, 10], [118, 128, 9], [190, 104, 8]]) {
    s += lac(hoaTim(x, H + 14, h, n, ['#9B6FD0', '#8457BE', '#B08AE0']), x, H + 14, 3.6, x / W * 1.5 + R2(0, 0.4));
  }

  // cánh hoa bị gió cuốn bay ngang tranh (chỉ hiện khi tranh động)
  for (let i = 0; i < 9; i++) {
    const mau = ['#FFFFFF', '#CFE6F8', '#F9C9D8', '#C9B8F0'][Math.floor(R2(0, 4))];
    s += `<g transform="translate(${f(R2(120, 640))},${f(R2(430, 1090))})"><g class="bay" style="--d:${f(-R2(0, 4))}s;--dx:${f(R2(150, 260))}px;--dy:${f(R2(-60, 40))}px">`
      + `<path class="xoay" d="M0,0 C3,-4.5 10,-4.5 13,0 C10,4.5 3,4.5 0,0Z" fill="${mau}" stroke="${INK}" stroke-width=".6" stroke-opacity=".5"/></g></g>`;
  }
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
      <stop offset="0" stop-color="#C24A2C"/><stop offset=".22" stop-color="#E5641F"/><stop offset=".45" stop-color="#F5841C"/><stop offset=".62" stop-color="#FBA428"/><stop offset=".74" stop-color="#FFC64A"/><stop offset=".84" stop-color="#FFDD7E"/><stop offset="1" stop-color="#FFDD7E"/>
    </linearGradient>
    <radialGradient id="quang"><stop offset="0" stop-color="#FFF6C8" stop-opacity=".95"/><stop offset=".3" stop-color="#FFD867" stop-opacity=".6"/><stop offset="1" stop-color="#FF9A2E" stop-opacity="0"/></radialGradient>
    <linearGradient id="ho" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC660"/><stop offset=".45" stop-color="#F58E3A"/><stop offset="1" stop-color="#A7563F"/></linearGradient>
    <linearGradient id="ho-suong" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD27A" stop-opacity="0"/><stop offset=".6" stop-color="#E88A4A" stop-opacity=".25"/><stop offset="1" stop-color="#8E4A45" stop-opacity=".5"/></linearGradient>
    <linearGradient id="co" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8C8A52"/><stop offset=".35" stop-color="#5F7350"/><stop offset="1" stop-color="#3C4F47"/></linearGradient>
    <linearGradient id="chieu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A1838" stop-opacity="0"/><stop offset=".62" stop-color="#2A1838" stop-opacity="0"/><stop offset="1" stop-color="#2A1838" stop-opacity=".26"/></linearGradient>
    <linearGradient id="lm-troi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7C86C4"/><stop offset=".26" stop-color="#B48FC0"/><stop offset=".44" stop-color="#F0A09A"/><stop offset=".58" stop-color="#F9B26A"/><stop offset=".7" stop-color="#FFD27A"/><stop offset="1" stop-color="#FFE3A0"/></linearGradient>
    <linearGradient id="lm-san" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9C7A6"/><stop offset="1" stop-color="#B49E7C"/></linearGradient>
    <linearGradient id="lm-chieu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A2440" stop-opacity="0"/><stop offset=".62" stop-color="#3A2440" stop-opacity="0"/><stop offset="1" stop-color="#3A2440" stop-opacity=".16"/></linearGradient>
    <clipPath id="cat-ho"><rect x="-12" y="${HO_Y}" width="${W + 24}" height="170"/></clipPath>
    <clipPath id="mep"><path d="${mepTranh()}"/></clipPath>
    <filter id="mo" x="-30%" y="-120%" width="160%" height="340%"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="mem" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="2.2"/></filter>
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
    <g id="dq"><g fill="#F7B531" stroke="${INK}" stroke-width=".7" stroke-opacity=".6">${dq}</g><circle r="4.6" fill="#A85A1C" stroke="${INK}" stroke-width=".7" stroke-opacity=".6"/></g>
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

/* ---------- danh sách các khung cảnh ----------
   Mỗi cảnh: hàm vẽ, vị trí cô gái, lớp phủ màu cuối cùng và phần chữ đi kèm trang. */
const CANH = {
  ho: {
    tep: 'phac-thao', tieuDe: 'Phác thảo Đà Lạt', ve: canh, gaiX: 425,
    phu: `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#chieu)"/><rect x="0" y="0" width="${W}" height="${H}" fill="#FF8A2B" opacity=".07"/>`,
    moTa: "Phác thảo: cô gái búi tóc, không vẽ mắt, mặc váy lụa xanh viền ren, một tay ôm đoá hoa xanh trắng, tay kia ôm bé thỏ bông màu kem đeo yếm, hai tai thêu chữ Tặng Vê và Minh Thư, đứng trên đồng cỏ Đà Lạt lúc hoàng hôn, trời cam rực sau dãy núi tím, đồi thông in bóng, mặt hồ loang nắng vàng và đỉnh LangBiang phía xa",
    nhan: 'Phác thảo số 01 · thiệp sinh nhật', ten: 'Cô gái ôm hoa và bé thỏ giữa Đà Lạt',
    chuThich: 'Đà Lạt, một chiều hoàng hôn',
    ghiChu: "Trong tranh: hoàng hôn cam rực sau dãy núi, đỉnh LangBiang hai ngọn và đồi thông in bóng tím, nhà thờ nhỏ đã lên đèn bên mặt hồ loang nắng, bụi dã quỳ tháng mười một và cẩm tú cầu dưới chân. Đoá hoa vẽ theo bó thật: lily xanh, hồng kem, hồng môn xanh, hoa sao nhỏ, nụ tulip trắng, giấy ren trắng và ruy băng xanh. Tay còn lại ôm bé thỏ bông Franilla lông xù màu kem, cổ đeo yếm, hai tai thêu chữ nâu vàng.",
  },
  'la-mozza': {
    tep: 'phac-thao-la-mozza', tieuDe: 'Phác thảo La Mozza', ve: canhLaMozza, gaiX: 306,
    phu: `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#lm-chieu)"/><rect x="0" y="0" width="${W}" height="${H}" fill="#FF9A4D" opacity=".06"/>`,
    moTa: 'Phác thảo: cô gái búi tóc, không vẽ mắt, mặc váy lụa xanh viền ren, một tay ôm đoá hoa xanh trắng, tay kia ôm bé thỏ bông màu kem, đứng trong sân vườn rải sỏi của quán La Mozza lúc hoàng hôn. Trên đầu là tán dù vải kem khung gỗ, bên phải là bàn bát giác mặt đá trắng chân sắt uốn bày pizza và mì Ý cùng ghế sắt đen nệm kem, sau lưng là hàng cây rậm xen hoa tím, xa hơn là khu biệt thự trắng của Đà Lạt trên đồi thông',
    nhan: 'Phác thảo số 02 · thiệp sinh nhật', ten: 'Hoàng hôn ở La Mozza',
    chuThich: 'La Mozza, Đà Lạt, lúc hoàng hôn',
    ghiChu: 'Trong tranh: sân vườn rải sỏi của La Mozza, hai tán dù vải kem khung gỗ, bàn bát giác mặt đá trắng chân sắt uốn bày pizza, mì Ý và bánh mì, ghế sắt đen lưng mắt cáo nệm kem viền đen, bờ đá hộc, hàng cây rậm xen hoa tím, cây tùng, lá to ở góc dưới, và khu biệt thự trắng của Đà Lạt trên đồi thông phía xa. Bố cục vẽ theo ảnh chụp thật của quán, ánh sáng đổi sang hoàng hôn.',
  },
};

function svg(ten) {
  const c = CANH[ten];
  // đặt lại hạt giống để mỗi cảnh luôn ra đúng một bức, không phụ thuộc thứ tự vẽ
  seed = 20261122; seed2 = 99; GAI.x = c.gaiX;
  const d = defs();
  const scene = c.ve();
  return `<svg class="tranh" id="tranh" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="tranh-ten">
  <title id="tranh-ten">${c.moTa}</title>
  ${d}
  <g filter="url(#rung)"><g clip-path="url(#mep)">
  ${scene}
  ${c.phu}
  <rect x="0" y="0" width="${W}" height="${H}" filter="url(#loang)" opacity=".12"/>
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
.to-giay img{display:block;width:100%;height:auto}
.canh{display:flex;flex-direction:column;gap:clamp(12px,3vw,18px)}
h2{font-family:var(--chu-de);font-weight:500;font-style:italic;font-size:clamp(1.2rem,4.4vw,1.5rem);line-height:1.2;margin:0}
.to-giay figcaption{font-family:var(--chu-de);font-style:italic;color:#5A6478;font-size:clamp(.82rem,2.6vw,.95rem);text-align:right;padding:6px clamp(6px,2vw,14px) 0}
.n{stroke:${INK};stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round}
.nh{stroke-width:1.5}
.nm{fill:none;stroke:${INK};stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round;opacity:.72}
.ban-ghe .n{vector-effect:non-scaling-stroke}
.nx{stroke:${INK};stroke-width:1.1;stroke-linejoin:round;stroke-opacity:.75}
.nk{fill:none;stroke:#A39A82;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round}
.nf{stroke:#5B7BA6;stroke-width:1.3;stroke-linejoin:round;stroke-linecap:round}
.nt{stroke:#B3A38F;stroke-width:1.25;stroke-linejoin:round;stroke-linecap:round}
.theu{font-family:'Charm','Lucida Calligraphy','Apple Chancery',cursive;font-weight:700;fill:#B5823A;stroke:#8E6527;stroke-width:.4;paint-order:stroke}
.ll{fill:#FFFFFF;stroke:#9CC4E4;stroke-width:.8;animation:chop 2s ease-in-out infinite}
@keyframes chop{0%,100%{opacity:.95}50%{opacity:.25}}
/* chuyển động đung đưa: chỉ chạy khi <svg class="tranh dong"> */
.dong .lac{animation:lac var(--t,4s) ease-in-out var(--d,0s) infinite}
.dong .troi{animation:troi 4s ease-in-out var(--d,0s) infinite}
.dong .gio{transform-box:fill-box;transform-origin:50% 100%;animation:gio 4s ease-in-out var(--d,0s) infinite}
.dong .vay-gio{transform-box:fill-box;transform-origin:50% 0%;animation:vay 4s ease-in-out -.45s infinite}
.bay{opacity:0}
.dong .bay{animation:bay 4s linear var(--d,0s) infinite}
.dong .xoay{transform-box:fill-box;transform-origin:center;animation:xoay 2s linear infinite}
.dong .chim{animation:chim 2s ease-in-out infinite}
.dong .long-lanh{animation:nhay 2s ease-in-out infinite}
@keyframes lac{0%,100%{transform:rotate(calc(var(--a,2deg) * -.2))}32%{transform:rotate(var(--a,2deg))}52%{transform:rotate(calc(var(--a,2deg) * .5))}70%{transform:rotate(calc(var(--a,2deg) * .85))}}
@keyframes troi{0%,100%{transform:translateX(calc(var(--dx,6px) * -1))}50%{transform:translateX(var(--dx,6px))}}
@keyframes gio{0%,100%{transform:skewX(1deg)}32%{transform:skewX(-6deg)}52%{transform:skewX(-2.5deg)}70%{transform:skewX(-4.5deg)}}
@keyframes vay{0%,100%{transform:skewX(-1deg)}32%{transform:skewX(6deg)}52%{transform:skewX(2.5deg)}70%{transform:skewX(4.5deg)}}
@keyframes bay{0%{opacity:0;transform:translate(0,0)}12%{opacity:.95}80%{opacity:.9}100%{opacity:0;transform:translate(var(--dx,200px),var(--dy,0px))}}
@keyframes xoay{to{transform:rotate(360deg)}}
@keyframes chim{0%,100%{transform:translateY(-2px)}50%{transform:translateY(3px)}}
@keyframes nhay{0%,100%{opacity:.95}50%{opacity:.5}}
@media (prefers-reduced-motion: reduce){ .ll,.dong .lac,.dong .troi,.dong .gio,.dong .vay-gio,.dong .bay,.dong .xoay,.dong .chim,.dong .long-lanh{animation:none} }
`;

// phông chữ thêu trên tai thỏ và biển tên quán (tạo bằng: node tools/lay-font.js)
const FONT_FILE = path.join(__dirname, 'font-theu.css');
const FONT = fs.existsSync(FONT_FILE) ? fs.readFileSync(FONT_FILE, 'utf8') : '';
if (!FONT) console.warn('Chưa có tools/font-theu.css, chữ thêu sẽ dùng phông dự phòng. Chạy: node tools/lay-font.js');

const root = path.join(__dirname, '..');
const TRANH = {}; // tên cảnh -> SVG đã vẽ
for (const ten of Object.keys(CANH)) TRANH[ten] = svg(ten);

const hinh = (ten) => `<figure class="to-giay">
    ${TRANH[ten]}
    <figcaption>${CANH[ten].chuThich}</figcaption>
  </figure>`;

/* ---------- mỗi cảnh một file HTML riêng, mở offline được ---------- */
for (const [ten, c] of Object.entries(CANH)) {
  const full = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${c.tieuDe}</title>
<style>${CSS}</style>
</head>
<body>
<!-- ============================================================
     BẢN PHÁC THẢO cho thiệp sinh nhật: ${c.ten}.
     File này do tools/ve-phac-thao.js vẽ ra. Muốn đổi hình thì sửa
     trong script rồi chạy lại: node tools/ve-phac-thao.js
     ============================================================ -->

<main class="trang">
  <header class="dau">
    <p class="nhan">${c.nhan}</p>
    <h1>${c.ten}</h1>
  </header>

  ${hinh(ten)}

  <p class="ghi-chu">${c.ghiChu}</p>
</main>

<!-- PHÔNG CHỮ NHÚNG: đừng sửa -->
<style>${FONT}</style>
</body>
</html>
`;
  fs.writeFileSync(path.join(root, c.tep + '.html'), full);
  console.log(`Đã vẽ xong: ${c.tep}.html (${Math.round(full.length / 1024)} KB)`);
}

/* ---------- bản xem thử trên Artifact: gom các cảnh vào một trang ----------
   Chỉ cảnh mới nhất được nhúng dạng SVG; cảnh còn lại hiện bằng GIF (tạo bằng: node tools/lam-gif.js)
   để trong một trang không có hai SVG trùng id. */
const out2 = process.argv[2];
if (out2) {
  const gif = (ten, alt) => {
    const p = path.join(root, CANH[ten].tep + '.gif');
    return fs.existsSync(p)
      ? `<figure class="to-giay">
    <img src="data:image/gif;base64,${fs.readFileSync(p).toString('base64')}" width="540" height="768" alt="${alt}">
    <figcaption>Bản có gió, lặp mỗi 4 giây</figcaption>
  </figure>`
      : '';
  };
  const artifact = `<title>Phác thảo Đà Lạt</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>${CSS}</style>

<main class="trang">
  <header class="dau">
    <p class="nhan">Phác thảo thiệp sinh nhật · hai khung cảnh</p>
    <h1>Cô gái ôm hoa và bé thỏ ở Đà Lạt</h1>
  </header>

  <section class="canh">
    <h2>Cảnh 02 · ${CANH['la-mozza'].ten}</h2>
  ${hinh('la-mozza')}
  ${gif('la-mozza', 'Bản có gió của cảnh La Mozza: dây đèn nhấp nháy, lửa lò bập bùng, tóc, tai thỏ, ruy băng và oải hương lay theo gió')}
    <p class="ghi-chu">${CANH['la-mozza'].ghiChu}</p>
  </section>

  <section class="canh">
    <h2>Cảnh 01 · Hoàng hôn bên hồ</h2>
  ${gif('ho', 'Bản có gió của cảnh hoàng hôn bên hồ: tóc, tai thỏ, ruy băng, cành thông và hoa lay theo gió') || hinh('ho')}
    <p class="ghi-chu">${CANH.ho.ghiChu}</p>
  </section>
</main>

<style>${FONT}</style>`;
  fs.writeFileSync(out2, artifact);
}
