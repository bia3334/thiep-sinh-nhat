#!/usr/bin/env node
'use strict';
/* ============================================================
   LÀM GIF ĐUNG ĐƯA TỪ phac-thao.html
   Chạy:  node tools/lam-gif.js                              → phac-thao.gif (rộng 540px, 40 khung, lặp 4 giây)
          node tools/lam-gif.js 720 48                       → rộng 720px, 48 khung
          node tools/lam-gif.js 540 40 phac-thao-la-mozza    → làm GIF cho cảnh La Mozza

   Cách làm: mở trang bằng trình duyệt không giao diện, bật lớp "dong" cho tranh,
   dừng mọi chuyển động rồi tua tới từng mốc thời gian để chụp, cuối cùng ghép bằng ffmpeg.
   Mọi chuyển động có chu kỳ 4 giây hoặc 2 giây nên khung cuối nối liền khung đầu.
   Cần: playwright (npm i playwright) và ffmpeg.
   ============================================================ */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RONG = parseInt(process.argv[2] || '540', 10);
const KHUNG = parseInt(process.argv[3] || '40', 10);
const CHU_KY = 4000; // mili giây
const root = path.join(__dirname, '..');
const TEP = process.argv[4] || 'phac-thao'; // tên file cảnh, không kèm đuôi
const html = path.join(root, TEP + '.html');
const gif = path.join(root, TEP + '.gif');

(async () => {
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'khung-gif-'));
  const cao = Math.round(RONG * 1280 / 900);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: RONG, height: cao }, deviceScaleFactor: 1 });
  await page.goto('file://' + html);
  await page.addStyleTag({ content: `
    html,body{margin:0!important;padding:0!important;background:#F9F6EF!important}
    .trang{max-width:none!important;padding:0!important;gap:0!important}
    .dau,.ghi-chu,figcaption{display:none!important}
    .to-giay{padding:0!important;box-shadow:none!important;border-radius:0!important;background:#F9F6EF!important}
    .tranh{width:${RONG}px!important;height:${cao}px!important}` });
  await page.evaluate(() => { document.getElementById('tranh').classList.add('dong'); return document.fonts.ready; });
  await page.waitForTimeout(400);

  for (let i = 0; i < KHUNG; i++) {
    const t = (i / KHUNG) * CHU_KY;
    await page.evaluate((ms) => { document.getAnimations().forEach((a) => { a.pause(); a.currentTime = ms; }); }, t);
    await page.screenshot({ path: path.join(tam, `k${String(i).padStart(3, '0')}.png`), clip: { x: 0, y: 0, width: RONG, height: cao } });
  }
  await browser.close();

  const fps = (KHUNG * 1000 / CHU_KY).toFixed(3);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', fps, '-i', path.join(tam, 'k%03d.png'),
    '-vf', 'split[a][b];[a]palettegen=max_colors=256:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle',
    '-loop', '0', gif]);
  fs.rmSync(tam, { recursive: true, force: true });
  console.log(`Đã làm xong ${path.basename(gif)}: ${RONG}x${cao}, ${KHUNG} khung, ${(fs.statSync(gif).size / 1048576).toFixed(1)} MB`);
})();
