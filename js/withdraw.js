/* 탈퇴: 사유(선택) → 30일 보관 선택 → 완료. 3번 누르면 끝나고, 붙잡지 않아요 */
(() => {
  const REASONS = [
    { text: '알림이 너무 많이 와요', tip: '받고 싶은 알림만 골라서 받을 수 있어요.', link: '알림 설정 바로 가기' },
    { text: '개인정보가 걱정돼요', tip: '마케팅 동의를 끄거나, 내 정보를 확인할 수 있어요.', link: '개인정보 관리 바로 가기' },
    { text: '당분간 쓸 일이 없어요 (이사·결혼 등이 끝났어요)', tip: '탈퇴 대신 계정을 쉬게 할 수 있어요. 알림과 광고는 멈추고 내역은 그대로 남아요.', link: '잠시 쉬어가기' },
    { text: '배송·교환·환불이 불만족스러웠어요', tip: '불편하셨던 점을 알려 주시면 빠르게 도와드릴게요.', link: '1:1 문의하기' },
    { text: '원하는 상품이 없어요' },
    { text: '다른 계정으로 쓰고 있어요' },
    { text: '기타' }
  ];
  let reason = null;
  $('#reasons').insertAdjacentHTML('beforeend', REASONS.map((r, i) => `
    <label class="reason"><input type="radio" name="reason" value="${i}"><span>${r.text}</span></label>
    ${r.tip ? `<div class="solution" id="sol${i}" hidden><p>${r.tip}</p><a href="#" class="sol-link">${r.link} →</a></div>` : ''}`).join(''));
  $$('#reasons input').forEach(inp => inp.addEventListener('change', () => {
    reason = REASONS[+inp.value].text;
    $$('#reasons .solution').forEach(s => s.hidden = s.id !== 'sol' + inp.value);
  }));
  $$('.sol-link').forEach(a => a.addEventListener('click', e => e.preventDefault()));

  let setBack = () => {};
  window.startWithdraw = (me, backSetter) => {
    setBack = backSetter || setBack;
    reason = null; $$('#reasons input').forEach(i => i.checked = false); $$('#reasons .solution').forEach(s => s.hidden = true);
    showSection('w1', { back: true }); setBack(() => { location.hash = ''; });
  };
  $('#toW2').addEventListener('click', () => {
    showSection('w2', { back: true }); setBack(() => window.startWithdraw());
  });
  $('#doWithdraw').addEventListener('click', async () => {
    const keep = $('input[name=keep]:checked').value === '1';
    try {
      const r = await store.withdraw({ reason, keep });
      $('#keepText').textContent = keep ? `보관한 내역은 ${fmtDate(r.keepUntil)}까지 지켜 둘게요. 그 뒤에는 자동으로 지워져요.` : '모든 내역을 지웠어요.';
      showSection('w3'); setBack(null);
    } catch (e) { alert(e.message); }
  });
})();
