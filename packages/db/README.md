# @orchestra/db — [B] Schema, RLS & Seed

Founder B là **chủ schema** (Playbook mục 10). Mọi thay đổi bảng đi qua migration ở đây.

## Bảng & quyền ghi (mục 10)
| Bảng | Ghi | Đọc | Ghi chú |
|---|---|---|---|
| `agents` (Pool) | **B** | A, B | FR-13 |
| `tasks` | **B** | A (update status/decision_id), B | |
| `decisions` | **A** | B | B đọc để tính metrics |
| `executions` | **A** | B | B đọc để hiện kết quả |
| `governance_rules` | **A** | B | |
| `feedback` | **B** | A, B | Nguồn sự thật của trust (FR-11) |
| `logs` | A, B | — (service_role) | Append-only, observability |

## Chạy
```bash
# cần DATABASE_URL (Supabase → Settings → Database → Connection string, direct)
export DATABASE_URL="postgres://postgres:<pwd>@db.<ref>.supabase.co:5432/postgres"

pnpm --filter @orchestra/db migrate   # 0001_init → 0002_rls
pnpm --filter @orchestra/db seed      # Capability Pool + governance defaults
pnpm --filter @orchestra/db reset     # drop + migrate + seed (CHỈ dev)
```
Thay thế: `supabase db push` nếu copy các file `migrations/*.sql` sang `supabase/migrations/`.

## Nguyên tắc thiết kế (từ cổng /sonle, /lky)
- **Event log bất biến** (`feedback`, `executions`, `logs`) tách khỏi **current-state** (`agents.trust`, `tasks.status`). Trust luôn tái dựng được từ `feedback.trust_delta` → không mất hành trình (sonle nguyên tắc 2–3).
- **Constraint = luật** (lky Layer-1): `type`, `status`, `verdict`, `rating`, `trust 0..100`, `executor` đều có `check`. Rule không dựa vào "nhớ mà làm đúng".
- **RLS deny-by-default**: bật RLS mọi bảng; `decisions`/`executions`/`governance_rules` client chỉ đọc; `logs` client không chạm.
