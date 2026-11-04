/* 그림: 정보 입력 중 지어지는 작은 집 · 생활 이벤트별 문 장면
   색은 모두 CSS 클래스(.hs-*, .dr-*)로 칠해요 → css/flow.css 에서 토큰을 써요 */
const LIFE_EVENTS = [
  { key: 'move',   emoji: '🚚', label: '이사를 해요',            lead: '새집을 채울 준비, 모아집이 도와드릴게요.',            back: '새집이네요! 담아 두셨던 것들부터 꺼내 볼까요?' },
  { key: 'marry',  emoji: '💍', label: '결혼을 해요',            lead: '두 분의 첫 집을 함께 꾸며 볼까요?',                  back: '결혼 축하드려요!<br>찜해 두셨던 것들, 이제 둘이 함께 봐요.' },
  { key: 'own',    emoji: '🔑', label: '나만의 공간이 생겼어요', lead: '나만의 첫 공간, 하나씩 채워 봐요.',                  back: '나만의 공간이 생겼네요.<br>찜해 두셨던 것들이 잘 어울릴 거예요.' },
  { key: 'baby',   emoji: '👶', label: '아기를 맞이해요',        lead: '아기와 함께할 공간을 준비해 봐요.',                  back: '아기 맞을 준비,<br>담아 두셨던 장바구니부터 살펴볼까요?' },
  { key: 'browse', emoji: '👀', label: '그냥 구경할래요',        lead: '모아집에서 마음에 드는 공간을 찾아보세요.',          back: '두고 가신 것들을 챙겨 뒀어요.<br>불러올 항목을 골라 주세요.' }
];

/* 집 조각: 1 기초 · 2 문패 · 3 자물쇠 문 · 4 창문 · 5 지붕
   done = 다 지은 조각 수, cur = 지금 짓는 조각 */
function houseSVG(done, cur) {
  const c = i => i <= done ? 'done' : i === cur ? 'cur' : 'todo';
  return `<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
    <path class="hs hs-roof ${c(5)}" d="M6 24 24 8 42 24"/>
    <rect class="hs hs-wall ${c(1)}" x="10" y="22" width="28" height="20"/>
    <rect class="hs hs-floor ${c(1)}" x="7" y="42" width="34" height="3" rx="1.5"/>
    <rect class="hs hs-plate ${c(2)}" x="19" y="25" width="10" height="3.5" rx="1"/>
    <rect class="hs hs-door ${c(3)}" x="20" y="31" width="8" height="11" rx="1"/>
    ${done >= 3 ? '<circle class="hs-knob" cx="26" cy="37" r="1.2"/>' : ''}
    <rect class="hs hs-window ${c(4)}" x="31" y="28" width="5" height="5" rx=".8"/>
    ${done >= 4 ? '<path class="hs-cross" d="M33.5 28v5M31 30.5h5"/>' : ''}
  </svg>`;
}

/* 문 장면: 문틀 · 안쪽 불빛 · 열리는 문 · 이벤트별 장식 */
function doorSceneHTML(key) {
  const deco = {
    move: `<svg class="dr-deco dr-boxes" viewBox="0 0 314 176"><g class="dr-box"><rect x="36" y="130" width="46" height="38" rx="3"/><path d="M36 141h46"/></g><g class="dr-box"><rect x="42" y="102" width="34" height="28" rx="3"/><path d="M42 110h34"/></g><g class="dr-box"><rect x="232" y="130" width="46" height="38" rx="3"/><path d="M232 141h46"/></g></svg>`,
    marry: `<svg class="dr-deco dr-hearts" viewBox="0 0 314 176"><path d="M145 16s-7-4.5-7-8.8c0-2.3 1.8-4.2 4-4.2 1.3 0 2.4.7 3 1.7.6-1 1.7-1.7 3-1.7 2.2 0 4 1.9 4 4.2 0 4.3-7 8.8-7 8.8Z"/><path d="M169 16s-7-4.5-7-8.8c0-2.3 1.8-4.2 4-4.2 1.3 0 2.4.7 3 1.7.6-1 1.7-1.7 3-1.7 2.2 0 4 1.9 4 4.2 0 4.3-7 8.8-7 8.8Z"/></svg>`,
    own: `<svg class="dr-deco dr-key" viewBox="0 0 44 20"><circle cx="9" cy="10" r="7"/><path d="M16 10h24M33 10v6M39 10v5"/></svg>`,
    baby: '', browse: ''
  }[key] || '';
  const onLeaf = {
    marry: `<svg class="dr-wreath" viewBox="0 0 40 44"><circle cx="20" cy="20" r="14"/><circle class="dr-berry" cx="20" cy="7" r="2.5"/><circle class="dr-berry" cx="31" cy="27" r="2.5"/><circle class="dr-berry" cx="9" cy="27" r="2.5"/></svg>`,
    baby: `<svg class="dr-shoes" viewBox="0 0 32 36"><path class="dr-string" d="M16 0v7M6 7h20"/><path class="dr-shoe pink" d="M4 7v11c0 6 1.5 10 6.5 12.5 3 1.5 4.5-1.5 3.5-4.5l-1.5-5V7"/><path class="dr-shoe blue" d="M18 7v11c0 6 1.5 10 6.5 12.5 3 1.5 4.5-1.5 3.5-4.5l-1.5-5V7"/></svg>`,
    browse: `<span class="dr-plate">모아집</span>`
  }[key] || '';
  return `<div class="dr-frame">
      <div class="dr-light"></div>
      <div class="dr-leaf"><span class="dr-panel"></span><span class="dr-panel"></span><span class="dr-knob"></span>${onLeaf}</div>
    </div>
    <div class="dr-glow"></div><div class="dr-mat"></div>${deco}`;
}
