/* 로그인 동작: 입력 검증, 로그인 처리(데모) */
const touched = {};
const rules = {
  email: () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('email')) ? '' : '올바른 이메일 형식이 아니에요.',
  pw: () => ''   // 비밀번호는 비어 있는지만 확인해요
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
for (const n of ['email', 'pw']) {
  const input = $('#' + n);
  input.addEventListener('input', () => { touched[n] = true; $('#alert').textContent = ''; show(n); });
  input.addEventListener('blur', () => show(n));
}

$('#form').addEventListener('submit', e => {
  e.preventDefault();
  let firstBad = null;
  for (const n of ['email', 'pw']) { touched[n] = true; if (!show(n, true) && !firstBad) firstBad = n; }
  if (firstBad) return $('#' + firstBad).focus();
  // 데모: 비밀번호가 8자 미만이면 로그인 실패로 처리
  if (val('pw').length < 8) { $('#alert').textContent = '이메일 또는 비밀번호가 맞지 않아요.'; return; }
  $('#login').hidden = true;
  $('#ok').hidden = false;
});
