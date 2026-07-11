# Tiêu chuẩn chất lượng NhiLe (NL-QA-NHILE-001)

## Scoring System
- **P0**: Phải pass trước khi deliver. Fail = không được submit. Không có ngoại lệ.
- **P1**: Nên pass. Fail = ghi vào backlog, fix sprint tiếp.
- **P2**: Tốt nếu có. Fail = không sao nhưng ghi nhận.
- **Verdict**: 90–100% = Deliver. 70–89% = Conditional (cần Nhi review). Dưới 70% = Làm lại.

---

## Universal — Tất cả team

### Tư duy sản phẩm
| Priority | Rule |
|----------|------|
| P0 | Giải thích được trong 1 câu không jargon |
| P0 | Người dùng thật được xác định: ai, giai đoạn nào, muốn gì |
| P0 | Không phức tạp hoá — complexity = chưa distill đủ |
| P1 | Mỗi element phải có lý do tồn tại — không thì xóa |
| P1 | Sản phẩm nhất quán với brand NhiLe/Nedu/N-ơi |

### Visual & Design

**Brand Color Palette:**
| Product | Primary | Accent | Heading Font | Body Font |
|---------|---------|--------|-------------|-----------|
| Nedu.vn | #2D6A8C (Teal Blue) | #4ECDC4 | Playfair Display | Inter / Be Vietnam Pro |
| The NhiLe Live | #8B1A1A (Crimson) | #B7860B (Gold) | Playfair Display | DM Sans |
| N-ơi | Dark Purple #0B0C14 | Teal / Amber | Playfair Display | Inter |
| NQuoc Work OS | #df0029 (Red) | White / Dark | Playfair Display | Inter |

| Priority | Rule |
|----------|------|
| P0 | Đúng color palette của từng brand — không mix |
| P0 | Không cheap, không noisy — dark luxury aesthetics |
| P0 | Font đúng cặp: Playfair Display (heading) + Inter/Be Vietnam Pro (body) |
| P1 | Spacing nhất quán — không quá chật, không quá thưa |
| P1 | Không dùng emoji trong UI trừ khi có lý do design rõ ràng |
| P2 | Dark mode / light mode consistency |

### UX & Product Flow
| Priority | Rule |
|----------|------|
| P0 | Hoạt động đúng trên mobile — test bằng điện thoại thật, không phải Chrome devtools |
| P0 | Empty states phải được thiết kế (message + CTA hướng dẫn) |
| P0 | Error states meaningful — không "An error occurred", phải nói rõ chuyện gì và làm gì |
| P1 | Loading states tồn tại cho mọi action >0.5 giây |
| P1 | User journey rõ ràng từ đầu đến cuối — không friction không rõ |
| P1 | Không có "dead end" trong UX — mọi state có next action |
| P2 | Micro-interactions có ý đồ và consistent |

### Content & Language
| Priority | Rule |
|----------|------|
| P0 | Không Vietnglish vô lý — nhất quán tiếng Việt thật hoặc tiếng Anh |
| P0 | CTA action-oriented và cụ thể — không "Tìm hiểu thêm" chung chung |
| P0 | Không có placeholder text trong delivered product (no Lorem ipsum, [Tên], TBD) |
| P1 | Tone: ấm, thẳng thắn, không stiff — nghe như người nói chuyện thật |
| P1 | Tiêu đề nói được value, không chỉ là label |

### Ops & Naming
| Priority | Rule |
|----------|------|
| P0 | Naming convention: NL-[TYPE]-[PRODUCT]-[NUMBER] |
| P0 | Version control: vX.Y (major.minor) — không dùng "final", "new", "revised" |
| P1 | Docs phải tồn tại trước khi build |
| P1 | Handoff đủ để người mới onboard trong 30 phút |

---

## Technical — IT Team

### Tech Stack (Bất biến)
- **Frontend**: Next.js 14 + TypeScript + TailwindCSS (ngoại lệ approve: mkt.nedu.vn dùng Vite + React SPA)
- **Backend**: Express.js tại api.[domain]:8080
- **Database**: Supabase (PostgreSQL)
- **Realtime**: Supabase Realtime
- **Auth**: Supabase Auth + JWT
- **Hosting**: Vercel (frontend), VPS/Railway (backend)

| Priority | Rule |
|----------|------|
| P0 | Không deviation khỏi stack đã define khi chưa có ADR approved |
| P0 | TypeScript strict mode — không dùng `any` |
| P0 | Environment variables không được hardcode trong code |
| P0 | Authentication check đúng trên cả frontend và backend |
| P1 | Naming convention: camelCase (variables/functions), PascalCase (components/classes), kebab-case (files/folders) |
| P1 | Không commit thẳng vào main/master |
| P1 | API response format nhất quán: `{ success, data, error, meta }` |
| P2 | Unit tests cho business logic phức tạp |
| P2 | Performance: LCP <2.5s, API response <500ms thông thường |

---

## 🚩 Red Flags — Dừng lại ngay (instant fail)

1. **Layout gãy trên mobile** — text overflow, element đè lên nhau, button không bấm được
2. **Sai màu brand** — màu ngoài palette hoặc mix palette của brand khác
3. **Placeholder text trong UI** — Lorem ipsum, [Tên], TBD, Coming soon
4. **App crash khi gặp lỗi** — white screen, freeze, unresponsive (cần graceful degradation)
5. **Vietnglish ngẫu nhiên** — "Click để submit", "View profile của bạn"
6. **Không có empty state** — dashboard/list trống trơn khi không có data
7. **Data leak giữa roles** — member thấy data không thuộc quyền, access được trang admin
8. **Stack deviation không có ADR** — tự ý dùng framework/library ngoài stack đã define

---

## ✅ Green Flags — Nhi sẽ impressed

1. **Self-explanatory** — người dùng mở lên biết ngay làm gì, không cần manual
2. **Edge cases đã được xử lý** — form validation thông minh, graceful error recovery
3. **CLAUDE.md đủ để onboard trong 30 phút** — bất kỳ ai (kể cả AI agent mới) có thể tiếp tục build
4. **Design language exact match với NhiLe brand** — không chỉ đúng màu mà còn đúng typography, spacing, component style
5. **Proactive feedback** — team tự chạy QA checklist, gửi kèm danh sách vấn đề P0 trước khi bị hỏi
6. **Người dùng cuối được nghĩ đến ở mọi decision** — có thể trả lời ngay: tính năng này phục vụ ai, ở giai đoạn nào
7. **Version + changelog rõ ràng** — mọi deliverable có version number, có ghi chú thay đổi

---

## E2E Test Scenarios ("Test như Nhi")

1. **First-time user** — onboarding rõ không, signup ≤3 bước, biết làm gì sau signup
2. **Mobile user** — test trên điện thoại thật, touch target ≥44px, keyboard không che content
3. **Empty states** — xóa hết data, mọi section có empty state + CTA
4. **Error + Edge cases** — network off, submit form trống, ký tự đặc biệt, app không crash
5. **Permission boundary** — account role thấp không thấy data protected, API reject đúng
6. **Cross-team integration** — data sync đúng, không silent failure
