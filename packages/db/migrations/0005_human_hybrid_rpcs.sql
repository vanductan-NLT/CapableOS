-- 0005_human_hybrid_rpcs.sql — Feature 4.3: Human + Hybrid execution flow.
-- Owner: Founder A (executions table).
-- Cross-domain: RPCs update tasks.status and tasks.result (Founder B's table).

-- ── Step 1: Add review columns to executions ────────────────

alter table executions
  add column if not exists review_outcome text
    check (review_outcome is null or review_outcome in ('approve','reject')),
  add column if not exists review_note text,
  add column if not exists reviewed_at timestamptz;

-- ── Step 2: RPC for human result submission ─────────────────
-- Atomically: verify ownership, complete execution, update task.
-- Human exception: pending → succeeded directly (no running intermediate).
create or replace function public.submit_human_result(
  p_execution_id uuid,
  p_submitter_id text,
  p_output text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exec executions%rowtype;
  v_task tasks%rowtype;
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

  -- Verify verdict is human
  if v_exec.verdict <> 'human' then
    return jsonb_build_object(
      'status', 'invalid_verdict',
      'verdict', v_exec.verdict
    );
  end if;

  -- Verify ownership: submitter must be assignee
  if v_exec.assignee_id is null or v_exec.assignee_id <> p_submitter_id then
    return jsonb_build_object('status', 'forbidden');
  end if;

  -- Idempotency: if already succeeded with same output, return existing
  if v_exec.status = 'succeeded' then
    if v_exec.output = p_output then
      return jsonb_build_object(
        'status', 'already_submitted',
        'execution', to_jsonb(v_exec)
      );
    else
      return jsonb_build_object('status', 'conflict');
    end if;
  end if;

  -- Must be in pending status
  if v_exec.status <> 'pending' then
    return jsonb_build_object(
      'status', 'conflict',
      'current_status', v_exec.status
    );
  end if;

  -- Atomic: pending → succeeded
  update executions
    set status = 'succeeded',
        output = p_output,
        started_at = now(),
        completed_at = now(),
        ms = null
    where id = p_execution_id
    returning * into v_exec;

  -- Cross-domain: update task status + result
  update tasks
    set status = 'done',
        result = p_output
    where id = v_exec.task_id;

  -- Log for audit
  insert into logs (trace_id, kind, task_id, payload)
  values (
    v_exec.trace_id,
    'human_submit',
    v_exec.task_id,
    jsonb_build_object(
      'execution_id', v_exec.id,
      'submitter_id', p_submitter_id
    )
  );

  return jsonb_build_object(
    'status', 'submitted',
    'execution', to_jsonb(v_exec)
  );
end;
$$;

revoke all on function public.submit_human_result(uuid, text, text) from public;
revoke all on function public.submit_human_result(uuid, text, text) from anon;
revoke all on function public.submit_human_result(uuid, text, text) from authenticated;
grant execute on function public.submit_human_result(uuid, text, text) to service_role;

-- ── Step 3: RPC for hybrid review ───────────────────────────
-- Reviewer approves/rejects AI output. Execution stays succeeded (immutable).
-- Only task status and review fields are updated.
create or replace function public.review_hybrid_execution(
  p_execution_id uuid,
  p_reviewer_id text,
  p_outcome text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exec executions%rowtype;
  v_task tasks%rowtype;
  v_new_task_status text;
begin
  -- Validate outcome
  if p_outcome not in ('approve', 'reject') then
    return jsonb_build_object(
      'status', 'invalid_outcome',
      'outcome', p_outcome
    );
  end if;

  -- Lock execution row
  select *
    into v_exec
    from executions
    where id = p_execution_id
    for update;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  -- Verify verdict is hybrid
  if v_exec.verdict <> 'hybrid' then
    return jsonb_build_object(
      'status', 'invalid_verdict',
      'verdict', v_exec.verdict
    );
  end if;

  -- Verify ownership: reviewer must match
  if v_exec.reviewer_id is null or v_exec.reviewer_id <> p_reviewer_id then
    return jsonb_build_object('status', 'forbidden');
  end if;

  -- Verify execution is succeeded (AI has completed)
  if v_exec.status <> 'succeeded' then
    return jsonb_build_object(
      'status', 'conflict',
      'reason', 'execution_not_succeeded',
      'current_status', v_exec.status
    );
  end if;

  -- Idempotency: if already reviewed with same outcome, return existing
  if v_exec.review_outcome is not null then
    if v_exec.review_outcome = p_outcome then
      return jsonb_build_object(
        'status', 'already_reviewed',
        'execution', to_jsonb(v_exec)
      );
    else
      return jsonb_build_object('status', 'conflict', 'reason', 'outcome_mismatch');
    end if;
  end if;

  -- Verify task is awaiting_approval
  select *
    into v_task
    from tasks
    where id = v_exec.task_id
    for update;

  if v_task.status <> 'awaiting_approval' then
    return jsonb_build_object(
      'status', 'conflict',
      'reason', 'task_not_awaiting_approval',
      'task_status', v_task.status
    );
  end if;

  -- Determine new task status
  v_new_task_status := case p_outcome
    when 'approve' then 'done'
    when 'reject' then 'rejected'
  end;

  -- Update execution review fields (output stays immutable)
  update executions
    set review_outcome = p_outcome,
        review_note = p_note,
        reviewed_at = now()
    where id = p_execution_id
    returning * into v_exec;

  -- Cross-domain: update task status (+ result on approve)
  if p_outcome = 'approve' then
    update tasks
      set status = v_new_task_status,
          result = v_exec.output
      where id = v_exec.task_id;
  else
    update tasks
      set status = v_new_task_status
      where id = v_exec.task_id;
  end if;

  -- Log for audit
  insert into logs (trace_id, kind, task_id, payload)
  values (
    v_exec.trace_id,
    'review',
    v_exec.task_id,
    jsonb_build_object(
      'execution_id', v_exec.id,
      'reviewer_id', p_reviewer_id,
      'outcome', p_outcome,
      'note', p_note
    )
  );

  return jsonb_build_object(
    'status', 'reviewed',
    'execution', to_jsonb(v_exec),
    'task_status', v_new_task_status
  );
end;
$$;

revoke all on function public.review_hybrid_execution(uuid, text, text, text) from public;
revoke all on function public.review_hybrid_execution(uuid, text, text, text) from anon;
revoke all on function public.review_hybrid_execution(uuid, text, text, text) from authenticated;
grant execute on function public.review_hybrid_execution(uuid, text, text, text) to service_role;
