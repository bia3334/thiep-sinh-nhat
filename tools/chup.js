#!/usr/bin/env node
'use strict';
/* ============================================================
   CHỤP TRANH ĐỂ TỰ KIỂM TRA BẰNG MẮT
   Chạy:  node tools/chup.js                       → chụp phac-thao.html vào thư mục kiem-tra/
          node tools/chup.js phac-thao-la-mozza    → chụp cảnh La Mozza
          node tools/chup.js phac-thao 1300        → chụp thêm lúc gió mạnh (mốc 1300 ms của vòng lặp)

   Ra các file: toan.png (cả tờ giấy), can-nguoi.png, can-chan.png, can-nen.png (cắt cận theo toạ độ
   viewBox 900x1280), và in độ tràn ngang ở bề rộng 390px, 320px. Thư mục kiem-tra/ không đưa vào git.
   Cần: playwright (npm i playwright).
   ============================================================ */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TEP = process.argv[2] || 'phac-thao';
const MOC = process.argv[3] ? parseInt(process.argv[3], 10) : null; // mili giây trong vòng lặp 4 giây, bỏ trống = tranh tĩnh
const root = path.join(__dirname, '..');
const file = path.join(root, TEP + '.html');
const out = path.join(root, 'kiem-tra');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const loi = [];

  // cả tờ giấy, như người xem thấy trên máy tính
  const page = await browser.newPage({ viewport: { width: 760, height: 1100 }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error') loi.push(m.text()); });
  page.on('pageerror', (e) => loi.push(String(e)));
  await page.goto('file://' + file);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  await (await page.$('.to-giay')).screenshot({ path: path.join(out, 'toan.png') });
  await page.close();

  // phóng to tranh rồi cắt từng vùng
  const big = await browser.newPage({ viewport: { width: 1900, height: 1400 }, deviceScaleFactor: 1 });
  await big.goto('file://' + file);
  await big.addStyleTag({ content: '.trang{max-width:none!important;padding:0!important}.to-giay{padding:0!important}.dau,.ghi-chu,figcaption{display:none!important}.tranh{width:1800px!important}' });
  await big.evaluate(() => document.fonts.ready);
  if (MOC !== null) {
    await big.evaluate((ms) => {
      document.getElementById('tranh').classList.add('dong');
      document.getAnimations().forEach((a) => { a.pause(); a.currentTime = ms; });
    }, MOC);
  }
  await big.waitForTimeout(600);
  const box = await (await big.$('#tranh')).boundingBox();
  const k = box.width / 900;
  const vung = { 'can-nguoi': [200, 240, 520, 620], 'can-chan': [160, 820, 600, 460], 'can-nen': [0, 0, 900, 640] };
  for (const [ten, [x, y, w, h]] of Object.entries(vung)) {
    await big.screenshot({ path: path.join(out, ten + '.png'), fullPage: true, clip: { x: box.x + x * k, y: box.y + y * k, width: w * k, height: h * k } });
  }
  await big.close();

  // điện thoại: không được tràn ngang
  for (const w of [390, 320]) {
    const p = await browser.newPage({ viewport: { width: w, height: 800 }, deviceScaleFactor: 1 });
    await p.goto('file://' + file);
    await p.waitForTimeout(200);
    const tran = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    console.log(`rộng ${w}px: tràn ngang ${tran}px`);
    await p.close();
  }
  console.log(loi.length ? 'LỖI: ' + loi.join(' | ') : 'không có lỗi console');
  console.log('Ảnh nằm ở ' + out);
  await browser.close();
})();
