# Cổng B — `/lky-institution-builder` · Nền tảng (Schema · Contract · Quyền ghi)

> Bước B: chạy khi thiết kế hệ thống (DB schema, API, quyền hạn). Ngày 2026-07-11 · DRI: Founder B.

## Institutional Health Score — nền tảng Workspace Intelligence
```
FOUNDER DEPENDENCY:     🟢 — SSOT ở packages/contracts + AGENTS.md + migrations + gate docs; không bước ẩn nào chỉ B biết.
MERITOCRACY (DRI):      🟢 — mỗi bảng/package có 1 chủ rõ (mục 10). db=B, contracts=[S] A+B.
SYSTEM DOCUMENTATION:   🟢 — README/db, DEVELOPMENT.md, ADR-0001, test-db.sh (19 checks) — người mới onboard được.
DECISION RIGHTS:        🟡 — ma trận bên dưới rõ, trừ 1 điểm "duyệt feedback" cần founder chốt (xem 🟡).
CULTURE ENFORCEMENT:    🟢 — giá trị được ép bằng hệ thống, không phải khẩu hiệu (xem 3-Layer §Layer bất biến).
INTEGRITY ARCHITECTURE: 🟢 — RLS deny-by-default; client không ghi được bảng của A; không có "luật trừ chủ".
SUCCESSION:             🟢 — "ngày mai B biến mất" → migrations tự chạy, test tự kiểm, contract là luật.

OVERALL: A-. Rủi ro #1: điểm 🟡 "ai duyệt feedback / ngưỡng approval" cần founder quyết.
```

## Founder Dependency Audit — "B biến mất 6 tháng thì sao?"
| Vùng | Không có B → | Sức khoẻ |
|---|---|---|
| Chạy migrations | `pnpm db:migrate` / test-db.sh tự chạy | 🟢 |
| Hiểu schema | comment + README + constraint tự mô tả luật | 🟢 |
| Interface giữa A–B | `packages/contracts` là hợp đồng, không cần B giải thích | 🟢 |
| Kiểm thử | test-db.sh cho verdict PASS/FAIL rõ | 🟢 |
| Sửa quyền ghi | RLS trong migration versioned | 🟢 |

Kết luận: nền tảng **không tạo điểm phụ thuộc-founder mới**.

## Decision Rights Matrix — mọi hành động GHI (yêu cầu master prompt)
| Hành động ghi | Ai được làm | Cơ chế ép | Ai duyệt |
|---|---|---|---|
| Tạo task | User đã đăng nhập | RLS `tasks_insert` (auth.uid() not null) | — |
| Sửa `tasks.status/assignee/result` | API route B (service_role) | Client không có update policy → chỉ qua API | — |
| Cập nhật `tasks.status/decision_id` | API route A (service_role) | 3 điểm giao; A ghi status sau routing | — |
| Ghi `decisions` / `executions` | **Chỉ** A qua service_role | RLS: client không insert được (đã test) | — |
| Ghi `governance_rules` | Chỉ A qua service_role | RLS read-only cho client | — |
| Gửi `feedback` (±1 trust) | User đã đăng nhập | RLS `feedback_insert` | 🟡 **cần chốt** |
| Ghi `logs` | Chỉ service_role | RLS deny client (đã test) | — |
| Thêm/sửa agent (Pool, FR-13) | API route B (service_role) | client read-only | — |

### 🟡 Điểm cần founder quyết (đúng cảnh báo master prompt §4)
**"Ai có quyền duyệt feedback? Ngưỡng nào cần approval?"**
- **Mặc định MVP đề xuất (theo Playbook FR-11):** mọi user đã đăng nhập gửi được feedback; trust tự ±1;
  chặn lạm dụng bằng: (1) `trust` bị `check between 0 and 100`, (2) toàn bộ feedback lưu log bất biến (audit trail),
  (3) không cho sửa trust tay — chỉ qua feedback.
- **Chưa làm trong MVP (Roadmap):** phê duyệt feedback, chống gian lận, weight theo vai trò người đánh giá.
- **Đề nghị:** founder xác nhận mặc định trên là đủ cho MVP, hay cần cổng duyệt ngay. Không phải blocker của nền tảng.

## 3-Layer Operating System
- **Layer 1 · Constitution (bất biến):** `packages/contracts` (Verdict/Task/Agent/envelope), check-constraints schema,
  3 điểm giao `POST /route · task_id · decision_id`, RLS deny-by-default. → đổi = PR + cả hai founder.
- **Layer 2 · Playbook (tiến hoá theo scale):** API routes, UI, metrics engine, seed Pool.
- **Layer 3 · Culture Code (ép ngầm):** AGENTS.md, naming convention, 3 cổng gate lưu ở `docs/gates/`, Conventional Commits.

## Verdict cổng B: **PASS** (A-), với 1 điểm 🟡 chuyển founder quyết (không chặn nền tảng).
