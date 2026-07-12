# Cổng C · /nhi feedback — Redesign "Editorial Calm" trước PR · 2026-07-12

> Nhập vai Lê Thảo Nhi. Chuẩn NL-QA-NHILE-001. P0 fail = không merge.
> Vòng 2 (sau 78% CONDITIONAL ở gate 03).

## Red flags: KHÔNG có cái nào instant-fail.

## Green flags (đạt)
- **Distill thật.** Command 5 khối → masthead + stage. Jargon dev (`POST /route`, `conf.`, `EWMA/Wilson`)
  gỡ khỏi lớp nhìn đầu; lớp `features/task/verdict.ts` dịch verdict/confidence/risk sang tiếng người.
- **Navy-not-black (#0A2540, 13:1) + hairline edge-XOR + khoảng thở gấp đôi** → "expensive", đọc rõ máy chiếu.
- **Vibrancy tiết chế:** mesh noisy gỡ sạch, glow chỉ còn 1 nút primary/màn, 1 aurora ≤9% sau đúng 1 hero.
- **Proactive QA:** typecheck web+ui PASS; tự khai 2 hạng mục chưa verify.

## P0 còn mở (phải đóng trước submit)
1. **Test điện thoại máy thật** — code responsive + touch ≥44px, nhưng chưa cầm máy thật mở. P0 của Nhi.
2. **Nhánh AI chạy thật trong demo** — cần Docker + `QWEN_*`. UI sẵn sàng hiện output; phải thấy live.

## P1
3. **Vietnglish nav/eyebrow** — nav "Command/Task Board/Performance/Capability Pool" EN vs nội dung VI.
   Chọn một. (Eyebrow editorial EN tạm chấp nhận; nav cần quyết.)

## Kiểm chứng
- `pnpm --filter web typecheck` → exit 0. `pnpm --filter @orchestra/ui typecheck` → exit 0.
- `next lint`: chưa cấu hình ESLint (pre-existing, không chạy non-interactive).
- `vitest`: không chạy trên E: exFAT (thiếu transitive dep `nanoid` trong node_modules copy) — cần Docker/NTFS.
  Thay đổi presentation-only, không đụng logic được test.

## Verdict: 🟡 CONDITIONAL — 88%.
Thiết kế đã Deliver-grade; 2 P0 là cổng verify chưa đóng (máy thật + AI live) + 1 P1 (nav VN/EN).
**Đóng 3 việc đó → ký submit.**
