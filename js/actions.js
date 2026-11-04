/* 회원가입: 약관 → 정보 입력(한 단계씩, 끝나면 한 줄로 접혀요) → 확인 팝업 → 생활 이벤트 팝업 → 문 열림 → 가입 완료 */
(() => {
  let onBack = null;
  $('#back').addEventListener('click', () => onBack && onBack());

  /* ---------- 1단계: 약관 ---------- */
  const terms = $$('.term');
  const reqTerms = terms.filter(t => t.dataset.req);
  function syncTerms() {
    $('#all').checked = terms.every(t => t.checked);
    $('#reqOnly').setAttribute('aria-pressed', terms.every(t => t.checked === !!t.dataset.req));
    const ok = reqTerms.every(t => t.checked);
    $('#next1').disabled = !ok;
    $('#hint1').textContent = ok ? '' : '필수 약관에 동의하면 다음으로 넘어갈 수 있어요.';
  }
  $('#all').addEventListener('change', e => { terms.forEach(t => t.checked = e.target.checked); syncTerms(); });
  terms.forEach(t => t.addEventListener('change', syncTerms));
  $('#reqOnly').addEventListener('click', () => { terms.forEach(t => t.checked = !!t.dataset.req); syncTerms(); });
  $('#reset').addEventListener('click', () => { terms.forEach(t => t.checked = false); syncTerms(); });
  $$('.view').forEach(a => a.addEventListener('click', e => e.preventDefault()));
  $('#next1').addEventListener('click', () => openStep2());
  function showS1() { showSection('s1', { steps: 1, back: false }); onBack = null; }

  /* ---------- 2단계: 정보 입력 ---------- */
  const STEPS = [
    { name: '본인인증', sub: '집의 기초를 놓아요', label: '본인인증' },
    { name: '아이디 만들기', sub: '문패를 달아요', label: '아이디' },
    { name: '비밀번호 만들기', sub: '문에 자물쇠를 달아요', label: '비밀번호' },
    { name: '닉네임 · 이메일', sub: '창문을 내요', label: '닉네임' }
  ];
  let cur = 0;
  const completed = [false, false, false, false];
  let verified = null;            // { name, phone, ci }
  let withdrawn = null;           // 본인인증으로 찾은 탈퇴 기록
  let returning = false, returnPending = false;
  let uidOk = false, uidMsg = '', nickOk = false;
  const touched = {};
  const maskPhone = p => p.replace(/\D/g, '').replace(/^(\d{3})\d{3,4}(\d{4})$/, '$1-****-$2');

  function openStep2() { showSection('s2', { steps: 2, back: true }); onBack = showS1; render(); }

  function render() {
    $$('#form .step').forEach(s => s.hidden = +s.dataset.step !== cur);
    const values = [verified ? `${verified.name} · ${maskPhone(verified.phone)}` : '', val('uid'), '••••••••', val('nick')];
    $('#doneList').innerHTML = STEPS.map((s, i) => completed[i] && i !== cur
      ? `<li class="done-row"><span class="ok-dot" aria-hidden="true"></span><span class="done-label">${s.label}</span><span class="done-value">${escapeHTML(values[i])}</span><button type="button" class="link-btn" data-edit="${i}" aria-label="${s.label} 수정">수정</button></li>` : '').join('');
    const built = completed.filter(Boolean).length;
    $('#house').innerHTML = houseSVG(built, cur + 1);
    $('#stepNum').textContent = `${cur + 1} / 4`;
    $('#stepSub').textContent = STEPS[cur].sub;
    $('#next2').disabled = false;
    $('#next2').textContent = cur === 3 ? '가입하기' : '다음';
  }
  const escapeHTML = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  $('#doneList').addEventListener('click', e => {
    const b = e.target.closest('[data-edit]'); if (!b) return;
    cur = +b.dataset.edit; render();
    const first = $(`#form .step[data-step="${cur}"]`).querySelector('input, button'); if (first) first.focus();
  });
  function advance() {
    completed[cur] = true;
    const next = completed.findIndex(c => !c);
    cur = next === -1 ? 3 : next;
    render();
    const first = $(`#form .step[data-step="${cur}"]`).querySelector('input, button'); if (first) first.focus();
  }

  /* 입력 검사: 치는 중엔 조용히, 칸을 벗어날 때 처음 검사, 오류가 뜬 뒤엔 고치는 즉시 지워요 */
  const ID_HINT = '5~20자, 영문 소문자·숫자·밑줄(_)로 만들어 주세요. 대문자로 입력해도 소문자로 바꿔 드려요.';
  const hint = { uid: ID_HINT, pw: '8자 이상, 영문과 숫자를 함께 사용해 주세요.', email: '입력하시면 아이디 찾기와 주문 영수증 받기에 쓸 수 있어요.' };
  const optional = { email: true };
  const idFormat = v => v.length < 5 || v.length > 20 ? '아이디는 5~20자로 만들어 주세요.'
    : !/^[a-z0-9_]+$/.test(v) ? '영문 소문자, 숫자, 밑줄(_)만 쓸 수 있어요.'
    : !/^[a-z]/.test(v) ? '아이디는 영문으로 시작해 주세요.' : '';
  const rules = {
    uid: force => idFormat(val('uid').trim()) || (force && !uidOk ? '아이디 중복확인을 해 주세요.' : ''),
    pw: () => /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(val('pw')) ? '' : '8자 이상, 영문과 숫자를 함께 사용해 주세요.',
    pw2: () => val('pw2') === val('pw') ? '' : '비밀번호가 일치하지 않아요.',
    nick: force => val('nick').trim().length < 2 ? '닉네임은 2자 이상이에요.' : (force && !nickOk ? '닉네임 중복확인을 해 주세요.' : ''),
    email: () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('email').trim()) ? '' : '올바른 이메일 형식이 아니에요.'
  };
  const okText = { uid: () => uidOk ? uidMsg : '', pw: () => '사용 가능한 비밀번호예요.', pw2: () => '비밀번호가 일치해요.', nick: () => nickOk ? '사용 가능한 닉네임이에요.' : '', email: () => '' };

  function show(name, force) {
    const el = f(name), msg = el.querySelector('.msg'), empty = val(name).trim() === '';
    const neutral = () => { el.classList.remove('invalid', 'valid'); msg.textContent = hint[name] || ''; return true; };
    if (!force && !touched[name]) return neutral();
    if (empty) { if (optional[name] || !force) return neutral(); el.classList.add('invalid'); el.classList.remove('valid'); msg.textContent = '필수 입력 항목이에요.'; return false; }
    const err = rules[name](force);
    const ok = !err && okText[name]();
    el.classList.toggle('invalid', !!err);
    el.classList.toggle('valid', !!ok);
    msg.textContent = err || ok || hint[name] || '';
    return !err;
  }
  for (const n of ['uid', 'pw', 'pw2', 'nick', 'email']) {
    const input = $('#' + n);
    input.addEventListener('input', () => {
      if (n === 'uid') { const p = input.selectionStart; input.value = input.value.toLowerCase(); input.setSelectionRange(p, p); uidOk = false; }
      if (n === 'nick') nickOk = false;
      if (f(n).classList.contains('invalid') || f(n).classList.contains('valid')) show(n);   // 이미 검사한 칸은 바로바로 다시 봐요
      if (n === 'pw' && touched.pw2) show('pw2');
    });
    input.addEventListener('blur', () => { if (val(n) !== '') touched[n] = true; show(n); });
  }
  ['uid', 'pw', 'nick', 'email'].forEach(n => show(n));

  /* 아이디 중복확인 */
  $('#uidCheck').addEventListener('click', async () => {
    touched.uid = true;
    const v = val('uid').trim(), el = f('uid'), msg = el.querySelector('.msg');
    const fmt = v === '' ? '필수 입력 항목이에요.' : idFormat(v);
    if (fmt) { uidOk = false; el.classList.add('invalid'); el.classList.remove('valid'); msg.textContent = fmt; return; }
    let available = false;
    try { available = await store.usernameAvailable(v); } catch (e) { msg.textContent = '확인하지 못했어요. 잠시 뒤 다시 눌러 주세요.'; return; }
    const isOldId = returning && withdrawn && withdrawn.username === v && !store.live;
    if (!available && !isOldId) { uidOk = false; el.classList.add('invalid'); el.classList.remove('valid'); msg.textContent = '이미 사용 중인 아이디예요.'; return; }
    uidOk = true; uidMsg = isOldId ? '예전에 쓰시던 아이디예요. 그대로 써도 되고 바꿔도 돼요.' : '사용할 수 있는 아이디예요.';
    show('uid', true);
  });

  /* 닉네임: 자동으로 정하기 · 중복확인 (데모 목록) */
  const NICK_WORDS = [['포근한', '아늑한', '산뜻한', '느긋한', '따뜻한', '말랑한', '단정한', '반짝이는'], ['소파', '쿠션', '러그', '화분', '조명', '식탁', '커튼', '머그컵']];
  const pick = a => a[Math.floor(Math.random() * a.length)];
  $('#nickAuto').addEventListener('click', () => {
    $('#nick').value = pick(NICK_WORDS[0]) + pick(NICK_WORDS[1]) + (1000 + Math.floor(Math.random() * 9000));
    touched.nick = true; nickOk = true; show('nick', true);
    f('nick').querySelector('.msg').textContent = '자동으로 정했어요. 다시 누르면 바뀌고, 직접 고쳐도 돼요.';
  });
  $('#nickCheck').addEventListener('click', () => {
    touched.nick = true;
    const v = val('nick').trim(), el = f('nick');
    if (v.length < 2) { nickOk = false; show('nick', true); return; }
    if (['admin', '관리자', 'moajip'].includes(v.toLowerCase())) { nickOk = false; el.classList.add('invalid'); el.classList.remove('valid'); el.querySelector('.msg').textContent = '이미 사용 중인 닉네임이에요.'; return; }
    nickOk = true; show('nick', true);
  });

  /* 본인인증 (데모: 통신사 선택 → 정보 입력 → 아무 숫자 6자리) */
  let carrier = 'SKT';
  $$('.carrier').forEach(b => b.addEventListener('click', () => {
    $$('.carrier').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
    carrier = b.textContent;
  }));
  $('#openVerify').addEventListener('click', () => {
    $('#vStep1').hidden = false; $('#vStep2').hidden = true; $('#vMsg').textContent = '';
    modal.open('verifyModal');
  });
  $('#vNext').addEventListener('click', () => {
    $('#vStep1').hidden = true; $('#vStep2').hidden = false;
    $('#vLead').textContent = `${carrier} 휴대폰으로 인증번호를 보내 드려요.`;
    $('#vName').focus();
  });
  $('#vPhone').addEventListener('input', e => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 11);
    e.target.value = d.length > 7 ? `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}` : d.length > 3 ? `${d.slice(0, 3)}-${d.slice(3)}` : d;
  });
  $('#vSend').addEventListener('click', () => {
    $('#vMsg').textContent = /^\d{10,11}$/.test(val('vPhone').replace(/\D/g, '')) ? '인증번호를 보냈어요. 3분 안에 입력해 주세요.' : '휴대폰 번호를 확인해 주세요.';
    $('#vSend').textContent = '다시 받기';
  });
  $('#vDone').addEventListener('click', async () => {
    const name = val('vName').trim(), birth = val('vBirth').trim(), phone = val('vPhone').replace(/\D/g, ''), code = val('vCode').trim();
    const err = !name ? '이름을 입력해 주세요.' : !/^\d{6}$/.test(birth) ? '생년월일 6자리를 입력해 주세요.' : !/^\d{10,11}$/.test(phone) ? '휴대폰 번호를 확인해 주세요.' : !/^\d{6}$/.test(code) ? '인증번호 6자리를 입력해 주세요.' : '';
    if (err) { $('#vMsg').textContent = err; return; }
    const ci = await store.makeCI(name, birth);
    verified = { name, phone, ci };
    modal.close(false);
    const btn = $('#openVerify'); btn.textContent = '본인인증 완료'; btn.classList.add('done');
    f('verify').classList.add('valid'); f('verify').querySelector('.msg').textContent = '본인인증이 끝났어요.';
    // 탈퇴 기록은 본인인증을 마친 본인에게만 알려요
    try { withdrawn = await store.findWithdrawn(ci); } catch (e) { withdrawn = null; }
    returning = false;
    if (withdrawn) { returnPending = true; $('#returning').hidden = false; $('#confirmReturn').focus(); render(); }
    else { returnPending = false; $('#returning').hidden = true; advance(); }
  });
  $('#notMe').addEventListener('click', () => { returnPending = false; returning = false; $('#returning').hidden = true; advance(); });
  $('#confirmReturn').addEventListener('click', () => {
    returnPending = false; returning = true; $('#returning').hidden = true;
    f('verify').querySelector('.msg').textContent = '돌아오신 걸 환영해요. 비밀번호를 새로 만들어 주세요.';
    completed[0] = true;
    if (!store.live && withdrawn.username) {
      // 이미 있는 조각(문패)은 한 번에 지어져요: 예전 아이디를 채워 둬요
      $('#uid').value = withdrawn.username; touched.uid = true; uidOk = true;
      uidMsg = '예전에 쓰시던 아이디예요. 그대로 써도 되고 바꿔도 돼요.'; show('uid', true);
      completed[1] = true;
    }
    cur = 0; advance();
  });

  /* 다음 · 가입하기 */
  $('#form').addEventListener('submit', e => {
    e.preventDefault();
    if (cur === 0) {
      if (!verified) { f('verify').classList.add('invalid'); f('verify').querySelector('.msg').textContent = '본인인증을 해 주세요.'; return $('#openVerify').focus(); }
      if (returnPending) return $('#confirmReturn').focus();
      return advance();
    }
    const names = [null, ['uid'], ['pw', 'pw2'], ['nick', 'email']][cur];
    let firstBad = null;
    for (const n of names) { touched[n] = true; if (!show(n, true) && !firstBad) firstBad = n; }
    if (firstBad) return $('#' + firstBad).focus();
    if (cur < 3 || completed.slice(0, 3).some(c => !c)) return advance();
    completed[3] = true; render();
    openConfirm();
  });

  /* 가입 정보 확인 팝업 */
  function openConfirm() {
    const rows = [['이름', verified.name], ['휴대폰', maskPhone(verified.phone)], ['아이디', val('uid').trim()], ['닉네임', val('nick').trim()], ['이메일', val('email').trim() || '입력 안 함']];
    $('#summary').innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHTML(v)}</dd></div>`).join('');
    $('#signupError').textContent = '';
    modal.open('confirmModal');
  }
  const errP = document.createElement('p'); errP.id = 'signupError'; errP.className = 'alert'; errP.setAttribute('role', 'alert');
  $('#summary').after(errP);
  $('#doSignup').addEventListener('click', async () => {
    const btn = $('#doSignup'); btn.disabled = true;
    try {
      if (returning && withdrawn) window.__restoreSnapshot = withdrawn;
      await store.signUp({ username: val('uid').trim(), password: val('pw'), nickname: val('nick').trim(), email: val('email').trim(), ci: verified.ci, name: verified.name });
      modal.close(false);
      openEvents();
    } catch (err) { $('#signupError').textContent = err.message; }
    btn.disabled = false;
  });

  /* 생활 이벤트 팝업 (가입은 이미 끝났어요 — 건너뛰어도 손해 없어요) */
  let chosen = null;
  function openEvents() {
    chosen = null; $('#eventDone').disabled = true;
    $('#eventTitle').textContent = returning ? '이번엔 어떤 일로 돌아오셨어요?' : '어떤 일로 모아집에 오셨어요?';
    $('#events').innerHTML = '<legend class="sr-only">생활 이벤트 (선택)</legend>' + LIFE_EVENTS.map(ev => {
      const label = !returning && ev.key === 'own' ? '처음 독립해요' : ev.label;   // 돌아온 분께는 지난 일을 짐작하게 하는 말을 쓰지 않아요
      return `<label class="ev-opt"><input type="radio" name="ev" value="${ev.key}"><span class="ev-emoji" aria-hidden="true">${ev.emoji}</span><span>${label}</span></label>`;
    }).join('');
    $$('#events input').forEach(i => i.addEventListener('change', () => { chosen = i.value; $('#eventDone').disabled = false; }));
    modal.open('eventModal', () => finish(null));
  }
  $('#eventDone').addEventListener('click', () => { modal.close(false); finish(chosen); });

  /* 문 열림 → 가입 완료 */
  async function finish(evKey) {
    try { await store.setLifeEvent(evKey); } catch (e) {}
    const ev = LIFE_EVENTS.find(x => x.key === evKey) || LIFE_EVENTS[4];
    $$('.who').forEach(w => w.textContent = val('nick').trim());
    showSection('s3', { steps: 3 }); onBack = null;
    const box = $('#doneBox');
    box.classList.remove('play');
    $('#doorScene').className = 'door-scene ev-' + ev.key;
    $('#doorScene').innerHTML = doorSceneHTML(ev.key);
    ['doneNew', 'doneRestore', 'doneOld'].forEach(id => $('#' + id).hidden = true);
    const w = withdrawn;
    if (returning && w && w.keep && w.daysAgo <= store.KEEP_DAYS) {
      $('#rOrders').textContent = (w.counts.orders || 0) + '건';
      $('#rCart').textContent = (w.counts.cart || 0) + '개';
      $('#rPoints').textContent = (w.counts.points || 0).toLocaleString() + 'P';
      $('#rWishes').textContent = (w.counts.wishes || 0) + '개';
      $('#rDeadline').textContent = `${fmtDate(w.withdrawnAt + store.KEEP_DAYS * 86400000)}까지 불러올 수 있어요.`;
      $('#restoreLead').innerHTML = ev.back;
      $('#doneRestore').hidden = false;
    } else if (w) {
      $('#oldNotice').textContent = !w.keep ? '탈퇴할 때 보관하지 않기로 해서 예전 내역은 불러올 수 없어요.' : '탈퇴한 지 30일이 지나 예전 내역은 불러올 수 없어요.';
      $('#doneOld').hidden = false;
    } else {
      $('#doneLead').textContent = ev.lead;
      $('#doneNew').hidden = false;
    }
    void box.offsetWidth;          // 움직임을 처음부터 다시 시작하게 해요
    box.classList.add('play');
    if (reduceMotion()) box.classList.add('still');
  }
  $('#doRestore').addEventListener('click', async e => {
    const b = e.currentTarget;
    if (b.dataset.restored) { location.hash = ''; return route(); }      // 불러온 뒤에는 쇼핑 시작하기
    const items = $$('#doneRestore input[type=checkbox]:checked').map(i => i.dataset.item);
    try { await store.restore(withdrawn.username, items); } catch (err) {}
    $('#restoreLead').textContent = items.length ? '골라 주신 내역을 불러왔어요. 새 공간을 함께 채워 봐요.' : '새로 시작해요.';
    $$('#doneRestore input[type=checkbox]').forEach(i => i.disabled = true);
    $('#doneRestore .cta.line').hidden = true; $('#doneRestore .done-warn').hidden = true; $('#rDeadline').hidden = true;
    b.textContent = '쇼핑 시작하기'; b.dataset.restored = '1'; b.focus();
  });
  $('#doneRestore .cta.line').addEventListener('click', async () => { try { await store.discardOld(withdrawn.username); } catch (e) {} });
  $$('[data-home]').forEach(b => b.addEventListener('click', () => { location.hash = ''; route(); }));

  function resetSignup() {
    cur = 0; completed.fill(false); verified = withdrawn = null; returning = returnPending = false; uidOk = nickOk = false;
    Object.keys(touched).forEach(k => delete touched[k]);
    ['uid', 'pw', 'pw2', 'nick', 'email', 'vName', 'vBirth', 'vPhone', 'vCode'].forEach(id => $('#' + id).value = '');
    ['uid', 'pw', 'pw2', 'nick', 'email'].forEach(n => show(n));
    $('#returning').hidden = true;
    const btn = $('#openVerify'); btn.textContent = '휴대폰으로 본인인증하기'; btn.classList.remove('done');
    f('verify').classList.remove('valid', 'invalid'); f('verify').querySelector('.msg').textContent = '한 분께 한 번만 드리는 신규 가입 혜택을 지키기 위해 본인 확인을 해요.';
    terms.forEach(t => t.checked = false); syncTerms();
    window.__restoreSnapshot = null;
    const rb = $('#doRestore'); rb.textContent = '선택한 내역 불러오기'; delete rb.dataset.restored;
    $$('#doneRestore input[type=checkbox]').forEach(i => { i.disabled = false; i.checked = true; });
    $('#doneRestore .cta.line').hidden = false; $('#doneRestore .done-warn').hidden = false; $('#rDeadline').hidden = false;
  }

  /* 화면 전환: #signup 회원가입 · #withdraw 탈퇴 · 그 밖은 로그인 (로그인돼 있으면 마이페이지) */
  async function route() {
    const h = location.hash;
    if (h === '#signup') { resetSignup(); return showS1(); }
    const me = await store.me().catch(() => null);
    if (h === '#withdraw' && me) return window.startWithdraw(me, b => { onBack = b; });
    onBack = null;
    if (me) return window.showOk(me);
    showSection('login');
  }
  window.route = route;
  window.addEventListener('hashchange', route);
  if (!store.live && !/video/.test(location.search)) { $('#modeBadge').hidden = false; $('#modeBadge').textContent = '데모 모드 · 가입 정보는 이 브라우저에만 저장돼요'; }
  store.seed().then(route);
})();
