/* 로그인 동작: 입력 검증, 로그인 처리(Supabase) — 회원가입 코드와 이름이 겹치지 않게 감쌌어요 */
(() => {
  const touched = {};
  const rules = {
    loginEmail: () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('loginEmail')) ? '' : '올바른 이메일 형식이 아니에요.',
    loginPw: () => ''   // 비밀번호는 비어 있는지만 확인해요
  };

  function show(name, force) {
    const el = f(name), msg = el.querySelector('.msg'), empty = val(name) === '';
    // 직접 입력을 시작하지 않았거나 비어 있으면 오류를 보이지 않음 (제출할 때만)
    if (!force && (!touched[name] || empty)) { el.classList.remove('invalid', 'valid'); msg.textContent = ''; return true; }
    const err = empty ? '필수 입력 항목이에요.' : rules[name]();
    el.classList.toggle('invalid', !!err);
    el.classList.remove('valid');
    msg.textContent = err;
    return !err;
  }
  for (const n of ['loginEmail', 'loginPw']) {
    const input = $('#' + n);
    input.addEventListener('input', () => { touched[n] = true; $('#loginAlert').textContent = ''; show(n); });
    input.addEventListener('blur', () => show(n));
  }

  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    let firstBad = null;
    for (const n of ['loginEmail', 'loginPw']) { touched[n] = true; if (!show(n, true) && !firstBad) firstBad = n; }
    if (firstBad) return $('#' + firstBad).focus();
    // Supabase에 이메일·비밀번호가 맞는지 물어봐요
    const { error } = await sb.auth.signInWithPassword({ email: val('loginEmail').trim(), password: val('loginPw') });
    if (error) { $('#loginAlert').textContent = sbMessage(error); return; }
    $('#login').hidden = true;
    $('#ok').hidden = false;
  });
})();
