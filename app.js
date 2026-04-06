const SUBJECTS = [
  { key: 'english', label: '英語', desc: '文法・単語・並び替え' },
  { key: 'math', label: '数学', desc: '計算・関数・図形' },
  { key: 'science', label: '理科', desc: '物理・化学・生物・地学' },
  { key: 'social', label: '社会', desc: '地理・歴史・公民' },
  { key: 'japanese', label: '国語', desc: '漢字・文法・読解' },
];

const CURRICULUM = {
  standard: {
    中1: ['be動詞', '一般動詞', '正負の数', '文字式', '植物の分類', '地理の基本', '漢字の読み'],
    中2: ['過去形', '比較', '連立方程式', '一次関数', '化学変化', '歴史の流れ', '文法の識別'],
    中3: ['受け身', '現在完了', '二次関数', '相似', 'イオン', '公民', '古文の基礎'],
  },
  private: {
    中1: ['英単語強化', '先取り計算', '理科応用', '世界地理', '読解トレーニング'],
    中2: ['長文読解', '応用方程式', '電流', '近代史', '作文'],
    中3: ['入試英語', '図形応用', '天体', '公民演習', '古文読解'],
  },
};

const GACHA_POOL = [
  { rarity: 'ノーマル', name: '青のきらめきテーマ' },
  { rarity: 'ノーマル', name: '努力家の称号' },
  { rarity: 'レア', name: '中間テストブースト' },
  { rarity: 'レア', name: '集中力アップフレーム' },
  { rarity: '激レア', name: '伝説の学神エフェクト' },
  { rarity: '激レア', name: '王者のオーラテーマ' },
];

const storeKey = 'manabu-quest-web-v1';
const defaultState = {
  route: 'home',
  grade: '中1',
  school: 'standard',
  unit: 'be動詞',
  subject: 'english',
  coins: 300,
  xp: 0,
  streak: 0,
  level: 1,
  dailyCorrect: 0,
  review: [],
  ranking: [],
  collection: [],
  playerName: 'プレイヤー',
  quiz: null,
};

let state = loadState();
let deferredPrompt = null;
const app = document.getElementById('app');

