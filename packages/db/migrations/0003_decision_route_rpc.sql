-- 0003_decision_route_rpc.sql — Feature 3.3 atomic decision persistence.
-- Cross-domain: A writes decisions; this RPC also updates B-owned tasks.current state.

alter table decisions
  add column if not exists reason jsonb;

create or replace function public.route_decision_transaction(
  p_task_id uuid,
  p_decision jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task tasks%rowtype;
  v_decision decisions%rowtype;
begin
  select *
    into v_task
    from tasks
    where id = p_task_id
    for update;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  if v_task.decision_id is not null then
    select *
      into v_decision
      from decisions
      where id = v_task.decision_id;

    if not found then
      raise exception 'Task % points to missing decision %', p_task_id, v_task.decision_id;
    end if;

    return jsonb_build_object(
      'status', 'existing',
      'decision', to_jsonb(v_decision)
    );
  end if;

  if v_task.status <> 'created' then
    return jsonb_build_object(
      'status', 'conflict',
      'task_status', v_task.status
    );
  end if;

  insert into decisions (
    task_id,
    verdict,
    required,
    candidates,
    chosen,
    confidence,
    ambiguity,
    risk,
    reason,
    reasoning,
    governance,
    cost_est,
    minutes_est,
    estimated
  )
  values (
    p_task_id,
    p_decision ->> 'verdict',
    p_decision -> 'required',
    p_decision -> 'candidates',
    p_decision -> 'chosen',
    (p_decision ->> 'confidence')::numeric,
    (p_decision ->> 'ambiguity')::numeric,
    p_decision ->> 'risk',
    p_decision -> 'reason',
    p_decision ->> 'reasoning',
    case
      when p_decision ? 'governance' and p_decision -> 'governance' <> 'null'::jsonb
        then p_decision -> 'governance'
      else null
    end,
    (p_decision ->> 'cost_est')::numeric,
    (p_decision ->> 'minutes_est')::int,
    coalesce((p_decision ->> 'estimated')::boolean, true)
  )
  returning *
    into v_decision;

  update tasks
    set decision_id = v_decision.id,
        status = 'routed'
    where id = p_task_id;

  return jsonb_build_object(
    'status', 'created',
    'decision', to_jsonb(v_decision)
  );
end;
$$;

revoke all on function public.route_decision_transaction(uuid, jsonb) from public;
revoke all on function public.route_decision_transaction(uuid, jsonb) from anon;
revoke all on function public.route_decision_transaction(uuid, jsonb) from authenticated;
grant execute on function public.route_decision_transaction(uuid, jsonb) to service_role;
