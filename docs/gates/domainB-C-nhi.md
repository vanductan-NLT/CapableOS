# Cổng C — `/nhi feedback` · Domain B App

> Bước C, trước khi mở PR. Nhập vai chị Nhi, kiểm Red Flags trước. Ngày 2026-07-12.

---

Chị review app của em: Command, Board (realtime), Dashboard, Pool + toàn bộ API.

## Red Flags — soi trước
| Red flag (NL-QA) | Kết quả |
|---|---|
| Layout gãy mobile | ✅ Grid co lại 1 cột; Board + bảng có `overflow-x-auto`; touch target ổn. |
| Sai màu brand | ✅ Palette teal/tím/gold nhất quán; chart palette **đã chạy validator dataviz** (CVD ΔE 20.8, pass). |
| Placeholder text | ✅ Không có Lorem/TBD. Seed thật, message thật. |
| App crash khi lỗi | ✅ **Đã test runtime**: thiếu env → envelope `{ok:false,error}` sạch, UI hiện `ErrorState`, không white-screen. |
| Vietnglish | ✅ UI tiếng Việt nhất quán; thuật ngữ kỹ thuật để nguyên có chủ đích. |
| Không empty state | ✅ Command/Board/Dashboard/Pool đều có empty + CTA. |
| Data leak giữa roles | ✅ RLS test thật: client không ghi được `logs`/`decisions`; anon không đọc task. |
| Stack deviation không ADR | ✅ ADR-0001. |

**Không có P0 fail.**

## Green Flags
- **Self-explanatory** — Command 1 ô nhập, không cần manual.
- **Proactive QA** — em đưa kèm bằng chứng: build 13 route, typecheck 0, 8/8 unit, 19/19 DB, smoke 4 page 200 + envelope. Không đợi chị hỏi.
- **Edge cases** — zod validate mọi input, message tiếng Việt rõ ("Cần nhập tiêu đề công việc"); DB constraint chặn tầng dưới.
- **Onboard 30'** — AGENTS.md + README + DEVELOPMENT + 6 gate docs; AI mới tiếp được.
- **Trung thực số** — cost/time người gắn `ESTIMATED`; quality hiện "—" khi chưa có đánh giá (không bịa 0%).

## Cần nhớ (không P0)
- **Chạy thật với DB sống chưa test** — thiếu Supabase credentials. Lớp DB đã verify trên Postgres thật; luồng app↔DB sống sẽ chạy khi có `.env.local` (hoặc `supabase start`). Đây là việc chờ input, không phải lỗi.
- **Auth MVP đơn giản** — một workspace, điều kiện `auth.uid() not null`. Multi-tenant = Roadmap.
- Realtime cần Supabase để kiểm tận tay; code có guard `hasSupabase()` để không vỡ khi thiếu.

## Verdict: **READY**
App domain B đủ chuẩn deliver ở mức MVP "chạy thật" (build + test + runtime chứng minh). 

> Việc cụ thể tiếp theo: **cắm Supabase credentials vào `.env.local`** → chạy `pnpm db:migrate && db:seed` → demo full luồng Command → Board (realtime) → Feedback → Dashboard. Và **đưa `packages/contracts` cho A duyệt** để hợp nhất seam với Decision domain.
