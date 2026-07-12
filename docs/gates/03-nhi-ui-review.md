# Cổng C · /nhi feedback — Giao diện Orchestra trước PR · 2026-07-12

> Nhập vai Lê Thảo Nhi. Chuẩn NL-QA-NHILE-001. P0 fail = không merge.

---

Tân, chị xem rồi. Nói thẳng nhé.

**Chị thích trước đã (Green Flags):**
- Bỏ sạch emoji, thay icon SVG hệ thống — cái này đúng chuẩn, nhìn "product" chứ không "bài tập". ✅
- Empty state có minh hoạ + câu dẫn — nhiều đội quên cái này, em làm rồi. ✅
- Chạy data thật, build production xanh, test pass, gửi kèm QA (chính mấy cổng này) trước khi chị hỏi — proactive, chị đánh giá cao. ✅
- Dark mode, loading skeleton, error có retry — cơ bản đủ. ✅

**Nhưng chưa deliver được. Đây là chỗ chưa đạt:**

### 🔴 P0 — phải fix trước khi mang đi thi
1. **Chi chít chữ = chưa distill đủ.** Chuẩn chị: "Không phức tạp hoá — complexity là dấu hiệu chưa hiểu đủ sâu." Màn Command còn đoạn giải thích `POST /route` — **đó là jargon của dev, không phải ngôn ngữ người dùng.** Sản phẩm tốt *không cần giải thích*. Em tự nhận ra rồi (nền trắng, chữ to, bớt chữ) — đúng, làm đi. Vi phạm P0 "giải thích trong 1 câu không jargon".
2. **Chưa test điện thoại thật.** Chấm live là người ta cầm máy mở lên. "Test bằng điện thoại thật, không phải Chrome devtools." Chưa làm = chưa biết có gãy không = chưa được submit.

### 🟡 P1 — nên fix
3. **Vietnglish chưa nhất quán.** Nav "Command / Performance / Task Board" tiếng Anh, nội dung tiếng Việt. Chọn một. Đây là sản phẩm cho người Việt đi thi — chị nghiêng về nhãn tiếng Việt rõ nghĩa, hoặc nếu giữ tiếng Anh thì phải có lý do.
4. **Vibrancy đừng để "noisy".** Gradient/glow ổn nếu tiết chế. Chuẩn chị là "không cheap, không noisy". Nền trắng em định làm sẽ giúp — nhớ: màu để *dẫn mắt tới hành động*, không phải để trang trí.

### 🟢 P2
- Font Newsreader (không phải Playfair như brand NhiLe) — chấp nhận vì Orchestra có playbook riêng, nhưng ghi nhận là khác chuẩn NhiLe.

---

## 3 việc phải sửa để "đủ chuẩn Nhi" đi thi
1. **Distill:** nền trắng, chữ to, cắt jargon (`POST /route`), mỗi màn ít khối hơn, nhiều khoảng thở hơn. Người dùng mở lên *biết ngay*.
2. **Test mobile máy thật** — touch target ≥44px, bàn phím không che nội dung, không gãy layout.
3. **Cho chị thấy nhánh AI chạy thật** (cần QWEN) — sản phẩm này bán "người + AI làm thật". Nếu demo mà AI không chạy, cái claim lớn nhất sụp.

## Verdict: 🟡 CONDITIONAL (78%) — chưa deliver, chị cần review lại sau khi fix 3 việc trên.

**Em fix distill + test mobile trước, rồi gọi chị xem lại — chưa merge vội.**
