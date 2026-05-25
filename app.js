// HSK Study App
const KEY_SETTINGS = 'hsk-settings';
const KEY_WRONG = 'hsk-wrong';
const KEY_PROGRESS = 'hsk-progress';

const defaultSettings = {
  dailyCount: 20,
  quizDirection: 'hanzi-to-meaning',
  autoSpeak: 'off',
  language: 'ko',
  fontSize: 'm',
};

function applyFontSize(size) {
  const valid = ['s', 'm', 'l', 'xl'];
  const s = valid.includes(size) ? size : 'm';
  document.body.classList.remove('font-s', 'font-m', 'font-l', 'font-xl');
  document.body.classList.add('font-' + s);
}

function getMeaning(w) {
  const lang = state.settings.language || 'ko';
  if (lang === 'en') {
    return w.m;
  }
  if (lang === 'ja') {
    if (typeof TRANSLATIONS_JA !== 'undefined' && TRANSLATIONS_JA[w.h]) {
      return TRANSLATIONS_JA[w.h];
    }
    return w.m; // English fallback when Japanese translation is missing
  }
  // Korean (default)
  if (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[w.h]) {
    return TRANSLATIONS[w.h];
  }
  return w.m;
}

function applyI18n() {
  const counts = {
    menuStudyBasicSmall: VOCABULARY.basic.length,
    menuStudy5Small: VOCABULARY.hsk5.length,
    menuReviewSmall: state.wrong.length,
    menuSettingsSmall: state.settings.dailyCount,
  };
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const vars = (key in counts) ? { count: counts[key] } : undefined;
    if (key === 'reviewEmpty') {
      el.innerHTML = t(key, vars);
    } else {
      el.textContent = t(key, vars);
    }
  });
  document.querySelectorAll('[data-i18n-attr-title]').forEach(el => {
    el.title = t(el.dataset.i18nAttrTitle);
  });
  document.querySelectorAll('[data-i18n-attr-aria-label]').forEach(el => {
    el.setAttribute('aria-label', t(el.dataset.i18nAttrAriaLabel));
  });
  document.title = t('siteTitle');
  document.documentElement.lang = state.settings.language || 'ko';
}

function updateLangButtons() {
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === state.settings.language);
  });
}

function setLanguage(lang) {
  state.settings.language = lang;
  saveSettings();
  applyI18n();
  updateLangButtons();
  // Re-render current screen so dynamic content updates
  const active = document.querySelector('.screen.active');
  if (active) {
    const id = active.id;
    if (id === 'home') renderHome();
    else if (id === 'study') renderStudy();
    else if (id === 'quiz') renderQuiz();
    else if (id === 'review') renderReview();
    else if (id === 'settings') renderSettings();
  }
}

let _zhVoice = null;
let _voicesLoaded = false;
let _speechAlerted = false;

function _loadVoices() {
  if (!('speechSynthesis' in window)) return;
  const voices = speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return;
  _voicesLoaded = true;
  _zhVoice =
    voices.find(v => v.lang === 'zh-CN') ||
    voices.find(v => v.lang === 'zh-HK') ||
    voices.find(v => v.lang === 'zh-TW') ||
    voices.find(v => v.lang && v.lang.toLowerCase().startsWith('zh')) ||
    null;
}

if ('speechSynthesis' in window) {
  _loadVoices();
  if ('onvoiceschanged' in speechSynthesis) {
    speechSynthesis.addEventListener('voiceschanged', _loadVoices);
  }
}

function isInAppBrowser() {
  const ua = navigator.userAgent || '';
  return /KAKAOTALK|FB_IAB|FBAN|FBAV|Instagram|NAVER|Line\/|Daum|KAKAOSTORY|; wv\)/i.test(ua);
}

