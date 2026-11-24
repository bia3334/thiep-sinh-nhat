# Nhật ký làm việc: thiệp sinh nhật Đà Lạt

Cập nhật lần cuối: 24/11/2026.

Phiên mới hãy đọc hết file này trước khi làm tiếp.

Đây là một dự án riêng, KHÔNG thuộc repo `graduation` (thiệp tốt nghiệp). Owner muốn nó nằm ở repo của riêng nó và đã phản đối việc đưa vào `graduation`, nên đừng đẩy vào đó. Các quy tắc trong `AGENTS.md` của `graduation` (mỗi khách một trang, cổng ngày sinh, thông tin buổi lễ) không áp dụng ở đây, trừ khi owner nói khác.

## 1. Dự án là gì

- Owner muốn làm một tấm thiệp sinh nhật.
- Mới ở bước phác thảo hình minh hoạ. Chưa dựng thiệp: chưa có lời chúc, chưa có cổng ngày sinh, chưa biết ngày sinh và cách xưng hô.
- Nhân vật: một cô gái (vẽ theo ảnh owner gửi trong chat) đứng giữa cảnh Đà Lạt, một tay ôm đoá hoa, tay kia ôm bé thỏ bông.

## 2. Hiện có gì

| File | Là gì |
|---|---|
| `phac-thao.html`, `phac-thao.gif` | Cảnh 01: hoàng hôn bên hồ giữa đồi thông, có LangBiang, nhà thờ, cẩm tú cầu, dã quỳ |
| `phac-thao-la-mozza.html`, `phac-thao-la-mozza.gif` | Cảnh 02: sân vườn quán La Mozza (nơi owner sẽ đi ăn) lúc hoàng hôn |
| `tools/ve-phac-thao.js` | Script vẽ ra cả hai file HTML. Toàn bộ hình là SVG sinh từ code |
| `tools/lam-gif.js` | Chụp 40 khung rồi ghép GIF bằng ffmpeg |
| `tools/chup.js` | Chụp tranh và cắt cận để tự kiểm tra bằng mắt |
| `tools/lay-font.js`, `tools/font-theu.css` | Tải và nhúng phông Charm đậm cho chữ thêu |
| `README.md` | Cách chạy và cấu trúc script |

Bản xem thử (Artifact riêng tư của owner, gom cả hai cảnh): https://claude.ai/artifact/YFyfKscCgKZAHP9AshYnhV

## 3. Owner đã chốt, đừng tự ý đổi

- Cô gái không vẽ mắt. Hiện có má hồng và nụ cười nhỏ.
- Tóc búi cao, mái thưa. Váy lụa xanh viền ren (phương án váy bạc hà đã bị loại và xoá).
- Một tay ôm đoá hoa, tay kia ôm bé thỏ bông Jellycat Franilla Luxe Bunny màu kem.
- Trong bó hoa không có gấu bông.
- Bé thỏ phải mềm và tròn. Bản viền lông chỏm nhọn với nét lông sẫm trên mặt bị chê "đáng sợ".
- Tai bên trái tranh thêu "Tặng Vê", tai bên phải tranh thêu "Minh Thư", chữ nghiêng thư pháp màu nâu vàng, đọc xuôi. Cổ thỏ đeo yếm.
- Cảnh 01 là hoàng hôn (đổi từ buổi sáng nhiều sương theo ảnh owner gửi).
- GIF: người đứng yên. Chỉ có gió thổi làm tóc, hoa, tai thỏ, ruy băng, cây cỏ động. Bản lắc cả người đã bị loại.
- Cảnh 02 phải theo ảnh thật của quán và nghiêng về hoàng hôn. Bản ban đêm bị chê tối.
- Trả lời owner bằng tiếng Việt, nêu kết luận trước, không dùng dấu gạch ngang dài.

## 4. Agent tự chọn, owner chưa xác nhận

