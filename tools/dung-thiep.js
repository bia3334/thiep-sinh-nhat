#!/usr/bin/env node
'use strict';
/* ============================================================
   DỰNG THIỆP KÉO "MỘT NGÀY Ở ĐÀ LẠT"
   Chạy:  node tools/dung-thiep.js
   Kết quả: thiep.html, một file duy nhất, mở offline được.

   Thiệp gồm: màn nhập mật mã, rồi một câu chuyện kéo dọc. Mỗi lần kéo xuống,
   một khoảnh khắc chạy lên, trời đổi dần từ rạng đông sang hoàng hôn, cuối cùng
   là tờ tranh có gió (GIF cảnh La Mozza) kèm lời chúc.

   MUỐN SỬA LỜI: chỉ cần sửa khối "NỘI DUNG" ngay bên dưới rồi chạy lại.
   Chỗ nào còn nằm trong [ngoặc vuông] là chữ giữ chỗ, chưa phải lời thật.
   ============================================================ */
const fs = require('fs');
const path = require('path');

/* ---------- NỘI DUNG ---------- */
const MAT_MA = '1314';
const TIEU_DE_TAB = 'Thiệp gửi Hoa';
// Màn khoá: câu của owner, giữ nguyên từng chữ, chỉ ngắt dòng cho vừa màn hình. Bốn ô mật mã nằm ngay dưới.
const KHOA = { tieuDe: ['Hôm nay là 1 ngày đẹp trời', 'tui rất thích bà', 'thấy thế nào'], phu: 'Nhập bốn số để mở thiệp' };
const MO_DAU = {
  goi: 'Gửi Hoa,',
  dong: ['[Một câu mở đầu, ví dụ: tui có chuyện này muốn kể bà nghe.]'],
  nhac: 'Kéo xuống nha',
};
// Mỗi khoảnh khắc: "luc" là nhãn thời điểm trong ngày, "dong" là các dòng chữ chạy lên lần lượt.
const CAU_CHUYEN = [
  { luc: 'Bình minh', dong: ['[Lần đầu tui gặp bà: ở đâu, hôm đó thế nào.]'] },
  { luc: 'Buổi sáng', dong: ['[Một điều nhỏ ở bà mà tui để ý từ sớm.]'] },
  { luc: 'Giữa trưa', dong: ['[Một kỷ niệm vui của hai đứa.]'] },
  { luc: 'Xế chiều', dong: ['[Lúc tui nhận ra tui thích bà.]'] },
  { luc: 'Hoàng hôn', dong: ['[Khúc cuối trước tờ tranh: một câu chốt.]'] },
];
const LOI_CUOI = ['Chúc mừng sinh nhật,', 'tình yêu đời mình.'];
const KY_TEN = '[Tên người gửi]';
const GIF_CUOI = 'phac-thao-la-mozza'; // tên file GIF ở gốc repo, không kèm đuôi
const MO_TA_GIF = 'Tranh vẽ có gió: cô gái búi tóc mặc váy lụa xanh, một tay ôm đoá hoa xanh trắng, tay kia ôm bé thỏ bông, đứng trong sân vườn quán La Mozza lúc hoàng hôn';

/* ---------- BẢNG MÀU THEO THỜI ĐIỂM ----------
   Mỗi mốc ứng với một màn (mở đầu, 5 khoảnh khắc, màn cuối), trình duyệt tự pha màu giữa hai mốc.
   t: trời từ đỉnh xuống chân trời, d: ba lớp đồi từ xa tới gần, mt: mặt trời, may: mây, suong: độ dày sương.
   Mốc cuối lấy theo trời của cảnh La Mozza để nối với tờ tranh. */
