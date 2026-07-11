# Development — môi trường & cảnh báo ổ đĩa

## ⚠️ Ổ `E:` là exFAT — KHÔNG chạy pnpm/turbo trực tiếp ở đây
Repo hiện nằm trên `E:` (exFAT). exFAT **không hỗ trợ symlink**, mà pnpm workspaces + turbo
bắt buộc symlink → `pnpm install` sẽ fail (`ERR_PNPM_EISDIR ... symlink`).

Ba cách phát triển (chọn 1):

1. **Khuyến nghị — chuyển repo sang ổ NTFS** (vd `C:\dev\CapableOS` hoặc `D:\`), rồi `pnpm install` bình thường.
2. **Docker** — build/typecheck/chạy app trong container Linux (FS hỗ trợ symlink). Xem dưới.
3. WSL2 (ext4) nếu đã cài.

`.npmrc` đã set `node-linker=hoisted` nhưng vẫn không đủ cho turbo trên exFAT — chỉ NTFS/Docker/WSL mới chạy trọn.

## Kiểm thử DB — chạy được NGAY cả trên `E:`
`packages/db/scripts/test-db.sh` đọc file SQL qua stdin (không cần symlink, không cần node_modules),
dựng Postgres trong Docker và chạy migrations + RLS + seed + assertions. Chạy từ gốc repo:
```bash
bash packages/db/scripts/test-db.sh
```
Kết quả kỳ vọng: `19 passed, 0 failed` (đã verify 2026-07-11: migrations apply, 4 check-constraint
reject sai dữ liệu, seed 9 agents/12 capabilities, RLS chặn anon + chặn client ghi logs/decisions).

## Typecheck contracts (cần FS symlink)
```bash
pnpm install                       # trên NTFS/Docker/WSL
pnpm --filter @orchestra/contracts typecheck   # → tsc exit 0 (đã verify)
```
