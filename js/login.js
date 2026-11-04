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

  /* 로그인 후: 고른 생활 이벤트에 맞춰 첫 문구를 바꿔요 */
  const OK_LEAD = {
    move: '이사 준비 중이시죠?<br>새집에 어울리는 수납·조명부터 골라 봤어요.',
    marry: '두 분의 첫 집을 위한<br>가구와 침구를 골라 봤어요.',
    own: '나만의 첫 공간에 딱 맞는<br>작은 가구부터 골라 봤어요.',
    baby: '아기와 함께할 공간을 위한<br>안전한 소품을 골라 봤어요.',
    browse: '요즘 많이 찾는 인기 상품부터 둘러보세요.'
  };
  window.showOk = me => {
    $$('.who').forEach(w => w.textContent = me.nickname);
    $('#okLead').innerHTML = OK_LEAD[me.lifeEvent] || '모아집에서 마음에 드는 공간을 찾아보세요.';
    showSection('ok');
    $('#accountLinks').hidden = false;
  };
  $('#startShop').addEventListener('click', () => alert('데모: 여기서 쇼핑 화면으로 이동해요.'));
  $('#showRecs').addEventListener('click', () => alert('데모: 여기서 추천 상품 목록으로 이동해요.'));
  $('#logout').addEventListener('click', async () => { await store.signOut(); location.hash = ''; window.route(); });
  $('#goWithdraw').addEventListener('click', () => { location.hash = '#withdraw'; });
})();
