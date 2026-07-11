# Tech Stack & Code Quality — NhiLe Holdings

## Stack bất biến

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 + TypeScript + TailwindCSS |
| Backend | Express.js tại `api.[domain]:8080` |
| Database | Supabase (PostgreSQL) |
| Realtime | Supabase Realtime |
| Auth | Supabase Auth + JWT |
| Hosting FE | Vercel |
| Hosting BE | VPS / Railway |
| Automation | Make.com / n8n |

**Ngoại lệ đã approve:** `mkt.nedu.vn` dùng Vite + React SPA (documented ADR).

**Mỗi product có API riêng:**
- api.nedu.vn:8080
- api.nquoc.vn:8080
- api.noi.vn:8080

Không share backend giữa các product trừ khi có ADR.

---

## Naming Conventions

- **Variables/functions**: camelCase
- **Components/classes**: PascalCase
- **Files/folders**: kebab-case
- **Database tables**: snake_case
- **Constants**: UPPER_SNAKE_CASE
- **Documents**: NL-[TYPE]-[PRODUCT]-[NUMBER]

## API Response Format

Mọi API response phải nhất quán:
```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {}
}
```

## Code Quality Rules (P0)

- TypeScript strict mode, không dùng `any`
- Environment variables không hardcode trong code
- Auth check đúng trên cả frontend VÀ backend
- Không commit thẳng vào main/master
- Mọi stack deviation phải có ADR approved trước

## ADR (Architecture Decision Record)

Cần ADR khi:
- Dùng library/framework ngoài stack đã define
- Thay đổi database schema lớn
- Thay đổi auth strategy
- Share backend giữa các product
