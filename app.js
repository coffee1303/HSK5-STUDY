// HSK Study App
// Profile-scoped storage keys (prefixed at access time via pk())
const KEY_SETTINGS = 'hsk-settings';
const KEY_WRONG = 'hsk-wrong';
const KEY_PROGRESS = 'hsk-progress';
const KEY_HISTORY = 'hsk-study-history';
const KEY_QUIZ_SAVE = 'hsk-quiz-saved';
const KEY_AUTH = 'hsk-auth';

// Global (un-prefixed) keys for profile management
const KEY_PROFILES_LIST = 'hsk-profiles';
const KEY_CURRENT_PROFILE = 'hsk-current-profile';

let currentProfile = null;

function pk(base) {
  // Returns the profile-prefixed storage key, e.g. "alice::hsk-settings"
  return (currentProfile || 'default') + '::' + base;
}

function getProfiles() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY_PROFILES_LIST));
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

function saveProfilesList(list) {
  localStorage.setItem(KEY_PROFILES_LIST, JSON.stringify(list));
}

function createProfile(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return { ok: false, reason: 'empty' };
  if (trimmed.length > 20) return { ok: false, reason: 'tooLong' };
  const list = getProfiles();
  if (list.includes(trimmed)) return { ok: false, reason: 'duplicate' };
  const isFirstProfile = list.length === 0;
  list.push(trimmed);
  saveProfilesList(list);

  const legacyKeys = [KEY_SETTINGS, KEY_WRONG, KEY_PROGRESS, KEY_HISTORY, KEY_QUIZ_SAVE];
  let migratedSettings = false;
  if (isFirstProfile) {
    legacyKeys.forEach(k => {
      const v = localStorage.getItem(k);
      if (v === null) return;
      localStorage.setItem(trimmed + '::' + k, v);
      localStorage.removeItem(k);
      if (k === KEY_SETTINGS) migratedSettings = true;
    });
  }
  if (!migratedSettings) {
    // Seed the new profile with default settings but carry over the language
    // chosen on the login screen so users don't have to re-pick it.
    const seed = { ...defaultSettings, language: state.settings.language };
    localStorage.setItem(trimmed + '::' + KEY_SETTINGS, JSON.stringify(seed));
  }
  return { ok: true };
}

function deleteProfile(name) {
  const list = getProfiles().filter(p => p !== name);
  saveProfilesList(list);
  [KEY_SETTINGS, KEY_WRONG, KEY_PROGRESS, KEY_HISTORY, KEY_QUIZ_SAVE, KEY_AUTH].forEach(k => {
    localStorage.removeItem(name + '::' + k);
  });
  if (currentProfile === name) {
    currentProfile = null;
    localStorage.removeItem(KEY_CURRENT_PROFILE);
  }
}

function selectProfile(name) {
  currentProfile = name;
  localStorage.setItem(KEY_CURRENT_PROFILE, name);
}

function logout() {
  currentProfile = null;
  localStorage.removeItem(KEY_CURRENT_PROFILE);
}

// ----- Password auth -----
// Polite lock only — anyone with DevTools access can bypass localStorage.
// We hash (SHA-256) with a random per-profile salt to avoid storing plaintext.

function _randomSaltHex(bytes = 16) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function _hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const data = enc.encode(saltHex + ':' + password);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getAuthRecord(name) {
  try {
    const v = JSON.parse(localStorage.getItem(name + '::' + KEY_AUTH));
    if (v && typeof v.salt === 'string' && typeof v.hash === 'string') return v;
  } catch {}
  return null;
}

function hasPassword(name) {
  return getAuthRecord(name) !== null;
}

async function setPasswordFor(name, password) {
  if (!password) {
    localStorage.removeItem(name + '::' + KEY_AUTH);
    return;
  }
  const salt = _randomSaltHex();
  const hash = await _hashPassword(password, salt);
  localStorage.setItem(name + '::' + KEY_AUTH, JSON.stringify({ salt, hash }));
}