- Trái và phải của tai thỏ tính theo hướng người xem tranh.
- Yếm: nền trắng, viền chỉ nâu vàng, đường may chấm, một trái tim nhỏ. Owner chưa nói màu và hoạ tiết thật.
- Mũi thỏ hồng và lớp lót tai màu kem: đoán theo dòng Luxe Bunny, chưa xem được ảnh sản phẩm.
- Phông chữ thêu: Charm đậm, chọn sau khi so 6 phông có dấu tiếng Việt với mẫu chữ owner gửi. Màu chỉ `#B5823A`.
- Cảnh 02: ảnh mẫu chụp ban ngày, tranh đổi sang hoàng hôn. Cô gái đứng bên trái, bàn ghế bên phải và hơi nhỏ vì nằm lùi phía sau.

## 5. Việc còn mở

1. Đưa dự án lên GitHub ở repo riêng. Phiên cloud không tự tạo được repo, nên cần owner tạo một repo trống (gợi ý `bia3334/thiep-sinh-nhat`) rồi gắn vào phiên để push. Cho tới lúc đó dự án chỉ tồn tại trong máy của phiên và trong file zip đã gửi owner.
2. Câu hỏi đang chờ owner trả lời: bàn ghế ở cảnh 02 có cần to và gần hơn không, hay cho cô gái ngồi vào bàn.
3. Dựng thiệp thật. Cần owner cho biết: thiệp gửi ai, sinh nhật ngày nào, xưng hô thế nào, lời chúc, dùng cảnh nào hay cả hai, có cổng ngày sinh như thiệp tốt nghiệp không.
4. Agent chưa xem được GIF chạy liên tục, chỉ so được từng khung. Độ mượt do owner kiểm tra.

## 6. Làm việc với script

```
node tools/ve-phac-thao.js                          # vẽ lại cả hai file HTML
node tools/lam-gif.js                               # GIF cảnh 01
node tools/lam-gif.js 540 40 phac-thao-la-mozza     # GIF cảnh 02
node tools/chup.js phac-thao-la-mozza               # chụp để soi, ảnh ra thư mục kiem-tra/
node tools/chup.js phac-thao 1300                   # chụp lúc gió mạnh
```

Những điều dễ vấp:

- Mỗi cảnh khai trong hằng `CANH` (hàm vẽ, vị trí cô gái `gaiX`, lớp phủ màu, chữ đi kèm). Cô gái, bó hoa, thỏ dùng chung cho mọi cảnh: `coGai()`, `boHoa()`, `thoSau()` và `thoTruoc()`.
- Hạt giống ngẫu nhiên được đặt lại trước mỗi cảnh. Thêm một lời gọi `R()` vào hàm dùng chung sẽ làm xê dịch cây cỏ của cả hai cảnh. Tham số chỉ dành cho chuyển động thì dùng `R2()`.
- Thứ tự vẽ quyết định cái gì che cái gì. Lỗi từng gặp: cánh tay vẽ trước váy nên bị váy che mất. Thỏ vẽ hai lớp vì cánh tay nằm xen giữa.
- Chuyển động: bọc hình bằng `lac(hình, ox, oy, biênĐộ, lệchPha)`. Vật mọc từ dưới lên dùng biên độ dương, vật rủ từ trên xuống (tai thỏ, ruy băng, tóc) dùng biên độ âm thì cùng tạt về bên phải. Chu kỳ chỉ 4 giây hoặc 2 giây để GIF lặp liền mạch.
- Chuyển động chỉ chạy khi thẻ `<svg>` có lớp `dong`. Trang HTML để tĩnh vì bộ lọc làm rung nét và hạt giấy phủ cả tranh, vẽ lại mỗi khung hình sẽ nặng máy.
- Bản xem thử trên Artifact chỉ nhúng một SVG (cảnh mới nhất), cảnh còn lại hiện bằng GIF, vì hai SVG trong một trang sẽ trùng `id`.
- Chữ trên trang chỉ dùng tiếng Việt. Không đưa ảnh chụp thật vào repo.

