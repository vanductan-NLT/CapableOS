-- seed.sql — Capability Pool + governance defaults (FR-13, mục 16.4).
-- caps DÙNG ĐÚNG taxonomy chung @orchestra/contracts (Feature 0, domain A):
--   summarization · research · email_drafting · translation · meeting_notes
--   · writing · analysis · coding · design
-- Số cost/minutes là ESTIMATED (FR-14). Idempotent: on conflict do nothing.
--
-- GHI CHÚ CHO A (đề xuất, chưa tự thêm): test plan mục 19 #2/#4 nhắc "Legal"/"tín dụng".
-- Taxonomy hiện thiếu legal/finance/compliance → seed dùng analysis+writing cho các vai đó,
-- và dựa vào routing theo risk=high (không cần cap riêng). Nếu A muốn phân biệt sâu hơn,
-- đề xuất thêm 'legal','finance' vào CAPABILITIES — cần A duyệt (không tự sửa file shared).

-- ── Humans ──────────────────────────────────────────────────
insert into agents (id, type, name, role, trust, cost, minutes, caps) values
  ('h-alice', 'human', 'Alice Nguyen',  'Business Analyst', 82, 40, 120,
     '{"analysis":0.72,"writing":0.65,"research":0.6}'),
  ('h-bob',   'human', 'Bob Tran',      'Legal Counsel',    88, 90, 240,
     '{"analysis":0.7,"writing":0.72,"research":0.6}'),
  ('h-carol', 'human', 'Carol Le',      'JP Localization',  80, 50, 150,
     '{"translation":0.7,"writing":0.68}'),
  ('h-dave',  'human', 'Dave Pham',     'Finance Manager',  85, 80, 180,
     '{"analysis":0.7,"research":0.6,"writing":0.6}'),
  ('h-erin',  'human', 'Erin Vo',       'Product Designer', 81, 60, 160,
     '{"design":0.85,"writing":0.6}'),
  ('h-frank', 'human', 'Frank Ho',      'Software Engineer',83, 70, 200,
     '{"coding":0.88,"analysis":0.65}')
on conflict (id) do nothing;

-- ── AI agents (5 executor thật) ─────────────────────────────
insert into agents (id, type, name, role, trust, cost, minutes, caps) values
  ('ai-summarize', 'ai', 'Summarizer',   'Summarize PDF/Docs', 78, 0.3, 1,
     '{"summarization":0.92,"analysis":0.85,"writing":0.75}'),
  ('ai-research',  'ai', 'Researcher',    'Web/Doc Research',   75, 0.5, 2,
     '{"research":0.9,"analysis":0.8,"writing":0.72}'),
  ('ai-email',     'ai', 'Email Writer',  'Draft Emails',       76, 0.2, 1,
     '{"writing":0.86,"email_drafting":0.9}'),
  ('ai-translate', 'ai', 'Translator',    'Translate (common)', 74, 0.2, 1,
     '{"translation":0.9,"writing":0.7}'),
  ('ai-meeting',   'ai', 'Meeting Notes', 'Meeting Summaries',  77, 0.3, 1,
     '{"summarization":0.88,"meeting_notes":0.86,"writing":0.7}')
on conflict (id) do nothing;

-- ── Governance defaults (mục 16.4) ──────────────────────────
insert into governance_rules (scope, allow, deny, approval) values
  ('ai',    '["read:*","write:draft"]', '["delete:*"]', '["send:*"]'),
  ('human', '["*"]',                    '[]',           '[]')
on conflict (scope) do nothing;
