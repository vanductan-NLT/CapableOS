-- 0006_route_sets_assignee.sql — Fix: route_decision_transaction now sets tasks.assignee_id
-- from decision.chosen[0]. Previously, assignee was only set during execution creation,
-- causing the Board to show "Chưa chọn nguồn lực" for routed tasks.

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
  v_assignee_id text;
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

  -- Extract first chosen candidate as assignee (if any)
  v_assignee_id := (p_decision -> 'chosen' ->> 0);

  update tasks
    set decision_id = v_decision.id,
        status = 'routed',
        assignee_id = v_assignee_id
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

-- Backfill: update existing routed tasks that have decisions with chosen but no assignee
update tasks t
  set assignee_id = (d.chosen ->> 0)
  from decisions d
  where t.decision_id = d.id
    and t.assignee_id is null
    and d.chosen is not null
    and jsonb_array_length(d.chosen) > 0;
