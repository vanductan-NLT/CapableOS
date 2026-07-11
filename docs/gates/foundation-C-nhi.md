# Cổng C — `/nhi feedback` · Nền tảng (Contracts + DB)

> Bước C: chạy trước khi mở PR. Nhập vai chị Nhi, kiểm Red Flags trước. Ngày 2026-07-11.

---

Chị đọc nền tảng của em (contracts + db + scaffold). Chị nói thẳng như mọi khi.

## Red Flags — chị soi trước tiên
| Red flag (NL-QA) | Kết quả |
|---|---|
| Data leak giữa roles | ✅ Sạch. RLS đã **test thật** trong Postgres: anon không đọc được task, client không ghi được `logs`/`decisions`. Đây là thứ chị sợ nhất ở backend — em xử đúng. |
| Stack deviation không ADR | ✅ Có ADR-0001 giải thích vì sao Next 15/envelope `{ok,data,error}` khác chuẩn Nhi. Không im lặng — chị duyệt cách làm này. |
| Placeholder text | ✅ Không có. Seed là dữ liệu thật, có ý đồ (khớp test plan). |
| App crash / no empty state / sai màu / Vietnglish / mobile | ⏳ N/A — chưa có UI ở milestone này. Sẽ soi ở cổng của B-02/B-03/B-05. |

**Không có P0 fail.**

## Điều chị thích (Green Flags)
- **Proactive QA** — em tự chạy 19 check rồi mới đưa chị, không đợi chị hỏi "test chưa?". Đúng chuẩn.
- **Onboard 30 phút** — AGENTS.md + README + DEVELOPMENT.md + gate docs. Người sau (kể cả AI mới) đọc là tiếp được.
- **Edge case đã xử** — constraint chặn rating/type/trust/status sai ngay ở tầng DB, không chờ app nhớ.
- **Trung thực dữ liệu** — cost/minutes gắn ESTIMATED (FR-14), trust là giá trị dẫn xuất từ log. Chị tin số này.

## Điều cần em nhớ (không phải P0, đừng để trôi)
- Điểm 🟡 "ai duyệt feedback" ở cổng B — chốt với 2 founder trước khi làm FR-11, đừng tự quyết ngầm.
- `packages/contracts` là [S] — **chưa được merge** tới khi Founder A duyệt (nhất là `decision.ts` + envelope).
- Khi lên UI, chị sẽ soi lại đủ bộ: mobile thật, empty/error state, dark mode, đúng brand.

## Verdict: **READY** (cho tầng nền tảng)
Nền contracts + db của em đủ chuẩn để làm móng cho B-01…B-06. Không có gì treo mơ hồ.

> Việc cần làm tiếp, cụ thể: **đưa `packages/contracts` cho Founder A duyệt + hỏi 2 founder về chính sách duyệt feedback**, rồi bắt đầu B-01 (Task CRUD API) trên nền này.
