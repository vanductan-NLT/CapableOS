# ADR-0001 — Sai khác stack có chủ đích so với chuẩn Nhi (NL-QA-NHILE-001)

- **Trạng thái:** Accepted (cần Founder A đồng thuận vì chạm quy ước dùng chung)
- **Ngày:** 2026-07-11
- **DRI:** Founder B · đề xuất; Founder A · co-approve (shared convention)
- **Bối cảnh cổng:** phát sinh khi chạy cổng C `/nhi feedback`, red flag #8 "Stack deviation không có ADR".

## Bối cảnh
Có hai nguồn tiêu chuẩn cùng chạm dự án này:

1. **Orchestra Engineering Playbook** (`context.html`) — SSOT của *dự án Orchestra*. Quy định:
   Next.js 15 + React 19, App Router API routes (monolith), Supabase, envelope `{ ok, data?, error? }`.
2. **Chuẩn Nhi NL-QA-NHILE-001** — chuẩn *toàn tổ chức NhiLe*. Quy định:
   Next.js 14 + Express backend `api.[domain]:8080`, envelope `{ success, data, error, meta }`.

Master prompt Founder B nêu rõ: "Tài liệu nguồn sự thật duy nhất là Orchestra Playbook; khi mâu thuẫn → tài liệu thắng." Đồng thời chuẩn Nhi coi "deviation khỏi stack khi chưa có ADR approved" là **P0 red flag**.

## Quyết định
Theo Orchestra Playbook cho *dự án này*, và ghi lại sai khác bằng ADR để không vi phạm chuẩn Nhi:

| Khía cạnh | Chuẩn Nhi | Orchestra (chọn) | Lý do |
|---|---|---|---|
| Next.js | 14 | **15 + React 19** | Playbook chốt; App Router + Server Actions + streaming cho AI executor. |
| Backend | Express riêng `:8080` | **API routes trong `apps/web`** | Monorepo một app, ranh giới domain bằng folder + contract, không tách service. Giảm điểm phụ thuộc vận hành. |
| Envelope | `{ success, data, error, meta }` | **`{ ok, data?, error? }`** | Playbook mục 11. `error` luôn có `code` máy đọc được. |
| Naming, TS strict, Supabase, RLS, không hardcode env | — | **Giữ nguyên chuẩn Nhi** | Không xung đột; tuân thủ đầy đủ. |

## Hệ quả
- Các phần *khác* của chuẩn Nhi (TS strict, Supabase, RLS, naming, không commit main, secret qua env) **vẫn áp dụng đầy đủ**.
- Nếu sau này ghép Orchestra vào hệ NhiLe rộng hơn, cần adapter envelope `{ok,data,error}` ↔ `{success,data,error,meta}` ở ranh giới — ghi nhận là việc tương lai, không làm trong MVP.
- ADR này phải được Founder A xác nhận trước khi merge `packages/contracts` (envelope là interface dùng chung).
