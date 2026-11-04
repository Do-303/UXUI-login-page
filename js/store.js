/* 데이터 저장소: Supabase 키가 있으면 Supabase, 없으면 데모 모드(localStorage)
   화면 코드는 store.xxx() 만 불러요. 어느 모드든 같은 모양으로 답해요. */
const store = (() => {
  const cfg = window.MOAJIP_CONFIG || {};
  const live = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
  const sb = live ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  const KEEP_DAYS = 30;
  const DAY = 86400000;
  const toEmail = id => `${id}@moajip.local`;       // Supabase 는 이메일 로그인이라 아이디를 내부용 이메일로 바꿔요

  /* 본인인증 결과로 만드는 사람 고유 값 (데모용 CI). 실제로는 본인확인기관이 내려줘요 */
  async function makeCI(name, birth) {
    const data = new TextEncoder().encode('moajip:' + name.trim() + ':' + birth.trim());
    const buf = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /* ---------- 데모 모드 ---------- */
  const LS = 'moajip.demo.v3', ME = 'moajip.demo.me';
  function db() {
    let d = null; try { d = JSON.parse(localStorage.getItem(LS)); } catch (e) {}
    return d || { users: {} };
  }
  function save(d) { try { localStorage.setItem(LS, JSON.stringify(d)); } catch (e) {} }
  async function seed() {
    const d = db();
    if (d.seeded) return;
    // 시험용: 3일 전에 탈퇴하며 보관에 동의한 분, 45일 전에 탈퇴한 분
    d.users.oldsujin = { username: 'oldsujin', password: 'demo1234', nickname: '수진', ci: await makeCI('이수진', '970707'),
      withdrawnAt: Date.now() - 3 * DAY, keep: true, counts: { orders: 12, cart: 5, points: 3200, wishes: 48 } };
    d.users.oldie = { username: 'oldie', password: 'demo1234', nickname: '예전님', ci: await makeCI('김예전', '880101'),
      withdrawnAt: Date.now() - 45 * DAY, keep: true, counts: { orders: 5, cart: 1, points: 800, wishes: 20 } };
    d.seeded = true; save(d);
  }
  const demo = {
    async usernameAvailable(u) { return !db().users[u]; },
    async findWithdrawn(ci) {
      const d = db();
      const x = Object.values(d.users).filter(u => u.ci === ci && u.withdrawnAt).sort((a, b) => b.withdrawnAt - a.withdrawnAt)[0];
      if (!x) return null;
      return { username: x.username, nickname: x.nickname, daysAgo: Math.floor((Date.now() - x.withdrawnAt) / DAY), keep: !!x.keep, counts: x.keep ? x.counts : null, withdrawnAt: x.withdrawnAt };
    },
    async signUp(p) {
      const d = db();
      const prev = d.users[p.username];
      if (prev && !(prev.withdrawnAt && prev.ci === p.ci)) throw new Error('이미 사용 중인 아이디예요.');
      d.users[p.username] = { username: p.username, password: p.password, nickname: p.nickname, email: p.email || null, ci: p.ci, name: p.name,
        lifeEvent: null, withdrawnAt: null, keep: false, counts: { orders: 0, cart: 0, points: 0, wishes: 0 }, createdAt: Date.now() };
      save(d); localStorage.setItem(ME, p.username);
      return { username: p.username, nickname: p.nickname };
    },
    async setLifeEvent(ev) { const d = db(), me = localStorage.getItem(ME); if (d.users[me]) { d.users[me].lifeEvent = ev; save(d); } },
    async restore(fromUsername, items) {
      const d = db(), me = localStorage.getItem(ME), old = Object.values(d.users).find(u => u.username === fromUsername && u.withdrawnAt) || null;
      // 아이디를 그대로 다시 쓰면 같은 칸을 덮어써서 예전 기록이 사라지므로, 복원 대상은 미리 받아 둔 값으로 채워요
      const src = (window.__restoreSnapshot && window.__restoreSnapshot.counts) || (old && old.counts) || {};
      if (d.users[me]) { for (const k of items) d.users[me].counts[k] = src[k] || 0; }
      if (old && old.username !== me) delete d.users[old.username];
      save(d);
    },
    async discardOld(fromUsername) { const d = db(), me = localStorage.getItem(ME); const old = d.users[fromUsername]; if (old && old.withdrawnAt && fromUsername !== me) { delete d.users[fromUsername]; save(d); } },
    async signIn(u, pw) {
      const d = db(), x = d.users[u];
      if (!x || x.password !== pw) throw new Error('아이디 또는 비밀번호가 맞지 않아요.');
      if (x.withdrawnAt) throw new Error('탈퇴한 계정이에요. 다시 가입하시면 30일 안에 예전 내역을 불러올 수 있어요.');
      localStorage.setItem(ME, u); return { username: u, nickname: x.nickname };
    },
    async me() { const d = db(), u = localStorage.getItem(ME); return u && d.users[u] && !d.users[u].withdrawnAt ? { username: u, nickname: d.users[u].nickname } : null; },
    async signOut() { localStorage.removeItem(ME); },
    async withdraw({ reason, keep }) {
      const d = db(), u = localStorage.getItem(ME), x = d.users[u];
      if (!x) throw new Error('로그인 정보가 없어요.');
      // 데모: 탈퇴 전 쌓인 내역을 그럴듯하게 채워 둬요 (실제로는 쇼핑하면서 쌓여요)
      if (!x.counts || !Object.values(x.counts).some(Boolean)) x.counts = { orders: 3, cart: 5, points: 3200, wishes: 12 };
      x.withdrawnAt = Date.now(); x.keep = !!keep; x.reason = reason || null; x.reusable = true;
      if (!keep) x.counts = { orders: 0, cart: 0, points: 0, wishes: 0 };
      save(d); localStorage.removeItem(ME);
      return { keepUntil: keep ? x.withdrawnAt + KEEP_DAYS * DAY : null };
    },
    async ciUsedBefore(ci) { return Object.values(db().users).some(u => u.ci === ci); }
  };

  /* ---------- Supabase 모드 ---------- */
  const real = {
    async usernameAvailable(u) { const { data, error } = await sb.rpc('username_available', { p_username: u }); if (error) throw error; return !!data; },
    async findWithdrawn(ci) {
      const { data, error } = await sb.rpc('find_withdrawn', { p_ci: ci }); if (error) throw error;
      const x = Array.isArray(data) ? data[0] : data; if (!x) return null;
      return { username: x.username, nickname: x.nickname, daysAgo: x.days_ago, keep: x.keep, withdrawnAt: Date.parse(x.withdrawn_at),
        counts: x.keep ? { orders: x.orders, cart: x.cart, points: x.points, wishes: x.wishes } : null };
    },
    async signUp(p) {
      const { data, error } = await sb.auth.signUp({ email: toEmail(p.username), password: p.password });
      if (error) throw new Error(error.message.includes('registered') ? '이미 사용 중인 아이디예요.' : '가입하지 못했어요. 잠시 뒤 다시 시도해 주세요.');
      if (!data.session) throw new Error('Supabase 의 이메일 확인(Confirm email)을 꺼 주세요. 아이디 로그인은 이메일 확인을 쓰지 않아요.');
      const { error: e2 } = await sb.from('profiles').insert({ id: data.user.id, username: p.username, nickname: p.nickname, email: p.email || null, ci_hash: p.ci });
      if (e2) throw new Error('회원 정보를 저장하지 못했어요.');
      return { username: p.username, nickname: p.nickname };
    },
    async setLifeEvent(ev) { const { data: { user } } = await sb.auth.getUser(); if (user) await sb.from('profiles').update({ life_event: ev }).eq('id', user.id); },
    async restore(fromUsername, items) { const { error } = await sb.rpc('restore_from', { p_username: fromUsername, p_items: items }); if (error) throw error; },
    async discardOld(fromUsername) { await sb.rpc('discard_withdrawn', { p_username: fromUsername }); },
    async signIn(u, pw) {
      const { error } = await sb.auth.signInWithPassword({ email: toEmail(u), password: pw });
      if (error) throw new Error('아이디 또는 비밀번호가 맞지 않아요.');
      const p = await real.me(true);
      if (p && p.withdrawn) { await sb.auth.signOut(); throw new Error('탈퇴한 계정이에요. 다시 가입하시면 30일 안에 예전 내역을 불러올 수 있어요.'); }
      return p;
    },
    async me(raw) {
      const { data: { user } } = await sb.auth.getUser(); if (!user) return null;
      const { data } = await sb.from('profiles').select('username,nickname,withdrawn_at').eq('id', user.id).single();
      if (!data) return null;
      if (data.withdrawn_at && !raw) return null;
      return { username: data.username, nickname: data.nickname, withdrawn: !!data.withdrawn_at };
    },
    async signOut() { await sb.auth.signOut(); },
    async withdraw({ reason, keep }) {
      const { data, error } = await sb.rpc('withdraw_me', { p_reason: reason || null, p_keep: !!keep });
      if (error) throw new Error('탈퇴하지 못했어요. 잠시 뒤 다시 시도해 주세요.');
      await sb.auth.signOut();
      return { keepUntil: keep ? Date.parse(data) : null };
    },
    async ciUsedBefore(ci) { const { data } = await sb.rpc('ci_used_before', { p_ci: ci }); return !!data; }
  };

  const api = live ? real : demo;
  return { live, makeCI, KEEP_DAYS, seed: live ? async () => {} : seed, ...api };
})();
