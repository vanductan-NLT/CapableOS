# Test Plan — Track B (chạy thật trên Supabase qua Docker)

> QA cho track Founder B (Playbook mục 19 + FR-1/8/10/11/12/13). Ngày 2026-07-12.
> Môi trường: container `orchestra-web` (Docker) → Supabase thật (ap-northeast-2).
> Runner: `scratchpad/test-plan.mjs` (hoặc `BASE=<url>/api node test-plan.mjs`).

## Kết quả: **19/19 PASS**

| Nhóm | Kiểm | Kết quả |
|---|---|---|
| BT1 · FR-1 (mục19 #10a) | Tạo 5 task ngôn ngữ tự nhiên → status `created` | ✅ |
| BT2 · FR-13 | `/capabilities` = 9 taxonomy · Pool ≥ 11 · POST/PATCH agent · **Feature 0: từ chối cap ngoài taxonomy (400)** | ✅ |
| BT3 · FR-8 | Giao task cho người → `awaiting_human` | ✅ |
| BT4 · FR-10 | `/tasks?status=` lọc đúng · list toàn bộ | ✅ |
| BT5 · FR-11 (mục19 #8) | feedback đạt → trust +1 · không đạt → −1 · net đúng (79→79) · reputation Wilson (n=3, 0.21) | ✅ |
| BT6 · FR-12 (mục19 #10b) | flow completed=3, leadP50=2404ms, throughput=3 · breakdown AI=3 quality 67% · metrics quality 67% | ✅ |
| BT7 · Chất lượng API | envelope `{ok,error}` · zod validation (400) · not-found (404) | ✅ |

## Ghi chú phạm vi
- **Kịch bản mục 19 #1–7, #9** (verdict human/ai/hybrid/escalate, executor thật, governance allow/deny/approval, fallback khi LLM lỗi) thuộc **domain A** (`POST /route`, `/execute`, `/approve`). Không nằm trong track B; sẽ chạy liên-domain khi A expose API endpoints (A đã build engine `packages/ai`: planner/scoring/router/decision-pipeline — 119 test pass).
- **Realtime (FR-10)**: subscription Supabase đã wire ở client (`useRealtimeTasks`); cần trình duyệt để kiểm tận tay (không test được qua curl). Data-correctness đã verify.
- **RLS/security**: verify riêng bằng `packages/db/scripts/test-db.sh` (19/19 trên Postgres) — anon bị chặn, client không ghi được bảng của A.

## Deploy
- Dockerfile (multi-stage, `next start`, không sửa `next.config`). Build: `docker build --build-arg NEXT_PUBLIC_SUPABASE_URL=… --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=… -t orchestra-web .`
- Run: `docker run -d --env-file .env -p 3000:3000 orchestra-web` → http://localhost:3000
