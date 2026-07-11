#!/usr/bin/env bash
# End-to-end DB validation for @orchestra/db against a real Postgres in Docker.
# Proves: migrations apply, constraints enforce, seed loads, RLS allows/denies correctly.
set -u
CNAME=orchestra-pg-test
DB=packages/db
PASS=0; FAIL=0
ok(){ echo "  ✓ $1"; PASS=$((PASS+1)); }
no(){ echo "  ✗ $1"; FAIL=$((FAIL+1)); }

cleanup(){ docker rm -f "$CNAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT
cleanup

echo "== start postgres:16-alpine =="
docker run -d --name "$CNAME" -e POSTGRES_PASSWORD=postgres postgres:16-alpine >/dev/null
for i in $(seq 1 30); do docker exec "$CNAME" pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done

PSQL="docker exec -i $CNAME psql -U postgres -v ON_ERROR_STOP=1 -q"
PSQLC="docker exec -i $CNAME psql -U postgres -q"

echo "== auth shim (Supabase provides this in prod) =="
$PSQL <<'SQL' >/dev/null && ok "auth.uid() shim + app_user role" || no "shim"
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create role app_user nologin;
SQL

echo "== apply migrations + seed =="
$PSQL < "$DB/migrations/0001_init.sql" >/dev/null 2>/tmp/e1 && ok "0001_init.sql" || { no "0001_init.sql"; cat /tmp/e1; }
$PSQL < "$DB/migrations/0002_rls.sql" >/dev/null 2>/tmp/e2 && ok "0002_rls.sql" || { no "0002_rls.sql"; cat /tmp/e2; }
$PSQL < "$DB/seed.sql"               >/dev/null 2>/tmp/e3 && ok "seed.sql"      || { no "seed.sql"; cat /tmp/e3; }

echo "== grants for RLS role test =="
$PSQL <<'SQL' >/dev/null
grant usage on schema public, auth to app_user;
grant select, insert, update, delete on all tables in schema public to app_user;
grant execute on function auth.uid() to app_user;
SQL

echo "== data assertions =="
n(){ docker exec -i "$CNAME" psql -U postgres -tAq -c "$1" | tr -d '[:space:]'; }
[ "$(n "select count(*) from agents")" = "11" ]             && ok "11 agents seeded" || no "agents count = $(n "select count(*) from agents")"
[ "$(n "select count(*) from agents where type='human'")" = "6" ] && ok "6 humans" || no "humans"
[ "$(n "select count(*) from agents where type='ai'")" = "5" ]    && ok "5 ai" || no "ai"
[ "$(n "select count(*) from governance_rules")" = "2" ]    && ok "2 governance rules" || no "governance"
echo "  capabilities: $(docker exec -i "$CNAME" psql -U postgres -tAq -c "select string_agg(distinct k,',' order by k) from agents, lateral jsonb_object_keys(caps) k")"

echo "== constraint enforcement (expect rejects) =="
$PSQLC -c "insert into feedback(task_id,rating) values(null,'maybe')" >/dev/null 2>&1 && no "bad rating accepted" || ok "rating check rejects 'maybe'"
$PSQLC -c "insert into agents(id,type,name) values('x','robot','X')" >/dev/null 2>&1 && no "bad type accepted" || ok "type check rejects 'robot'"
$PSQLC -c "insert into agents(id,type,name,trust) values('x','ai','X',150)" >/dev/null 2>&1 && no "trust>100 accepted" || ok "trust range rejects 150"
$PSQLC -c "insert into tasks(title,status) values('t','banana')" >/dev/null 2>&1 && no "bad status accepted" || ok "status check rejects 'banana'"

echo "== seed a task as superuser (bypasses RLS) =="
$PSQL -c "insert into tasks(title) values('rls-fixture')" >/dev/null

echo "== RLS behaviour (role app_user, non-owner → RLS enforced) =="
AUTHED="set request.jwt.claim.sub='11111111-1111-1111-1111-111111111111'; set role app_user;"
ANON="set role app_user;"
# authed can read the fixture
[ "$(docker exec -i "$CNAME" psql -U postgres -tAq -c "$AUTHED select count(*) from tasks" | tr -d '[:space:]')" = "1" ] && ok "authed reads tasks" || no "authed read"
# anon reads 0 (RLS filters)
[ "$(docker exec -i "$CNAME" psql -U postgres -tAq -c "$ANON select count(*) from tasks" | tr -d '[:space:]')" = "0" ] && ok "anon sees 0 tasks (read blocked)" || no "anon read not blocked"
# authed insert task ok
$PSQLC -c "$AUTHED insert into tasks(title) values('t-authed')" >/dev/null 2>&1 && ok "authed can insert task" || no "authed insert blocked"
# anon insert task blocked
$PSQLC -c "$ANON insert into tasks(title) values('t-anon')" >/dev/null 2>&1 && no "anon insert allowed!" || ok "anon insert blocked (RLS)"
# authed cannot write logs (no policy → deny)
$PSQLC -c "$AUTHED insert into logs(kind) values('x')" >/dev/null 2>&1 && no "client wrote logs!" || ok "client cannot write logs"
# authed cannot write decisions (A-only, no insert policy)
$PSQLC -c "$AUTHED insert into decisions(verdict) values('ai')" >/dev/null 2>&1 && no "client wrote decisions!" || ok "client cannot write decisions"
# authed CAN read decisions (B reads)
$PSQLC -c "$AUTHED select 1 from decisions limit 1" >/dev/null 2>&1 && ok "client can read decisions" || no "client read decisions blocked"

echo ""
echo "== RESULT: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ]