function speak(text, btnEl) {
  if (!('speechSynthesis' in window)) {
    if (!_speechAlerted) {
      alert(t(isInAppBrowser() ? 'alertInAppBrowser' : 'alertSpeechNotSupported'));
      _speechAlerted = true;
    }
    return;
  }
  if (!_voicesLoaded) _loadVoices();
  if (!_zhVoice) {
    if (!_speechAlerted) {
      alert(t(isInAppBrowser() ? 'alertInAppBrowser' : 'alertNoChineseVoice'));
      _speechAlerted = true;
    }
    return;
  }
  try { speechSynthesis.cancel(); } catch (e) {}
  const u = new SpeechSynthesisUtterance(text);
  u.voice = _zhVoice;
  u.lang = _zhVoice.lang || 'zh-CN';
  u.rate = 0.85;
  u.pitch = 1;
  if (btnEl) {
    btnEl.classList.add('speaking');
    u.onend = () => btnEl.classList.remove('speaking');
    u.onerror = () => btnEl.classList.remove('speaking');
  }
  speechSynthesis.speak(u);
}

const state = {
  settings: { ...defaultSettings },
  wrong: [],
  progress: { basic: [], hsk5: [] },
  studyWords: [],
  studyIndex: 0,
  studyMode: null,
  quizWords: [],
  quizIndex: 0,
  quizScore: 0,
  quizMode: null,
  quizAnswered: false,
};

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY_SETTINGS));
    if (s) state.settings = { ...defaultSettings, ...s };
  } catch {}
  try {
    const w = JSON.parse(localStorage.getItem(KEY_WRONG));
    if (Array.isArray(w)) state.wrong = w;
  } catch {}
  try {
    const p = JSON.parse(localStorage.getItem(KEY_PROGRESS));
    if (p && typeof p === 'object') {
      state.progress = { basic: p.basic || [], hsk5: p.hsk5 || [] };
    }
  } catch {}
}

function saveSettings() { localStorage.setItem(KEY_SETTINGS, JSON.stringify(state.settings)); }
function saveWrong() { localStorage.setItem(KEY_WRONG, JSON.stringify(state.wrong)); }
function saveProgress() { localStorage.setItem(KEY_PROGRESS, JSON.stringify(state.progress)); }

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#' + id).classList.add('active');
  window.scrollTo(0, 0);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickStudyWords(pool, poolKey, count) {
  const studiedSet = new Set(state.progress[poolKey]);
  const unstudied = pool.filter(w => !studiedSet.has(w.h));
  if (unstudied.length >= count) {
    return shuffle(unstudied).slice(0, count);
  }
  // not enough unstudied - mix in already-studied
  const remaining = count - unstudied.length;
  const studied = pool.filter(w => studiedSet.has(w.h));
  return shuffle(unstudied).concat(shuffle(studied).slice(0, remaining));
}

function pickQuizWords(pool, count) {
  return shuffle(pool).slice(0, count);
}

function renderHome() {
  applyI18n();
}

// ========= STUDY =========
function startStudy(mode) {
  state.studyMode = mode;
  const pool = mode === 'basic' ? VOCABULARY.basic : VOCABULARY.hsk5;
  const poolKey = mode === 'basic' ? 'basic' : 'hsk5';
  state.studyWords = pickStudyWords(pool, poolKey, state.settings.dailyCount);
  state.studyIndex = 0;
  if (state.studyWords.length === 0) {
    alert(t('alertNoStudyWords'));
    return;
  }
  showScreen('study');
  renderStudy();
}

function renderStudy() {
  const w = state.studyWords[state.studyIndex];
  $('#study-progress').textContent = `${state.studyIndex + 1} / ${state.studyWords.length}`;
  $('#study-level').textContent = t('studyLevel', { level: w.l });
  $('#study-hanzi').textContent = w.h;
  $('#study-pinyin').textContent = w.p;
  $('#study-meaning').textContent = getMeaning(w);
  setExampleEl($('#study-example'), w);
  $('#study-prev').disabled = state.studyIndex === 0;
  $('#study-next').textContent = state.studyIndex === state.studyWords.length - 1 ? t('done') : t('next');
  // mark word as studied
  const poolKey = state.studyMode === 'basic' ? 'basic' : 'hsk5';
  if (!state.progress[poolKey].includes(w.h)) {
    state.progress[poolKey].push(w.h);
    saveProgress();
  }
  // auto-speak
  if (state.settings.autoSpeak === 'on') {
    setTimeout(() => speak(w.h, $('#study-audio')), 200);
  }
}

function nextStudy() {
  if (state.studyIndex >= state.studyWords.length - 1) {
    showScreen('home');
    renderHome();
    return;
  }
  state.studyIndex++;
  renderStudy();
}