const MAU = [
  { t: ['#6E7BB0', '#C9A9C4', '#FBD0B4'], d: ['#9C97C2', '#757BA8', '#4E5886'], mt: '#FFE9C4', may: '#F6D9DC', suong: 0.9 },
  { t: ['#8FA3D6', '#F4BFB4', '#FFE3B5'], d: ['#B2A7C9', '#8389AE', '#55628A'], mt: '#FFE2A8', may: '#FFE4D6', suong: 0.7 },
  { t: ['#79B2E6', '#BFDFF6', '#F6F2DA'], d: ['#A7C4DA', '#7DA890', '#487A5C'], mt: '#FFF3C4', may: '#FFFFFF', suong: 0.25 },
  { t: ['#4F9CE0', '#9FCDF2', '#E4F2FB'], d: ['#9CC0D8', '#6BA079', '#3C6F4C'], mt: '#FFFBE6', may: '#FFFFFF', suong: 0 },
  { t: ['#6FA6DA', '#F1DDB0', '#FFE6A8'], d: ['#B9AFC0', '#8B9068', '#4C6146'], mt: '#FFE9A0', may: '#FFF1D6', suong: 0.1 },
  { t: ['#8A86C6', '#F3A58F', '#FFCB70'], d: ['#A587AE', '#735C88', '#43365C'], mt: '#FFD67A', may: '#FFC9A8', suong: 0.2 },
  { t: ['#7C86C4', '#F0A09A', '#FFD27A'], d: ['#9A7FA8', '#6A5580', '#3C3152'], mt: '#FFE08A', may: '#F7B7A6', suong: 0.25 },
];
if (MAU.length !== CAU_CHUYEN.length + 2) throw new Error('Số mốc màu phải bằng số khoảnh khắc cộng 2 (mở đầu và màn cuối).');

/* ---------- vẽ dãy đồi Đà Lạt (bóng đổ, không viền) ---------- */
let seed = 20261124;
const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const R = (a, b) => a + (b - a) * rnd();
const f = (n) => Math.round(n * 10) / 10;
const DW = 600, DH = 420;

