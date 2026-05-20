# HSK 5급 단어 공부 (HSK 5 Vocabulary Study)

HSK 1~5급 중국어 단어를 한국어 / 日本語 / English 로 학습할 수 있는 정적 웹사이트.

## ✨ 기능

- **2,491개 HSK 단어** (HSK 1~4 기초 1,193개 + HSK 5 1,298개)
- **3개 언어 지원** (한국어 / 日本語 / English) - 우측 상단 버튼으로 전환
- 각 단어: 한자(简体) + 병음 + 뜻 + 예문(한자/병음/번역)
- 4지선다 퀴즈, 자동 오답 노트, 오답 복습 퀴즈
- 중국어 발음 듣기 (Web Speech API)
- 하루 학습 단어 수, 퀴즈 방향, 자동 발음 재생 설정
- 모바일 반응형 디자인
- 진도는 브라우저 localStorage에 저장 (서버 불필요)

## 📁 구조

```
hsk-study/
├── index.html          # 메인 페이지
├── style.css           # 스타일
├── app.js              # 학습/퀴즈/설정 로직
├── i18n.js             # UI 다국어 문자열
├── vocabulary.js       # 단어 데이터 (한자/병음/영어)
├── translations.js     # 한국어 뜻
├── translations_ja.js  # 일본어 뜻
├── examples.js         # 한국어 예문
├── examples_en.js      # 영어 예문
└── examples_ja.js      # 일본어 예문
```

## 🚀 사용 방법

`index.html`을 브라우저에서 열기만 하면 됩니다. 서버나 빌드 도구 불필요.

## 📜 데이터 출처

- 단어 목록: [drkameleon/complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary) (HSK 2.0)
- 한국어/일본어 번역 및 예문: 직접 작성
