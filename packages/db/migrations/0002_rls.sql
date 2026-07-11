-- 0002_rls.sql — Row Level Security (Playbook mục 23).
-- RLS bật trên MỌI bảng. Client (anon/authed) chỉ chạm qua policy.
-- Thao tác nhạy cảm (ghi decisions/executions/governance_rules/logs) đi qua API route
-- với service_role (bypass RLS) — không lộ ra trình duyệt.
-- MVP: một workspace, điều kiện quyền = "đã đăng nhập" (auth.uid() is not null).

alter table agents            enable row level security;
alter table tasks             enable row level security;
alter table decisions         enable row level security;
alter table executions        enable row level security;
alter table governance_rules  enable row level security;
alter table feedback          enable row level security;
alter table logs              enable row level security;

-- ── agents (Pool): client đọc; ghi qua API service_role ─────
drop policy if exists "agents_read" on agents;
create policy "agents_read" on agents
  for select using (auth.uid() is not null);

-- ── tasks: client đọc + tạo task; cập nhật đi qua API ───────
drop policy if exists "tasks_read" on tasks;
create policy "tasks_read" on tasks
  for select using (auth.uid() is not null);

drop policy if exists "tasks_insert" on tasks;
create policy "tasks_insert" on tasks
  for insert with check (auth.uid() is not null);

-- ── decisions / executions: client CHỈ đọc (mục 10 B reads) ─
--    ghi chỉ service_role. Không có insert/update policy = client không ghi được.
drop policy if exists "decisions_read" on decisions;
create policy "decisions_read" on decisions
  for select using (auth.uid() is not null);

drop policy if exists "executions_read" on executions;
create policy "executions_read" on executions
  for select using (auth.uid() is not null);

-- ── governance_rules: client đọc để hiển thị; ghi service_role
drop policy if exists "governance_read" on governance_rules;
create policy "governance_read" on governance_rules
  for select using (auth.uid() is not null);

-- ── feedback: client đọc + gửi feedback; cập nhật trust qua API
drop policy if exists "feedback_read" on feedback;
create policy "feedback_read" on feedback
  for select using (auth.uid() is not null);

drop policy if exists "feedback_insert" on feedback;
create policy "feedback_insert" on feedback
  for insert with check (auth.uid() is not null);

-- ── logs: KHÔNG cho client chạm. RLS bật, không policy = deny all
--    (chỉ service_role ghi/đọc). Cố ý để trống.
