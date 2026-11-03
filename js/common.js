/* 공통 동작: 선택자 도우미, 비밀번호 보기(눈 아이콘) — 가입·로그인 페이지에서 같이 써요 */
const $ = s => document.querySelector(s);
const f = n => $(`.field[data-name="${n}"]`);
const val = id => $('#' + id).value;
const EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/></svg>';
document.querySelectorAll('.eye').forEach(b => {
  b.innerHTML = EYE;
  b.addEventListener('click', () => {
    const i = $('#' + b.dataset.target), reveal = i.type === 'password';
    i.type = reveal ? 'text' : 'password';
    b.innerHTML = reveal ? EYE_OFF : EYE;
    b.setAttribute('aria-pressed', reveal);
    b.setAttribute('aria-label', reveal ? '비밀번호 숨기기' : '비밀번호 보기');
  });
});