function prevStudy() {
  if (state.studyIndex > 0) {
    state.studyIndex--;
    renderStudy();
  }
}

// ========= QUIZ =========
function startQuiz(mode, customWords) {
  state.quizMode = mode;
  if (customWords) {
    state.quizWords = shuffle(customWords).slice(0, Math.min(customWords.length, state.settings.dailyCount));
  } else {
    const pool = mode === 'basic' ? VOCABULARY.basic : VOCABULARY.hsk5;
    state.quizWords = pickQuizWords(pool, state.settings.dailyCount);
  }
  state.quizIndex = 0;
  state.quizScore = 0;
  state.quizAnswered = false;
  if (state.quizWords.length === 0) {
    alert(t('alertNoQuizWords'));
    return;
  }
  showScreen('quiz');
  renderQuiz();
}

function renderQuiz() {
  state.quizAnswered = false;
  const w = state.quizWords[state.quizIndex];
  const direction = state.settings.quizDirection;
  $('#quiz-progress').textContent = `${state.quizIndex + 1} / ${state.quizWords.length}`;
  $('#quiz-score').textContent = state.quizScore;
  $('#quiz-level').textContent = t('studyLevel', { level: w.l });
  $('#quiz-next').classList.add('hidden');
  // reset card visual state
  const card = $('#quiz-card');
  card.classList.remove('correct', 'wrong');
  $('#quiz-reveal').classList.add('hidden');
  const badge = $('#quiz-result-badge');
  badge.classList.add('hidden');
  badge.classList.remove('correct', 'wrong');
  badge.textContent = '';

  if (direction === 'hanzi-to-meaning') {
    $('#quiz-hanzi').textContent = w.h;
    $('#quiz-hanzi').style.fontSize = '';
    $('#quiz-pinyin').textContent = w.p;
    $('#quiz-audio').style.display = '';
  } else {
    // show meaning, options are hanzi
    const meaning = getMeaning(w);
    $('#quiz-hanzi').textContent = meaning.length > 50 ? meaning.slice(0, 50) + '...' : meaning;
    $('#quiz-hanzi').style.fontSize = '24px';
    $('#quiz-pinyin').textContent = '';
    $('#quiz-audio').style.display = 'none';
  }

  // build options - 4 choices including correct
  const pool = state.quizMode === 'basic' ? VOCABULARY.basic : (state.quizMode === 'hsk5' ? VOCABULARY.hsk5 : [...VOCABULARY.basic, ...VOCABULARY.hsk5]);
  const others = pool.filter(x => x.h !== w.h);
  const distractors = shuffle(others).slice(0, 3);
  const choices = shuffle([w, ...distractors]);

  const optsEl = $('#quiz-options');
  optsEl.innerHTML = '';
  choices.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    if (direction === 'hanzi-to-meaning') {
      btn.textContent = getMeaning(c);
    } else {
      btn.textContent = `${c.h} (${c.p})`;
    }
    btn.onclick = () => answerQuiz(c, w, btn);
    optsEl.appendChild(btn);
  });
}

function getExampleTranslation(w, lang) {
  if (lang === 'en') {
    if (typeof EXAMPLES_EN !== 'undefined' && EXAMPLES_EN[w.h]) return EXAMPLES_EN[w.h];
    return null;
  }
  if (lang === 'ja') {
    if (typeof EXAMPLES_JA !== 'undefined' && EXAMPLES_JA[w.h]) return EXAMPLES_JA[w.h];
    return null;
  }
  // Korean
  if (typeof EXAMPLES !== 'undefined' && EXAMPLES[w.h]) return EXAMPLES[w.h].k;
  return null;
}

