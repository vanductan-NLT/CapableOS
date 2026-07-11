# Cổng B — `/lky-institution-builder` · Domain B App

> Bước B, khi thiết kế API/quyền/luồng ghi. Ngày 2026-07-12 · DRI: Founder B.

## Institutional Health Score
```
FOUNDER DEPENDENCY:     🟢 — app build/test/run không cần B giải thích; DEVELOPMENT.md + gate log đầy đủ.
MERITOCRACY (DRI):      🟢 — route/feature có chủ; A-seam chỉ 1 điểm (POST /route).
SYSTEM DOCUMENTATION:   🟢 — README + db/README + DEVELOPMENT + ADR + 6 gate docs.
DECISION RIGHTS:        🟢 — mọi WRITE qua API service_role; RLS deny-by-default đã test; feedback policy đã chốt MVP.
CULTURE ENFORCEMENT:    🟢 — zod validate input, check-constraint DB, envelope cố định — luật ép bằng hệ thống.
INTEGRITY:              🟢 — client không ghi được logs/decisions (test thật); không có "luật trừ chủ".
SUCCESSION:             🟢 — engine thuần + test là tài liệu sống; thay người vẫn chạy.
OVERALL: A.
```

## Decision Rights Matrix — mọi hành động GHI trong app
| Hành động | Ai | Cơ chế ép | Duyệt |
|---|---|---|---|
| Tạo task (`POST /tasks`) | User (UI) → API service_role | zod `createTaskSchema` + RLS | — |
| Sửa task (`PATCH /tasks/:id`) | API B (service_role) | client không có update policy | — |
| Thêm/sửa agent (`/agents`) | API B (service_role) | zod + `23505`→409 conflict | — |
| Gửi feedback (`POST /feedback`) | User đã đăng nhập | zod uuid + rating enum; trust bounded 0..100 | **MVP: không cổng duyệt** (đã chốt) |
| Đọc metrics/breakdown | API B (service_role đọc decisions/executions của A) | chỉ đọc, không ghi bảng A | — |

**Feedback policy (điểm 🟡 cũ → nay chốt cho MVP):** mọi user đăng nhập gửi được; trust ±1 tự động; chặn lạm dụng bằng bound 0..100 + audit log bất biến (`feedback.trust_delta`). Cổng duyệt + chống gian lận = Roadmap. *(Có thể đảo nếu founder muốn — chỉ cần thêm 1 policy.)*

## 3-Layer
- **L1 Constitution:** `packages/contracts` + envelope `{ok,data,error}` + check-constraints + RLS. Không đổi tuỳ tiện.
- **L2 Playbook:** API routes, feature UI, metrics engine, seed — tiến hoá được.
- **L3 Culture:** AGENTS.md, naming, zod-everywhere, 6 gate docs, Conventional Commits.

## Ghi chú kiến trúc (crossing-lanes / full-stack control)
- UI kit để **local trong `apps/web/components`** (không tạo `packages/ui` [S]) → tránh nút thắt duyệt A cho MVP. Việc gộp vào `packages/ui` dùng chung là hạng mục shared tương lai (ghi PENDING-A-APPROVAL).
- Bỏ `recharts`: allocation chart tự dựng bằng SVG/CSS → ít phụ thuộc, kiểm soát full-stack, theme-aware (nguyên tắc Apple full-stack control).

**Verdict: PASS (A).**
