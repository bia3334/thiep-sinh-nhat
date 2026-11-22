# Thiệp sinh nhật Đà Lạt

Thiệp sinh nhật vẽ tay bằng SVG: cô gái mặc váy lụa xanh viền ren, một tay ôm đoá hoa xanh trắng, tay kia ôm bé thỏ bông Franilla, đứng giữa đồi thông Đà Lạt lúc hoàng hôn.

## Hiện có

- `phac-thao.html`: bản phác thảo số 01. Một file duy nhất, mở offline được bằng cách bấm đúp.
- `phac-thao.gif`: bản đung đưa của bức tranh (540x768, lặp mỗi 4 giây).
- `tools/ve-phac-thao.js`: script vẽ ra file HTML. Toàn bộ hình là SVG sinh từ code, không dùng ảnh.
- `tools/lam-gif.js`: chụp từng khung của tranh rồi ghép thành GIF.
- `tools/font-theu.css`: phông Charm đậm (latin + vietnamese) nhúng base64, dùng cho chữ thêu trên tai thỏ.
- `tools/lay-font.js`: tải lại phông trên từ Google Fonts khi muốn đổi phông.

## Vẽ lại

```
node tools/ve-phac-thao.js      # vẽ lại phac-thao.html
node tools/lam-gif.js           # làm lại phac-thao.gif (cần playwright và ffmpeg)
node tools/lam-gif.js 720 48    # GIF to hơn: rộng 720px, 48 khung
```

Vị trí và cỡ cô gái nằm ở hằng `GAI` đầu file. Mỗi phần tranh là một hàm riêng: `coGai()`, `boHoa()`, `vayLua()`, `thoSau()` + `thoTruoc()` (bé thỏ, vẽ hai lớp vì cánh tay nằm xen giữa), `canh()`.

Chữ thêu trên hai tai thỏ và màu chỉ nằm ở hằng `THO` (`chuTrai`, `chuPhai`, `chiTheu`).

## Chuyển động

Người đứng yên, chỉ có gió thổi từ trái sang: tóc mai, mái và tóc con bay; từng bông hoa trong bó lay riêng; tai và chân thỏ, ruy băng, gấu váy phất; cành thông, cẩm tú cầu, dã quỳ, cỏ rạp theo từng đợt; mây trôi, vệt nắng trên hồ nhấp nháy, vài cánh hoa bay ngang.

Phần nào muốn động thì bọc bằng `lac(hình, ox, oy, biênĐộ, lệchPha)`: nó ngả quanh điểm `(ox, oy)` theo nhịp gió (thổi mạnh rồi lơi dần). Vật mọc từ dưới lên dùng biên độ dương, vật rủ từ trên xuống (tai thỏ, ruy băng, tóc) dùng biên độ âm thì cùng tạt về bên phải. Lệch pha tăng dần theo toạ độ x để sóng gió chạy từ trái sang.

Chuyển động chỉ chạy khi thẻ `<svg>` có lớp `dong`, nên trang HTML mặc định đứng yên; `tools/lam-gif.js` tự bật lớp này khi chụp. Chu kỳ chỉ dùng 4 giây hoặc 2 giây để GIF lặp liền mạch.

## Quy ước

- Cô gái không vẽ mắt (chỉ má hồng và nụ cười nhỏ). Bé thỏ thì có mắt hạt đen.
- Chữ trên trang chỉ dùng tiếng Việt.
- Không đưa ảnh chụp thật vào repo.
