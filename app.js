// File: app.js
'use strict';

(function () {
  const SAVE_KEY = 'kotoba-flow-save-v1';

  const LEVEL_NAMES = {
    1: 'Lv.1 英→日 4択',
    2: 'Lv.2 日→英 4択',
    3: 'Lv.3 文字タイル',
    4: 'Lv.4 ヒント入力',
    5: 'Lv.5 タイピング'
  };

  const QWERTY_ROWS = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'BK', 'OK']
  ];

  let save = loadSave();
  let allWords = [];
  window.KF_STAGES.forEach(s => s.words.forEach(w => allWords.push(w)));

  const state = {
    screen: 'home',
    stage: null,
    queue: [],
    totalInitial: 0,
    solvedCount: 0,
    mistakeCount: 0,
    combo: 0,
    locked: false,
    currentWord: null,
    currentLevel: 1,
    // Lv.3 tiles
    tilePool: [],
    tileSlots: [],
    // Lv.4/5 typing
    typed: '',
    hintReveal: 0
  };

  const $ = id => document.getElementById(id);

  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          mastery: parsed.mastery && typeof parsed.mastery === 'object' ? parsed.mastery : {},
          bestCombo: Number(parsed.bestCombo) || 0,
          sound: parsed.sound !== false
        };
      }
    } catch (e) {}
    return { mastery: {}, bestCombo: 0, sound: true };
  }

  function persistSave() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch (e) {}
  }

  function getMastery(wordId) {
    const v = save.mastery[wordId];
    return v >= 1 && v <= 5 ? v : 1;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function showScreen(name) {
    state.screen = name;
    ['home', 'play', 'result'].forEach(s => {
      $('screen-' + s).classList.toggle('hidden', s !== name);
    });
    $('btn-back').classList.toggle('hidden', name === 'home');
    $('topbar-title').textContent = name === 'home' ? 'Kotoba Flow' : (state.stage ? state.stage.title : 'Kotoba Flow');
  }

  function updateSoundBtn() {
    window.Sound.enabled = save.sound;
    $('btn-sound').textContent = save.sound ? '🔊' : '🔇';
  }

  /* ================= ホーム画面 ================= */
  function renderHome() {
    let masteredTotal = 0;
    allWords.forEach(w => {
      if (getMastery(w.id) >= 5) masteredTotal++;
    });
    $('stat-mastered').textContent = `${masteredTotal} / ${allWords.length}`;
    $('stat-best-combo').textContent = String(save.bestCombo);

    const list = $('stage-list');
    list.innerHTML = '';

    window.KF_STAGES.forEach(stage => {
      const maxPts = stage.words.length * 5;
      const curPts = stage.words.reduce((sum, w) => sum + getMastery(w.id), 0);
      const minLv = Math.min(...stage.words.map(w => getMastery(w.id)));
      const allMax = stage.words.every(w => getMastery(w.id) >= 5);
      const pct = Math.round(((curPts - stage.words.length) / (maxPts - stage.words.length)) * 100);

      const card = document.createElement('button');
      card.className = 'stage-card';
      card.innerHTML = `
        <div class="stage-info">
          <div class="stage-title">${stage.title}</div>
          <div class="stage-desc">${stage.desc}</div>
          <div class="stage-meter">
            <div class="stage-meter-fill" style="width:${Math.max(4, pct)}%"></div>
          </div>
        </div>
        <span class="stage-badge ${allMax ? 'done' : ''}">
          ${allMax ? 'MASTER!' : `現在 Lv.${minLv}〜`}
        </span>
      `;
      card.addEventListener('click', () => {
        window.Sound.playTap();
        startStage(stage);
      });
      list.appendChild(card);
    });

    showScreen('home');
  }

  /* ================= ステージ開始 ================= */
  function startStage(stage) {
    state.stage = stage;
    state.queue = shuffle(stage.words);
    state.totalInitial = stage.words.length;
    state.solvedCount = 0;
    state.mistakeCount = 0;
    state.combo = 0;
    state.locked = false;
    showScreen('play');
    nextQuestion();
  }

  function nextQuestion() {
    if (state.queue.length === 0) {
      showResult();
      return;
    }

    state.locked = false;
    $('feedback-banner').classList.add('hidden');

    const w = state.queue[0];
    const lv = getMastery(w.id);
    state.currentWord = w;
    state.currentLevel = lv;

    // HUD
    $('play-stage-name').textContent = state.stage.title.split('：')[0];
    $('play-level-badge').textContent = LEVEL_NAMES[lv];
    $('play-combo').textContent = `${state.combo} COMBO`;
    $('play-progress-text').textContent = `${Math.min(state.solvedCount + 1, state.totalInitial)} / ${state.totalInitial}`;
    $('play-progress-bar').style.width = `${Math.round((state.solvedCount / state.totalInitial) * 100)}%`;

    // 習熟度ドット
    const dots = $('word-mastery-dots');
    dots.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const d = document.createElement('span');
      d.className = 'm-dot' + (i < lv ? ' filled' : (i === lv ? ' current' : ''));
      dots.appendChild(d);
    }

    // ドット絵進捗
    drawPixelArt($('reward-canvas'), state.stage.art, state.solvedCount / state.totalInitial);

    // 出題表示切替
    ['mode-choice', 'mode-tiles', 'mode-typing'].forEach(id => $(id).classList.add('hidden'));

    if (lv === 1) {
      $('question-prompt').textContent = w.en;
      $('question-sub').textContent = '意味をえらぼう（英 → 日）';
      window.Sound.speakWord(w.en);
      renderChoices(w, 'en2ja');
    } else if (lv === 2) {
      $('question-prompt').textContent = w.ja;
      $('question-sub').textContent = '英単語をえらぼう（日 → 英）';
      renderChoices(w, 'ja2en');
    } else if (lv === 3) {
      $('question-prompt').textContent = w.ja;
      $('question-sub').textContent = '文字を並べてスペルを作ろう';
      renderTiles(w);
    } else {
      $('question-prompt').textContent = w.ja;
      $('question-sub').textContent = lv === 4 ? 'ヒントを見ながら入力しよう' : 'ノーヒントで入力しよう！';
      renderTyping(w, lv === 4 ? 1 : 0);
    }
  }

  /* ================= Lv.1 & Lv.2：4択 ================= */
  function renderChoices(word, mode) {
    $('mode-choice').classList.remove('hidden');
    const grid = $('choice-grid');
    grid.innerHTML = '';

    const others = shuffle(allWords.filter(x => x.id !== word.id)).slice(0, 3);
    const options = shuffle([word, ...others]);

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = mode === 'en2ja' ? opt.ja : opt.en;
      btn.addEventListener('click', () => {
        if (state.locked) return;
        const isOk = opt.id === word.id;
        btn.classList.add(isOk ? 'ok' : 'ng');
        if (!isOk) {
          Array.from(grid.children).forEach(c => {
            const targetText = mode === 'en2ja' ? word.ja : word.en;
            if (c.textContent === targetText) c.classList.add('ok');
          });
        }
        handleAnswer(isOk);
      });
      grid.appendChild(btn);
    });
  }

  /* ================= Lv.3：文字タイル並べ替え ================= */
  function renderTiles(word) {
    $('mode-tiles').classList.remove('hidden');
    const letters = word.en.split('');
    const extras = 'eariotnslcudpmhgbfywkvxz'
      .split('')
      .filter(ch => !letters.includes(ch));
    const distractorCount = Math.min(2, extras.length);
    const poolLetters = shuffle([...letters, ...shuffle(extras).slice(0, distractorCount)]);

    state.tilePool = poolLetters.map((ch, idx) => ({ id: idx, ch, used: false }));
    state.tileSlots = new Array(letters.length).fill(null);

    drawTileUI();
  }

  function drawTileUI() {
    const slotsEl = $('tile-slots');
    const poolEl = $('tile-pool');
    slotsEl.innerHTML = '';
    poolEl.innerHTML = '';

    state.tileSlots.forEach((item, sIdx) => {
      const slot = document.createElement('button');
      slot.className = 'tile-slot' + (item ? ' filled' : '');
      slot.textContent = item ? item.ch : '';
      slot.addEventListener('click', () => {
        if (state.locked || !item) return;
        window.Sound.playTap();
        item.used = false;
        state.tileSlots[sIdx] = null;
        drawTileUI();
      });
      slotsEl.appendChild(slot);
    });

    state.tilePool.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'letter-tile';
      btn.textContent = item.ch;
      btn.disabled = item.used;
      btn.addEventListener('click', () => {
        if (state.locked || item.used) return;
        const emptyIdx = state.tileSlots.indexOf(null);
        if (emptyIdx === -1) return;
        window.Sound.playTap();
        item.used = true;
        state.tileSlots[emptyIdx] = item;
        drawTileUI();

        if (!state.tileSlots.includes(null)) {
          const attempt = state.tileSlots.map(x => x.ch).join('');
          handleAnswer(attempt === state.currentWord.en);
        }
      });
      poolEl.appendChild(btn);
    });
  }

  /* ================= Lv.4 & Lv.5：タイピング ================= */
  function renderTyping(word, initialHint) {
    $('mode-typing').classList.remove('hidden');
    state.typed = '';
    state.hintReveal = initialHint;
    drawTypingDisplay();
  }

  function drawTypingDisplay() {
    const w = state.currentWord;
    const disp = $('typing-display');
    disp.innerHTML = '';

    for (let i = 0; i < w.en.length; i++) {
      const span = document.createElement('span');
      const isCursor = i === state.typed.length;
      span.className = 'type-char' + (isCursor ? ' cursor' : '');
      if (i < state.typed.length) {
        span.textContent = state.typed[i];
      } else if (i < state.hintReveal) {
        span.textContent = w.en[i];
        span.classList.add('hint');
      } else {
        span.textContent = '';
      }
      disp.appendChild(span);
    }

    $('typing-hint-text').textContent = `${w.en.length}文字の英単語`;
  }

  function typeChar(ch) {
    if (state.locked || state.currentLevel < 4) return;
    if (ch === 'BK') {
      if (state.typed.length > 0) {
        window.Sound.playTap();
        state.typed = state.typed.slice(0, -1);
        drawTypingDisplay();
      }
      return;
    }
    if (ch === 'OK') {
      if (state.typed.length === 0) return;
      handleAnswer(state.typed.toLowerCase() === state.currentWord.en.toLowerCase());
      return;
    }
    if (/^[a-z]$/i.test(ch) && state.typed.length < state.currentWord.en.length) {
      window.Sound.playTap();
      state.typed += ch.toLowerCase();
      drawTypingDisplay();
    }
  }

  function buildQwertyPad() {
    const pad = $('qwerty-pad');
    pad.innerHTML = '';
    QWERTY_ROWS.forEach(row => {
      const rEl = document.createElement('div');
      rEl.className = 'qwerty-row';
      row.forEach(k => {
        const btn = document.createElement('button');
        btn.className = 'q-key' + (k === 'BK' ? ' wide' : k === 'OK' ? ' enter' : '');
        btn.textContent = k === 'BK' ? '⌫' : k === 'OK' ? '決定' : k;
        btn.addEventListener('click', () => typeChar(k));
        rEl.appendChild(btn);
      });
      pad.appendChild(rEl);
    });
  }

  /* ================= 正誤判定 ================= */
  function handleAnswer(isOk) {
    state.locked = true;
    const w = state.currentWord;
    const curLv = state.currentLevel;
    const banner = $('feedback-banner');
    banner.classList.remove('hidden', 'ok', 'ng');

    if (isOk) {
      state.combo++;
      if (state.combo > save.bestCombo) save.bestCombo = state.combo;
      save.mastery[w.id] = Math.min(5, curLv + 1);
      persistSave();

      window.Sound.playOk(state.combo - 1);
      if (curLv >= 2) window.Sound.speakWord(w.en);

      state.queue.shift();
      state.solvedCount++;

      const nextLv = save.mastery[w.id];
      const lvUpMsg = curLv < 5 ? `（Lv.${nextLv} へアップ！）` : '（MASTER!）';
      banner.classList.add('ok');
      banner.textContent = `せいかい！ ${w.en} = ${w.ja} ${lvUpMsg}`;

      drawPixelArt($('reward-canvas'), state.stage.art, state.solvedCount / state.totalInitial);

      setTimeout(nextQuestion, 900);
    } else {
      state.combo = 0;
      state.mistakeCount++;
      save.mastery[w.id] = Math.max(1, curLv - 1);
      persistSave();

      window.Sound.playNg();
      window.Sound.speakWord(w.en);

      // 間違えた単語はキューの後ろに戻して再挑戦
      state.queue.shift();
      state.queue.push(w);

      banner.classList.add('ng');
      banner.textContent = `おしい！ 正解は「${w.en}」（${w.ja}）`;

      setTimeout(nextQuestion, 1500);
    }
  }

  /* ================= 結果画面 ================= */
  function showResult() {
    window.Sound.playClear();
    showScreen('result');

    drawPixelArt($('result-canvas'), state.stage.art, 1);

    const allMax = state.stage.words.every(w => getMastery(w.id) >= 5);
    $('result-title').textContent = allMax ? 'ステージ完全マスター！' : 'ステージクリア！';
    $('result-summary').textContent = state.mistakeCount === 0
      ? 'ノーミスでクリアしました！次のステップへ進みました。'
      : `ミス ${state.mistakeCount} 回でクリア！間違えた単語は次で復習できます。`;

    const list = $('result-word-list');
    list.innerHTML = '';
    state.stage.words.forEach(w => {
      const lv = getMastery(w.id);
      const row = document.createElement('div');
      row.className = 'result-word-item';
      row.innerHTML = `
        <div><strong>${w.en}</strong> <span style="color:#64748b;margin-left:6px">${w.ja}</span></div>
        <span style="font-weight:700;color:${lv >= 5 ? '#047857' : '#2563eb'}">Lv.${lv}${lv >= 5 ? ' ★' : ''}</span>
      `;
      list.appendChild(row);
    });
  }

  /* ================= ドット絵描画 ================= */
  function drawPixelArt(canvas, artRows, ratio) {
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const rows = artRows.length;
    const cols = artRows[0].length;
    const cell = size / cols;

    ctx.clearRect(0, 0, size, size);

    const pixels = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const ch = artRows[y][x];
        if (ch !== '.') pixels.push({ x, y, color: window.KF_PALETTE[ch] || '#94a3b8' });
      }
    }

    const revealCount = Math.round(pixels.length * Math.max(0, Math.min(1, ratio)));
    pixels.forEach((p, idx) => {
      ctx.fillStyle = idx < revealCount ? p.color : '#e2e8f0';
      ctx.fillRect(p.x * cell, p.y * cell, Math.ceil(cell), Math.ceil(cell));
    });
  }

  /* ================= イベント登録 ================= */
  $('btn-back').addEventListener('click', () => {
    window.Sound.playTap();
    renderHome();
  });

  $('btn-sound').addEventListener('click', () => {
    save.sound = !save.sound;
    persistSave();
    updateSoundBtn();
    if (save.sound) window.Sound.playTap();
  });

  $('btn-speak').addEventListener('click', () => {
    if (state.currentWord) window.Sound.speakWord(state.currentWord.en);
  });

  $('btn-tile-clear').addEventListener('click', () => {
    if (state.locked) return;
    window.Sound.playTap();
    state.tilePool.forEach(item => { item.used = false; });
    state.tileSlots.fill(null);
    drawTileUI();
  });

  $('btn-typing-hint').addEventListener('click', () => {
    if (state.locked || !state.currentWord) return;
    window.Sound.playTap();
    const target = state.currentWord.en;
    if (state.typed.length < target.length) {
      // 正しい先頭一致部分だけ残して1文字進める
      let matchLen = 0;
      while (matchLen < state.typed.length && state.typed[matchLen] === target[matchLen]) {
        matchLen++;
      }
      state.typed = target.slice(0, matchLen + 1);
      state.hintReveal = Math.max(state.hintReveal, state.typed.length);
      drawTypingDisplay();
    }
  });

  $('btn-play-again').addEventListener('click', () => {
    window.Sound.playTap();
    if (state.stage) startStage(state.stage);
  });

  $('btn-to-home').addEventListener('click', () => {
    window.Sound.playTap();
    renderHome();
  });

  $('btn-reset-progress').addEventListener('click', () => {
    if (!confirm('すべての単語の習熟度を Lv.1 に戻しますか？')) return;
    save.mastery = {};
    save.bestCombo = 0;
    persistSave();
    renderHome();
  });

  // 物理キーボード対応（PCでの確認用）
  window.addEventListener('keydown', e => {
    if (state.screen !== 'play' || state.currentLevel < 4 || state.locked) return;
    if (e.key === 'Backspace') {
      e.preventDefault();
      typeChar('BK');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      typeChar('OK');
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      typeChar(e.key.toLowerCase());
    }
  });

  // 初期化
  updateSoundBtn();
  buildQwertyPad();
  renderHome();
})();