async function verifyPassword(name, password) {
  const rec = getAuthRecord(name);
  if (!rec) return true; // no password set
  const hash = await _hashPassword(password, rec.salt);
  return hash === rec.hash;
}

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

function _resolveEntry(entry) {
  if (entry == null) return null;
  if (typeof entry === 'string') return { m: entry };
  return entry;
}

function getMeaning(w) {
  const lang = state.settings.language || 'ko';
  if (lang === 'en') return w.m;
  if (lang === 'ja') {
    const ja = (typeof TRANSLATIONS_JA !== 'undefined') ? TRANSLATIONS_JA[w.h] : null;
    const e = _resolveEntry(ja);
    return e ? e.m : w.m;
  }
  // Korean (default)
  const ko = (typeof TRANSLATIONS !== 'undefined') ? TRANSLATIONS[w.h] : null;
  const e = _resolveEntry(ko);
  return e ? e.m : w.m;
}

function renderMetaInline(w) {
  const meta = getWordMeta(w);
  if (!meta.pos && !meta.star) return '';
  let h = '<span class="ri-meta">';
  if (meta.star) h += `<span class="star-badge">★</span>`;
  if (meta.pos) h += `<span class="pos-tag">${meta.pos}</span>`;
  h += '</span>';
  return h;
}

function getWordMeta(w) {
  const lang = state.settings.language || 'ko';
  let entry = null;
  if (lang === 'ko' && typeof TRANSLATIONS !== 'undefined') entry = TRANSLATIONS[w.h];
  else if (lang === 'ja' && typeof TRANSLATIONS_JA !== 'undefined') entry = TRANSLATIONS_JA[w.h];
  const e = _resolveEntry(entry);
  if (!e) return { pos: null, star: false };
  return { pos: e.pos || null, star: !!e.star };
}