// đường mềm đi qua các điểm, rồi khép xuống đáy
function suonDoi(pts) {
  let d = `M${pts[0][0]},${DH} L${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d + ` L${pts[pts.length - 1][0]},${DH} Z`;
}
// độ cao sườn đồi tại x (nội suy thẳng, đủ dùng để cắm cây)
function caoTai(pts, x) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    if (x >= x0 && x <= x1) return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
  }
  return pts[pts.length - 1][1];
}
// một cây thông: thân mảnh, tán nhiều tầng xoè dần
function thong(x, y, h) {
  const tang = Math.max(4, Math.round(h / 13));
  let d = `M${f(x - h * 0.02)},${f(y + 3)} L${f(x - h * 0.02)},${f(y - h * 0.3)} L${f(x + h * 0.02)},${f(y - h * 0.3)} L${f(x + h * 0.02)},${f(y + 3)} Z`;
  for (let i = 0; i < tang; i++) {
    const k = i / (tang - 1);
    const yt = y - h + k * h * 0.72, w = h * (0.07 + k * 0.2) * R(0.85, 1.15), cao = h * 0.3;
    d += ` M${f(x)},${f(yt)} L${f(x + w)},${f(yt + cao + R(-2, 2))} L${f(x + w * 0.35)},${f(yt + cao * 0.8)} L${f(x - w * 0.35)},${f(yt + cao * 0.8)} L${f(x - w)},${f(yt + cao + R(-2, 2))} Z`;
  }
  return d;
}

function veDoi() {
  // lớp xa: dãy LangBiang hai ngọn
  const xa = [[0, 196], [60, 186], [120, 192], [185, 170], [245, 150], [300, 118], [326, 104], [350, 124], [378, 112], [410, 140], [470, 168], [540, 180], [600, 172]];
  // lớp giữa: đồi thông, có nhà thờ nhỏ
  const giua = [[0, 250], [70, 236], [150, 252], [230, 240], [310, 262], [390, 244], [470, 232], [540, 250], [600, 240]];
  // lớp gần: sườn đồi ngay trước mặt
  const gan = [[0, 322], [80, 338], [170, 350], [300, 362], [430, 348], [520, 332], [600, 318]];

  let cayGiua = '';
  for (let x = 6; x < DW; x += R(9, 17)) {
    if (x > 222 && x < 262) continue; // chừa chỗ cho nhà thờ
    cayGiua += thong(x, caoTai(giua, x) + 2, R(16, 30));
  }
  const yNT = caoTai(giua, 242);
  const nhaTho = `M226,${f(yNT + 4)} L226,${f(yNT - 12)} L236,${f(yNT - 20)} L236,${f(yNT - 34)} L240,${f(yNT - 52)} L244,${f(yNT - 34)} L244,${f(yNT - 20)} L258,${f(yNT - 12)} L258,${f(yNT + 4)} Z`;

  let cayGan = '';
  for (const [x, h] of [[38, 150], [84, 112], [128, 170], [168, 96], [436, 104], [476, 176], [522, 124], [566, 156]]) {
    cayGan += thong(x, caoTai(gan, x) + 16, h * R(0.94, 1.06));
  }

  return `<svg class="doi" viewBox="0 0 ${DW} ${DH}" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="suong-day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/><stop offset=".5" stop-color="#FFFFFF" stop-opacity=".6"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
    </defs>
    <path class="d1" d="${suonDoi(xa)}"/>
    <rect class="suong" x="0" y="150" width="${DW}" height="120" fill="url(#suong-day)"/>
    <path class="d2" d="${suonDoi(giua)}"/>
    <path class="d2" d="${cayGiua} ${nhaTho}"/>
    <rect class="suong" x="0" y="226" width="${DW}" height="170" fill="url(#suong-day)"/>
    <path class="d3" d="${suonDoi(gan)}"/>
    <path class="d3" d="${cayGan}"/>
  </svg>`;
}

/* ---------- trang ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const dongChu = (arr, lop = 'dong-chu', batDau = 0) => arr.map((s, i) => `<p class="${lop} len" style="--i:${batDau + i}">${esc(s)}</p>`).join('\n      ');

const root = path.join(__dirname, '..');
const gifPath = path.join(root, GIF_CUOI + '.gif');
if (!fs.existsSync(gifPath)) throw new Error(`Chưa có ${GIF_CUOI}.gif. Chạy: node tools/lam-gif.js 540 40 ${GIF_CUOI}`);
const gifB64 = fs.readFileSync(gifPath).toString('base64');
const FONT_FILE = path.join(__dirname, 'font-theu.css');
const FONT = fs.existsSync(FONT_FILE) ? fs.readFileSync(FONT_FILE, 'utf8') : '';
if (!FONT) console.warn('Chưa có tools/font-theu.css, chữ viết tay sẽ dùng phông dự phòng. Chạy: node tools/lay-font.js');

const m0 = MAU[0];
const CSS = `
:root{
  --muc:#2E384C; --giay:#F9F6EF; --chi:#8E6527; --ban:#1B2030;
  --t1:${m0.t[0]}; --t2:${m0.t[1]}; --t3:${m0.t[2]}; --d1:${m0.d[0]}; --d2:${m0.d[1]}; --d3:${m0.d[2]};
  --mt:${m0.mt}; --may:${m0.may}; --suong:${m0.suong};
  --cot:min(100vw,560px);
  --chu-de:"Iowan Old Style","Palatino Linotype","Book Antiqua",Palatino,Georgia,"Noto Serif",serif;
  --chu-tay:'Charm','Lucida Calligraphy','Apple Chancery',cursive;
  --chu:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
}
*{box-sizing:border-box}
html{background:var(--ban)}
body{margin:0;color:var(--muc);font-family:var(--chu-de);font-size:16px;line-height:1.5;overflow-x:hidden}
body.khoa{overflow:hidden}
p{margin:0}

/* sân khấu đứng yên phía sau: trời, mặt trời, mây, đồi */
.san-khau{position:fixed;top:0;left:50%;width:var(--cot);height:100vh;height:100lvh;transform:translateX(-50%);overflow:hidden;z-index:0;
  background:linear-gradient(to bottom,var(--t1) 0%,var(--t2) 46%,var(--t3) 76%,var(--t3) 100%)}
.mat-troi{position:absolute;left:0;top:0;width:68px;height:68px;margin:-34px 0 0 -34px;border-radius:50%;background:var(--mt);
  box-shadow:0 0 0 14px rgba(255,255,255,.14),0 0 60px 26px var(--mt);opacity:.95;will-change:transform}
.may{position:absolute;border-radius:50%;background:var(--may);filter:blur(10px);opacity:.75;animation:troi var(--t,70s) ease-in-out var(--d,0s) infinite alternate}
.may.a{left:6%;top:14%;width:44%;height:5.5%}
.may.b{left:48%;top:25%;width:40%;height:4.5%;--t:90s;--d:-30s;opacity:.6}
.may.c{left:20%;top:37%;width:56%;height:4%;--t:110s;--d:-60s;opacity:.5}
@keyframes troi{from{transform:translateX(-7%)}to{transform:translateX(7%)}}
.doi{position:absolute;left:0;bottom:0;width:100%;height:52%;display:block}
.d1{fill:var(--d1)}.d2{fill:var(--d2)}.d3{fill:var(--d3)}
.suong{opacity:var(--suong)}

/* câu chuyện kéo dọc */
.truyen{position:relative;z-index:1;width:var(--cot);margin:0 auto}
.khuc{min-height:100vh;min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;
  padding:30vh max(24px, env(safe-area-inset-right, 0px)) 24vh max(24px, env(safe-area-inset-left, 0px));text-align:center}
.khuc + .khuc{min-height:115vh;min-height:115svh;padding-top:37vh}
.luc{font-family:var(--chu);font-size:.75rem;font-weight:600;letter-spacing:.2em;text-transform:uppercase;margin-bottom:14px;opacity:.85}
.goi{font-family:var(--chu-tay);font-weight:700;font-size:clamp(2.2rem,10vw,3rem);line-height:1.15;margin-bottom:12px}
.dong-chu{font-style:italic;font-size:clamp(1.3rem,5.6vw,1.65rem);line-height:1.45;max-width:17em;text-wrap:balance}
.dong-chu + .dong-chu{margin-top:.55em}
.luc,.goi,.dong-chu,.nhac{text-shadow:0 0 14px rgba(255,247,232,.9),0 0 3px rgba(255,247,232,.7)}
.nhac{margin-top:40px;font-family:var(--chu);font-size:.85rem;letter-spacing:.08em;display:flex;flex-direction:column;align-items:center;gap:6px}
.nhac svg{width:22px;height:22px;animation:nhun 1.8s ease-in-out infinite}
@keyframes nhun{0%,100%{transform:translateY(0)}50%{transform:translateY(7px)}}

/* chữ chạy lên khi khúc của nó vào giữa màn hình */
.len{opacity:0;transform:translateY(34px);transition:opacity .9s ease,transform 1.1s cubic-bezier(.2,.7,.2,1);transition-delay:calc(var(--i,0) * .28s)}
.hien .len{opacity:1;transform:none}

/* màn cuối: tờ tranh có gió và lời chúc */
.khuc.khuc.cuoi{padding-top:12vh;padding-bottom:max(14vh, env(safe-area-inset-bottom, 0px));justify-content:center}
.to-giay{margin:0;width:min(100%,400px);background:var(--giay);border-radius:3px;padding:10px 10px 22px;
  box-shadow:0 22px 44px -20px rgba(20,16,40,.7),0 2px 8px rgba(20,16,40,.25)}
.to-giay img{display:block;width:100%;height:auto;border-radius:1px}
.to-giay figcaption{padding:18px 8px 0;color:var(--chi)}
.loi-cuoi{font-family:var(--chu-tay);font-weight:700;font-size:clamp(1.55rem,7vw,2rem);line-height:1.25}
.ky{font-style:italic;font-size:1rem;color:#5A6478;margin-top:12px;text-align:right;padding-right:6px}
.to-giay.len{transform:translateY(60px) rotate(-2.5deg)}
.hien .to-giay.len{transform:rotate(-.6deg)}
.to-giay .len{transition-delay:calc(.5s + var(--i,0) * .35s)}

/* màn nhập mật mã */
.cong{position:fixed;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;
  padding:max(20px, env(safe-area-inset-top, 0px)) 20px max(20px, env(safe-area-inset-bottom, 0px));
  background:linear-gradient(to bottom,#4E5A8E 0%,#8F86B4 52%,#E9B7A6 100%);transition:opacity .9s ease,visibility 0s linear .9s}
.cong.mo{opacity:0;visibility:hidden;pointer-events:none}
.o-khoa{width:min(100%,320px);display:flex;flex-direction:column;align-items:center;gap:18px;color:#FFF8EC;text-align:center}
.o-khoa h1{font-family:var(--chu-tay);font-weight:700;font-size:clamp(1.5rem,6.6vw,1.9rem);line-height:1.3;margin:0;text-wrap:balance}
.o-khoa .phu{order:2;opacity:.85}
.o-khoa .bao{order:3}
.o-khoa .phim{order:4}
.o-khoa .phu{font-family:var(--chu);font-size:.95rem;opacity:.9}
.cham{display:flex;gap:16px;margin:6px 0 2px}
.cham span{width:16px;height:16px;border-radius:50%;border:2px solid #FFF8EC;transition:background .15s,transform .15s}
.cham span.co{background:#FFF8EC;transform:scale(1.08)}
.cham.dung span{background:#FFD67A;border-color:#FFD67A}
.cham.sai{animation:lac-dau .42s ease}
@keyframes lac-dau{20%{transform:translateX(-9px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(4px)}}
.bao{min-height:1.4em;font-family:var(--chu);font-size:.9rem}
.phim{display:grid;grid-template-columns:repeat(3,68px);gap:14px;justify-content:center}
.phim button{width:68px;height:68px;border-radius:50%;border:1.5px solid rgba(255,248,236,.7);background:rgba(255,248,236,.12);color:#FFF8EC;
  font-family:var(--chu-de);font-size:1.6rem;line-height:1;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:background .12s,transform .12s}
.phim button:active{background:rgba(255,248,236,.38);transform:scale(.95)}
.phim button:focus-visible{outline:3px solid #FFD67A;outline-offset:3px}
.phim .xoa{font-family:var(--chu);font-size:1.15rem;border-color:transparent;background:none}
.phim .trong{visibility:hidden}

@media (prefers-reduced-motion: reduce){
  .len{transition:opacity .4s ease;transform:none}
  .to-giay.len,.hien .to-giay.len{transform:none}
  .may,.nhac svg,.cham.sai{animation:none}
}
`;

const JS = `
(function(){
  var MAU = ${JSON.stringify(MAU)};
  var MAT_MA = ${JSON.stringify(MAT_MA)};
  var goc = document.documentElement;
  document.body.classList.add('khoa');

  /* ----- màn nhập mật mã ----- */
  var cong = document.getElementById('cong'), cham = document.getElementById('cham'), bao = document.getElementById('bao');
  var nhap = '', xong = false;
  function veCham(){ for (var i = 0; i < cham.children.length; i++) cham.children[i].className = i < nhap.length ? 'co' : ''; }
  function moCong(){
    xong = true; cham.classList.add('dung'); bao.textContent = '';
    setTimeout(function(){
      cong.classList.add('mo'); cong.setAttribute('aria-hidden', 'true'); document.body.classList.remove('khoa');
      document.getElementById('truyen').removeAttribute('inert');
      window.scrollTo(0, 0); doMoc(); capNhat();
      setTimeout(function(){ document.querySelector('.khuc').classList.add('hien'); }, 500);
    }, 420);
  }
  function bam(k){
    if (xong) return;
    if (k === 'xoa') { nhap = nhap.slice(0, -1); veCham(); return; }
    if (nhap.length >= MAT_MA.length) return;
    nhap += k; bao.textContent = ''; veCham();
    if (nhap.length === MAT_MA.length) {
      if (nhap === MAT_MA) moCong();
      else {
        cham.classList.remove('sai'); void cham.offsetWidth; cham.classList.add('sai');
        bao.textContent = 'Chưa đúng rồi, thử lại nha.';
        setTimeout(function(){ nhap = ''; veCham(); }, 440);
      }
    }
  }
  document.getElementById('phim').addEventListener('click', function(e){
    var b = e.target.closest('button'); if (b) bam(b.getAttribute('data-k'));
  });
  document.addEventListener('keydown', function(e){
    if (xong) return;
    if (/^[0-9]$/.test(e.key)) bam(e.key); else if (e.key === 'Backspace') bam('xoa');
  });

  /* ----- trời đổi màu theo độ kéo ----- */
  var khuc = [].slice.call(document.querySelectorAll('.khuc'));
  var matTroi = document.getElementById('mat-troi'), sanKhau = document.getElementById('san-khau');
  var moc = [];
  function doMoc(){
    var ih = window.innerHeight, cao = goc.scrollHeight;
    moc = khuc.map(function(k){ return Math.min(k.offsetTop + k.offsetHeight / 2, cao - ih / 2); });
    moc[0] = ih / 2;
  }
  function hex(h){ return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function pha(a, b, k){ a = hex(a); b = hex(b); return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * k) + ',' + Math.round(a[1] + (b[1] - a[1]) * k) + ',' + Math.round(a[2] + (b[2] - a[2]) * k) + ')'; }
  function capNhat(){
    cho = false;
    var giua = window.scrollY + window.innerHeight / 2, n = moc.length - 1, vt = n;
    if (giua <= moc[0]) vt = 0;
    else for (var i = 0; i < n; i++) if (giua < moc[i + 1]) { vt = i + (giua - moc[i]) / Math.max(1, moc[i + 1] - moc[i]); break; }
    var i0 = Math.min(Math.floor(vt), n - 1), k = vt - i0, A = MAU[i0], B = MAU[i0 + 1], s = goc.style;
    for (var j = 0; j < 3; j++) { s.setProperty('--t' + (j + 1), pha(A.t[j], B.t[j], k)); s.setProperty('--d' + (j + 1), pha(A.d[j], B.d[j], k)); }
    s.setProperty('--mt', pha(A.mt, B.mt, k)); s.setProperty('--may', pha(A.may, B.may, k));
    s.setProperty('--suong', (A.suong + (B.suong - A.suong) * k).toFixed(3));
    // mặt trời mọc bên phải, lên đỉnh lúc giữa trưa, lặn về bên trái như trong tờ tranh cuối
    var q = vt / n, w = sanKhau.clientWidth, h = sanKhau.clientHeight;
    var sn = Math.sin(Math.PI * (0.06 + 0.86 * q));
    var x = (0.88 - 0.74 * q) * w, y = (0.70 - 0.64 * sn * sn) * h;
    matTroi.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
  }
  var cho = false;
  function goi(){ if (!cho) { cho = true; requestAnimationFrame(capNhat); } }
  window.addEventListener('scroll', goi, { passive: true });
  window.addEventListener('resize', function(){ doMoc(); goi(); });
  window.addEventListener('load', function(){ doMoc(); goi(); });
  doMoc(); capNhat();

  /* ----- chữ chạy lên khi khúc vào vùng giữa màn hình, kéo ngược lên thì chạy lại ----- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(ds){
      ds.forEach(function(d){ if (!document.body.classList.contains('khoa')) d.target.classList.toggle('hien', d.isIntersecting); });
    }, { rootMargin: '-12% 0px -40% 0px', threshold: 0 });
    [].forEach.call(document.querySelectorAll('.noi'), function(el){ io.observe(el); });
  } else {
    [].forEach.call(document.querySelectorAll('.noi'), function(el){ el.classList.add('hien'); });
  }
})();
`;

const khucHtml = CAU_CHUYEN.map((k) => `
  <section class="khuc">
    <div class="noi">
      <p class="luc len" style="--i:0">${esc(k.luc)}</p>
      ${dongChu(k.dong, 'dong-chu', 1)}
    </div>
  </section>`).join('\n');

const phim = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => `<button type="button" data-k="${k}">${k}</button>`).join('')
  + '<button type="button" class="trong" tabindex="-1" aria-hidden="true" disabled></button>'
  + '<button type="button" data-k="0">0</button>'
  + '<button type="button" class="xoa" data-k="xoa" aria-label="Xoá số vừa nhập">Xoá</button>';

const THAN = `<!-- ============================================================
     THIỆP KÉO. File này do tools/dung-thiep.js dựng ra.
     Muốn đổi lời hay mật mã thì sửa khối "NỘI DUNG" trong script rồi chạy lại:
     node tools/dung-thiep.js
     ============================================================ -->

<div class="cong" id="cong">
  <div class="o-khoa">
    <h1>${KHOA.tieuDe.map(esc).join('<br>')}</h1>
    <p class="phu">${esc(KHOA.phu)}</p>
    <div class="cham" id="cham" aria-hidden="true">${'<span></span>'.repeat(MAT_MA.length)}</div>
    <p class="bao" id="bao" role="status" aria-live="polite"></p>
    <div class="phim" id="phim">${phim}</div>
  </div>
</div>

<div class="san-khau" id="san-khau" aria-hidden="true">
  <div class="mat-troi" id="mat-troi"></div>
  <div class="may a"></div><div class="may b"></div><div class="may c"></div>
  ${veDoi()}
</div>

<main class="truyen" id="truyen" inert>
  <section class="khuc">
    <div class="noi-dau">
      <p class="goi len" style="--i:0">${esc(MO_DAU.goi)}</p>
      ${dongChu(MO_DAU.dong, 'dong-chu', 1)}
      <p class="nhac len" style="--i:${MO_DAU.dong.length + 2}">${esc(MO_DAU.nhac)}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v15M5.5 12.5 12 19l6.5-6.5"/></svg>
      </p>
    </div>
  </section>
${khucHtml}

  <section class="khuc cuoi">
    <div class="noi">
      <figure class="to-giay len">
        <img src="data:image/gif;base64,${gifB64}" width="540" height="768" alt="${esc(MO_TA_GIF)}">
        <figcaption>
          ${dongChu(LOI_CUOI, 'loi-cuoi', 0)}
          <p class="ky len" style="--i:${LOI_CUOI.length}">${esc(KY_TEN)}</p>
        </figcaption>
      </figure>
    </div>
  </section>
</main>

<script>${JS}</script>
<!-- PHÔNG CHỮ NHÚNG: đừng sửa -->
<style>${FONT}</style>`;


const html = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#4E5A8E">
<title>${esc(TIEU_DE_TAB)}</title>
<style>${CSS}</style>
</head>
<body class="khoa">
${THAN}
</body>
</html>
`;
const out = path.join(root, 'thiep.html');
fs.writeFileSync(out, html);
console.log(`Đã dựng xong: thiep.html (${(html.length / 1048576).toFixed(1)} MB)`);

/* ---------- bản xem thử trên Artifact (không có thẻ html, head, body) ----------
   Chạy: node tools/dung-thiep.js đường-dẫn-file-ra.html */
const out2 = process.argv[2];
if (out2) {
  fs.writeFileSync(out2, `<title>${esc(TIEU_DE_TAB)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>${CSS}</style>
${THAN}
`);
  console.log('Đã dựng bản xem thử: ' + out2);
}
