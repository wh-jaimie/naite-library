# 엄마표영어 스터디 — 독립 웹앱 세팅 (GitHub Pages + Supabase)

GitHub Pages(정적 프론트) + Supabase(DB/Auth/KPI) 조합. Claude 없이 독립적으로 동작한다.

## 1. Supabase 프로젝트 만들기 (본인이)
1. https://supabase.com 가입 → **New project** 생성 (Region은 `Northeast Asia (Seoul)` 권장)
2. 프로젝트 생성 후 **Project Settings → API** 에서 두 값 확인:
   - **Project URL** (예: `https://abcd1234.supabase.co`)
   - **anon public key** (긴 문자열 — 공개해도 되는 키. RLS로 보호됨)
   > ⚠️ **service_role key 는 절대** 알려주거나 커밋하지 말 것. anon key만 사용.

## 2. DB 만들기
1. Supabase → **SQL Editor** → New query
2. `schema.sql` 을 붙여넣기. 관리자 이메일은 `is_admin()` 안에 `jabbaek@gmail.com` 로 설정돼 있음(다른 이메일이면 그 주소만 수정). 이 이메일로 로그인한 사람만 편집 가능.
   > 저장 시 `row-level security policy` 오류가 나면, 이메일이 안 맞는 것 → `fix_admin.sql` 을 실행해 바로잡는다.
3. 실행(Run).
4. 다시 New query → `seed.sql` 붙여넣고 실행 (24주제 120권 입력).

## 3. 관리자 로그인 설정 (이메일 + 비밀번호)
매직링크 대신 **비밀번호로 바로 로그인**하도록 바꿨다. 관리자 계정을 한 번만 만들면 된다.
1. Supabase → **Authentication → Providers → Email** 활성화 (Confirm email 은 꺼도 됨).
2. Supabase → **Authentication → Users → Add user → Create new user**
   - Email: `jabbaek@gmail.com` (config.js 의 `ADMIN_EMAIL` 과 동일하게)
   - Password: 원하는 비밀번호 입력
   - **Auto Confirm User: 켜기** (메일 확인 없이 바로 사용)
3. 끝. `docs/study/admin.html` 에서 이 이메일+비밀번호로 로그인하면 된다.
   (이메일은 미리 채워져 있어 **비밀번호만** 치면 됨. `is_admin()` 이 이메일로 편집 권한을 판별.)
   > 비밀번호를 바꾸려면 같은 화면(Users)에서 해당 사용자 → **Reset password / Update**.

## 4. 프론트 연결
프로젝트 **URL + anon key + 관리자 이메일** 을 개발자(Claude)에게 전달하면
`docs/study/` 에 관리자 페이지·공유 페이지·KPI 대시보드를 만들어 커밋한다.
연결값은 `docs/study/config.js` 에 들어가며 anon key라 공개 커밋해도 안전하다.

## 구조 미리보기
```
docs/study/
  config.js     # SUPABASE_URL, SUPABASE_ANON_KEY (공개 가능)
  index.html    # 부모 공유 페이지 (이번 달 주제 5권 + 방법/활용/표현) + KPI 로깅
  admin.html    # 관리자: 로그인 → 주제별 내용 입력/발행 + KPI 대시보드
```

## KPI로 수집할 것 (events 테이블)
- `page_view` — 공유 페이지 방문 (주제·세션)
- `book_click` — 어떤 책을 눌러봤는지
- `section_view` — 읽어주는법/활용/표현 등 어디까지 봤는지
- `dwell` — 체류 시간
→ 관리자 KPI 대시보드에서 방문 수·인기 책·재방문 등으로 집계.
