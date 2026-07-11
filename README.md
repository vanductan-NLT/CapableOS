# Orchestra · Human-AgentOS

Control plane cho lực lượng lao động lai **người + AI**: quyết định việc nào giao cho người, cho agent, hay cả hai; kiểm soát quyền & rủi ro của agent; đo năng suất trên cùng một thước đo.

> Tài liệu vận hành gốc (single source of truth): `../context.html` — **Orchestra Engineering Playbook**.
> Luật cho AI agent: [AGENTS.md](./AGENTS.md).

## Mô hình
Hai Engineering Manager điều phối ~20 agent chuyên biệt (không tự code):
- **Founder A — Decision Intelligence:** planner, router, governance, AI executor. Sở hữu `features/decision`, `features/execution`, `packages/ai`, `packages/prompts`.
- **Founder B — Workspace Intelligence:** task board, realtime, dashboard, metrics, feedback→trust. Sở hữu `features/task`, `features/dashboard`, `packages/db` (chủ schema).
- **Shared `[S]`** (`packages/contracts`, `packages/ui`): sửa qua PR, cần cả hai duyệt.

## Cấu trúc
```
orchestra/
├─ apps/web/                 # [B] Next.js 15 — Command/Board/Dashboard/Pool + API routes ✅
├─ packages/
│  ├─ contracts/             # [S] interface dùng chung ✅ (chờ A duyệt)
│  ├─ db/                    # [B] schema + migrations + RLS + seed ✅
│  ├─ ai/                    # [A] chưa dựng
│  └─ ui/                    # [S] chưa dựng (UI kit tạm để local trong apps/web)
├─ docs/
│  ├─ ADR/                   # Architecture Decision Records
│  └─ gates/                 # kết quả 3 cổng /sonle /lky /nhi cho track B
├─ AGENTS.md CLAUDE.md
└─ turbo.json pnpm-workspace.yaml
```

## Bắt đầu
> ⚠️ KHÔNG chạy pnpm trên ổ `E:` (exFAT, không symlink). Xem [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) — dùng NTFS/Docker/WSL.
```bash
pnpm install                          # trên NTFS/Docker/WSL
cp .env.example .env.local            # điền Supabase URL + anon + service_role key
pnpm --filter @orchestra/db migrate   # 0001_init → 0002_rls (cần DATABASE_URL)
pnpm --filter @orchestra/db seed      # seed Capability Pool
pnpm --filter @orchestra/web dev      # http://localhost:3000
```
Kiểm thử: `pnpm --filter @orchestra/web test` (unit) · `bash packages/db/scripts/test-db.sh` (DB trong Docker).

## Trạng thái build (verify 2026-07-12, trong Docker/NTFS)
`next build` 13 route ✓ · typecheck 0 ✓ · unit 8/8 ✓ · DB 19/19 (Postgres thật) ✓ · runtime smoke 4 page 200 + envelope/validation ✓. Luồng app↔DB sống chờ Supabase credentials.

## Trạng thái
Xem [docs/PENDING-A-APPROVAL.md](./docs/PENDING-A-APPROVAL.md) cho các hạng mục shared đang chờ Founder A duyệt.