function getExampleInnerHTML(w) {
  const lang = state.settings.language || 'ko';
  if (typeof EXAMPLES !== 'undefined' && EXAMPLES[w.h]) {
    const ex = EXAMPLES[w.h];
    const escapedC = ex.c.replace(/"/g, '&quot;');
    const translation = getExampleTranslation(w, lang);
    const translationHTML = translation ? `<div class="ex-ko">${translation}</div>` : '';
    return `<div class="ex-header">
        <span class="ex-label">${t('exampleLabel')}</span>
        <button class="ex-audio-btn" data-text="${escapedC}" title="${t('exampleAudioLabel')}" aria-label="${t('exampleAudioLabel')}">🔊</button>
      </div>
      <div class="ex-cn">${ex.c}</div>
      <div class="ex-py">${ex.p}</div>
      ${translationHTML}`;
  }
  return null;
}

function setExampleEl(el, w) {
  const html = getExampleInnerHTML(w);
  if (html) {
    el.className = 'reveal-example';
    el.innerHTML = html;
  } else {
    el.className = 'reveal-example empty';
    el.textContent = t('exampleEmpty');
  }
}

function answerQuiz(chosen, correct, btn) {
  if (state.quizAnswered) return;
  state.quizAnswered = true;
  const isCorrect = chosen.h === correct.h;
  // highlight all options
  $$('.quiz-option').forEach(b => {
    b.disabled = true;
    const label = b.textContent;
    if (label.startsWith(correct.h + ' ') || label === getMeaning(correct)) {
      b.classList.add('correct');
    }
  });
  // color the card
  const card = $('#quiz-card');
  card.classList.add(isCorrect ? 'correct' : 'wrong');
  // show result badge
  const badge = $('#quiz-result-badge');
  badge.classList.remove('hidden');
  badge.classList.add(isCorrect ? 'correct' : 'wrong');
  badge.textContent = isCorrect ? t('correct') : t('wrong');
  // show reveal: word info (if was hidden) + example
  // ensure hanzi & pinyin are shown for meaning->hanzi direction
  if (state.settings.quizDirection === 'meaning-to-hanzi') {
    $('#quiz-hanzi').textContent = correct.h;
    $('#quiz-hanzi').style.fontSize = '';
    $('#quiz-pinyin').textContent = correct.p;
    $('#quiz-audio').style.display = '';
  }
  $('#quiz-reveal-meaning').textContent = getMeaning(correct);
  setExampleEl($('#quiz-reveal-example'), correct);
  $('#quiz-reveal').classList.remove('hidden');

  if (!isCorrect) {
    btn.classList.add('wrong');
    if (!state.wrong.find(x => x.h === correct.h)) {
      state.wrong.push(correct);
      saveWrong();
    }
  } else {
    state.quizScore++;
    const idx = state.wrong.findIndex(x => x.h === correct.h);
    if (idx >= 0) {
      state.wrong.splice(idx, 1);
      saveWrong();
    }
  }
  $('#quiz-score').textContent = state.quizScore;
  $('#quiz-next').classList.remove('hidden');
}

function nextQuiz() {
  if (state.quizIndex >= state.quizWords.length - 1) {
    // show result
    showResult();
    return;
  }
  state.quizIndex++;
  // reset font size if changed
  $('#quiz-hanzi').style.fontSize = '';
  renderQuiz();
}

function showResult() {
  const total = state.quizWords.length;
  const correct = state.quizScore;
  const wrong = total - correct;
  const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
  $('#result-correct').textContent = correct;
  $('#result-total').textContent = total;
  $('#result-wrong').textContent = wrong;
  $('#result-rate').textContent = rate + '%';
  // unit suffix (개 in Korean, 個 in Japanese, empty in English)
  const unitEl = $('#result-wrong-unit');
  if (unitEl) {
    const lang = state.settings.language || 'ko';
    if (lang === 'ko') unitEl.textContent = '개';
    else if (lang === 'ja') unitEl.textContent = '個';
    else unitEl.textContent = '';
  }
  showScreen('quiz-result');
}

// ========= REVIEW =========
function renderReview() {
  const listEl = $('#review-list');
  listEl.innerHTML = '';
  if (state.wrong.length === 0) {
    listEl.innerHTML = `<div class="empty-state">${t('reviewEmpty')}</div>`;
    $('#review-quiz').disabled = true;
    $('#review-clear').disabled = true;
    return;
  }
  $('#review-quiz').disabled = false;
  $('#review-clear').disabled = false;
  state.wrong.forEach((w, i) => {
    const item = document.createElement('div');
    item.className = 'review-item';
    item.innerHTML = `
      <div class="ri-hanzi">${w.h}</div>
      <div class="ri-body">
        <div class="ri-pinyin">${w.p}</div>
        <div class="ri-meaning">${getMeaning(w)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;">
        <span class="ri-level">${t('studyLevel', { level: w.l })}</span>
        <button class="ri-remove" data-idx="${i}" title="${t('reviewItemRemove')}">✕</button>
      </div>
    `;
    listEl.appendChild(item);
  });
  listEl.querySelectorAll('.ri-remove').forEach(b => {
    b.onclick = () => {
      const idx = parseInt(b.dataset.idx);
      state.wrong.splice(idx, 1);
      saveWrong();
      renderReview();
    };
  });
}

function startReviewQuiz() {
  if (state.wrong.length === 0) return;
  startQuiz('review', [...state.wrong]);
}

function clearWrong() {
  if (state.wrong.length === 0) return;
  if (!confirm(t('confirmClearWrong', { count: state.wrong.length }))) return;
  state.wrong = [];
  saveWrong();
  renderReview();
}

// ========= SETTINGS =========
function renderSettings() {
  const options = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 150, 200];
  const current = state.settings.dailyCount;
  const closest = options.reduce((a, b) => Math.abs(b - current) < Math.abs(a - current) ? b : a);
  $('#daily-count').value = closest;
  $('#quiz-direction').value = state.settings.quizDirection;
  $('#auto-speak').value = state.settings.autoSpeak;
  $('#lang-select').value = state.settings.language || 'ko';
  $('#font-size').value = state.settings.fontSize || 'm';
}

