/* Supabase 연결: 회원가입·로그인을 실제로 저장해요
   - URL과 publishable 키는 화면 코드에 넣어도 되는 "공개용" 값이에요.
   - secret / service_role 키는 절대 여기에 넣지 마세요. */
const SUPABASE_URL = 'https://whuvrhhoqjkgnxpurqrc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_u8-Uu1LupuKpoFu6GLhW-Q_6ZbtulF2';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* Supabase가 영어로 주는 오류를 한국어 문구로 바꿔요 */
function sbMessage(error) {
  const m = (error && error.message || '').toLowerCase();
  if (m.includes('invalid login credentials')) return '이메일 또는 비밀번호가 맞지 않아요.';
  if (m.includes('email not confirmed')) return '메일함에서 인증 링크를 먼저 눌러 주세요.';
  if (m.includes('already registered') || m.includes('already been registered')) return '이미 가입된 이메일이에요.';
  if (m.includes('rate limit') || m.includes('security purposes')) return '잠시 후에 다시 시도해 주세요.';
  if (m.includes('password')) return '비밀번호 조건이 맞지 않아요.';
  return '문제가 생겼어요. 잠시 후 다시 시도해 주세요.';
}
