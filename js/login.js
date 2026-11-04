/* 로그인: 아이디 · 비밀번호 검증, 로그인 처리 (Supabase 또는 데모) */
(() => {
  const touched = {};
  const rules = { loginId: () => '', loginPw: () => '' };   // 로그인은 비어 있는지만 확인해요

  function show(name, force) {
    const el = f(name), msg = el.querySelector('.msg'), empty = val(name).trim() === '';
    if (!force && (!touched[name] || empty)) { el.classList.remove('invalid'); msg.textContent = ''; return true; }
    const err = empty ? '필수 입력 항목이에요.' : rules[name]();
    el.classList.toggle('invalid', !!err); msg.textContent = err; return !err;
  }
  for (const n of ['loginId', 'loginPw']) {
    const input = $('#' + n);
    input.addEventListener('input', () => {
      if (n === 'loginId') input.value = input.value.toLowerCase();   // 대문자는 소문자로 바꿔 줘요
      $('#loginAlert').textContent = '';
      if (f(n).classList.contains('invalid')) show(n);               // 오류가 뜬 뒤에는 고치는 즉시 지워요
    });
    input.addEventListener('blur', () => { touched[n] = true; show(n); });   // 칸을 벗어날 때 처음 검사해요
  }

  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    let firstBad = null;
    for (const n of ['loginId', 'loginPw']) { touched[n] = true; if (!show(n, true) && !firstBad) firstBad = n; }
    if (firstBad) return $('#' + firstBad).focus();
    try {
      const me = await store.signIn(val('loginId').trim(), val('loginPw'));
      window.showOk(me);
    } catch (err) { $('#loginAlert').textContent = err.message; }
  });

  window.showOk = me => {
    $$('.who').forEach(w => w.textContent = me.nickname);
    showSection('ok');
  };
  $('#logout').addEventListener('click', async () => { await store.signOut(); location.hash = ''; window.route(); });
  $('#goWithdraw').addEventListener('click', () => { location.hash = '#withdraw'; });
})();
