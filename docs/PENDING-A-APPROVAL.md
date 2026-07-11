# Hạng mục chờ Founder A duyệt (shared `[S]`)

> Nền tảng được làm trên nhánh `s/foundation`. Theo luật mục 07/12: file `[S]` cần **cả hai** founder duyệt
> trước khi merge. Founder B **không tự merge** những mục dưới đây.

## 1. `packages/contracts` — [S] interface dùng chung
- `src/decision.ts` — shape `Decision/Verdict/Candidate/Governance`. **Đây là domain của A**; B chỉ transcribe nguyên văn từ Playbook mục 08. A xác nhận đúng nhu cầu executor/router.
- `src/api.ts` — **response envelope `{ ok, data?, error? }`** dùng chung cả hai domain. A xác nhận.
- `src/task.ts`, `src/agent.ts` — B là tác giả chính, nhưng A đọc `Task.decision_id` nên cần A biết.

## 2. ADR-0001 — sai khác stack so với chuẩn Nhi
- Next.js 15 (không phải 14), API routes (không phải Express riêng), envelope `{ok,data,error}`.
- Cần A đồng thuận vì envelope là quy ước dùng chung. Xem `docs/ADR/0001-*.md`.

## 3. Điểm 🟡 cần CẢ HAI founder + người dùng quyết (từ cổng /lky)
- **Chính sách duyệt feedback (FR-11):** ai được gửi, ngưỡng nào cần approval, chống gian lận?
  Mặc định MVP đề xuất: mọi user đăng nhập gửi được, trust ±1 tự động, bounded 0..100, full audit log. Cần chốt.

## Những gì B ĐƯỢC tự merge (thuần B, 1 review)
- `packages/db` (migrations, RLS, seed, scripts) — B là chủ schema (mục 10). Đã verify 19/19 trên Postgres thật.
- Scaffold monorepo, AGENTS.md, docs/ — hạ tầng chung không đổi interface.

*Lưu ý: schema `decisions`/`executions`/`governance_rules` do B tạo trong migration (B là chủ schema) nhưng
A là chủ GHI dữ liệu (mục 10). Nếu A cần đổi CỘT của 3 bảng này → A báo B, B sửa migration.*
