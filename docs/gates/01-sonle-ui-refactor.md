# Cổng A · /sonle — UI refactor domain B (2026-07-12)

**Đối tượng:** Design system @orchestra/ui + reskin Command/Board/Dashboard/Pool, vibrancy,
motion, illustration-forward. Bối cảnh: dự thi GenAI Fund · Human-Agent OS, mục tiêu top 5.

## Verdict: ⚠️ PASS-CÓ-ĐIỀU-KIỆN (ship được, nhưng phải sửa 3 điểm trước demo)

### Câu 8 — "Ngày mai tôi chết": sản phẩm tự sống, không stuck, người sau tiếp tục?
- ✅ **Tự sống:** build production xanh, typecheck sạch, 318 test pass, chạy data thật. Không phụ thuộc ai giải thích để chạy.
- ✅ **Người sau hiểu:** design system có README + token contract + tên component rõ; icon/màu/motion hệ thống hoá, không magic-number rải rác.
- 🟡 **Rủi ro single-owner:** `packages/ui` là shared `[S]` nhưng do B seed một mình. Chưa có DRI chung A+B → đúng "hiệu ứng photocopy" nếu A không đồng sở hữu. **Đã ghi PENDING-A-APPROVAL**, nhưng cần A thực sự review, không chỉ merge.

### Câu 11 (arguments) — điểm mù / rủi ro lớn nhất về sản phẩm & trải nghiệm
1. **Mật độ chữ cao — vi phạm Simplicity Test (#10 Apple).** Nhiều helper text dài (đoạn giải thích `POST /route`, lead dài, chip metric chi chít). "Nếu người dùng phải đọc mới hiểu → thiết kế lại." Founder đã tự nhận ra (yêu cầu nền trắng, chữ to, bớt chữ) — **đây là bằng chứng feedback đúng, phải sửa, không tìm lý do giữ nguyên** (Test feedback #5).
2. **AI-execute chưa chạy (thiếu QWEN).** Điểm khác biệt của sản phẩm (theo playbook: "AI thực sự làm ra kết quả" mới khiến giám khảo tin là sản phẩm, không phải slide). Thiếu QWEN → nhánh AI chết trong demo = **rủi ro sản phẩm lớn nhất cho cuộc thi**.
3. **Hero illustration chưa "sống".** Routing Pipeline hiện là loop tĩnh trang trí. Sơn: "detail IS the product" — illustration phải *encode nghĩa*, chạy thật khi submit (prompt → định tuyến → verdict), nếu không = "lấp chỗ trống không kiếm được chỗ đứng".

## 3 việc ưu tiên nhất cho UI (đúng thứ tự)
1. **Simplicity pass:** nền trắng thật, chữ to, cắt chữ thừa, tăng khoảng thở. Mỗi màn hình < 9 khối thông tin. Bỏ đến khi chỉ còn tinh túy.
2. **Bật AI-execute thật** (nhận QWEN) — để demo có "human vs AI làm thật".
3. **Hero sống:** khi submit, pipeline animate → verdict dial → success. Đây là khoảnh khắc "wow" cho giám khảo.

_Nguyên tắc Sơn: trải nghiệm > lời nói. Đừng giải thích bằng text — hãy để giao diện tự nói._
