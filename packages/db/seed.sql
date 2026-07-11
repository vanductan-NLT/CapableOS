-- seed.sql — Capability Pool + governance defaults (FR-13, mục 16.4).
-- Số cost/minutes là ESTIMATED (FR-14) tới khi có log đối chiếu.
-- Seed được thiết kế để khớp Test Plan mục 19 (human/ai/hybrid/escalate/deny/approval).
-- Idempotent: on conflict do nothing.

-- ── Humans ──────────────────────────────────────────────────
insert into agents (id, type, name, role, trust, cost, minutes, caps) values
  ('h-alice', 'human', 'Alice Nguyen',  'Business Analyst', 82, 40, 120,
     '{"analysis":0.72,"writing":0.65,"research":0.6}'),
  ('h-bob',   'human', 'Bob Tran',      'Legal Counsel',    88, 90, 240,
     '{"legal":0.92,"compliance":0.85,"analysis":0.6}'),
  ('h-carol', 'human', 'Carol Le',      'JP Localization',  80, 50, 150,
     '{"translation":0.7,"japanese":0.75,"writing":0.68}'),
  ('h-dave',  'human', 'Dave Pham',     'Finance Manager',  85, 80, 180,
     '{"finance":0.88,"risk":0.82,"analysis":0.7}')
on conflict (id) do nothing;

-- ── AI agents (5 executor thật) ─────────────────────────────
insert into agents (id, type, name, role, trust, cost, minutes, caps) values
  ('ai-summarize', 'ai', 'Summarizer',   'Summarize PDF/Docs', 78, 0.3, 1,
     '{"summarize":0.92,"analysis":0.85,"writing":0.75}'),
  ('ai-research',  'ai', 'Researcher',    'Web/Doc Research',   75, 0.5, 2,
     '{"research":0.9,"analysis":0.8,"writing":0.72}'),
  ('ai-email',     'ai', 'Email Writer',  'Draft Emails',       76, 0.2, 1,
     '{"writing":0.86,"email":0.9}'),
  ('ai-translate', 'ai', 'Translator',    'Translate (common)', 74, 0.2, 1,
     '{"translation":0.9,"writing":0.7}'),
  ('ai-meeting',   'ai', 'Meeting Notes', 'Meeting Summaries',  77, 0.3, 1,
     '{"summarize":0.88,"meeting":0.86,"writing":0.7}')
on conflict (id) do nothing;

-- ── Governance defaults (mục 16.4) ──────────────────────────
insert into governance_rules (scope, allow, deny, approval) values
  ('ai',    '["read:*","write:draft"]', '["delete:*"]', '["send:*"]'),
  ('human', '["*"]',                    '[]',           '[]')
on conflict (scope) do nothing;
