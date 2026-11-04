/* Supabase 연결 정보
   - 두 값을 비워 두면 "데모 모드"로 동작해요. 가입 정보는 이 브라우저에만 저장돼요.
   - 지금은 모아집 Supabase 프로젝트가 연결돼 있어요. 비우면 데모 모드로 돌아가요.
   - Supabase 프로젝트의 Settings → API 에서 Project URL 과 anon(public)/publishable key 를 넣어요.
   - anon key 는 공개용 키라 저장소에 올려도 되지만, service_role key 는 절대 넣지 마세요. */
window.MOAJIP_CONFIG = {
  SUPABASE_URL: 'https://whuvrhhoqjkgnxpurqrc.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_u8-Uu1LupuKpoFu6GLhW-Q_6ZbtulF2'   // 공개용(publishable) 키
};
