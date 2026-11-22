# Thiệp sinh nhật Đà Lạt

Thiệp sinh nhật vẽ tay bằng SVG: cô gái mặc váy lụa xanh viền ren, một tay ôm đoá hoa xanh trắng, tay kia ôm bé thỏ bông Franilla, đứng giữa đồi thông Đà Lạt.

## Hiện có

- `phac-thao.html`: bản phác thảo số 01. Một file duy nhất, mở offline được bằng cách bấm đúp.
- `tools/ve-phac-thao.js`: script vẽ ra file trên. Toàn bộ hình là SVG sinh từ code, không dùng ảnh.

## Vẽ lại

```
node tools/ve-phac-thao.js
```

Vị trí và cỡ cô gái nằm ở hằng `GAI` đầu file. Mỗi phần tranh là một hàm riêng: `coGai()`, `boHoa()`, `vayLua()`, `thoSau()` + `thoTruoc()` (bé thỏ, vẽ hai lớp vì cánh tay nằm xen giữa), `canh()`.

## Quy ước

- Cô gái không vẽ mắt (chỉ má hồng và nụ cười nhỏ). Bé thỏ thì có mắt hạt đen.
- Chữ trên trang chỉ dùng tiếng Việt.
- Không đưa ảnh chụp thật vào repo.