function loadState() {
  try {
    const raw = localStorage.getItem(storeKey);
    return raw ? { ...defaultState, ...JSON.parse(raw) } : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}
function saveState() { localStorage.setItem(storeKey, JSON.stringify(state)); }

function setRoute(route) {
  state.route = route;
  saveState();
  render();
}

function qs(id) { return document.getElementById(id); }
function cloneTemplate(id) { return document.getElementById(id).content.cloneNode(true); }

function gradeUnits() {
  const pool = CURRICULUM[state.school][state.grade] || [];
  if (!pool.includes(state.unit)) state.unit = pool[0] || '基礎';
  return pool;
}

function generateQuestion(subjectKey, unit, grade, index) {
  const n = index + 1;
  switch (subjectKey) {
    case 'english': {
      const subjects = ['I', 'You', 'He', 'She', 'They'];
      const verbs = ['play', 'study', 'read', 'watch'];
      const s = subjects[index % subjects.length];
      const v = verbs[index % verbs.length];
      const correct = (s === 'He' || s === 'She') ? 'is' : (s === 'I' ? 'am' : 'are');
      return {
        question: `${grade} 英語 / ${unit}：${s} ___ ready to ${v}.`,
        options: ['am', 'is', 'are', 'be'],
        answer: ['am','is','are','be'].indexOf(correct),
        explanation: `${s} に合う be動詞を選ぶ問題やで。`,
        difficulty: n <= 4 ? '基礎' : n <= 7 ? '標準' : '応用',
      };
    }
    case 'math': {
      const a = n * (grade === '中3' ? 3 : 2) + 5;
      const b = n + (grade === '中1' ? 2 : 4);
      const answer = a + b;
      return {
        question: `${grade} 数学 / ${unit}： ${a} + ${b} = ?`,
        options: shuffle([answer, answer + 1, answer - 1, answer + 2]),
        answer: null,
        explanation: `たし算を落ち着いて計算する問題。`,
        difficulty: n <= 4 ? '基礎' : n <= 7 ? '標準' : '応用',
      };
    }
    case 'science': {
      const items = [
        ['光合成で必要なもの', ['二酸化炭素', '塩酸', '鉄', 'アンモニア'], 0, '植物は二酸化炭素を使う。'],
        ['水の沸点', ['50℃', '100℃', '150℃', '200℃'], 1, '標準気圧では100℃。'],
        ['電流の単位', ['V', 'A', 'Ω', 'W'], 1, '電流はA。'],
      ];
      const item = items[index % items.length];
      return {
        question: `${grade} 理科 / ${unit}：${item[0]}は？`,
        options: item[1],
        answer: item[2],
        explanation: item[3],
        difficulty: n <= 4 ? '基礎' : n <= 7 ? '標準' : '応用',
      };
    }
    case 'social': {
      const items = [
        ['日本の首都', ['東京', '大阪', '京都', '名古屋'], 0, '首都は東京。'],
        ['三権分立に含まれないもの', ['立法', '行政', '司法', '報道'], 3, '三権は立法・行政・司法。'],
        ['緯線の例', ['赤道', '本初子午線', '経線', '県境'], 0, '赤道は緯線。'],
      ];
      const item = items[index % items.length];
      return {
        question: `${grade} 社会 / ${unit}：${item[0]}はどれ？`,
        options: item[1],
        answer: item[2],
        explanation: item[3],
        difficulty: n <= 4 ? '基礎' : n <= 7 ? '標準' : '応用',
      };
    }
    case 'japanese': {
      const items = [
        ['「努力」の読み', ['どりょく', 'どりよう', 'どりく', 'どうりょく'], 0, '努力は「どりょく」。'],
        ['主語にあたるもの', ['〜が', '〜を', '〜に', '〜で'], 0, '主語は「〜が」になりやすい。'],
        ['反対語：「開始」', ['終結', '終了', '停止', '完了'], 1, '開始の反対は終了。'],
      ];
      const item = items[index % items.length];
      return {
        question: `${grade} 国語 / ${unit}：${item[0]}`,
        options: item[1],
        answer: item[2],
        explanation: item[3],
        difficulty: n <= 4 ? '基礎' : n <= 7 ? '標準' : '応用',
      };
    }
    default:
      return { question: '問題なし', options: ['1','2','3','4'], answer: 0, explanation: '', difficulty: '基礎' };
  }
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizeMathAnswer(q) {
  if (q.answer === null) {
    const val = parseInt(q.question.match(/(\d+) \+ (\d+)/)?.slice(1).reduce((a, b) => Number(a) + Number(b), 0), 10);
    q.answer = q.options.indexOf(String(val));
  }
  return q;
}

function startQuiz(subjectKey = state.subject) {
  state.subject = subjectKey;
  const total = 10;
  const questions = Array.from({ length: total }, (_, i) => normalizeMathAnswer(generateQuestion(subjectKey, state.unit, state.grade, i)));
  state.quiz = {
    questions,
    index: 0,
    correct: 0,
    answered: false,
    lastSelected: null,
  };
  state.route = 'study';
  saveState();
  render();
}

function answerQuestion(choiceIndex) {
  const quiz = state.quiz;
  if (!quiz || quiz.answered) return;
  quiz.answered = true;
  quiz.lastSelected = choiceIndex;
  const q = quiz.questions[quiz.index];
  const correct = choiceIndex === q.answer;
  if (correct) {
    quiz.correct += 1;
    state.dailyCorrect += 1;
  } else {
    state.review.unshift({ ...q, picked: q.options[choiceIndex], date: new Date().toLocaleString('ja-JP') });
    state.review = state.review.slice(0, 50);
  }
  saveState();
  renderStudyOnly();
}

function nextQuestion() {
  const quiz = state.quiz;
  if (!quiz) return;
  quiz.index += 1;
  quiz.answered = false;
  quiz.lastSelected = null;
  if (quiz.index >= quiz.questions.length) {
    finishQuiz();
  } else {
    saveState();
    render();
  }
}

function finishQuiz() {
  const quiz = state.quiz;
  const total = quiz.questions.length;
  const gainedXp = quiz.correct * 12;
  const gainedCoins = quiz.correct * 8;
  state.xp += gainedXp;
  state.coins += gainedCoins;
  state.level = Math.floor(state.xp / 120) + 1;
  state.streak = Math.max(state.streak, 1);
  state.lastResult = {
    score: quiz.correct,
    total,
    xp: gainedXp,
    coins: gainedCoins,
  };
  state.quiz = null;
  state.route = 'result';
  saveState();
  render();
}

function registerScore() {
  if (!state.lastResult) return;
  state.ranking.push({
    name: state.playerName || 'プレイヤー',
    score: state.lastResult.score,
    total: state.lastResult.total,
    stamp: new Date().toLocaleDateString('ja-JP'),
  });
  state.ranking.sort((a, b) => b.score - a.score || a.total - b.total);
  state.ranking = state.ranking.slice(0, 20);
  saveState();
  render();
}

function rollGacha() {
  if (state.coins < 100) {
    showToast('コインが足りへんで');
    return;
  }
  state.coins -= 100;
  const roll = Math.random() * 100;
  let rarity = 'ノーマル';
  if (roll > 92) rarity = '激レア';
  else if (roll > 65) rarity = 'レア';
  const candidates = GACHA_POOL.filter(item => item.rarity === rarity);
  const item = candidates[Math.floor(Math.random() * candidates.length)];
  if (!state.collection.includes(item.name)) state.collection.push(item.name);
  state.gachaLast = item;
  saveState();
  render();
}

function shareLine() {
  const text = encodeURIComponent(`まなぶクエストで勉強中📘\nLv.${state.level} / ${state.coins}コイン / ${state.dailyCorrect}問正解！`);
  window.open(`https://line.me/R/msg/text/?${text}`, '_blank');
}

function showToast(message) {
  alert(message);
}

function render() {
  app.innerHTML = '';
  updateNav();
  switch (state.route) {
    case 'home': renderHome(); break;
    case 'study': renderStudy(); break;
    case 'result': renderResult(); break;
    case 'review': renderReview(); break;
    case 'ranking': renderRanking(); break;
    case 'store': renderStore(); break;
    default: renderHome();
  }
}

function renderHome() {
  app.appendChild(cloneTemplate('home-template'));
  qs('homeLevel').textContent = state.level;
  qs('streakValue').textContent = `${state.streak}日`;
  qs('coinValue').textContent = state.coins;
  qs('xpValue').textContent = state.xp;
  qs('missionProgress').textContent = `${Math.min(state.dailyCorrect, 10)} / 10`;
  qs('gradeChooser').append(...['中1','中2','中3'].map(g => segmentedBtn(g, state.grade === g, () => { state.grade = g; saveState(); render(); })));
  qs('schoolChooser').append(
    segmentedBtn('公立', state.school === 'standard', () => { state.school = 'standard'; saveState(); render(); }),
    segmentedBtn('私立', state.school === 'private', () => { state.school = 'private'; saveState(); render(); })
  );
  qs('curriculumChips').append(...gradeUnits().map(u => chipBtn(u, state.unit === u, () => { state.unit = u; saveState(); render(); })));
  qs('subjectGrid').append(...SUBJECTS.map(s => {
    const btn = document.createElement('button');
    btn.className = `subject-btn ${state.subject === s.key ? 'active' : ''}`;
    btn.innerHTML = `<strong>${s.label}</strong><small>${s.desc}</small>`;
    btn.onclick = () => { state.subject = s.key; saveState(); render(); };
    return btn;
  }));
  qs('startStudyBtn').onclick = () => startQuiz(state.subject);
  qs('shareBtn').onclick = shareLine;
}

function renderStudyOnly() { renderStudy(); }

function renderStudy() {
  app.innerHTML = '';
  app.appendChild(cloneTemplate('study-template'));
  const quiz = state.quiz;
  if (!quiz) { setRoute('home'); return; }
  const current = quiz.questions[quiz.index];
  const subject = SUBJECTS.find(s => s.key === state.subject);
  qs('quizMeta').textContent = `${state.grade} / ${subject.label}`;
  qs('quizUnitTitle').textContent = state.unit;
  qs('quizProgress').textContent = `${quiz.index + 1} / ${quiz.questions.length}`;
  qs('difficultyPill').textContent = current.difficulty;
  qs('questionText').textContent = current.question;
  const options = qs('questionOptions');
  current.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = `${String.fromCharCode(65 + idx)}. ${opt}`;
    if (quiz.answered) {
      if (idx === current.answer) btn.classList.add('correct');
      if (idx === quiz.lastSelected && idx !== current.answer) btn.classList.add('wrong');
      btn.disabled = true;
    }
    btn.onclick = () => answerQuestion(idx);
    options.appendChild(btn);
  });
  if (quiz.answered) {
    const correct = quiz.lastSelected === current.answer;
    const box = qs('feedbackBox');
    box.classList.remove('hidden');
    box.innerHTML = `<strong>${correct ? '正解！' : 'おしい！'}</strong><div style="margin-top:6px; color:#a8b4d0;">${current.explanation}</div>`;
    if (quiz.index + 1 < quiz.questions.length) qs('nextQuestionBtn').classList.remove('hidden');
    else qs('finishStudyBtn').classList.remove('hidden');
  }
  qs('nextQuestionBtn').onclick = nextQuestion;
  qs('finishStudyBtn').onclick = finishQuiz;
}

