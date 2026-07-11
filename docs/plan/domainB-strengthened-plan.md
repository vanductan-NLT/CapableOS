# Kế hoạch củng cố Domain B — Workspace Intelligence
### Dựa trên (1) phần A đã build trên `dev`, (2) research cách doanh nghiệp lớn + OSS làm

> Ngày 2026-07-12 · DRI: Founder B. Mọi cải tiến ở đây **additive**, không đổi contract A đang dùng.

---

## 0. Đọc phần A đã build trên `dev` để căn chỉnh
A đã đẩy **Feature 0 (capability taxonomy)** + **Planner Agent** + **capability normalizer** + mock `pool.json`.
- A's `normalizeCapabilities()` ép `required[]` về đúng 9-cap taxonomy, chuẩn hoá weight tổng = 1.
- A's Router chấm điểm ứng viên: `fit = 0.7*match + 0.3*trust` (contract `Candidate`) — **đọc `agents.trust` từ Pool của B**.
- A's mock pool dùng caps **dày** (mọi agent có điểm cho cả 9 cap).

**Hệ quả cho B (đã làm khi merge):** seed + `/agents` dùng đúng taxonomy; `/capabilities` trả `CAPABILITIES` canonical (đúng thứ Planner cần). **Ràng buộc quan trọng:** `agents.trust` là biến A dùng trong công thức fit → B **không đổi ngữ nghĩa** field này.

---

## 1. Research — cách "người ta đã thành công"

### 1.1 Hệ thống uy tín / trust (cho FR-11)
Vấn đề của "±1 counter" ngây thơ: (a) "1 đạt = 100%" vượt mặt "48/50 đạt"; (b) không bao giờ quên lỗi cũ; (c) không đo được độ chắc chắn.

| Kỹ thuật | Ai dùng | Ý tưởng |
|---|---|---|
| **Wilson lower bound** | Reddit, Stack Overflow (xếp hạng "best") | Cận dưới khoảng tin cậy của tỉ lệ đạt — **phạt mẫu nhỏ**, chống may rủi. |
| **Bayesian average** | IMDB Top-250 | Kéo agent ít dữ liệu về **prior chung**, tránh cực đoan. |
| **EWMA / time-decay** | trading, blockchain reputation, anti-spam | Hành vi **gần đây nặng hơn**; cho phép "phục hồi theo thời gian" (forgiveness). |

### 1.2 Đo năng suất đội (cho FR-12)
| Framework | Ai dùng | Đo gì |
|---|---|---|
| **DORA** | Google/DevOps chuẩn ngành | lead time, throughput, change-fail, MTTR — **khách quan, từ dữ liệu**. |
| **SPACE** | Microsoft/GitHub research | Satisfaction, Performance, Activity, Collaboration, Efficiency/flow — đa chiều, bền vững. |
> Bài học: DORA cho kỷ luật đo lường khách quan; SPACE thêm tính bền vững (đừng tối ưu 1 số mà đốt người). Bắt đầu bằng DORA, thêm SPACE sau.

**Nguồn:**
- Wilson vs Bayesian: [Medium — Wilson Lower Bound & Bayesian](https://medium.com/tech-that-works/wilson-lower-bound-score-and-bayesian-approximation-for-k-star-scale-rating-to-rate-products-c67ec6e30060) · [julesjacobs — Bayesian ranking](https://julesjacobs.com/2015/08/17/bayesian-scoring-of-ratings.html) · [Improved Online Wilson Score (arXiv)](https://arxiv.org/pdf/1809.07694)
- Time-decay/EWMA: [ODSC — EMA time-decay systems](https://odsc.medium.com/exponential-moving-averages-at-scale-building-smart-time-decay-systems-45d7509cd6ae) · [EWMA (value-at-risk)](https://www.value-at-risk.net/exponentially-weighted-moving-average-ewma/)
- DORA vs SPACE: [getdx — SPACE metrics](https://getdx.com/blog/space-metrics/) · [Opsera — DORA vs SPACE](https://opsera.ai/blog/dora-vs-space-metrics-key-differences-use-cases-and-when-to-use-each-framework/)

---

## 2. Đã build trong đợt này (additive, có test)
1. **Reputation engine** [`lib/reputation.ts`](../../apps/web/lib/reputation.ts) — Wilson lower bound + Bayesian + EWMA + trend, **tính từ log `feedback` bất biến**. KHÔNG đụng `agents.trust`.
   - `GET /agents/reputation` → `{ [agentId]: Reputation }`.
   - UI: Pool hiển thị "Uy tín kiểm chứng %" + xu hướng ↗→↘ cạnh trust (điểm vận hành A dùng).
2. **Flow metrics (DORA)** [`lib/metrics.ts` `computeFlow`](../../apps/web/lib/metrics.ts) — lead time P50 (trung vị, chống outlier) + throughput.
   - `PATCH /tasks` ghi log chuyển trạng thái vào bảng `logs` (observability mục 24) → nguồn tính lead time.
   - `GET /metrics/flow` → `{completed, leadTimeMsP50, leadTimeMsAvg, throughput, windowDays}`.
   - UI: Dashboard thêm dải "Flow" (hoàn thành · lead time P50 · throughput 7 ngày).

## 3. Backlog kế tiếp (đề xuất, ưu tiên giảm dần)
- **[Đề xuất A] Router dùng reputation thay `trust` thô** trong fit: `0.3 * wilson` thay vì `0.3 * (trust/100)`. Chính xác hơn, chống may rủi. **Cần A đồng thuận** (đổi ngữ nghĩa fit). → PR shared.
- **SPACE chiều "Satisfaction"**: feedback thêm lý do/nhãn (không chỉ pass/fail) → phân tích chất lượng sâu hơn.
- **Trust decay theo thời gian thật** (hiện EWMA theo thứ tự sự kiện; nâng lên decay theo tuổi ngày).
- **Change-fail rate / rework**: task quay lại từ done→review = tín hiệu chất lượng (DORA change-fail).
- **Cost thật thay ESTIMATED**: nối `executions.cost/ms` (A ghi) vào metrics khi có dữ liệu chạy thật.
- **Marketplace/taxonomy mở rộng** (Roadmap mục 27): thêm legal/finance cap (đang chờ A).

## 4. Vì sao điều này đúng tinh thần dự án
Domain B là lớp **niềm tin + đo lường** giữa người và AI. Một điểm trust ngây thơ tạo ra "slide đẹp"; một điểm **kiểm chứng thống kê** (Wilson, phạt mẫu nhỏ, EWMA phục hồi) tạo ra **sự thật công bằng** cho cả người lẫn agent — đúng thứ tổ chức cần để tin vào lực lượng lao động lai, và bền vững 300 năm dù model AI nào thắng.
