/* 동작(액션): 단계 이동, 약관 선택, 입력 검증, 비밀번호 보기 */
const $ = s => document.querySelector(s);
const f = n => $(`.field[data-name="${n}"]`);
const val = id => $('#' + id).value;
const EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/></svg>';
document.querySelectorAll('.eye').forEach(b => b.innerHTML = EYE);

/* 단계 이동 */
function go(n) {
  [1, 2, 3].forEach(i => $('#s' + i).hidden = i !== n);
  [...$('#steps').children].forEach((li, i) => { li.className = i + 1 < n ? 'done' : i + 1 === n ? 'on' : ''; });
  $('#back').hidden = n !== 2;
  window.scrollTo(0, 0);
}
$('#back').addEventListener('click', () => go(1));

/* 1단계: 약관 (항목끼리 서로 영향 없음) */
const terms = [...document.querySelectorAll('.term')];
const reqTerms = terms.filter(t => t.dataset.req);
function syncTerms() {
  $('#all').checked = terms.every(t => t.checked);
  const ok = reqTerms.every(t => t.checked);
  $('#next1').disabled = !ok;
  $('#hint1').textContent = ok ? '' : '필수 약관에 동의하면 다음으로 넘어갈 수 있어요.';
}
$('#all').addEventListener('change', e => { terms.forEach(t => t.checked = e.target.checked); syncTerms(); });
terms.forEach(t => t.addEventListener('change', syncTerms));
$('#reqOnly').addEventListener('click', () => { terms.forEach(t => t.checked = !!t.dataset.req); syncTerms(); });
$('#reset').addEventListener('click', () => { terms.forEach(t => t.checked = false); syncTerms(); });
document.querySelectorAll('.view').forEach(a => a.addEventListener('click', e => e.preventDefault()));
$('#next1').addEventListener('click', () => go(2));

/* 2단계: 입력 검증 */
let nickOk = false;
const touched = {};
const rules = {
  email: () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('email')) ? '' : '올바른 이메일 형식이 아니에요.',
  pw: () => /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(val('pw')) ? '' : '8자 이상, 영문과 숫자를 함께 사용해 주세요.',
  pw2: () => val('pw2') === val('pw') ? '' : '비밀번호가 일치하지 않아요.',
  nick: () => val('nick').trim().length < 2 ? '닉네임은 2자 이상이에요.' : nickOk ? '' : '닉네임 중복확인을 해 주세요.'
};
const okText = { email: '', pw: '사용 가능한 비밀번호예요.', pw2: '비밀번호가 일치해요.', nick: '사용 가능한 닉네임이에요.' };
const hint = { pw: '8자 이상, 영문과 숫자를 함께 사용해 주세요.' };

function show(name, force) {
  const el = f(name), msg = el.querySelector('.msg'), empty = val(name) === '';
  if (!force && (!touched[name] || empty)) { el.classList.remove('invalid', 'valid'); msg.textContent = hint[name] || ''; return true; }
  const err = empty ? '필수 입력 항목이에요.' : rules[name]();
  el.classList.toggle('invalid', !!err);
  el.classList.toggle('valid', !err);
  msg.textContent = err || okText[name];
  return !err;
}
for (const n of ['email', 'pw', 'pw2', 'nick']) {
  const input = $('#' + n);
  input.addEventListener('input', () => {
    touched[n] = true;
    if (n === 'nick') nickOk = false;
    show(n);
    if (n === 'pw' && touched.pw2) show('pw2');
  });
  input.addEventListener('blur', () => show(n));
}
document.querySelectorAll('.eye').forEach(b => b.addEventListener('click', () => {
  const i = $('#' + b.dataset.target), reveal = i.type === 'password';
  i.type = reveal ? 'text' : 'password';
  b.innerHTML = reveal ? EYE_OFF : EYE;
  b.setAttribute('aria-pressed', reveal);
  b.setAttribute('aria-label', reveal ? '비밀번호 숨기기' : '비밀번호 보기');
}));
$('#nickCheck').addEventListener('click', () => {
  touched.nick = true;
  const v = val('nick').trim(), el = f('nick'), msg = el.querySelector('.msg');
  if (v.length < 2) { nickOk = false; show('nick', true); return; }
  if (['admin', '관리자', 'moajip'].includes(v.toLowerCase())) {
    nickOk = false; el.classList.add('invalid'); el.classList.remove('valid'); msg.textContent = '이미 사용 중인 닉네임이에요.'; return;
  }
  nickOk = true; show('nick', true);
});
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  let firstBad = null;
  for (const n of ['email', 'pw', 'pw2', 'nick']) { touched[n] = true; if (!show(n, true) && !firstBad) firstBad = n; }
  if (firstBad) return $('#' + firstBad).focus();
  $('#who').textContent = val('nick').trim();
  go(3);
});
