#!/usr/bin/env node
'use strict';
/* ============================================================
   TẢI PHÔNG CHỮ THÊU (Google Fonts) VÀ NHÚNG THÀNH base64
   Chạy:  node tools/lay-font.js            → ghi tools/font-theu.css
          node tools/lay-font.js "Charm:wght@700" duong/dan/ra.css
   Chỉ giữ hai bộ ký tự latin + vietnamese để gõ được tên tiếng Việt có dấu.
   Cần có lệnh curl (Windows 10 trở lên có sẵn).
   ============================================================ */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const family = process.argv[2] || 'Charm:wght@700';
const out = process.argv[3] || path.join(__dirname, 'font-theu.css');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const curl = (url, binary) => execFileSync('curl', ['-sS', '-L', '-m', '40', '-A', UA, url], binary ? { maxBuffer: 1 << 26 } : { encoding: 'utf8', maxBuffer: 1 << 26 });

const css = curl(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}&display=swap`);
const blocks = [...css.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]+\})/g)]
  .filter((m) => m[1] === 'latin' || m[1] === 'vietnamese');
if (!blocks.length) { console.error('Không đọc được CSS phông chữ:\n' + css.slice(0, 300)); process.exit(1); }

let result = `/* Phông ${family} (latin + vietnamese), nhúng base64. File này do tools/lay-font.js tạo. */\n`;
for (const [, subset, block] of blocks) {
  const url = block.match(/url\((https:[^)]+\.woff2)\)/)[1];
  const b64 = Buffer.from(curl(url, true)).toString('base64');
  result += `/* ${subset} */\n` + block.replace(/url\(https:[^)]+\)/, `url(data:font/woff2;base64,${b64})`).replace(/\s*\n\s*/g, '') + '\n';
}
fs.writeFileSync(out, result);
console.log(`Đã ghi ${out} (${Math.round(result.length / 1024)} KB, ${blocks.length} bộ ký tự)`);
