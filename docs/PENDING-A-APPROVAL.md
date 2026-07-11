# Hạng mục chờ Founder A duyệt (shared `[S]`)

> Nền tảng được làm trên nhánh `s/foundation`. Theo luật mục 07/12: file `[S]` cần **cả hai** founder duyệt
> trước khi merge. Founder B **không tự merge** những mục dưới đây.

## 🔄 Cập nhật 2026-07-12 — đã hợp nhất lên `dev`
B đã merge lên `origin/dev` (nơi A đã đẩy Feature 0 — capability taxonomy). Khi hợp nhất, B **giữ nguyên bản của A** cho mọi file shared A sở hữu và **conform theo A**, không đè:
- `packages/contracts/src/{decision.ts, capabilities.ts}` → dùng **bản A** (Decision `cap: Capability`, taxonomy 9 cap).
- `tsconfig.base.json`, `turbo.json`(+.next outputs), `pnpm-workspace.yaml`, root `packageManager pnpm@9.12.3` → theo A.
- `src/index.ts` → hợp nhất: exports của A (capabilities+decision) + của B (task/agent/api).
- **B conform code theo taxonomy A:** seed.sql đổi `summarize→summarization`, `email→email_drafting`, `meeting→meeting_notes`; `POST /agents` validate caps bằng `CapabilitySchema`; `GET /capabilities` trả `CAPABILITIES` (canonical).

### ❓ Đề xuất cho A (KHÔNG tự sửa file shared — cần A quyết)
Taxonomy hiện **thiếu `legal`, `finance`, `compliance`** mà Test Plan mục 19 (#2 rà soát hợp đồng, #4 duyệt tín dụng) nhắc tới. B tạm map các vai Legal/Finance sang `analysis`+`writing` và dựa vào routing theo `risk=high`. **Đề xuất A cân nhắc thêm `legal`, `finance` vào `CAPABILITIES`** để phân biệt sâu hơn. Nếu A đồng ý, B cập nhật seed tương ứng.

---


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

## 4. UI kit dùng chung (tương lai, chưa làm — cần A)
- Domain B tạm để UI kit **local** trong `apps/web/components/ui.tsx` để không chặn MVP. Việc gộp thành `packages/ui` [S] (design system dùng chung A+B) là hạng mục shared tương lai → cần A đồng thiết kế.

## Những gì B ĐƯỢC tự merge (thuần B, 1 review)
- `packages/db` (migrations, RLS, seed, scripts) — B là chủ schema (mục 10). Đã verify 19/19 trên Postgres thật.
- Scaffold monorepo, AGENTS.md, docs/ — hạ tầng chung không đổi interface.

*Lưu ý: schema `decisions`/`executions`/`governance_rules` do B tạo trong migration (B là chủ schema) nhưng
A là chủ GHI dữ liệu (mục 10). Nếu A cần đổi CỘT của 3 bảng này → A báo B, B sửa migration.*
