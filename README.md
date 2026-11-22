# Thiệp sinh nhật Đà Lạt

Thiệp sinh nhật vẽ tay bằng SVG: cô gái ôm đoá hoa xanh trắng, đứng giữa đồi thông Đà Lạt.

## Hiện có

- `phac-thao.html`: bản phác thảo số 01. Một file duy nhất, mở offline được bằng cách bấm đúp.
- `tools/ve-phac-thao.js`: script vẽ ra file trên. Toàn bộ hình là SVG sinh từ code, không dùng ảnh.

## Vẽ lại

```
node tools/ve-phac-thao.js
```

Vị trí và cỡ cô gái nằm ở hằng `GAI` đầu file. Mỗi phần tranh là một hàm riêng: `coGai()`, `boHoa()`, `vayLua()`, `vayBacHa()`, `canh()`.

## Quy ước

- Cô gái không vẽ mắt (chỉ má hồng và nụ cười nhỏ).
- Chữ trên trang chỉ dùng tiếng Việt.
- Không đưa ảnh chụp thật vào repo.
