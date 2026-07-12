# Cổng B · /lky-institution-builder — @orchestra/ui (shared design system) · 2026-07-12

Câu hỏi LKY: "Cái này còn tồn tại & tiến hoá khi người tạo ra nó rời đi không?"

## Institutional Health Score
```
ĐỐI TƯỢNG: packages/ui (@orchestra/ui) — shared design system [S]

FOUNDER DEPENDENCY:     🟡 — token/contract đã viết ra (không nằm trong đầu), nhưng B seed một mình
MERITOCRACY (đúng công cụ): 🟢 — chọn CSS-vars + Tailwind + framer-motion (chuẩn ngành), không bespoke
SYSTEM DOCUMENTATION:   🟢 — README + class-vocabulary contract + export có type; build/test verify
DECISION RIGHTS:        🟡 — ranh giới A/B/[S] rõ ở AGENTS.md §2, nhưng quyền NỘI BỘ design-system chưa codify
CULTURE ENFORCEMENT:    🔴 — "nhất quán" chưa có hệ thống ép; không gì chặn hardcode hex/emoji/lệch token
SUCCESSION READINESS:   🟡 — handover 90 ngày khả thi nhờ docs, nhưng chưa có người thứ 2 (A) đồng phát triển
INTEGRITY ARCHITECTURE: 🟢 — B KHÔNG tự merge shared; đã flag PENDING-A-APPROVAL dù bất tiện (rule of law)

OVERALL GRADE: B (Founder-resilient, cần chuẩn hoá)
```

## Rủi ro thể chế (top 3)
1. **Shared seed một người.** `packages/ui` là [S] nhưng chỉ B dựng → "personality, not institution". Nếu B rời, A chưa đồng sở hữu → drift hoặc đóng băng.
2. **Không có enforcement nhất quán.** "Value consistency" mà không có lint/CI ép → chỉ là poster. Người/agent sau dễ hardcode `#0E9C8B`, thêm emoji, tự chế màu → phá hệ thống dần.
3. **Decision Rights nội bộ chưa rõ:** ai được thêm token màu? thêm component? đổi timing motion? Chưa nói được 1 quy tắc cụ thể.

## Sức mạnh thể chế (top 3)
1. Token + contract viết ra rõ (README) → knowledge thuộc về team, không thuộc 1 người.
2. Tuân luật: không bypass PR shared, đã ghi mục chờ A duyệt.
3. Verify được (build xanh, test pass) → chất lượng là hệ thống, không phải cảm tính.

## Decision Rights Matrix — design system (đề xuất codify)
| Quyết định | Ai quyết | Ai được báo | Ai veto |
|---|---|---|---|
| Đổi **token màu / gradient / glow** (globals.css + tailwind) | PR shared | cả hai founder | **cả A và B** |
| Đổi **motion token** (timing/easing) | PR shared | cả hai | cả A và B |
| **Thêm component** vào packages/ui | Chủ domain đề xuất | founder kia | founder kia |
| Dùng component có sẵn trong slice của mình | Chủ slice | — | không |
| **Promote** kit local → packages/ui | PR shared | cả hai | cả A và B |

## Hành động chuẩn hoá (PRIORITY — làm đầu tiên)
1. **A đồng sở hữu `packages/ui`** (review token + component) → biến seed thành institution.
2. **Thêm guard tự động** (lint/CI): cấm raw hex màu + emoji trong `components/`, `features/`, `packages/ui` → nhất quán thành hệ thống, không phải lời hứa.
3. **Codify Decision Rights ở trên vào `packages/ui/README.md`** để agent/người sau follow được.

_LKY: "Systems outlast individuals." Design system chỉ là institution khi người thứ 2 mở rộng được nó mà không hỏi người đầu._