## 7. Bài học từ những lần bị chê

- Bó hoa bản đầu thưa và hở giấy. Phải vẽ đầy, đủ loại hoa như bó thật, hồng vẽ cánh xếp lớp.
- Muốn lông xù thì dùng múi bông tròn và quầng mờ, không dùng chỏm nhọn.
- Chữ chạy dọc theo vật nghiêng phải kiểm tra chiều đọc ở cả hai bên.
- Owner nói "đung đưa" nhưng ý là cảnh vật động theo gió, người đứng yên. Nên hỏi lại cái gì động trước khi làm.
- Dựng cảnh một địa điểm thật theo mô tả bằng chữ cho ra kết quả không giống. Xin owner ảnh thật ngay từ đầu.
- Mỗi lần đổi xong đều chụp lại và soi bằng mắt trước khi gửi.

## 8. Giới hạn môi trường đã gặp

- Phiên cloud chỉ có quyền GitHub với repo `graduation`, không tạo được repo mới.
- Mạng chặn Facebook, trang Jellycat và hầu hết trang ngoài. Google Fonts thì vào được.
- Ngày 24/11 owner duyệt một môi trường cloud tên `graduation` cho phép `www.bsa.com.vn` và `layen.vn`, nhưng lệnh tải trang vẫn bị lớp kiểm duyệt của phiên từ chối. Cách chắc ăn nhất để có hình tham khảo là nhờ owner gửi ảnh vào chat.
- Ảnh owner gửi trong chat không nằm trong repo nên phiên mới không thấy. Những gì đã dùng từ ảnh:
  - Bó hoa: lily xanh kép, hồng kem, hồng môn xanh, lily trắng, tulip trắng, hoa sao xanh nhỏ, hạt đá đính, giấy gói trắng có ren, ruy băng xanh nhạt.
  - Chữ thêu mẫu: kiểu nghiêng thư pháp, màu nâu vàng.
  - Ảnh hoàng hôn Đà Lạt: trời cam rực nhiều tầng mây, núi và thông in bóng tím sẫm.
  - Ảnh La Mozza: ngồi ngoài vườn dưới tán dù vải kem khung gỗ, nền sỏi, bàn bát giác mặt đá trắng chân sắt uốn, ghế sắt đen lưng mắt cáo nệm kem viền đen, hàng cây rậm xen hoa tím, bờ đá hộc bên trái, cây tùng bên phải, lá to ở góc dưới phải, nhìn ra khu biệt thự trắng trên đồi thông.

## 9. Lịch sử

| Ngày | Việc |
|---|---|
| 22/11 | Phác thảo số 01: cô gái ôm hoa giữa Đà Lạt buổi sáng, hai phương án váy |
| 22/11 | Sửa cẳng tay bị váy che mất |
| 22/11 | Vẽ lại bó hoa cho đầy và sát bó thật |
| 22/11 | Chốt váy lụa xanh, tay còn lại ôm bé thỏ Franilla |
| 22/11 | Thỏ lông xù hơn, hai tai thêu chữ, cổ đeo yếm |
| 22/11 | Vẽ lại thỏ cho mềm và tròn |
| 22/11 | Đổi cảnh 01 sang hoàng hôn, sửa chữ thêu tai trái bị ngược |
| 22/11 | Thêm GIF, sau đó đổi thành người đứng yên và chỉ có gió thổi |
| 24/11 | Thêm cảnh 02 La Mozza (bản đầu dựng theo mô tả, lúc lên đèn) |
| 24/11 | Cảnh 02 sáng hơn, ngả về hoàng hôn |
| 24/11 | Vẽ lại cảnh 02 theo ảnh chụp thật của quán |
| 24/11 | Viết nhật ký này, thêm script chụp kiểm tra. Chưa đẩy lên GitHub vì chưa có repo riêng |
