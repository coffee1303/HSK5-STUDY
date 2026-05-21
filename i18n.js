// UI 다국어 문자열 (Korean / English)
const I18N = {
  ko: {
    siteTitle: "HSK 5급 단어 공부",
    subtitle: "기초(1~4급) 1193단어 · 5급 1298단어",

    // 메뉴
    menuStudyBasicBig: "기초 단어 학습",
    menuStudyBasicSmall: "HSK 1~4급 · {count}단어",
    menuStudy5Big: "5급 단어 학습",
    menuStudy5Small: "HSK 5급 · {count}단어",
    menuQuizBasicBig: "기초 단어 퀴즈",
    menuQuizBasicSmall: "HSK 1~4급",
    menuQuiz5Big: "5급 단어 퀴즈",
    menuQuiz5Small: "HSK 5급",
    menuReviewBig: "오답 복습",
    menuReviewSmall: "틀린 단어 {count}개",
    menuSettingsBig: "설정",
    menuSettingsSmall: "하루 학습 단어 수: {count}개",

    // 공통
    back: "← 메인",
    next: "다음 →",
    prev: "← 이전",
    done: "완료 ✓",
    main: "메인으로",

    // 학습/퀴즈
    score: "점수",
    correct: "정답",
    wrong: "오답",
    exampleLabel: "예문",
    exampleEmpty: "예문은 향후 추가될 예정입니다.",
    audioLabel: "발음 듣기",
    exampleAudioLabel: "예문 발음 듣기",
    studyLevel: "HSK {level}",

    // 결과
    resultTitle: "퀴즈 완료",
    resultCorrect: "맞은 개수",
    resultRate: "정답률",
    resultWrongAdded: "오답 노트 추가",
    resultUnitCount: "{count}개",

    // 오답 복습
    reviewTitle: "오답 복습",
    reviewQuizBtn: "오답으로 퀴즈 풀기",
    reviewClearBtn: "전체 삭제",
    reviewEmpty: "오답 노트가 비어있습니다.<br>퀴즈에서 틀린 단어가 여기에 모입니다.",
    reviewItemRemove: "삭제",

    // 설정
    settingsTitle: "설정",
    settingsDaily: "하루 학습 단어 수",
    settingsDailyHint: "한 번에 공부할 단어 수입니다",
    settingsCountOption: "{count}개",
    settingsDirection: "퀴즈 방향",
    settingsDirHanziMeaning: "한자 → 뜻 (한자를 보고 뜻 고르기)",
    settingsDirMeaningHanzi: "뜻 → 한자 (뜻을 보고 한자 고르기)",
    settingsAutoSpeak: "학습 시 자동 발음 재생",
    settingsAutoSpeakOn: "켜기 (단어가 바뀔 때 자동 재생)",
    settingsAutoSpeakOff: "끄기 (🔊 버튼 눌렀을 때만 재생)",
    settingsAutoSpeakHint: "Web Speech API 사용. 브라우저에 중국어 음성이 설치돼 있어야 합니다.",
    settingsResetLabel: "학습 진도 초기화",
    settingsResetBtn: "학습한 단어 기록 초기화",
    settingsResetHint: "학습한 단어를 다시 처음부터 보고 싶을 때 사용하세요",
    settingsLanguage: "언어 (Language)",
    settingsLanguageHint: "사이트 표시 언어를 선택하세요",
    settingsSave: "저장",

    // 알림/확인
    alertSpeechNotSupported: "이 브라우저는 음성 합성을 지원하지 않습니다.",
    alertInAppBrowser: "카카오톡·페이스북·인스타그램 등의 인앱 브라우저에서는 음성 재생이 지원되지 않습니다. 우측 상단 메뉴에서 'Chrome으로 열기' 또는 'Safari로 열기'를 선택해주세요.",
    alertNoChineseVoice: "이 기기에 중국어 음성이 설치되어 있지 않아 발음을 재생할 수 없습니다.\n\n[설정 방법]\n• Android: 설정 > 시스템 > 언어 및 입력 > 텍스트 음성 변환(TTS) > 중국어 추가\n• iPhone: 설정 > 손쉬운 사용 > 음성 콘텐츠 > 음성 > 중국어 추가",
    alertNoStudyWords: "학습할 단어가 없습니다.",
    alertNoQuizWords: "퀴즈를 만들 단어가 없습니다.",
    confirmClearWrong: "오답 노트 {count}개를 모두 삭제할까요?",
    alertSelectCount: "학습 단어 수를 선택해주세요.",
    alertSaved: "저장되었습니다.",
    confirmResetProgress: "학습한 단어 기록을 모두 초기화할까요? (오답 노트는 유지됩니다)",
    alertReset: "초기화되었습니다.",
    alertVocabLoadFailed: "vocabulary.js 파일을 불러오지 못했습니다.",
    quizCorrectFeedback: "정답!",
    quizWrongFeedback: "오답! 정답: {hanzi} ({pinyin}) - {meaning}",
  },

  en: {
    siteTitle: "HSK 5 Vocabulary Study",
    subtitle: "Basic (HSK 1~4): 1,193 words · HSK 5: 1,298 words",

    // Menu
    menuStudyBasicBig: "Study Basic Vocabulary",
    menuStudyBasicSmall: "HSK 1~4 · {count} words",
    menuStudy5Big: "Study HSK 5 Vocabulary",
    menuStudy5Small: "HSK 5 · {count} words",
    menuQuizBasicBig: "Basic Vocabulary Quiz",
    menuQuizBasicSmall: "HSK 1~4",
    menuQuiz5Big: "HSK 5 Vocabulary Quiz",
    menuQuiz5Small: "HSK 5",
    menuReviewBig: "Review Mistakes",
    menuReviewSmall: "{count} wrong words",
    menuSettingsBig: "Settings",
    menuSettingsSmall: "Words per session: {count}",

    // Common
    back: "← Home",
    next: "Next →",
    prev: "← Prev",
    done: "Done ✓",
    main: "Back to Home",

    // Study/Quiz
    score: "Score",
    correct: "Correct",
    wrong: "Wrong",
    exampleLabel: "Example",
    exampleEmpty: "English example translation coming soon.",
    audioLabel: "Play pronunciation",
    exampleAudioLabel: "Play example pronunciation",
    studyLevel: "HSK {level}",

    // Result
    resultTitle: "Quiz Complete",
    resultCorrect: "Correct",
    resultRate: "Accuracy",
    resultWrongAdded: "Added to mistakes",
    resultUnitCount: "{count}",

    // Review
    reviewTitle: "Review Mistakes",
    reviewQuizBtn: "Quiz on mistakes",
    reviewClearBtn: "Clear all",
    reviewEmpty: "No mistakes saved yet.<br>Words you get wrong in quizzes will appear here.",
    reviewItemRemove: "Remove",

    // Settings
    settingsTitle: "Settings",
    settingsDaily: "Words per session",
    settingsDailyHint: "Number of words per study session",
    settingsCountOption: "{count}",
    settingsDirection: "Quiz direction",
    settingsDirHanziMeaning: "Hanzi → Meaning (see hanzi, choose meaning)",
    settingsDirMeaningHanzi: "Meaning → Hanzi (see meaning, choose hanzi)",
    settingsAutoSpeak: "Auto-play pronunciation while studying",
    settingsAutoSpeakOn: "On (auto-play on each new word)",
    settingsAutoSpeakOff: "Off (only when 🔊 button is clicked)",
    settingsAutoSpeakHint: "Uses Web Speech API. Chinese voice must be installed in your browser.",
    settingsResetLabel: "Reset study progress",
    settingsResetBtn: "Reset learned words",
    settingsResetHint: "Use this if you want to study all words from the beginning again",
    settingsLanguage: "Language (언어)",
    settingsLanguageHint: "Choose the display language for this site",
    settingsSave: "Save",

    // Alerts/confirms
    alertSpeechNotSupported: "Your browser does not support speech synthesis.",
    alertInAppBrowser: "Speech playback is not supported in in-app browsers (KakaoTalk, Facebook, Instagram, etc.). Please tap the menu in the top-right corner and choose 'Open in Chrome' or 'Open in Safari'.",
    alertNoChineseVoice: "No Chinese voice is installed on this device, so pronunciation cannot be played.\n\n[How to enable]\n• Android: Settings > System > Languages & input > Text-to-speech > Add Chinese\n• iPhone: Settings > Accessibility > Spoken Content > Voices > Add Chinese",
    alertNoStudyWords: "No words available for studying.",
    alertNoQuizWords: "No words available for the quiz.",
    confirmClearWrong: "Delete all {count} mistakes from the list?",
    alertSelectCount: "Please select the number of words.",
    alertSaved: "Saved.",
    confirmResetProgress: "Reset all learned word records? (Mistakes list will be kept)",
    alertReset: "Progress has been reset.",
    alertVocabLoadFailed: "Failed to load vocabulary.js.",
    quizCorrectFeedback: "Correct!",
    quizWrongFeedback: "Wrong! Answer: {hanzi} ({pinyin}) - {meaning}",
  },

  ja: {
    siteTitle: "HSK 5級 単語学習",
    subtitle: "基礎(HSK 1~4): 1,193単語 · HSK 5: 1,298単語",

    // メニュー
    menuStudyBasicBig: "基礎単語学習",
    menuStudyBasicSmall: "HSK 1~4 · {count}単語",
    menuStudy5Big: "HSK 5単語学習",
    menuStudy5Small: "HSK 5 · {count}単語",
    menuQuizBasicBig: "基礎単語クイズ",
    menuQuizBasicSmall: "HSK 1~4",
    menuQuiz5Big: "HSK 5単語クイズ",
    menuQuiz5Small: "HSK 5",
    menuReviewBig: "間違い直し",
    menuReviewSmall: "間違えた単語 {count}個",
    menuSettingsBig: "設定",
    menuSettingsSmall: "1日の学習単語数: {count}個",

    // 共通
    back: "← ホーム",
    next: "次へ →",
    prev: "← 前へ",
    done: "完了 ✓",
    main: "ホームに戻る",

    // 学習/クイズ
    score: "スコア",
    correct: "正解",
    wrong: "不正解",
    exampleLabel: "例文",
    exampleEmpty: "日本語の例文翻訳は今後追加予定です。",
    audioLabel: "発音を聞く",
    exampleAudioLabel: "例文の発音を聞く",
    studyLevel: "HSK {level}",

    // 結果
    resultTitle: "クイズ完了",
    resultCorrect: "正解数",
    resultRate: "正答率",
    resultWrongAdded: "間違い直しに追加",
    resultUnitCount: "{count}個",

    // 間違い直し
    reviewTitle: "間違い直し",
    reviewQuizBtn: "間違えた単語でクイズ",
    reviewClearBtn: "すべて削除",
    reviewEmpty: "間違い直しリストは空です。<br>クイズで間違えた単語がここに集まります。",
    reviewItemRemove: "削除",

    // 設定
    settingsTitle: "設定",
    settingsDaily: "1日の学習単語数",
    settingsDailyHint: "1回の学習で勉強する単語数です",
    settingsCountOption: "{count}個",
    settingsDirection: "クイズの方向",
    settingsDirHanziMeaning: "漢字 → 意味 (漢字を見て意味を選ぶ)",
    settingsDirMeaningHanzi: "意味 → 漢字 (意味を見て漢字を選ぶ)",
    settingsAutoSpeak: "学習時の自動発音再生",
    settingsAutoSpeakOn: "オン (単語が変わるとき自動再生)",
    settingsAutoSpeakOff: "オフ (🔊ボタンを押したときのみ再生)",
    settingsAutoSpeakHint: "Web Speech APIを使用。ブラウザに中国語音声がインストールされている必要があります。",
    settingsResetLabel: "学習進捗のリセット",
    settingsResetBtn: "学習した単語の記録をリセット",
    settingsResetHint: "学習した単語を最初から見直したいときに使用してください",
    settingsLanguage: "言語 (Language)",
    settingsLanguageHint: "サイトの表示言語を選択してください",
    settingsSave: "保存",

    // アラート/確認
    alertSpeechNotSupported: "このブラウザは音声合成をサポートしていません。",
    alertInAppBrowser: "カカオトーク・Facebook・Instagramなどのアプリ内ブラウザでは音声再生がサポートされていません。右上のメニューから「Chromeで開く」または「Safariで開く」を選択してください。",
    alertNoChineseVoice: "この端末には中国語の音声が入っていないため、発音を再生できません。\n\n[設定方法]\n• Android: 設定 > システム > 言語と入力 > テキスト読み上げ(TTS) > 中国語を追加\n• iPhone: 設定 > アクセシビリティ > 読み上げコンテンツ > 声 > 中国語を追加",
    alertNoStudyWords: "学習する単語がありません。",
    alertNoQuizWords: "クイズを作成する単語がありません。",
    confirmClearWrong: "間違い直しリスト {count}個をすべて削除しますか？",
    alertSelectCount: "学習単語数を選択してください。",
    alertSaved: "保存しました。",
    confirmResetProgress: "学習した単語の記録をすべてリセットしますか？(間違い直しリストは保持されます)",
    alertReset: "リセットしました。",
    alertVocabLoadFailed: "vocabulary.jsファイルを読み込めませんでした。",
    quizCorrectFeedback: "正解！",
    quizWrongFeedback: "不正解！ 正解: {hanzi} ({pinyin}) - {meaning}",
  },
};

function t(key, vars) {
  const lang = (typeof state !== 'undefined' && state.settings && state.settings.language) || 'ko';
  const dict = I18N[lang] || I18N.ko;
  let s = dict[key] || I18N.ko[key] || key;
  if (vars) {
    for (const k in vars) s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
  }
  return s;
}
