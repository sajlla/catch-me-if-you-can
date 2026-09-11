(() => {
  'use strict';

  /* =====================================================
     ESCAPE THE RED BUTTON  -  vanilla JS, no deps
     ===================================================== */

  const $  = (id) => document.getElementById(id);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const dist2 = (ax, ay, bx, by) => (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
  const fmtTime = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(s / 60);
    return m + ':' + String(s % 60).padStart(2, '0');
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  /* ============================== config ============================== */
  const DIFF = {
    easy:   { label: 'Easy',   mult: 1,   radius: 58,  cooldown: 620, fatigue: 4 },
    normal: { label: 'Normal', mult: 1.5, radius: 92,  cooldown: 470, fatigue: 3 },
    hard:   { label: 'Hard',   mult: 2.2, radius: 118, cooldown: 370, fatigue: 3 },
    insane: { label: 'Insane', mult: 3,   radius: 145, cooldown: 300, fatigue: 3 },
  };

  const LEVELS = [
    { name: 'The Flinch',  desc: 'It scoots away when you get close.',                    dodge: 'jitter',   points: 1000 },
    { name: 'Teleport',    desc: 'Gone before you even blink.',                           dodge: 'teleport', points: 1500 },
    { name: 'Shake & Bake',desc: 'Fast escape. The room shakes with fear.',               dodge: 'fast',     shake: true, points: 2000 },
    { name: 'The Fakes',   desc: 'Fake buttons everywhere. Only ONE is real.',            dodge: 'teleport', fakes: 6,     points: 2500 },
    { name: 'A Grain of Rice', desc: 'It shrank. No, zoom in. Really zoom in.',           dodge: 'jitter',   tiny: true,    points: 3000 },
    { name: 'Ghost Button',desc: 'It fades and hides behind the UI elements.',            dodge: 'jitter',   hide: true,    points: 3500 },
    { name: 'Mind Reader', desc: 'It predicts where your cursor is going.',               dodge: 'predict',  points: 4000 },
  ];

  const DODGE_MSGS = [
    'Too slow.', 'Bro 💀', 'Nice try.', 'Skill issue.', 'Almost!', 'Nope.',
    'Catch me if you can.', 'Not today.', 'You snooze, you lose.', 'Womp womp.',
    'L + ratio + red button', 'Dream on.', 'It said no.', 'Boop missed.',
    'Wrong again.', 'Keep dreaming.', 'You can\'t outrun destiny?',
  ];

  const MISS_MSGS = [
    'You aimed at air 💨', 'So close… not really.', 'Whoops, that was fake.',
    'The button is laughing.', 'Air is undefeated today.',
  ];

  const MILESTONES = {
    100: { title: '100 ATTEMPTS', desc: 'Dedication… or pure spite? 💀' },
    250: { title: '250 ATTEMPTS', desc: 'Are you even okay? The button is impressed.' },
    500: { title: '500 ATTEMPTS', desc: '500! Have you tried unplugging your mouse?' },
  };

  const ACHIEVEMENTS = [
    { id: 'first_dodge',  name: 'First Escape',   desc: 'The button dodged you once.',      check: (s) => s.dodges >= 1 },
    { id: 'fake_click',   name: 'Boop Me Not',    desc: 'Clicked your first fake button.',   check: (s) => s.fakeMisclicks >= 1 },
    { id: 'tiny_catch',   name: 'Needle Hunter',  desc: 'Caught the grain-of-rice button.',  check: (s) => s.tinyCaught === true },
    { id: 'ghost_catch',  name: 'Ghost Buster',   desc: 'Caught the hiding ghost button.',   check: (s) => s.ghostCaught === true },
    { id: 'predict',      name: 'Mind Reader?',   desc: 'Outsmarted the predictive button.', check: (s) => s.beatLvl7 === true },
    { id: 'q100',         name: 'Stubborn',       desc: 'Reached 100 attempts.',             check: (s) => s.attempts >= 100 },
    { id: 'q250',         name: 'Iron Will',      desc: 'Reached 250 attempts.',             check: (s) => s.attempts >= 250 },
    { id: 'q500',         name: 'Devotion',       desc: 'Reached 500 attempts.',             check: (s) => s.attempts >= 500 },
    { id: 'speedrun',     name: 'Quicksilver',    desc: 'Finished in under 60 seconds.',     check: (s) => s.speedRun === true },
    { id: 'beast',        name: 'Insane Beast',   desc: 'Finished on Insane.',               check: (s) => s.beast === true },
    { id: 'winner',       name: 'Champion',       desc: 'Managed to finish the game.',       check: (s) => s.finished === true },
  ];

  const LB_KEY = 'escapeRedButtonLB';

  /* ============================== dom ============================== */
  const els = {
    start: $('screen-start'),
    game: $('screen-game'),
    end: $('screen-end'),

    startBtn: $('start-btn'),
    lbBtn: $('leaderboard-btn'),

    hudLevel: $('hud-level'),
    hudAttempts: $('hud-attempts'),
    hudTime: $('hud-time'),
    hudScore: $('hud-score'),
    progressFill: $('hud-progress').querySelector('span'),
    muteBtn: $('mute-btn'),
    restartBtn: $('restart-btn'),

    area: $('game-area'),
    banner: $('level-banner'),
    bannerTitle: document.querySelector('#level-banner .lb-title'),
    bannerDesc: document.querySelector('#level-banner .lb-desc'),
    btn: $('red-button'),
    fxCanvas: $('fx-canvas'),
    floatMsg: $('float-msg'),

    toasts: $('toasts'),

    endScore: $('end-score'),
    endTime: $('end-time'),
    endAttempts: $('end-attempts'),
    endDiff: $('end-diff'),
    nameInput: $('name-input'),
    saveBtn: $('save-score-btn'),
    playAgain: $('play-again-btn'),
    shareBtn: $('share-btn'),
    lbBtn2: $('lb-btn-2'),

    lbModal: $('lb-modal'),
    lbClose: $('lb-close'),
    lbTable: document.querySelector('#lb-table tbody'),

    coverZones: Array.from(document.querySelectorAll('.cover-zone')),
  };

  els.diffBtns = Array.from(document.querySelectorAll('.diff-btns button'));

  /* ============================== state ============================== */
  const S = {
    diff: 'normal',
    muted: false,
    running: false,
    level: 1,
    caught: false,
    attempts: 0,
    dodges: 0,
    fakeMisclicks: 0,
    scoreBase: 0,
    startStamp: 0,
    pauseTotal: 0,
    lastVisTime: null,
    timerId: null,
    tickId: null,
    lastDodgeAt: 0,
    streak: 0,
    restUntil: 0,
    area: { l: 0, t: 0, w: 0, h: 0 },
    btn: { x: 0, y: 0, w: 0, h: 0 },
    pointer: { x: -9999, y: -9999, inside: false, hist: [], lastHandled: 0 },
    fakes: [],
    parts: [],
    achieved: new Set(),
    finished: false,
    beatLvl7: false,
    speedRun: false,
    beast: false,
    tinyCaught: false,
    ghostCaught: false,
    finalMs: 0,
    finalScore: 0,
    _finalMs: 0,
    _score: 0,
  };

  /* ============================== audio ============================== */
  let audio = null;

  function ensureAudio() {
    if (audio) {
      if (audio.ctx.state === 'suspended') audio.ctx.resume();
      return audio;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audio = { ctx: new AC(), master: null };
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = S.muted ? 0 : 1;
    audio.master.connect(audio.ctx.destination);
    return audio;
  }

  function tone(freq, dur, type, vol, delay, glideTo) {
    const a = ensureAudio();
    if (!a) return;
    const t0 = a.ctx.currentTime + (delay || 0);
    const osc = a.ctx.createOscillator();
    const g = a.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.16, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(a.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.06);
  }

  function noiseBurst(dur, vol, delay) {
    const a = ensureAudio();
    if (!a) return;
    const t0 = a.ctx.currentTime + (delay || 0);
    const len = Math.max(1, Math.floor(a.ctx.sampleRate * dur));
    const buf = a.ctx.createBuffer(1, len, a.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.ctx.createBufferSource();
    src.buffer = buf;
    const f = a.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 900;
    f.Q.value = 0.8;
    const g = a.ctx.createGain();
    g.gain.setValueAtTime(vol || 0.12, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(a.master);
    src.start(t0);
  }

  const sounds = {
    dodge() { noiseBurst(0.09, 0.16); tone(320, 0.12, 'sawtooth', 0.08, 0, 90); },
    catch() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.16, i * 0.07)); },
    levelUp() { [392, 523, 659, 784].forEach((f, i) => tone(f, 0.18, 'square', 0.1, i * 0.09)); tone(1046, 0.3, 'triangle', 0.12, 0.36); },
    fakeClick() { tone(190, 0.14, 'square', 0.12, 0, 120); tone(140, 0.18, 'square', 0.1, 0.06, 90); },
    click() { tone(720, 0.06, 'sine', 0.1); },
    achievement() { [880, 1174, 1318, 1760].forEach((f, i) => tone(f, 0.14, 'sine', 0.12, i * 0.08)); },
    milestone() { [660, 440].forEach((f, i) => tone(f, 0.22, 'sine', 0.16, i * 0.12)); },
    gameOver() { [392, 330, 262].forEach((f, i) => tone(f, 0.3, 'triangle', 0.14, i * 0.16)); },
  };

  function toggleMute() {
    S.muted = !S.muted;
    try { localStorage.setItem('erbMuted', S.muted ? '1' : '0'); } catch (e) {}
    els.muteBtn.textContent = S.muted ? '🔇' : '🔊';
    els.muteBtn.classList.toggle('muted', S.muted);
    if (audio) audio.master.gain.value = S.muted ? 0 : 1;
  }

  /* ============================== screens ============================== */
  function showScreen(id) {
    [els.start, els.game, els.end].forEach((el) => el.classList.toggle('hidden', el.id !== 'screen-' + id));
  }

  /* ============================== timing ============================== */
  function elapsedMs() {
    if (!S.running) return S.finalMs || 0;
    let t = performance.now() - S.startStamp - S.pauseTotal;
    if (S.lastVisTime) t -= (performance.now() - S.lastVisTime);
    return Math.max(0, t);
  }

  function setTimer() {
    els.hudTime.textContent = fmtTime(elapsedMs());
    els.hudScore.textContent = liveScore().toLocaleString();
  }

  function startClock() {
    clearInterval(S.timerId);
    S.timerId = setInterval(() => { setTimer(); }, 200);
  }

  function stopClock() {
    clearInterval(S.timerId);
    S.timerId = null;
  }

  /* ============================== lifecycle ============================== */
  function startRun() {
    stopRun();
    S.running = true;
    S.level = 1;
    S.attempts = 0;
    S.dodges = 0;
    S.fakeMisclicks = 0;
    S.finished = false;
    S.scoreBase = 0;
    S.speedRun = false;
    S.beast = false;
    S.tinyCaught = false;
    S.ghostCaught = false;
    S.beatLvl7 = false;
    S.finalMs = 0;
    S.finalScore = 0;
    S.startStamp = performance.now();
    S.pauseTotal = 0;
    S.lastVisTime = null;
    showScreen('game');
    setupLevel(1);
    startClock();
    startTick();
    updateHUD();
  }

  function stopRun() {
    S.running = false;
    stopClock();
    stopTick();
    removeFakes();
    els.btn.className = 'red-btn';
    els.area.classList.remove('shaking');
    els.area.classList.remove('has-covers');
    els.btn.classList.remove('behind', 'blink', 'exhausted', 'tiny');
  }

  /* ============================== geometry ============================== */
  function measArea() {
    const r = els.area.getBoundingClientRect();
    S.area = { l: r.left, t: r.top, w: r.width, h: r.height };
  }

  function measBtn() {
    const r = els.btn.getBoundingClientRect();
    S.btn.w = r.width;
    S.btn.h = r.height;
    S.btn.x = r.left - S.area.l + r.width / 2;
    S.btn.y = r.top - S.area.t + r.height / 2;
  }

  function placeButton(cx, cy) {
    const w = S.btn.w, h = S.btn.h;
    const m = 6;
    cx = clamp(cx, w / 2 + m, S.area.w - w / 2 - m);
    cy = clamp(cy, h / 2 + m, S.area.h - h / 2 - m);
    els.btn.style.left = (cx - w / 2) + 'px';
    els.btn.style.top = (cy - h / 2) + 'px';
    S.btn.x = cx;
    S.btn.y = cy;
  }

  function randomSafePoint(minDist) {
    const m = 24;
    for (let i = 0; i < 60; i++) {
      const x = m + Math.random() * (S.area.w - m * 2);
      const y = m + Math.random() * (S.area.h - m * 2);
      if (!S.pointer.inside || dist2(x, y, S.pointer.x, S.pointer.y) > minDist * minDist) {
        return { x, y };
      }
    }
    return { x: m, y: m };
  }

  /* ============================== level setup ============================== */
  function levelOf() { return LEVELS[S.level - 1]; }

  function setupLevel(n) {
    S.level = n;
    S.caught = false;
    S.streak = 0;
    S.restUntil = 0;
    S.lastDodgeAt = 0;
    const lv = levelOf();

    removeFakes();
    els.btn.classList.remove('behind', 'blink', 'exhausted');
    els.area.classList.remove('has-covers', 'shaking');
    els.btn.className = 'red-btn' + (lv.tiny ? ' tiny' : '') + (lv.hide ? ' blink' : '');

    measArea();
    measBtn();
    const cx = rand(S.area.w * 0.3, S.area.w * 0.65);
    const cy = rand(S.area.h * 0.35, S.area.h * 0.65);
    placeButton(cx, cy);

    if (lv.fakes) spawnFakes(lv.fakes);
    if (lv.hide) els.area.classList.add('has-covers');

    showBanner('Level ' + S.level + ' of 7', lv.name + ' — ' + lv.desc);
    updateHUD();
  }

  function nextLevel() {
    if (S.level >= LEVELS.length) { endGame(); return; }
    S.scoreBase += levelOf().points * DIFF[S.diff].mult;
    setupLevel(S.level + 1);
  }

  /* ============================== dodging ============================== */
  function jitterEscape(dist) {
    const angle = Math.atan2(S.btn.y - S.pointer.y, S.btn.x - S.pointer.x);
    const spread = (Math.random() - 0.5) * 1.1;
    return {
      x: S.btn.x + Math.cos(angle + spread) * dist,
      y: S.btn.y + Math.sin(angle + spread) * dist,
    };
  }

  function predictEscape() {
    const now = performance.now();
    const hist = S.pointer.hist.filter((p) => now - p.t < 220);
    let vx = 0, vy = 0;
    if (hist.length >= 2) {
      const a = hist[0], b = hist[hist.length - 1];
      const dt = Math.max(1, b.t - a.t);
      vx = (b.x - a.x) / dt * 16;
      vy = (b.y - a.y) / dt * 16;
    }
    const aheadX = S.pointer.x + vx;
    const aheadY = S.pointer.y + vy;
    let ang = Math.atan2(S.btn.y - aheadY, S.btn.x - aheadX);
    if (Math.random() < 0.3) ang += (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2;
    const d = 150 + Math.random() * 120;
    let tx = S.btn.x + Math.cos(ang) * d;
    let ty = S.btn.y + Math.sin(ang) * d;
    if (S.pointer.inside && dist2(tx, ty, S.pointer.x, S.pointer.y) < 130 * 130) {
      tx = S.btn.x - Math.cos(ang) * d;
      ty = S.btn.y - Math.sin(ang) * d;
    }
    return { x: tx, y: ty };
  }

  function tryDodge() {
    const now = performance.now();
    if (now < S.restUntil) return false;
    if (now - S.lastDodgeAt < DIFF[S.diff].cooldown) return false;
    const lv = levelOf();
    const diff = DIFF[S.diff];

    let tgt;
    if (lv.dodge === 'teleport') tgt = randomSafePoint(Math.max(150, diff.radius + 40));
    else if (lv.dodge === 'fast') {
      tgt = jitterEscape(180 + diff.radius * 1.4);
      els.area.classList.remove('shaking');
      void els.area.offsetWidth;
      els.area.classList.add('shaking');
      setTimeout(() => els.area.classList.remove('shaking'), 320);
    } else if (lv.dodge === 'predict') tgt = predictEscape();
    else tgt = jitterEscape(diff.radius * 1.6);

    placeButton(tgt.x, tgt.y);
    S.lastDodgeAt = now;
    S.dodges++;
    S.streak++;
    S.attempts++;
    sounds.dodge();
    updateHUD();

    if (lv.fakes) shuffleFakesAway();

    if (S.streak >= diff.fatigue) {
      S.streak = 0;
      S.restUntil = now + 800;
      els.btn.classList.add('exhausted');
      setTimeout(() => els.btn.classList.remove('exhausted'), 900);
      floatMsg('The button is exhausted… GO! ⚡');
    } else if (Math.random() < 0.75) {
      floatMsg(pick(DODGE_MSGS));
    }

    checkMilestones();
    checkAchievements();
    return true;
  }

  function shakeArena() {
    els.area.classList.remove('shaking');
    void els.area.offsetWidth;
    els.area.classList.add('shaking');
    setTimeout(() => els.area.classList.remove('shaking'), 340);
  }

  /* ============================== pointer ============================== */
  function onPointerMove(e) {
    if (!S.running) return;
    const now = performance.now();
    const rx = e.clientX - S.area.l;
    const ry = e.clientY - S.area.t;
    S.pointer.inside = rx >= 0 && ry >= 0 && rx <= S.area.w && ry <= S.area.h;
    S.pointer.x = rx;
    S.pointer.y = ry;
    S.pointer.hist.push({ x: rx, y: ry, t: now });
    if (S.pointer.hist.length > 10) S.pointer.hist.shift();
    if (now - S.pointer.lastHandled < 14) return;
    S.pointer.lastHandled = now;

    const lv = levelOf();
    const d = dist2(S.pointer.x, S.pointer.y, S.btn.x, S.btn.y);
    const r = DIFF[S.diff].radius;
    if (S.pointer.inside && d < r * r) tryDodge();
  }

  function onAreaDown(e) {
    if (!S.running) return;
    ensureAudio();
    const rx = e.clientX - S.area.l;
    const ry = e.clientY - S.area.t;
    S.pointer.x = rx;
    S.pointer.y = ry;

    const t = e.target;
    if (t && t.classList && t.classList.contains('fake-btn')) {
      fakeClicked(t);
      return;
    }
    if (t && (t === els.btn || (t.closest && t.closest('.red-btn')))) {
      const d = dist2(rx, ry, S.btn.x, S.btn.y);
      if (d <= Math.max(S.btn.w, S.btn.h) * Math.max(S.btn.w, S.btn.h) * 0.6) {
        catchButton();
        return;
      }
    }
    if (Math.random() < 0.14) floatMsg(pick(MISS_MSGS));
    sounds.click();
  }

  function catchButton() {
    if (!S.running || S.caught) return;
    S.caught = true;
    const lv = levelOf();
    sounds.catch();
    S.scoreBase += lv.points * DIFF[S.diff].mult;
    burst(lv.tiny ? 90 : 70, S.area.w / 2, S.area.h / 2, 11);
    burst(40, S.btn.x, S.btn.y, 8);

    if (lv.tiny) S.tinyCaught = true;
    if (lv.hide) S.ghostCaught = true;
    if (S.level >= LEVELS.length) S.beatLvl7 = true;

    checkAchievements();
    updateHUD();

    setTimeout(() => {
      if (!S.running) return;
      if (S.level >= LEVELS.length) endGame();
      else {
        sounds.levelUp();
        setupLevel(S.level + 1);
      }
    }, 550);
  }

  /* ============================== fakes ============================== */
  function spawnFakes(count) {
    removeFakes();
    for (let i = 0; i < count; i++) {
      const f = document.createElement('button');
      f.className = 'fake-btn';
      f.innerHTML = '<span>DO NOT<br>CLICK</span>';
      f.style.position = 'absolute';
      els.area.appendChild(f);
      const w = f.offsetWidth || 90, h = f.offsetHeight || 90;
      let p;
      if (i === 0) {
        p = randomSafePoint(220);
        p = { x: S.area.w / 2 + (-80 + Math.random() * 160), y: S.area.h / 2 + (-80 + Math.random() * 160) };
        p = clamp(p.x, w / 2, S.area.w - w / 2); p = clamp(p.y, h / 2, S.area.h - h / 2);
      } else p = randomSafePoint(60);
      f.style.left = clamp(p.x - w / 2, 0, S.area.w - w) + 'px';
      f.style.top = clamp(p.y - h / 2, 0, S.area.h - h) + 'px';
      S.fakes.push({ el: f, x: p.x, y: p.y, dx: rand(-40, 40), dy: rand(-40, 40) });
    }
  }

  function removeFakes() {
    S.fakes.forEach((f) => { if (f.el.parentNode) f.el.parentNode.removeChild(f.el); });
    S.fakes = [];
  }

  function fakeClicked(el) {
    S.fakeMisclicks++;
    S.attempts++;
    sounds.fakeClick();
    el.classList.add('pop');
    floatMsg('THAT ONE WAS FAKE 😤');
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
    S.fakes = S.fakes.filter((f) => f.el !== el);
    updateHUD();
    checkAchievements();
  }

  function shuffleFakesAway(k) {
    const speed = k == null ? 1 : k;
    S.fakes.forEach((f) => {
      const dx = f.dx * speed, dy = f.dy * speed;
      const cx = clamp(f.x + dx, f.el.offsetWidth / 2, S.area.w - f.el.offsetWidth / 2);
      const cy = clamp(f.y + dy, f.el.offsetHeight / 2, S.area.h - f.el.offsetHeight / 2);
      f.x = cx; f.y = cy;
      f.el.style.left = (cx - f.el.offsetWidth / 2) + 'px';
      f.el.style.top = (cy - f.el.offsetHeight / 2) + 'px';
    });
  }

  function updateCoverState() {
    let behind = false;
    for (const z of els.coverZones) {
      const r = z.getBoundingClientRect();
      const l = r.left - S.area.l, t = r.top - S.area.t;
      if (S.btn.x > l + 8 && S.btn.x < l + r.width - 8 && S.btn.y > t + 8 && S.btn.y < t + r.height - 8) behind = true;
    }
    els.btn.classList.toggle('behind', behind);
  }

  /* ============================== banner & floats ============================== */
  let bannerTimer = null;

  function showBanner(title, desc) {
    els.bannerTitle.textContent = title;
    els.bannerDesc.textContent = desc;
    els.banner.classList.add('on');
    if (bannerTimer) clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => els.banner.classList.remove('on'), 1900);
  }

  let floatTimer = null;

  function floatMsg(msg) {
    if (floatTimer) return;
    els.floatMsg.textContent = msg;
    els.floatMsg.classList.remove('kick');
    void els.floatMsg.offsetWidth;
    const x = clamp(S.btn.x + rand(-40, 40), 70, S.area.w - 70);
    const y = clamp(S.btn.y - 40, 30, S.area.h - 30);
    els.floatMsg.style.left = x + 'px';
    els.floatMsg.style.top = y + 'px';
    els.floatMsg.classList.add('kick');
    floatTimer = setTimeout(() => { floatTimer = null; }, 900);
  }

  /* ============================== toasts ============================== */
  function toast(emoji, title, sub, milestone) {
    const el = document.createElement('div');
    el.className = 'toast' + (milestone ? ' milestone' : '');
    el.innerHTML = '<div class="t-emoji">' + emoji + '</div>' +
      '<div><div class="t-title">' + esc(title) + '</div>' +
      (sub ? '<div class="t-sub">' + esc(sub) + '</div>' : '') + '</div>';
    els.toasts.appendChild(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 320);
    }, 3400);
  }

  function clearToasts() {
    els.toasts.innerHTML = '';
  }

  /* ============================== milestones ============================== */
  function checkMilestones() {
    const m = MILESTONES[S.attempts];
    if (m) {
      sounds.milestone();
      toast('🎯', m.title, m.desc, true);
      burst(70, els.btn.x, els.btn.y, 8);
    }
  }

  function checkAchievements() {
    ACHIEVEMENTS.forEach((a) => {
      if (S.achieved.has(a.id) || !a.check(S)) return;
      S.achieved.add(a.id);
      sounds.achievement();
      toast('🏆', 'Achievement: ' + a.name, a.desc);
    });
  }

  /* ============================== particles ============================== */
  const COLORS = ['#ff2d55', '#22d3ee', '#ffd166', '#62f24f', '#c084fc', '#ffffff'];

  function burst(count, cx, cy, power) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = power * (0.4 + Math.random());
      S.parts.push({
        x: cx, y: cy,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - power * 0.35,
        life: 55 + Math.random() * 25, max: 80,
        size: 3 + Math.random() * 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rot: Math.random() * 6.28, vr: rand(-0.3, 0.3),
      });
    }
  }

  function renderParticles() {
    const ctx = els.fxCanvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, els.fxCanvas.width / dpr, els.fxCanvas.height / dpr);
    for (const p of S.parts) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22;
      p.life--;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
    S.parts = S.parts.filter((p) => p.life > 0);
  }

  /* ============================== tick loop ============================== */
  function startTick() {
    stopTick();
    S.tickId = requestAnimationFrame(tick);
  }

  function stopTick() {
    if (S.tickId) { cancelAnimationFrame(S.tickId); S.tickId = null; }
  }

  function tick(t) {
    if (!S.running) {
      S.parts = [];
      return;
    }
    const lv = levelOf();
    if (lv.hide) updateCoverState();
    if (lv.fakes && S.fakes.length) shuffleFakesAway(0.04);
    if (S.parts.length) renderParticles();
    S.tickId = requestAnimationFrame(tick);
  }

  /* ============================== score / progress ============================== */
  function liveScore() {
    const mult = DIFF[S.diff].mult;
    const base = S.scoreBase;
    const penalty = S.attempts * 8;
    return Math.max(0, Math.round(base * mult - penalty));
  }

  function updateHUD() {
    els.hudLevel.textContent = S.level + ' / ' + LEVELS.length;
    els.hudAttempts.textContent = S.attempts;
    els.hudTime.textContent = fmtTime(elapsedMs());
    els.hudScore.textContent = liveScore().toLocaleString();
    const pct = Math.round(((S.level - 1) / LEVELS.length) * 100);
    els.progressFill.style.width = pct + '%';
  }

  /* ============================== end game ============================== */
  function endGame() {
    const t = elapsedMs();
    S.running = false;
    stopClock();
    stopTick();
    S.finalMs = t;
    S.finalScore = liveScore();
    S.finished = true;
    S.speedRun = S.finalMs < 60000;
    S.beast = S.diff === 'insane';
    S.beatLvl7 = true;

    els.endScore.textContent = S.finalScore.toLocaleString();
    els.endTime.textContent = fmtTime(S.finalMs);
    els.endAttempts.textContent = S.attempts;
    els.endDiff.textContent = DIFF[S.diff].label;

    checkAchievements();
    sounds.gameOver();
    showBanner('YOU FINALLY GOT ME', 'There was never a prize. 💀');
    burst(120, S.area.w / 2, S.area.h / 2, 12);

    setTimeout(() => {
      els.banner.classList.remove('on');
      showScreen('end');
      els.endScore.textContent = S.finalScore.toLocaleString();
    }, 900);
  }

  /* ============================== leaderboard ============================== */
  function getLB() {
    try { return JSON.parse(localStorage.getItem(LB_KEY)) || []; }
    catch (e) { return []; }
  }

  function setLB(list) {
    try { localStorage.setItem(LB_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function renderLB() {
    const list = getLB();
    els.lbTable.innerHTML = '';
    if (!list.length) {
      const el = document.createElement('tr');
      el.id = 'lb-empty';
      el.innerHTML = '<td colspan="6">No legends yet. Be the first! 🏆</td>';
      els.lbTable.appendChild(el);
      return;
    }
    list.forEach((e, i) => {
      const tr = document.createElement('tr');
      if (i === 0) tr.className = 'top';
      tr.innerHTML = '<td class="rank">' + (i + 1) + '</td>' +
        '<td class="name-cell">' + esc(e.name) + '</td>' +
        '<td>' + Number(e.score).toLocaleString() + '</td>' +
        '<td>' + fmtTime(e.time) + '</td>' +
        '<td>' + e.attempts + '</td>' +
        '<td>' + esc(e.diff) + '</td>';
      els.lbTable.appendChild(tr);
    });
  }

  function openLB() {
    renderLB();
    els.lbModal.classList.remove('hidden');
  }

  function closeLB() {
    els.lbModal.classList.add('hidden');
  }

  function saveScore() {
    const name = (els.nameInput.value.trim() || 'Anonymous').slice(0, 12);
    const entry = {
      name,
      score: S.finalScore,
      time: S.finalMs,
      attempts: S.attempts,
      diff: DIFF[S.diff].label,
    };
    const list = getLB();
    list.push(entry);
    list.sort((a, b) => b.score - a.score || a.time - b.time);
    setLB(list.slice(0, 10));
    toast('💾', 'Score saved', 'Welcome to the leaderboard, ' + esc(name) + '!');
    renderLB();
  }

  function shareResult() {
    const text = '💀 I finally caught the Red Button! Score: ' +
      S.finalScore.toLocaleString() + ' · ' + fmtTime(S.finalMs) +
      ' · ' + S.attempts + ' attempts · ' + DIFF[S.diff].label +
      '. There was never a prize.';
    if (navigator.share) {
      navigator.share({ title: 'Escape the Red Button', text }).catch(() => {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => toast('📤', 'Copied!', 'Paste it anywhere.'))
        .catch(() => toast('📤', 'Share failed', 'Your browser says no.'));
    } else {
      prompt('Copy your result:', text);
    }
  }

  /* ============================== events ============================== */
  function wire() {
    els.startBtn.addEventListener('click', () => { ensureAudio(); sounds.click(); startRun(); });
    els.restartBtn.addEventListener('click', () => { ensureAudio(); sounds.click(); startRun(); });
    els.playAgain.addEventListener('click', () => { ensureAudio(); sounds.click(); startRun(); });
    els.muteBtn.addEventListener('click', toggleMute);
    els.lbBtn.addEventListener('click', openLB);
    els.lbBtn2.addEventListener('click', openLB);
    els.lbClose.addEventListener('click', closeLB);
    els.lbModal.addEventListener('click', (e) => { if (e.target === els.lbModal) closeLB(); });
    els.saveBtn.addEventListener('click', saveScore);
    els.shareBtn.addEventListener('click', shareResult);
    els.nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveScore(); });

    els.diffBtns.forEach((b) => {
      b.addEventListener('click', () => {
        els.diffBtns.forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        S.diff = b.dataset.diff;
        ensureAudio();
        sounds.click();
      });
    });

    els.area.addEventListener('pointermove', onPointerMove, { passive: true });
    els.area.addEventListener('pointerdown', onAreaDown);
    els.area.addEventListener('pointerleave', () => { S.pointer.inside = false; });
    els.area.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('resize', () => {
      if (!S.running) return;
      measArea();
      const nx = clamp(S.btn.x, S.btn.w / 2, S.area.w - S.btn.w / 2);
      const ny = clamp(S.btn.y, S.btn.h / 2, S.area.h - S.btn.h / 2);
      placeButton(nx, ny);
    });

    document.addEventListener('visibilitychange', () => {
      if (!S.running) return;
      if (document.hidden) S.lastVisTime = performance.now();
      else if (S.lastVisTime) {
        S.pauseTotal += performance.now() - S.lastVisTime;
        S.lastVisTime = null;
      }
    });
  }

  /* ============================== init ============================== */
  function init() {
    try {
      S.muted = localStorage.getItem('erbMuted') === '1';
    } catch (e) {}
    els.muteBtn.textContent = S.muted ? '🔇' : '🔊';
    els.muteBtn.classList.toggle('muted', S.muted);
    MeasUpdate0();
    wire();
  }

  function MeasUpdate0() {
    measArea();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    els.fxCanvas.width = Math.floor(els.area.clientWidth * dpr);
    els.fxCanvas.height = Math.floor(els.area.clientHeight * dpr);
  }

  showScreen('start');
  init();
})();