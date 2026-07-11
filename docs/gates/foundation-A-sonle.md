# Cổng A — `/sonle` filter · Nền tảng (Contracts + DB Schema)

> Bước A trong quy trình Founder B: chạy trước khi viết dòng code đầu tiên.
> Hạng mục: S-01 (packages/contracts) + S-02 (packages/db) — nền của Workspace Intelligence Domain.
> Ngày: 2026-07-11 · DRI: Founder B (Workspace Intelligence Manager).

## 11 câu hỏi bộ lọc

| # | Câu hỏi | Kết quả cho nền tảng này |
|---|---|---|
| 1 | 300 năm sau còn cần không? | ✅ Nhu cầu "tổ chức phân bổ việc giữa người và AI, đo lường công bằng, kiểm soát quyền agent" là **bất biến** — còn tổ chức là còn cần lớp phân bổ/quản trị/đo lường trung lập. Contract + schema chỉ mã hoá nhu cầu đó. |
| 2 | Vì big picture hay thoả mãn cá nhân? | ✅ Nền chung phục vụ cả A lẫn B và mọi agent kế thừa, không phải cho tiện tay một người. |
| 3 | Thứ con người cần hay thứ mình thích? | ✅ Shape lấy nguyên từ Playbook (mục 08/09) — SSOT do cả hai founder chốt, không tự chế. |
| 6 | Team IT không ở đây ngày mai, sản phẩm tự sống? | ✅ `packages/contracts` = nguồn sự thật interface; `AGENTS.md` = luật cho mọi agent; migrations versioned. Người/agent mới đọc là dựng lại được. |
| 7 | Dữ liệu 100 năm sau còn giá trị? | ✅ `feedback`, `executions`, `logs` là **event log bất biến** (hành trình), không phải snapshot — giá trị tích luỹ theo thời gian (moat = data × thời gian). |
| 8 | **Ngày mai tôi chết** — chạy tiếp? không stuck? người sau hiểu? | ✅✅✅ (1) Schema + migration tự chạy; (2) không có bước thủ công nào chỉ tôi biết; (3) ADR + gate log + AGENTS.md giải thích mọi quyết định. Đây là lý do nền tảng được viết như tài liệu, không chỉ như code. |
| 9 | Ai là DRI? | ✅ `packages/db` → Founder B (chủ schema, mục 10). `packages/contracts` → [S] shared, DRI kép A+B. Không mơ hồ. |
| 11 | Tự hào ship không? | ✅ Có — với điều kiện qua nốt cổng B (lky) và C (nhi) bên dưới. |

## 6 nguyên tắc kiến trúc

1. **Test 300 năm** — đã qua (Q1).
2. **Tách data bất biến / thay đổi** — ✅ Bảng *current-state có thể đổi* (`agents.trust`, `tasks.status`) tách khỏi *event log bất biến* (`feedback` với `trust_delta`, `executions`, `logs`). `trust` hiện tại luôn tái dựng được từ log `feedback` → không mất hành trình.
3. **Tracking hành trình, không snapshot** — ✅ Trust thay đổi được ghi từng bước ở `feedback.trust_delta` (±1), không chỉ lưu con số cuối. Dashboard đọc được cả xu hướng.
4. **Moat = data × thời gian** — ✅ Mỗi task/feedback/execution có `created_at` + `trace_id`; càng chạy càng giàu dữ liệu outcome.
5. **Tạo thứ người cần** — ✅ Shape do Playbook (input cross-team A+B) quyết định, không phải B tự tưởng tượng.
6. **Data là di sản** — ✅ RLS bật mọi bảng (mục 23); `decisions`/`executions` client không ghi trực tiếp; phân tầng quyền là kiến trúc core, không phải afterthought.

## Verdict cổng A: **PASS** → được phép code nền tảng.

Ghi chú mang sang cổng sau:
- `agents.trust` là giá trị dẫn xuất; **nguồn sự thật của trust là log `feedback`**. Giữ nguyên tắc này khi làm FR-11 (không cho sửa trust tay mà không ghi feedback).
- Xung đột stack với chuẩn Nhi (Next 14/Express/`{success,...}`) → xử lý bằng ADR-0001, không im lặng.
