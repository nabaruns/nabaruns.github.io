// nabaruns.com — read-aloud for articles.
//
// Speaks the article with the browser's own speech engine (no network, no
// third party) and highlights each word as it is spoken. Everything is
// progressive: the control stays hidden unless speech synthesis is present,
// and the word highlight is skipped where the CSS Custom Highlight API is
// missing. The voice still works there; you just do not get the following dot.

(() => {
  'use strict';

  const synth = window.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;

  const bar = document.querySelector('.read-aloud');
  const prose = document.querySelector('.prose');
  if (!bar || !prose) return;

  const playBtn = bar.querySelector('.ra-play');
  const stopBtn = bar.querySelector('.ra-stop');
  const speedBtn = bar.querySelector('.ra-speed');
  const label = bar.querySelector('.ra-label');
  if (!playBtn) return;

  const canHighlight = ('highlights' in CSS) && typeof window.Highlight === 'function';

  /* ---------- collect words in reading order ---------- */
  // Each token is one run of non-space characters, tied back to the exact
  // text node and offsets it came from, so a word can be turned into a live
  // DOM Range for the highlight. Punctuation stays glued to its word, so the
  // string handed to the engine keeps its sentence breaks and reads naturally.

  const tokens = [];
  const walker = document.createTreeWalker(prose, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue;
    const re = /\S+/g;
    let m;
    while ((m = re.exec(text))) {
      tokens.push({ node, start: m.index, end: m.index + m[0].length, text: m[0] });
    }
  }
  if (!tokens.length) return;

  /* ---------- group words into short spoken chunks ---------- */
  // Long single utterances get cut off mid-sentence in some engines, so the
  // article is spoken a sentence or two at a time and advanced on each `end`.
  // A chunk carries its own token slice and the char offset of each token
  // within the chunk string, so a boundary event maps straight to a word.

  const SENTENCE_END = /[.!?][")\]]?$/;
  const CHUNK_MIN = 140;
  const chunks = [];
  let startTok = 0;
  let text = '';
  const starts = [];

  const pushChunk = (endTok) => {
    chunks.push({ startTok, endTok, text, starts: starts.slice() });
    startTok = endTok;
    text = '';
    starts.length = 0;
  };

  for (let i = 0; i < tokens.length; i++) {
    if (text) text += ' ';
    starts.push(text.length);
    text += tokens[i].text;
    const long = text.length >= CHUNK_MIN;
    if (long && SENTENCE_END.test(tokens[i].text)) pushChunk(i + 1);
  }
  if (text) pushChunk(tokens.length);

  /* ---------- highlight ---------- */

  const range = canHighlight ? document.createRange() : null;
  const highlight = canHighlight ? new window.Highlight() : null;
  if (canHighlight) CSS.highlights.set('read-aloud', highlight);

  const showWord = (tok) => {
    if (!canHighlight || !tok) return;
    try {
      range.setStart(tok.node, tok.start);
      range.setEnd(tok.node, tok.end);
      highlight.clear();
      highlight.add(range);
    } catch { return; }
    const r = range.getBoundingClientRect();
    const top = 96, bottom = innerHeight - 140;
    if (r.top < top || r.bottom > bottom) {
      scrollBy({ top: r.top - innerHeight * 0.4, behavior: 'smooth' });
    }
  };

  const clearWord = () => { if (canHighlight) highlight.clear(); };

  /* ---------- voice ---------- */

  let voice = null;
  const pickVoice = () => {
    const voices = synth.getVoices();
    if (!voices.length) return;
    const en = voices.filter(v => /^en(-|$)/i.test(v.lang));
    voice = en.find(v => v.default) ||
      en.find(v => /google|natural|samantha|siri/i.test(v.name)) ||
      en[0] || voices.find(v => v.default) || voices[0];
  };
  pickVoice();
  if (synth.getVoices().length === 0) {
    synth.addEventListener('voiceschanged', pickVoice, { once: true });
  }

  /* ---------- speed ---------- */

  const RATES = [1, 1.25, 1.5, 0.9];
  let rate = 1;
  try {
    const saved = parseFloat(localStorage.getItem('ns-read-rate'));
    if (RATES.includes(saved)) rate = saved;
  } catch { /* private mode: fall back to 1 */ }
  const showRate = () => { if (speedBtn) speedBtn.textContent = rate + '×'; };
  showRate();

  /* ---------- playback ---------- */

  let state = 'idle';   // idle | playing | paused
  let idx = 0;          // current chunk
  let gen = 0;          // generation guard: stale callbacks after a stop are ignored

  const setState = (s) => {
    state = s;
    const playing = s === 'playing';
    label.textContent = playing ? 'Pause' : (s === 'paused' ? 'Resume' : 'Listen');
    playBtn.setAttribute('aria-pressed', String(playing));
    bar.classList.toggle('is-active', s !== 'idle');
    if (stopBtn) stopBtn.hidden = s === 'idle';
  };

  const speakChunk = (i) => {
    const chunk = chunks[i];
    if (!chunk) { finish(); return; }
    const mine = gen;
    const u = new SpeechSynthesisUtterance(chunk.text);
    if (voice) u.voice = voice;
    u.rate = rate;
    u.onboundary = (e) => {
      if (mine !== gen || e.name === 'sentence') return;
      let lo = 0, hi = chunk.starts.length - 1, hit = 0;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (chunk.starts[mid] <= e.charIndex) { hit = mid; lo = mid + 1; }
        else hi = mid - 1;
      }
      showWord(tokens[chunk.startTok + hit]);
    };
    u.onend = () => {
      if (mine !== gen) return;
      idx = i + 1;
      if (idx < chunks.length) speakChunk(idx);
      else finish();
    };
    u.onerror = () => { if (mine === gen) finish(); };
    synth.speak(u);
  };

  function finish() {
    gen++;
    synth.cancel();
    clearWord();
    idx = 0;
    setState('idle');
  }

  const start = () => {
    gen++;
    synth.cancel();          // clear anything a previous page or click left queued
    idx = 0;
    setState('playing');
    speakChunk(0);
  };

  playBtn.addEventListener('click', () => {
    if (state === 'idle') start();
    else if (state === 'playing') { synth.pause(); setState('paused'); }
    else { synth.resume(); setState('playing'); }
  });

  if (stopBtn) stopBtn.addEventListener('click', finish);

  if (speedBtn) speedBtn.addEventListener('click', () => {
    rate = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    showRate();
    try { localStorage.setItem('ns-read-rate', String(rate)); } catch { /* ignore */ }
    if (state !== 'idle') { const at = idx; finish(); gen++; idx = at; setState('playing'); speakChunk(at); }
  });

  // a speaking utterance keeps going after navigation in some browsers; stop it
  addEventListener('pagehide', () => synth.cancel());
  addEventListener('beforeunload', () => synth.cancel());

  bar.hidden = false;
})();