function saveSettingsForm() {
  const count = parseInt($('#daily-count').value);
  if (isNaN(count) || count < 1) {
    alert(t('alertSelectCount'));
    return;
  }
  state.settings.dailyCount = count;
  state.settings.quizDirection = $('#quiz-direction').value;
  state.settings.autoSpeak = $('#auto-speak').value;
  state.settings.fontSize = $('#font-size').value;
  applyFontSize(state.settings.fontSize);
  const newLang = $('#lang-select').value;
  const langChanged = newLang !== state.settings.language;
  state.settings.language = newLang;
  saveSettings();
  if (langChanged) {
    applyI18n();
    updateLangButtons();
  }
  alert(t('alertSaved'));
  showScreen('home');
  renderHome();
}

function resetProgress() {
  if (!confirm(t('confirmResetProgress'))) return;
  state.progress = { basic: [], hsk5: [] };
  saveProgress();
  alert(t('alertReset'));
}

// ========= EVENT BINDING =========
function bindEvents() {
  document.body.addEventListener('click', (e) => {
    const exAudio = e.target.closest('.ex-audio-btn');
    if (exAudio) {
      speak(exAudio.dataset.text, exAudio);
      return;
    }
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    switch (action) {
      case 'home': showScreen('home'); renderHome(); break;
      case 'study-basic': startStudy('basic'); break;
      case 'study-5': startStudy('hsk5'); break;
      case 'quiz-basic': startQuiz('basic'); break;
      case 'quiz-5': startQuiz('hsk5'); break;
      case 'review': showScreen('review'); renderReview(); break;
      case 'settings': showScreen('settings'); renderSettings(); break;
    }
  });

  $('#study-next').onclick = nextStudy;
  $('#study-prev').onclick = prevStudy;
  $('#quiz-next').onclick = nextQuiz;
  $('#review-quiz').onclick = startReviewQuiz;
  $('#review-clear').onclick = clearWrong;
  $('#save-settings').onclick = saveSettingsForm;
  $('#reset-progress').onclick = resetProgress;

  $('#study-audio').onclick = () => {
    const w = state.studyWords[state.studyIndex];
    if (w) speak(w.h, $('#study-audio'));
  };
  $('#quiz-audio').onclick = () => {
    const w = state.quizWords[state.quizIndex];
    if (w) speak(w.h, $('#quiz-audio'));
  };

  // Language selector (top-right buttons)
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.onclick = () => setLanguage(b.dataset.lang);
  });
}

// ========= INIT =========
function init() {
  if (typeof VOCABULARY === 'undefined') {
    document.body.innerHTML = '<p style="padding:20px;color:red;">vocabulary.js 파일을 불러오지 못했습니다 / Failed to load vocabulary.js</p>';
    return;
  }
  load();
  applyFontSize(state.settings.fontSize);
  applyI18n();
  updateLangButtons();
  bindEvents();
  renderHome();
}

init();