function applyI18n() {
  const counts = {
    menuStudyBasicSmall: VOCABULARY.basic.length,
    menuStudy5Small: VOCABULARY.hsk5.length,
    menuTodaySmall: getTodayWords().length,
    menuStudiedSmall: getStudiedWords().length,
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
  document.querySelectorAll('[data-i18n-attr-placeholder]').forEach(el => {
    el.setAttribute('placeholder', t(el.dataset.i18nAttrPlaceholder));
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
  // Only persist when logged into a profile — on the login screen, the choice
  // is kept in-memory and carried over when the user creates a profile.
  if (currentProfile) saveSettings();
  applyI18n();
  updateLangButtons();
  // Re-render current screen so dynamic content updates
  const active = document.querySelector('.screen.active');
  if (active) {
    const id = active.id;
    if (id === 'home') renderHome();
    else if (id === 'login') renderLogin();
    else if (id === 'study') renderStudy();
    else if (id === 'quiz') renderQuiz();
    else if (id === 'review') renderReview();
    else if (id === 'today') renderToday();
    else if (id === 'studied') renderStudied();
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
  studyHistory: [],
  quizWords: [],
  quizIndex: 0,
  quizScore: 0,
  quizMode: null,
  quizAnswered: false,
};

function load() {
  // Reset to defaults first so switching profiles doesn't bleed prior state
  state.settings = { ...defaultSettings };
  state.wrong = [];
  state.progress = { basic: [], hsk5: [] };
  state.studyHistory = [];
  try {
    const s = JSON.parse(localStorage.getItem(pk(KEY_SETTINGS)));
    if (s) state.settings = { ...defaultSettings, ...s };
  } catch {}
  try {
    const w = JSON.parse(localStorage.getItem(pk(KEY_WRONG)));
    if (Array.isArray(w)) state.wrong = w;
  } catch {}
  try {
    const p = JSON.parse(localStorage.getItem(pk(KEY_PROGRESS)));
    if (p && typeof p === 'object') {
      state.progress = { basic: p.basic || [], hsk5: p.hsk5 || [] };
    }
  } catch {}
  try {
    const h = JSON.parse(localStorage.getItem(pk(KEY_HISTORY)));
    if (Array.isArray(h)) state.studyHistory = h;
  } catch {}
}

function saveSettings() { localStorage.setItem(pk(KEY_SETTINGS), JSON.stringify(state.settings)); }
function saveWrong() { localStorage.setItem(pk(KEY_WRONG), JSON.stringify(state.wrong)); }
function saveProgress() { localStorage.setItem(pk(KEY_PROGRESS), JSON.stringify(state.progress)); }
function saveStudyHistory() { localStorage.setItem(pk(KEY_HISTORY), JSON.stringify(state.studyHistory)); }

function getStartOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function recordStudy(w, mode) {
  const start = getStartOfToday();
  const dup = state.studyHistory.some(e => e.h === w.h && e.t >= start);
  if (!dup) {
    state.studyHistory.push({ h: w.h, mode, t: Date.now() });
    saveStudyHistory();
  }
}

function getTodayWords() {
  if (typeof VOCABULARY === 'undefined') return [];
  const start = getStartOfToday();
  const entries = state.studyHistory.filter(e => e.t >= start);
  const all = [...VOCABULARY.basic, ...VOCABULARY.hsk5];
  const map = new Map(all.map(w => [w.h, w]));
  return entries.slice().reverse().map(e => map.get(e.h)).filter(Boolean);
}

function saveQuizState(indexOverride) {
  const data = {
    words: state.quizWords,
    index: typeof indexOverride === 'number' ? indexOverride : state.quizIndex,
    score: state.quizScore,
    mode: state.quizMode,
    savedAt: Date.now(),
  };
  localStorage.setItem(pk(KEY_QUIZ_SAVE), JSON.stringify(data));
}

function loadSavedQuiz() {
  try {
    const data = JSON.parse(localStorage.getItem(pk(KEY_QUIZ_SAVE)));
    if (!data || !Array.isArray(data.words) || data.words.length === 0) return null;
    if (typeof data.index !== 'number' || data.index >= data.words.length) return null;
    return data;
  } catch { return null; }
}

function clearSavedQuiz() {
  localStorage.removeItem(pk(KEY_QUIZ_SAVE));
}

function resumeQuiz() {
  const saved = loadSavedQuiz();
  if (!saved) return;
  state.quizMode = saved.mode;
  state.quizWords = saved.words;
  state.quizIndex = saved.index;
  state.quizScore = saved.score;
  state.quizAnswered = false;
  showScreen('quiz');
  renderQuiz();
}

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
  const nameEl = $('#home-profile-name');
  if (nameEl) nameEl.textContent = currentProfile || '';
  const saved = loadSavedQuiz();
  const resumeBtn = $('#resume-quiz-btn');
  if (resumeBtn) {
    if (saved) {
      resumeBtn.classList.remove('hidden');
      $('#resume-quiz-progress').textContent = `${saved.index + 1} / ${saved.words.length}`;
      $('#resume-quiz-score').textContent = saved.score;
    } else {
      resumeBtn.classList.add('hidden');
    }
  }
}

function renderLogin() {
  applyI18n();
  const list = getProfiles();
  const listEl = $('#profile-list');
  const emptyEl = $('#profile-empty');
  listEl.innerHTML = '';
  if (list.length === 0) {
    emptyEl.classList.remove('hidden');
  } else {
    emptyEl.classList.add('hidden');
    list.forEach(name => {
      const row = document.createElement('div');
      row.className = 'profile-item';
      const selectBtn = document.createElement('button');
      const locked = hasPassword(name);
      selectBtn.className = 'profile-item-select' + (locked ? ' locked' : '');
      selectBtn.type = 'button';
      selectBtn.innerHTML = (locked ? '<span class="lock-icon" aria-hidden="true">🔒</span>' : '') +
        '<span>' + escapeHTML(name) + '</span>';
      selectBtn.onclick = () => tryEnterProfile(name);
      const delBtn = document.createElement('button');
      delBtn.className = 'profile-item-delete';
      delBtn.type = 'button';
      delBtn.textContent = t('loginDelete');
      delBtn.onclick = async () => {
        const ok = await customConfirm(
          t('confirmDeleteProfile', { name }),
          { okText: t('btnDelete'), cancelText: t('btnCancel') }
        );
        if (!ok) return;
        deleteProfile(name);
        renderLogin();
      };
      row.appendChild(selectBtn);
      row.appendChild(delBtn);
      listEl.appendChild(row);
    });
  }
  const nameInput = $('#new-profile-name');
  if (nameInput) nameInput.value = '';
  const pwInput = $('#new-profile-password');
  if (pwInput) pwInput.value = '';
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

async function tryEnterProfile(name) {
  if (hasPassword(name)) {
    const pw = await passwordPrompt({
      title: t('passwordEnterTitle'),
      message: t('passwordEnterMessage', { name }),
      mode: 'enter',
      verify: async (input) => await verifyPassword(name, input),
    });
    if (pw === null) return; // cancelled
  }
  enterProfile(name);
}

function enterProfile(name) {
  selectProfile(name);
  load();
  applyFontSize(state.settings.fontSize);
  applyI18n();
  updateLangButtons();
  showScreen('home');
  renderHome();
}

async function handleAddProfile() {
  const nameInput = $('#new-profile-name');
  const pwInput = $('#new-profile-password');
  const name = nameInput.value;
  const password = pwInput ? pwInput.value : '';
  const res = createProfile(name);
  if (!res.ok) {
    if (res.reason === 'empty') alert(t('alertProfileEmpty'));
    else if (res.reason === 'duplicate') alert(t('alertProfileDuplicate'));
    else if (res.reason === 'tooLong') alert(t('alertProfileTooLong'));
    return;
  }
  const trimmed = name.trim();
  if (password) {
    await setPasswordFor(trimmed, password);
  }
  enterProfile(trimmed);
}

async function handleChangePassword() {
  if (!currentProfile) return;
  const had = hasPassword(currentProfile);
  await passwordPrompt({
    title: t(had ? 'passwordChangeTitle' : 'passwordSetTitle'),
    message: t(had ? 'passwordChangeMessage' : 'passwordSetMessage'),
    mode: had ? 'change' : 'set',
    verify: had ? async (input) => await verifyPassword(currentProfile, input) : null,
    onSubmit: async (newPw) => {
      await setPasswordFor(currentProfile, newPw);
    },
  });
}

async function handleSwitchProfile() {
  // Save anything pending then return to login
  logout();
  showScreen('login');
  renderLogin();
}

async function handleDeleteCurrentProfile() {
  if (!currentProfile) return;
  const ok = await customConfirm(
    t('confirmDeleteProfile', { name: currentProfile }),
    { okText: t('btnDelete'), cancelText: t('btnCancel') }
  );
  if (!ok) return;
  deleteProfile(currentProfile);
  showScreen('login');
  renderLogin();
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
  const meta = getWordMeta(w);
  const metaEl = $('#study-meta');
  let metaHTML = '';
  if (meta.star) metaHTML += `<span class="star-badge">★ ${t('starBadge')}</span>`;
  if (meta.pos) metaHTML += `<span class="pos-tag">${meta.pos}</span>`;
  metaEl.innerHTML = metaHTML;
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
  recordStudy(w, state.studyMode);
  // auto-speak
  if (state.settings.autoSpeak === 'on') {
    setTimeout(() => speak(w.h, $('#study-audio')), 200);
  }
}

const STUDY_EXTRA_COUNT = 10;

function extendStudyWords(count) {
  const mode = state.studyMode;
  const pool = mode === 'basic' ? VOCABULARY.basic : VOCABULARY.hsk5;
  const poolKey = mode === 'basic' ? 'basic' : 'hsk5';
  const existing = new Set(state.studyWords.map(w => w.h));
  const studiedSet = new Set(state.progress[poolKey]);
  const candidates = pool.filter(w => !existing.has(w.h));
  const unstudied = candidates.filter(w => !studiedSet.has(w.h));
  let extra;
  if (unstudied.length >= count) {
    extra = shuffle(unstudied).slice(0, count);
  } else {
    const studied = candidates.filter(w => studiedSet.has(w.h));
    extra = shuffle(unstudied).concat(shuffle(studied).slice(0, count - unstudied.length));
  }
  state.studyWords.push(...extra);
  return extra.length;
}

async function nextStudy() {
  if (state.studyIndex >= state.studyWords.length - 1) {
    const studyMore = await customConfirm(
      t('confirmStudyMore', { count: STUDY_EXTRA_COUNT }),
      { okText: t('btnYes'), cancelText: t('btnNo') }
    );
    if (studyMore) {
      const added = extendStudyWords(STUDY_EXTRA_COUNT);
      if (added > 0) {
        state.studyIndex++;
        renderStudy();
        return;
      }
      alert(t('alertNoMoreWords'));
    }
    if (state.studyWords.length > 0) {
      const toQuiz = await customConfirm(
        t('confirmStudyToQuiz'),
        { okText: t('btnYes'), cancelText: t('btnNo') }
      );
      if (toQuiz) {
        startQuiz(state.studyMode, [...state.studyWords]);
        return;
      }
    }
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
  clearSavedQuiz();
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
    $('#quiz-audio').style.display = '';
  } else {
    // show meaning, options are hanzi
    const meaning = getMeaning(w);
    $('#quiz-hanzi').textContent = meaning.length > 50 ? meaning.slice(0, 50) + '...' : meaning;
    $('#quiz-hanzi').style.fontSize = '24px';
    $('#quiz-audio').style.display = 'none';
  }
  // Pinyin is always hidden until the answer is revealed
  $('#quiz-pinyin').textContent = '';

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
  // ensure hanzi is shown for meaning->hanzi direction
  if (state.settings.quizDirection === 'meaning-to-hanzi') {
    $('#quiz-hanzi').textContent = correct.h;
    $('#quiz-hanzi').style.fontSize = '';
    $('#quiz-audio').style.display = '';
  }
  // Always reveal pinyin once the answer is shown
  $('#quiz-pinyin').textContent = correct.p;
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
  clearSavedQuiz();
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
        <div class="ri-meaning">${renderMetaInline(w)}${getMeaning(w)}</div>
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

function renderToday() {
  const words = getTodayWords();
  const listEl = $('#today-list');
  const quizBtn = $('#today-quiz');
  if (words.length === 0) {
    listEl.innerHTML = `<div class="empty-state">${t('todayEmpty')}</div>`;
    quizBtn.disabled = true;
    return;
  }
  quizBtn.disabled = false;
  listEl.innerHTML = words.map(w => `
    <div class="review-item">
      <div class="ri-hanzi">${w.h}</div>
      <div class="ri-body">
        <div class="ri-pinyin">${w.p}</div>
        <div class="ri-meaning">${renderMetaInline(w)}${getMeaning(w)}</div>
      </div>
      <span class="ri-level">${t('studyLevel', { level: w.l })}</span>
    </div>
  `).join('');
}

function startTodayQuiz() {
  const words = getTodayWords();
  if (words.length === 0) return;
  startQuiz('today', words);
}

function getStudiedWords() {
  if (typeof VOCABULARY === 'undefined') return [];
  const all = [...VOCABULARY.basic, ...VOCABULARY.hsk5];
  const map = new Map(all.map(w => [w.h, w]));
  const hanziSet = new Set([...(state.progress.basic || []), ...(state.progress.hsk5 || [])]);
  // Most recent first: iterate progress arrays in reverse
  const ordered = [];
  const seen = new Set();
  const lists = [state.progress.hsk5 || [], state.progress.basic || []];
  for (const list of lists) {
    for (let i = list.length - 1; i >= 0; i--) {
      const h = list[i];
      if (seen.has(h)) continue;
      seen.add(h);
      const w = map.get(h);
      if (w) ordered.push(w);
    }
  }
  return ordered;
}

function renderStudied() {
  const words = getStudiedWords();
  const listEl = $('#studied-list');
  const quizBtn = $('#studied-quiz');
  if (words.length === 0) {
    listEl.innerHTML = `<div class="empty-state">${t('studiedEmpty')}</div>`;
    quizBtn.disabled = true;
    return;
  }
  quizBtn.disabled = false;
  listEl.innerHTML = words.map(w => `
    <div class="review-item">
      <div class="ri-hanzi">${w.h}</div>
      <div class="ri-body">
        <div class="ri-pinyin">${w.p}</div>
        <div class="ri-meaning">${renderMetaInline(w)}${getMeaning(w)}</div>
      </div>
      <span class="ri-level">${t('studyLevel', { level: w.l })}</span>
    </div>
  `).join('');
}

function startStudiedQuiz() {
  const words = getStudiedWords();
  if (words.length === 0) return;
  startQuiz('studied', words);
}

function customConfirm(message, options) {
  return new Promise(resolve => {
    const modal = $('#confirm-modal');
    $('#confirm-message').textContent = message;
    $('#confirm-ok').textContent = (options && options.okText) || t('btnSave');
    $('#confirm-cancel').textContent = (options && options.cancelText) || t('btnCancel');
    modal.classList.remove('hidden');
    const cleanup = (result) => {
      modal.classList.add('hidden');
      $('#confirm-ok').onclick = null;
      $('#confirm-cancel').onclick = null;
      resolve(result);
    };
    $('#confirm-ok').onclick = () => cleanup(true);
    $('#confirm-cancel').onclick = () => cleanup(false);
  });
}

// Password prompt modal. Supports three modes:
//  - 'enter'  : ask for password, call opts.verify(input) → boolean, resolves to input on success / null on cancel
//  - 'set'    : ask for new password + confirm, call opts.onSubmit(newPw)
//  - 'change' : ask for current + new + confirm; verify current then onSubmit(newPw). New password may be empty to remove.
function passwordPrompt(opts) {
  return new Promise(resolve => {
    const modal = $('#password-modal');
    const titleEl = $('#password-title');
    const msgEl = $('#password-message');
    const cur = $('#password-current');
    const ne = $('#password-new');
    const cf = $('#password-confirm');
    const err = $('#password-error');
    const okBtn = $('#password-ok');
    const cancelBtn = $('#password-cancel');

    titleEl.textContent = opts.title || '';
    msgEl.textContent = opts.message || '';
    cur.value = ''; ne.value = ''; cf.value = '';
    err.classList.add('hidden');
    err.textContent = '';

    const showField = (el, show) => { el.classList.toggle('hidden', !show); };
    if (opts.mode === 'enter') {
      showField(cur, true);
      cur.placeholder = t('passwordFieldPassword');
      showField(ne, false);
      showField(cf, false);
      okBtn.textContent = t('btnConfirm');
    } else if (opts.mode === 'set') {
      showField(cur, false);
      showField(ne, true);
      showField(cf, true);
      ne.placeholder = t('passwordFieldNew');
      cf.placeholder = t('passwordFieldConfirm');
      okBtn.textContent = t('btnSave');
    } else if (opts.mode === 'change') {
      showField(cur, true);
      showField(ne, true);
      showField(cf, true);
      cur.placeholder = t('passwordFieldCurrent');
      ne.placeholder = t('passwordFieldNewOrEmpty');
      cf.placeholder = t('passwordFieldConfirm');
      okBtn.textContent = t('btnSave');
    }
    cancelBtn.textContent = t('btnCancel');

    modal.classList.remove('hidden');
    setTimeout(() => {
      (opts.mode === 'set' ? ne : cur).focus();
    }, 50);

    const showErr = (msg) => { err.textContent = msg; err.classList.remove('hidden'); };
    const cleanup = (result) => {
      modal.classList.add('hidden');
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      [cur, ne, cf].forEach(el => { el.onkeydown = null; });
      resolve(result);
    };

    const submit = async () => {
      err.classList.add('hidden');
      if (opts.mode === 'enter') {
        const input = cur.value;
        const ok = await opts.verify(input);
        if (!ok) { showErr(t('passwordWrong')); return; }
        cleanup(input);
        return;
      }
      if (opts.mode === 'change' && opts.verify) {
        const ok = await opts.verify(cur.value);
        if (!ok) { showErr(t('passwordWrong')); return; }
      }
      const newPw = ne.value;
      if (opts.mode === 'set' && !newPw) {
        showErr(t('passwordEmpty'));
        return;
      }
      if (newPw !== cf.value) {
        showErr(t('passwordMismatch'));
        return;
      }
      if (opts.onSubmit) await opts.onSubmit(newPw);
      cleanup(true);
    };

    okBtn.onclick = submit;
    cancelBtn.onclick = () => cleanup(null);
    [cur, ne, cf].forEach(el => {
      el.onkeydown = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); submit(); }
        else if (e.key === 'Escape') { e.preventDefault(); cleanup(null); }
      };
    });
  });
}

async function handleQuizBack() {
  const effectiveIdx = state.quizAnswered ? state.quizIndex + 1 : state.quizIndex;
  const stillInProgress = state.quizWords.length > 0 && effectiveIdx < state.quizWords.length;
  if (stillInProgress) {
    const save = await customConfirm(t('confirmSaveQuiz'));
    if (save) {
      saveQuizState(effectiveIdx);
    } else {
      clearSavedQuiz();
    }
  } else {
    clearSavedQuiz();
  }
  showScreen('home');
  renderHome();
}

async function clearWrong() {
  if (state.wrong.length === 0) return;
  const ok = await customConfirm(
    t('confirmClearWrong', { count: state.wrong.length }),
    { okText: t('btnDelete'), cancelText: t('btnCancel') }
  );
  if (!ok) return;
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

async function resetProgress() {
  const ok = await customConfirm(
    t('confirmResetProgress'),
    { okText: t('btnReset'), cancelText: t('btnCancel') }
  );
  if (!ok) return;
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
      case 'today': showScreen('today'); renderToday(); break;
      case 'studied': showScreen('studied'); renderStudied(); break;
      case 'settings': showScreen('settings'); renderSettings(); break;
      case 'resume-quiz': resumeQuiz(); break;
      case 'quiz-back': handleQuizBack(); break;
    }
  });

  $('#study-next').onclick = nextStudy;
  $('#study-prev').onclick = prevStudy;
  $('#quiz-next').onclick = nextQuiz;
  $('#review-quiz').onclick = startReviewQuiz;
  $('#review-clear').onclick = clearWrong;
  $('#today-quiz').onclick = startTodayQuiz;
  $('#studied-quiz').onclick = startStudiedQuiz;
  $('#save-settings').onclick = saveSettingsForm;
  $('#reset-progress').onclick = resetProgress;
  $('#add-profile').onclick = handleAddProfile;
  $('#new-profile-name').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddProfile(); }
  });
  $('#home-profile-switch').onclick = handleSwitchProfile;
  $('#switch-profile').onclick = handleSwitchProfile;
  $('#delete-profile').onclick = handleDeleteCurrentProfile;
  $('#change-password').onclick = handleChangePassword;
  $('#new-profile-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddProfile(); }
  });

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
  bindEvents();
  // Restore last active profile only if it still exists
  const savedCurrent = localStorage.getItem(KEY_CURRENT_PROFILE);
  const profiles = getProfiles();
  if (savedCurrent && profiles.includes(savedCurrent)) {
    currentProfile = savedCurrent;
    load();
    applyFontSize(state.settings.fontSize);
    applyI18n();
    updateLangButtons();
    showScreen('home');
    renderHome();
  } else {
    // No active profile — show login. Use defaults until a profile is chosen.
    applyFontSize(state.settings.fontSize);
    applyI18n();
    updateLangButtons();
    showScreen('login');
    renderLogin();
  }
}

init();
