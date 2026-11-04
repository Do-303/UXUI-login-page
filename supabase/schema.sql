-- 모아집 회원 정보 · 탈퇴 · 재가입
-- 사용법: Supabase 대시보드 → SQL Editor → 이 파일 내용을 붙여 넣고 Run
-- 함께 할 일: Authentication → Sign In / Providers → Email 에서 "Confirm email" 끄기
--            (아이디 로그인은 내부용 가짜 이메일 아이디@moajip.local 을 써서, 확인 메일을 받을 수 없어요)

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text not null unique check (username ~ '^[a-z][a-z0-9_]{4,19}$'),
  nickname      text not null check (char_length(nickname) between 2 and 15),
  email         text,
  ci_hash       text not null,                 -- 본인인증 고유 값(데모: 이름+생년월일 해시). 원래 값은 저장하지 않아요
  life_event    text check (life_event in ('move','marry','own','baby','browse')),
  orders        int not null default 0,
  cart          int not null default 0,
  points        int not null default 0,
  wishes        int not null default 0,
  withdrawn_at  timestamptz,
  keep          boolean not null default false, -- 탈퇴할 때 30일 보관에 동의했는지
  keep_until    timestamptz,
  withdraw_reason text,
  created_at    timestamptz not null default now()
);
create index if not exists profiles_ci_idx on public.profiles (ci_hash);

alter table public.profiles enable row level security;

-- 내 정보만 보고, 만들고, 고칠 수 있어요
drop policy if exists "read own" on public.profiles;
create policy "read own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "insert own" on public.profiles;
create policy "insert own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "update own" on public.profiles;
create policy "update own" on public.profiles for update using (auth.uid() = id and withdrawn_at is null);

-- 아이디 중복확인 (다른 사람 정보는 보이지 않고 "쓸 수 있는지"만 알려줘요)
create or replace function public.username_available(p_username text)
returns boolean language sql security definer set search_path = public as $$
  select not exists (select 1 from profiles where username = lower(p_username));
$$;

-- 본인인증을 마친 뒤에만 부르는 함수: 같은 사람의 가장 최근 탈퇴 기록
create or replace function public.find_withdrawn(p_ci text)
returns table (username text, nickname text, withdrawn_at timestamptz, days_ago int, keep boolean,
               orders int, cart int, points int, wishes int)
language sql security definer set search_path = public as $$
  select p.username, p.nickname, p.withdrawn_at,
         floor(extract(epoch from (now() - p.withdrawn_at)) / 86400)::int,
         p.keep and p.keep_until > now(),
         case when p.keep and p.keep_until > now() then p.orders end,
         case when p.keep and p.keep_until > now() then p.cart end,
         case when p.keep and p.keep_until > now() then p.points end,
         case when p.keep and p.keep_until > now() then p.wishes end
  from profiles p
  where p.ci_hash = p_ci and p.withdrawn_at is not null
  order by p.withdrawn_at desc limit 1;
$$;

-- 이 사람이 전에 가입한 적이 있는지 (신규 가입 혜택은 한 사람에 한 번)
create or replace function public.ci_used_before(p_ci text)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from profiles where ci_hash = p_ci);
$$;

-- 탈퇴: 보관에 동의하면 30일 뒤까지, 아니면 바로 내역을 지워요. 보관 마감 시각을 돌려줘요
create or replace function public.withdraw_me(p_reason text, p_keep boolean)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare v_until timestamptz := case when p_keep then now() + interval '30 days' else null end;
begin
  update profiles set
    withdrawn_at = now(), keep = p_keep, keep_until = v_until, withdraw_reason = p_reason,
    email = null, life_event = null,
    orders = case when p_keep then orders else 0 end,
    cart   = case when p_keep then cart   else 0 end,
    points = case when p_keep then points else 0 end,
    wishes = case when p_keep then wishes else 0 end
  where id = auth.uid() and withdrawn_at is null;
  return v_until;
end; $$;

-- 재가입한 내 계정으로 예전 내역 중 고른 것만 옮겨요 (같은 사람 · 보관 기간 안일 때만)
create or replace function public.restore_from(p_username text, p_items text[])
returns void language plpgsql security definer set search_path = public as $$
declare o profiles; me profiles;
begin
  select * into me from profiles where id = auth.uid();
  select * into o from profiles where username = p_username and withdrawn_at is not null
    and ci_hash = me.ci_hash and keep and keep_until > now();
  if o.id is null then raise exception 'nothing to restore'; end if;
  update profiles set
    orders = orders + case when 'orders' = any(p_items) then o.orders else 0 end,
    cart   = cart   + case when 'cart'   = any(p_items) then o.cart   else 0 end,
    points = points + case when 'points' = any(p_items) then o.points else 0 end,
    wishes = wishes + case when 'wishes' = any(p_items) then o.wishes else 0 end
  where id = auth.uid();
  update profiles set keep = false, keep_until = null, orders = 0, cart = 0, points = 0, wishes = 0 where id = o.id;
end; $$;

-- "새로 시작할게요": 예전 내역을 바로 지워요
create or replace function public.discard_withdrawn(p_username text)
returns void language plpgsql security definer set search_path = public as $$
declare me profiles;
begin
  select * into me from profiles where id = auth.uid();
  update profiles set keep = false, keep_until = null, orders = 0, cart = 0, points = 0, wishes = 0
  where username = p_username and withdrawn_at is not null and ci_hash = me.ci_hash;
end; $$;

-- 보관 기간이 지난 내역 지우기 (Supabase → Database → Cron 에서 하루 한 번 실행하도록 걸어 두면 좋아요)
create or replace function public.purge_expired()
returns void language sql security definer set search_path = public as $$
  update profiles set keep = false, orders = 0, cart = 0, points = 0, wishes = 0
  where withdrawn_at is not null and keep and keep_until <= now();
$$;

grant execute on function public.username_available(text), public.find_withdrawn(text), public.ci_used_before(text) to anon, authenticated;
grant execute on function public.withdraw_me(text, boolean), public.restore_from(text, text[]), public.discard_withdrawn(text) to authenticated;
