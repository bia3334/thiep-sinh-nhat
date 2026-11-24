# Nhật ký làm việc: thiệp sinh nhật Đà Lạt

Cập nhật lần cuối: 24/11/2026.

Phiên mới hãy đọc hết file này trước khi làm tiếp.

Repo này (`bia3334/thiep-sinh-nhat`) là một dự án riêng, KHÔNG thuộc repo `graduation` (thiệp tốt nghiệp). Owner muốn nó nằm ở repo của riêng nó và đã phản đối việc đưa vào `graduation`, nên đừng đẩy vào đó. Các quy tắc trong `AGENTS.md` của `graduation` (mỗi khách một trang, cổng ngày sinh, thông tin buổi lễ) không áp dụng ở đây, trừ khi owner nói khác.

## 1. Dự án là gì

- Owner muốn làm một tấm thiệp sinh nhật.
- Thiệp vừa là lời chúc sinh nhật vừa là lời tỏ tình.
- Đã có bản khung thiệp kéo (`thiep.html`), lời còn là chữ giữ chỗ trong ngoặc vuông. Chưa có kỷ niệm thật, chưa chốt lời chúc cuối và tên ký.
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
| `thiep.html` | Thiệp kéo: màn nhập mật mã, câu chuyện kéo dọc trời đổi từ rạng đông sang hoàng hôn, kết bằng GIF cảnh 02 và lời chúc |
| `tools/dung-thiep.js` | Script dựng `thiep.html`. Lời, mật mã, bảng màu trời nằm ở đầu file |
| `README.md` | Cách chạy và cấu trúc script |

Bản xem thử phác thảo (Artifact riêng tư của owner, gom cả hai cảnh): https://claude.ai/artifact/YFyfKscCgKZAHP9AshYnhV

Bản xem thử thiệp kéo (Artifact riêng tư của owner): https://claude.ai/artifact/BkX6n5V1ikW6odcqbjc9q8. Dựng lại bằng `node tools/dung-thiep.js <file-ra.html>` rồi đăng lên đúng đường dẫn này.

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
- Thiệp là một câu chuyện kéo dọc: mỗi lần kéo xuống một khoảnh khắc chạy lên, trời đổi từ bình minh sang hoàng hôn, lời cuối gắn với GIF. Đây là ý của owner.
- Cô ấy sẽ mở thiệp ngay tại La Mozza, nên màn cuối dùng cảnh 02.
- Mật mã mở thiệp là 1314.
- Xưng hô thường ngày của hai người: "tui" với "bà", hoặc "mình" với "bạn".
- Màn mở đầu ghi "Gửi Hoa," (owner bảo đổi từ "Gửi Vê"). Chữ thêu trên tai thỏ vẫn giữ "Tặng Vê" và "Minh Thư".
- Màn khoá: thay "Thiệp này có khoá" bằng nguyên câu "Hôm nay là 1 ngày đẹp trời tui rất thích bà". Giữ nguyên từng chữ, không tách, không sửa. Agent từng tách câu này ra hai chỗ và bị owner hỏi lại.
- Cảnh 02: bàn và người phải cân đối. Bản bàn nhỏ bằng một phần tư người đã bị chê.
- Lời cuối owner đề xuất: "Chúc mừng sinh nhật tình yêu đời mình". Agent có đưa bản nhẹ hơn ("người mình thương"), owner chưa chọn.

## 4. Agent tự chọn, owner chưa xác nhận

- Thiệp kéo: câu trên màn khoá ngắt thành hai dòng sau chữ "đẹp trời" cho vừa màn hình. Vì lời tỏ tình đã nằm ở màn khoá, khúc Hoàng hôn trở lại là chữ giữ chỗ.
- Thiệp kéo: giữ dòng phụ "Nhập bốn số để mở thiệp" dưới bốn ô mật mã. Chữ giữ chỗ còn lại viết theo giọng "tui" với "bà".
- Cảnh 02: bộ bàn ghế phóng 1,7 lần (hằng `BAN`) để mặt bàn cao ngang hông cô gái, dù và bàn dời sang trái 32 đơn vị, cô gái dời sang trái 24 đơn vị (`gaiX` 306). Ghế bên phải bị mép tranh cắt một phần.
- Thiệp kéo: năm nhãn thời điểm (Bình minh, Buổi sáng, Giữa trưa, Xế chiều, Hoàng hôn), lời tỏ tình nằm ở khúc Hoàng hôn, tách khỏi lời chúc ở tờ tranh cuối.
- Thiệp kéo: cô gái chỉ hiện ở màn cuối. Đoạn kéo chỉ có đồi thông, LangBiang, nhà thờ vẽ dạng bóng đổ. Mặt trời mọc bên phải, lặn bên trái cho khớp tờ tranh.
- Thiệp kéo: màn khoá dùng bàn phím số tự vẽ, không có nút "đồng ý" ở cuối để câu trả lời dành cho lúc gặp mặt.
- Trái và phải của tai thỏ tính theo hướng người xem tranh.
- Yếm: nền trắng, viền chỉ nâu vàng, đường may chấm, một trái tim nhỏ. Owner chưa nói màu và hoạ tiết thật.
- Mũi thỏ hồng và lớp lót tai màu kem: đoán theo dòng Luxe Bunny, chưa xem được ảnh sản phẩm.
- Phông chữ thêu: Charm đậm, chọn sau khi so 6 phông có dấu tiếng Việt với mẫu chữ owner gửi. Màu chỉ `#B5823A`.
- Cảnh 02: ảnh mẫu chụp ban ngày, tranh đổi sang hoàng hôn. Cô gái đứng bên trái, bàn ghế bên phải và hơi nhỏ vì nằm lùi phía sau.