function renderResult() {
  app.appendChild(cloneTemplate('result-template'));
  const result = state.lastResult || { score: 0, total: 10, xp: 0, coins: 0 };
  qs('resultScore').textContent = result.score;
  qs('resultTotal').textContent = result.total;
  qs('resultXp').textContent = `+${result.xp}`;
  qs('resultCoins').textContent = `+${result.coins}`;
  qs('resultRate').textContent = `${Math.round((result.score / result.total) * 100)}%`;
  qs('retryBtn').onclick = () => startQuiz(state.subject);
  qs('goHomeBtn').onclick = () => setRoute('home');
}

function renderReview() {
  app.appendChild(cloneTemplate('review-template'));
  qs('reviewCountPill').textContent = `${state.review.length}問`;
  const list = qs('reviewList');
  if (!state.review.length) {
    list.innerHTML = `<div class="list-item"><h4>まだ復習問題はないで</h4><p>間違えた問題はここに自動保存される。</p></div>`;
    return;
  }
  state.review.forEach(item => {
    const el = document.createElement('article');
    el.className = 'list-item';
    el.innerHTML = `<h4>${item.question}</h4><p>あなたの回答：${item.picked}<br>解説：${item.explanation}<br>保存日時：${item.date}</p>`;
    list.appendChild(el);
  });
}

