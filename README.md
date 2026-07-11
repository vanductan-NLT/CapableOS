# Orchestra · Human-AgentOS

Control plane cho lực lượng lao động lai **người + AI**: quyết định việc nào giao cho người, cho agent, hay cả hai; kiểm soát quyền & rủi ro của agent; đo năng suất trên cùng một thước đo.

> Tài liệu vận hành gốc (single source of truth): `../context.html` — **Orchestra Engineering Playbook**.
> Luật cho AI agent: [AGENTS.md](./AGENTS.md).

## Mô hình
Hai Engineering Manager điều phối ~20 agent chuyên biệt (không tự code):
- **Founder A — Decision Intelligence:** planner, router, governance, AI executor. Sở hữu `features/decision`, `features/execution`, `packages/ai`, `packages/prompts`.
- **Founder B — Workspace Intelligence:** task board, realtime, dashboard, metrics, feedback→trust. Sở hữu `features/task`, `features/dashboard`, `packages/db` (chủ schema).
- **Shared `[S]`** (`packages/contracts`, `packages/ui`): sửa qua PR, cần cả hai duyệt.

## Cấu trúc (đang dựng)
```
orchestra/
├─ apps/web/                 # Next.js 15 (chưa dựng — bước sau)
├─ packages/
│  ├─ contracts/             # [S] interface dùng chung  ← có trong milestone này
│  ├─ db/                    # [B] schema + migrations + RLS + seed  ← có trong milestone này
│  ├─ ai/                    # [A] chưa dựng
│  └─ ui/                    # [S] chưa dựng
├─ docs/
│  ├─ ADR/                   # Architecture Decision Records
│  └─ gates/                 # kết quả 3 cổng /sonle /lky /nhi cho track B
├─ AGENTS.md CLAUDE.md
└─ turbo.json pnpm-workspace.yaml
```

## Bắt đầu
```bash
pnpm install
cp .env.example .env.local      # điền Supabase URL + keys
pnpm --filter @orchestra/db migrate   # chạy migrations (cần Supabase)
pnpm --filter @orchestra/db seed      # seed Capability Pool
```

## Trạng thái
Xem [docs/PENDING-A-APPROVAL.md](./docs/PENDING-A-APPROVAL.md) cho các hạng mục shared đang chờ Founder A duyệt.
