/* 공통 동작: 선택자 도우미, 비밀번호 보기(눈 아이콘), 팝업 열고 닫기 — 모든 화면에서 같이 써요 */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const f = n => $(`.field[data-name="${n}"]`);
const val = id => $('#' + id).value;
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/></svg>';
$$('.eye').forEach(b => {
  b.innerHTML = EYE;
  b.addEventListener('click', () => {
    const i = $('#' + b.dataset.target), reveal = i.type === 'password';
    i.type = reveal ? 'text' : 'password';
    b.innerHTML = reveal ? EYE_OFF : EYE;
    b.setAttribute('aria-pressed', reveal);
    b.setAttribute('aria-label', reveal ? '비밀번호 숨기기' : '비밀번호 보기');
  });
});

/* 팝업: 열면 첫 버튼으로 포커스, Tab 은 팝업 안에서만 돌고, Esc · 닫기 버튼은 onClose 를 불러요 */
const modal = (() => {
  let current = null, onClose = null, lastFocus = null;
  const focusables = el => [...el.querySelectorAll('button:not([disabled]),input:not([disabled]),[href]')].filter(n => n.offsetParent !== null);
  function open(id, closeHandler) {
    lastFocus = document.activeElement;
    current = $('#' + id); onClose = closeHandler || null;
    current.hidden = false; document.body.classList.add('modal-open');
    const first = focusables(current)[0]; if (first) first.focus();
  }
  function close(run = true) {
    if (!current) return;
    const cb = onClose; current.hidden = true; current = null; onClose = null;
    document.body.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    if (run && cb) cb();
  }
  document.addEventListener('keydown', e => {
    if (!current) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'Tab') {
      const list = focusables(current); if (!list.length) return;
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  $$('.modal [data-close]').forEach(b => b.addEventListener('click', () => close()));
  return { open, close };
})();

/* 화면 전환: 섹션 하나만 보여요 */
const SECTIONS = ['login', 'ok', 's1', 's2', 's3', 'w1', 'w2', 'w3'];
function showSection(id, { steps = null, back = false } = {}) {
  SECTIONS.forEach(s => $('#' + s).hidden = s !== id);
  $('#steps').hidden = steps === null;
  if (steps !== null) [...$('#steps').children].forEach((li, i) => { li.className = i + 1 < steps ? 'done' : i + 1 === steps ? 'on' : ''; });
  $('#back').hidden = !back;
  window.scrollTo(0, 0);
}
const fmtDate = t => { const d = new Date(t); return `${d.getMonth() + 1}월 ${d.getDate()}일`; };