function renderRanking() {
  app.appendChild(cloneTemplate('ranking-template'));
  qs('playerName').value = state.playerName;
  qs('rankingForm').onsubmit = (e) => {
    e.preventDefault();
    state.playerName = qs('playerName').value.trim() || 'プレイヤー';
    registerScore();
  };
  const list = qs('rankingList');
  if (!state.ranking.length) {
    list.innerHTML = `<div class="list-item"><h4>まだランキング登録がないで</h4><p>結果画面のあとにここへ来たら保存できる。</p></div>`;
    return;
  }
  state.ranking.forEach((row, i) => {
    const item = document.createElement('article');
    item.className = 'list-item ranking-row';
    item.innerHTML = `<div class="rank-no">${i + 1}</div><div><h4>${row.name}</h4><p>${row.stamp}</p></div><strong>${row.score}/${row.total}</strong>`;
    list.appendChild(item);
  });
}

function renderStore() {
  app.appendChild(cloneTemplate('store-template'));
  qs('rollGachaBtn').onclick = rollGacha;
  const result = qs('gachaResult');
  if (state.gachaLast) {
    result.classList.remove('hidden');
    result.innerHTML = `<div class="pill blue">${state.gachaLast.rarity}</div><strong>${state.gachaLast.name}</strong><div class="muted">コレクションに追加されたで</div>`;
  }
  qs('collectionCount').textContent = `${state.collection.length}種`;
  const list = qs('collectionList');
  if (!state.collection.length) {
    list.innerHTML = `<span class="chip">まだコレクションなし</span>`;
  } else {
    state.collection.forEach(name => {
      const chip = document.createElement('span');
      chip.className = 'chip active';
      chip.textContent = name;
      list.appendChild(chip);
    });
  }
}

function segmentedBtn(label, active, onClick) {
  const btn = document.createElement('button');
  btn.textContent = label;
  if (active) btn.classList.add('active');
  btn.onclick = onClick;
  return btn;
}
function chipBtn(label, active, onClick) {
  const btn = document.createElement('button');
  btn.className = `chip ${active ? 'active' : ''}`;
  btn.textContent = label;
  btn.onclick = onClick;
  return btn;
}

function updateNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.route === state.route);
  });
}

document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => setRoute(btn.dataset.route)));

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = qs('installBtn');
  installBtn.hidden = false;
  installBtn.onclick = async () => {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.hidden = true;
  };
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}

render();