## 5. Việc còn mở

1. Chờ owner xem lại cảnh 02 sau khi phóng bàn ghế cho cân với người.
2. Điền lời thật vào thiệp kéo. Owner chưa nghĩ ra kỷ niệm. Cần: câu mở đầu, năm khúc từ Bình minh tới Hoàng hôn, chọn lời chúc cuối, tên ký.
3. Agent chưa xem được GIF chạy liên tục, chỉ so được từng khung. Độ mượt do owner kiểm tra. Tương tự, thiệp kéo mới được chụp từng mốc ở cỡ 390x844, chưa thử trên điện thoại thật.
4. Chưa chốt cách đưa thiệp tới tay cô ấy (đường dẫn nào, mã QR hay gửi tin nhắn). Mật mã chỉ kiểm tra ngay trên trang nên không phải là bảo mật thật.

## 6. Làm việc với script

```
node tools/ve-phac-thao.js                          # vẽ lại cả hai file HTML
node tools/lam-gif.js                               # GIF cảnh 01
node tools/lam-gif.js 540 40 phac-thao-la-mozza     # GIF cảnh 02
node tools/chup.js phac-thao-la-mozza               # chụp để soi, ảnh ra thư mục kiem-tra/
node tools/chup.js phac-thao 1300                   # chụp lúc gió mạnh
node tools/dung-thiep.js                            # dựng lại thiep.html (cần có GIF cảnh 02)
```

Thiệp kéo (`tools/dung-thiep.js`):

- Sửa lời ở khối "NỘI DUNG" đầu file: `MAT_MA`, `MO_DAU`, `CAU_CHUYEN`, `LOI_CUOI`, `KY_TEN`. Mỗi khoảnh khắc có thể có nhiều dòng, các dòng chạy lên lần lượt.
- Bảng `MAU` có đúng một mốc màu cho mỗi màn (mở đầu, từng khoảnh khắc, màn cuối). Thêm hay bớt khoảnh khắc thì thêm hay bớt một mốc, script sẽ báo lỗi nếu lệch.
- Đường đi mặt trời được chỉnh để không đè lên chữ: chữ nằm quanh 30% chiều cao màn hình. Đổi vị trí chữ thì chụp lại từng khúc để soi.
- Làm lại GIF cảnh 02 xong phải chạy lại `dung-thiep.js` vì GIF được nhúng thẳng vào `thiep.html`.

Những điều dễ vấp:

- Mỗi cảnh khai trong hằng `CANH` (hàm vẽ, vị trí cô gái `gaiX`, lớp phủ màu, chữ đi kèm). Cô gái, bó hoa, thỏ dùng chung cho mọi cảnh: `coGai()`, `boHoa()`, `thoSau()` và `thoTruoc()`.
- Bộ bàn ghế cảnh 02 vẽ ở cỡ gốc quanh điểm (716, 1194) rồi phóng bằng hằng `BAN` (`x`, `y` là chỗ chân bàn chạm đất, `k` là độ phóng). Muốn bàn to nhỏ hay xa gần thì sửa `BAN`, đừng sửa toạ độ trong `banAn()` và `gheSat()`.
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

- Phiên cloud không tự tạo được repo GitHub. Repo này do owner tạo trống rồi gắn vào phiên.
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
| 24/11 | Viết nhật ký này, thêm script chụp kiểm tra |
| 24/11 | Owner tạo repo `bia3334/thiep-sinh-nhat`, đẩy toàn bộ lịch sử lên nhánh `main` |
| 24/11 | Owner chốt ý thiệp kéo vừa chúc sinh nhật vừa tỏ tình, mở tại La Mozza, mật mã 1314. Dựng bản khung `thiep.html` với chữ giữ chỗ |
| 24/11 | Thiệp kéo: đổi thành "Gửi Hoa", màn khoá ghi "Hôm nay là", đưa câu của owner vào lời mở đầu và lời tỏ tình. Cảnh 02: phóng bàn ghế cho cân với người, làm lại GIF |
| 24/11 | Màn khoá ghi nguyên câu của owner, bỏ cách tách câu ra hai chỗ |
