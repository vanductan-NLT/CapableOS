# Cổng A · /sonle — Redesign giao diện Orchestra (before code) · 2026-07-12

> Nhập vai Lê Hoàng Khắc Sơn. Big picture + Apple Simplicity. Chạy TRƯỚC khi code.

## Bối cảnh
Redesign 4 màn domain B (Command `/`, Task Board `/board`, Performance `/dashboard`, Capability Pool `/pool`).
Chấm LIVE bằng máy chiếu, mục tiêu TOP 5. Founder yêu cầu: nền trắng, sang–xịn–clean kiểu Singapore/world-class,
ưu tiên hình minh hoạ + animation hơn text. Nhi trước đó: 78% CONDITIONAL — "chi chít chữ, chưa distill đủ".

## Chẩn đoán
Sản phẩm KHÔNG thiếu tính năng — nó **chưa distill**. "Complexity là dấu hiệu chưa hiểu đủ sâu."
Apple Simplicity Test (câu 10): người dùng không cần đọc hướng dẫn. Trên máy chiếu cần **1 điểm nhìn/màn**.
Hiện mỗi màn có 5–6 khối cạnh tranh nhau.

## 20% tạo 80% khác biệt
1. **Một HERO mỗi màn** — 1 visual/animation chữ ký làm nhân vật chính; phần còn lại lùi xuống.
2. **Xoá jargon dev khỏi lớp nhìn đầu** — `POST /route`, `tokens`, `ms`, `conf. 92%` → tiếng người
   ("Giao cho AI · gần như chắc chắn"); telemetry lùi xuống lớp 2 (progressive disclosure).
3. **Khoảng thở gấp đôi + chữ to** — <9 khối/màn, spacing rộng, ít border. Sang = khoảng trắng, không phải gradient.
4. **Một bàn tay, một shell** — 4 màn chung 1 khung để nhất quán tuyệt đối (rubric C).

## Cạm bẫy phải tránh
- Gradient/glow "noisy" trên nền trắng (Nhi đã flag) → tiết chế, màu để dẫn mắt tới hành động.
- Animation trang trí thay vì feedback → mọi motion phải có nghĩa.
- Type to quá → vỡ layout máy chiếu/mobile.
- Redesign nửa vời → "hoặc tuyệt vời, hoặc chưa ship."

## Bài test đã chạy
- Test Simplicity: FAIL hiện tại (còn jargon dev) → mục tiêu PASS.
- Test "tự hào ship?": chưa → sau redesign phải tự tin mở trên máy chiếu top-5.
- Test DRI: Founder B là DRI màn workspace; agent build theo spec, B review.

## Verdict cổng A: ĐI TIẾP với 4 nguyên tắc trên. Chốt aesthetic lane với founder rồi build.
