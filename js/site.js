// nabaruns.com — progressive enhancements. Everything here is optional:
// each control stays hidden until its feature is confirmed available.

(() => {
  'use strict';

  /* ---------- email: assembled only on a real click ---------- */

  const rev = document.querySelector('.reveal');
  if (rev) {
    rev.hidden = false;
    rev.addEventListener('click', () => {
      const a = rev.dataset.a, b = rev.dataset.b;
      const addr = atob([...a].map((c, i) => c + (b[i] || '')).join(''))
        .split('').reverse().join('');
      const link = document.createElement('a');
      link.href = 'ma' + 'ilto:' + addr;
      link.textContent = addr;
      rev.replaceWith(link);
      link.focus();
    }, { once: true });
  }

  /* ---------- QR ---------- */

  const qrBtn = document.querySelector('.qr-open');
  const qrDlg = document.getElementById('qr-dialog');
  if (qrBtn && qrDlg && qrDlg.showModal) {
    qrBtn.hidden = false;
    qrBtn.addEventListener('click', () => qrDlg.showModal());
    qrDlg.addEventListener('click', e => { if (e.target === qrDlg) qrDlg.close(); });
  }

  /* ---------- margin doodles ---------- */
  // The pencil is always live: drag anywhere and you leave a mark. Marks are
  // saved to localStorage, keyed per page, so they persist across reloads and
  // return visits until you clear them. Fine pointers only; on touch a drag
  // has to stay a scroll. The clear button is optional (it only exists on
  // pages that offer one), so the layer works with or without it.

  const clearBtn = document.querySelector('.draw-clear');
  const finePointer = matchMedia('(any-pointer: fine)').matches;
  if (!finePointer) return;

  // anything a reader might legitimately click, select or focus is left alone
  const INTERACTIVE = 'a, button, input, textarea, select, summary, label, dialog';

  const KEY = 'ns-doodle:' + location.pathname;
  let canvas = null, ctx = null, strokes = [], current = null;

  const docW = () => Math.max(document.documentElement.scrollWidth, innerWidth);
  const docH = () => Math.max(document.documentElement.scrollHeight, innerHeight);

  const load = () => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  };

  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(strokes));
    } catch { /* private mode or quota, the drawing just won't persist */ }
  };

  function build() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.className = 'doodle';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    size();
    addEventListener('resize', size);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paint);
  }

  function size() {
    const w = docW(), h = docH(), dpr = devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paint();
  }

  function paint() {
    if (!ctx) return;
    const ink = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent').trim() || '#9c3b1b';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineWidth = 2.25;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const s of strokes) {
      if (s.length === 1) {
        ctx.beginPath();
        ctx.arc(s[0][0], s[0][1], 1.2, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(s[0][0], s[0][1]);
      for (let i = 1; i < s.length; i++) ctx.lineTo(s[i][0], s[i][1]);
      ctx.stroke();
    }
  }

  const at = e => [Math.round(e.pageX * 10) / 10, Math.round(e.pageY * 10) / 10];

  function down(e) {
    if (e.button !== 0 || e.pointerType === 'touch') return;
    if (e.target.closest(INTERACTIVE)) return;   // let links and controls behave
    e.preventDefault();                          // and suppress the text selection
    build();
    current = [at(e)];
    strokes.push(current);
    paint();
  }

  function move(e) {
    if (!current) return;
    const p = at(e), last = current[current.length - 1];
    if (Math.abs(p[0] - last[0]) < 1 && Math.abs(p[1] - last[1]) < 1) return;
    current.push(p);
    paint();
  }

  function up() {
    if (!current) return;
    current = null;
    save();
    sync();
  }

  function sync() {
    if (clearBtn) clearBtn.hidden = !strokes.length;
  }

  if (clearBtn) clearBtn.addEventListener('click', () => {
    strokes = [];
    current = null;
    save();
    if (ctx) paint();
    sync();
  });

  document.addEventListener('pointerdown', down);
  addEventListener('pointermove', move);
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);
  document.body.classList.add('can-draw');

  // restore anything drawn earlier this session
  strokes = load();
  if (strokes.length) { build(); paint(); }
  sync();
})();
