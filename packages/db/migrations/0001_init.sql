-- 0001_init.sql — Orchestra base schema (Playbook mục 09).
-- Owner: Founder B (chủ schema). Postgres on Supabase.
-- Layer-1 "constitution": rules are enforced by constraints, not left as comments.

create extension if not exists pgcrypto;  -- gen_random_uuid()

-- ── Capability Pool ─────────────────────────────────────────
create table if not exists agents (
  id          text primary key,
  type        text not null check (type in ('human','ai')),
  name        text not null,
  role        text,
  trust       int  not null default 80 check (trust between 0 and 100),
  cost        numeric,
  minutes     int,
  caps        jsonb not null default '{}',   -- {capability: 0..1}
  created_at  timestamptz not null default now()
);

-- ── Tasks ───────────────────────────────────────────────────
create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  status      text not null default 'created'
                check (status in ('created','routed','executing','awaiting_approval',
                                  'awaiting_human','review','done','rejected')),
  decision_id uuid,
  assignee_id text references agents(id),
  result      text,
  created_at  timestamptz not null default now()
);
create index if not exists tasks_status_idx      on tasks(status);
create index if not exists tasks_created_at_idx   on tasks(created_at desc);
create index if not exists tasks_assignee_idx     on tasks(assignee_id);

-- ── Decisions (Owner ghi: A) ────────────────────────────────
create table if not exists decisions (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid references tasks(id) on delete cascade,
  verdict     text not null check (verdict in ('human','ai','hybrid','escalate')),
  required    jsonb,
  candidates  jsonb,
  chosen      jsonb,
  confidence  numeric,
  ambiguity   numeric,
  risk        text check (risk in ('low','high')),
  reasoning   text,
  governance  jsonb,
  cost_est    numeric,
  minutes_est int,
  estimated   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists decisions_task_idx on decisions(task_id);

-- FK từ tasks.decision_id → decisions.id (thêm sau khi decisions tồn tại)
alter table tasks
  drop constraint if exists tasks_decision_id_fkey;
alter table tasks
  add constraint tasks_decision_id_fkey
  foreign key (decision_id) references decisions(id) on delete set null;

-- ── Executions — kết quả AI thực thi thật (Owner ghi: A) ─────
create table if not exists executions (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid references tasks(id) on delete cascade,
  executor    text check (executor in ('summarize','research','email','translate','meeting')),
  input       jsonb,
  output      text,
  tokens      int,
  cost        numeric,
  ms          int,
  status      text not null default 'ok' check (status in ('ok','error','timeout')),
  trace_id    text,
  created_at  timestamptz not null default now()
);
create index if not exists executions_task_idx on executions(task_id);

-- ── Governance rules (Owner ghi: A) ─────────────────────────
create table if not exists governance_rules (
  scope    text primary key,   -- 'ai' | 'human' | agent_id
  allow    jsonb,
  deny     jsonb,
  approval jsonb
);

-- ── Feedback — event log bất biến, nguồn sự thật của trust ──
create table if not exists feedback (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid references tasks(id),
  rating      text not null check (rating in ('pass','fail')),
  trust_delta int,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists feedback_task_idx on feedback(task_id);

-- ── Logs — observability (mục 24), append-only ──────────────
create table if not exists logs (
  id         bigint generated always as identity primary key,
  trace_id   text,
  kind       text,
  task_id    uuid,
  payload    jsonb,
  created_at timestamptz not null default now()
);
create index if not exists logs_trace_idx on logs(trace_id);
create index if not exists logs_task_idx  on logs(task_id);
