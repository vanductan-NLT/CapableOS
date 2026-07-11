-- 0004_execution_state_machine.sql — Feature 4.1: Execution lifecycle state machine.
-- Owner: Founder A (executions table).
-- Cross-domain: RPC updates tasks.status (Founder B's table) atomically.

-- ── Step 1: Drop old status constraint ──────────────────────
alter table executions
  drop constraint if exists executions_status_check;

-- ── Step 2: Expand status to full lifecycle ─────────────────
alter table executions
  add constraint executions_status_check
  check (status in ('pending','running','succeeded','failed','cancelled'));

-- ── Step 3: Change default from 'ok' to 'pending' ──────────
alter table executions
  alter column status set default 'pending';

-- ── Step 4: Allow executor to be null (human executions) ────
alter table executions
  drop constraint if exists executions_executor_check;

alter table executions
  alter column executor drop not null;

alter table executions
  add constraint executions_executor_check
  check (executor is null or executor in ('summarize','research','email','translate','meeting'));

-- ── Step 5: Add new columns ─────────────────────────────────
alter table executions
  add column if not exists decision_id uuid references decisions(id),
  add column if not exists verdict text check (verdict in ('human','ai','hybrid','escalate')),
  add column if not exists assignee_id text references agents(id),
  add column if not exists reviewer_id text references agents(id),
  add column if not exists attempt int not null default 1 check (attempt >= 1),
  add column if not exists max_retries int not null default 0 check (max_retries >= 0),
  add column if not exists root_execution_id uuid,
  add column if not exists previous_execution_id uuid references executions(id),
  add column if not exists error_code text,
  add column if not exists error_message text,
  add column if not exists timeout_at timestamptz,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz;

-- Self-referencing FK for root_execution_id
alter table executions
  drop constraint if exists executions_root_execution_id_fkey;
alter table executions
  add constraint executions_root_execution_id_fkey
  foreign key (root_execution_id) references executions(id);

-- ── Step 6: Indexes for common queries ──────────────────────
create index if not exists executions_decision_idx on executions(decision_id);
create index if not exists executions_status_idx on executions(status);
create index if not exists executions_assignee_idx on executions(assignee_id);
create index if not exists executions_root_idx on executions(root_execution_id);

-- ── Step 7: Partial unique index — at most 1 active execution per decision ──
-- Active = pending or running. Enforces idempotency at DB level.
create unique index if not exists executions_active_per_decision_idx
  on executions(decision_id)
  where status in ('pending','running');

-- ── Step 8: RPC for atomic execution creation + task status update ──
-- Cross-domain: A inserts execution, updates B's tasks.status.
create or replace function public.create_execution_transaction(
  p_task_id uuid,
  p_decision_id uuid,
  p_execution jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task tasks%rowtype;
  v_existing executions%rowtype;
  v_execution executions%rowtype;
  v_new_task_status text;
begin
  -- Lock task row
  select *
    into v_task
    from tasks
    where id = p_task_id
    for update;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  -- Check for existing active execution on this decision
  select *
    into v_existing
    from executions
    where decision_id = p_decision_id
      and status in ('pending', 'running')
    limit 1;

  if found then
    return jsonb_build_object(
      'status', 'existing',
      'execution', to_jsonb(v_existing)
    );
  end if;

  -- Validate task is in 'routed' status (or re-routed after failed attempt)
  if v_task.status not in ('routed') then
    return jsonb_build_object(
      'status', 'conflict',
      'task_status', v_task.status
    );
  end if;

  -- Determine new task status based on verdict
  v_new_task_status := case p_execution ->> 'verdict'
    when 'ai' then 'executing'
    when 'hybrid' then 'executing'
    when 'human' then 'awaiting_human'
    else null  -- escalate: no execution should be created
  end;

  if v_new_task_status is null then
    return jsonb_build_object(
      'status', 'invalid_verdict',
      'verdict', p_execution ->> 'verdict'
    );
  end if;

  -- Insert execution
  insert into executions (
    task_id,
    decision_id,
    verdict,
    executor,
    assignee_id,
    reviewer_id,
    status,
    attempt,
    max_retries,
    root_execution_id,
    previous_execution_id,
    input,
    trace_id,
    timeout_at
  )
  values (
    p_task_id,
    p_decision_id,
    p_execution ->> 'verdict',
    p_execution ->> 'executor',
    p_execution ->> 'assignee_id',
    p_execution ->> 'reviewer_id',
    'pending',
    coalesce((p_execution ->> 'attempt')::int, 1),
    coalesce((p_execution ->> 'max_retries')::int, 0),
    (p_execution ->> 'root_execution_id')::uuid,
    (p_execution ->> 'previous_execution_id')::uuid,
    p_execution -> 'input',
    p_execution ->> 'trace_id',
    case
      when p_execution ? 'timeout_at' and p_execution ->> 'timeout_at' is not null
        then (p_execution ->> 'timeout_at')::timestamptz
      else null
    end
  )
  returning *
    into v_execution;

  -- Set root_execution_id to self if attempt = 1
  if v_execution.attempt = 1 then
    update executions
      set root_execution_id = v_execution.id
      where id = v_execution.id;
    v_execution.root_execution_id := v_execution.id;
  end if;

  -- Cross-domain: update task status
  update tasks
    set status = v_new_task_status
    where id = p_task_id;

  return jsonb_build_object(
    'status', 'created',
    'execution', to_jsonb(v_execution)
  );
end;
$$;

revoke all on function public.create_execution_transaction(uuid, uuid, jsonb) from public;
revoke all on function public.create_execution_transaction(uuid, uuid, jsonb) from anon;
revoke all on function public.create_execution_transaction(uuid, uuid, jsonb) from authenticated;
grant execute on function public.create_execution_transaction(uuid, uuid, jsonb) to service_role;

-- ── Step 9: RPC for atomic execution status transition ──────
-- Handles start/succeed/fail/cancel with task status side-effects.
create or replace function public.transition_execution(
  p_execution_id uuid,
  p_event text,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exec executions%rowtype;
  v_new_status text;
  v_new_task_status text;
begin
  -- Lock execution row
  select *
    into v_exec
    from executions
    where id = p_execution_id
    for update;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  -- Resolve new execution status based on event + current status
  v_new_status := case
    when v_exec.status = 'pending' and p_event = 'start' then 'running'
    when v_exec.status = 'pending' and p_event = 'cancel' then 'cancelled'
    when v_exec.status = 'running' and p_event = 'succeed' then 'succeeded'
    when v_exec.status = 'running' and p_event = 'fail' then 'failed'
    when v_exec.status = 'running' and p_event = 'cancel' then 'cancelled'
    else null
  end;

  if v_new_status is null then
    return jsonb_build_object(
      'status', 'invalid_transition',
      'current_status', v_exec.status,
      'event', p_event
    );
  end if;

  -- Update execution
  update executions
    set status = v_new_status,
        started_at = case
          when p_event = 'start' then now()
          else started_at
        end,
        completed_at = case
          when v_new_status in ('succeeded','failed','cancelled') then now()
          else completed_at
        end,
        output = case
          when p_event = 'succeed' then p_payload ->> 'output'
          else output
        end,
        tokens = case
          when p_event = 'succeed' and p_payload ? 'tokens'
            then (p_payload ->> 'tokens')::int
          else tokens
        end,
        cost = case
          when p_event = 'succeed' and p_payload ? 'cost'
            then (p_payload ->> 'cost')::numeric
          else cost
        end,
        ms = case
          when p_event = 'succeed' and p_payload ? 'ms'
            then (p_payload ->> 'ms')::int
          else ms
        end,
        error_code = case
          when p_event = 'fail' then p_payload ->> 'error_code'
          else error_code
        end,
        error_message = case
          when p_event = 'fail' then p_payload ->> 'error_message'
          else error_message
        end
    where id = p_execution_id
    returning *
      into v_exec;

  -- Determine task status side-effect (cross-domain update)
  v_new_task_status := case
    when p_event = 'succeed' and v_exec.verdict = 'hybrid' then 'awaiting_approval'
    when p_event = 'succeed' and v_exec.verdict in ('ai','human') then 'done'
    else null  -- no task status change for start/fail/cancel in Feature 4.1
  end;

  if v_new_task_status is not null then
    update tasks
      set status = v_new_task_status
      where id = v_exec.task_id;
  end if;

  return jsonb_build_object(
    'status', 'transitioned',
    'execution', to_jsonb(v_exec),
    'task_status_update', coalesce(v_new_task_status, 'none')
  );
end;
$$;

revoke all on function public.transition_execution(uuid, text, jsonb) from public;
revoke all on function public.transition_execution(uuid, text, jsonb) from anon;
revoke all on function public.transition_execution(uuid, text, jsonb) from authenticated;
grant execute on function public.transition_execution(uuid, text, jsonb) to service_role;
