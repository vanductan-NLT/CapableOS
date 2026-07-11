# Cổng A — `/sonle` · Domain B (App: Task/Board/Dashboard/Pool + API)

> Bước A, chạy trước khi code lớp app. Ngày 2026-07-12 · DRI: Founder B.

| # | Câu hỏi | Kết quả |
|---|---|---|
| 1 | 300 năm sau còn cần? | ✅ Không gian làm việc + đo lường người/AI công bằng là nhu cầu bất biến của mọi tổ chức lai. |
| 6 | Team IT biến mất, tự sống? | ✅ App contract-driven; engine thuần (metrics/trust) unit-test; `pnpm build` + `test-db.sh` tự kiểm; docs đầy đủ. |
| 8 | **Ngày mai tôi chết** | ✅ (1) build tự chạy 13 route; (2) không bước tay ẩn — mọi thứ trong code/migration/test; (3) người sau đọc AGENTS.md + docs/gates là tiếp được. |
| 9 | DRI mỗi phần | ✅ mỗi route/feature trong `features/*`, `app/api/*` là B; ranh giới A rõ (chỉ gọi `POST /route`). |
| 10 | Apple Simplicity | ✅ Command page = 1 ô nhập lớn; người dùng không cần đọc hướng dẫn. Board/Dashboard tự giải thích. |
| 11 | Tự hào ship? | ✅ có — build xanh, 8/8 unit, 19/19 DB, runtime smoke pass. |

**Nguyên tắc kiến trúc 2–3 (bất biến/hành trình):** trust là giá trị dẫn xuất; `applyFeedback` ghi delta vào log `feedback` (hành trình), `agents.trust` chỉ là tổng đang chạy → không mất lịch sử. Metrics/breakdown tính từ event log, không phải snapshot tay.

**Verdict: PASS.**
