# UXUI-Sign-up
# 모아집 회원가입

가상의 인테리어 쇼핑몰 "모아집"의 회원가입·로그인 화면이에요.

- 회원가입(`index.html`): 시작(가입 방법 선택) → 약관 동의 → 정보 입력 → 가입 완료
- 로그인(`login.html`)

## 구조

```
index.html              회원가입 마크업
login.html              로그인 마크업
css/tokens/             디자인 시스템 토큰 (값만 정의)
  colors.css            글자색 · 배경색 · 테두리색 (팔레트 + 용도별 색상)
  typography.css        글꼴 · 크기 · 굵기 · 줄 간격 · 자간
  spacing.css           간격
  radius.css            모서리 둥글기
  effects.css           그림자 · 포커스 링
  sizes.css             컨트롤 높이 · 아이콘 · 레이아웃 폭
css/style.css           컴포넌트 스타일 (토큰 변수만 사용)
js/common.js            공통: 선택자 도우미, 비밀번호 보기
js/actions.js           회원가입 동작: 단계 이동, 약관 선택, 입력 검증
js/login.js             로그인 동작: 입력 검증, 로그인 처리(데모)
```

## 규칙

- `style.css`에는 색상·글꼴·간격 값을 직접 쓰지 않고 `var(--...)` 토큰만 써요.
- 색을 바꾸려면 `css/tokens/colors.css`의 팔레트 값만 고치면 돼요.
- 폴더째로 열거나 배포해야 스타일과 동작이 적용돼요.
