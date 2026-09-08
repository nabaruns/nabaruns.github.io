// nabaruns.com/blog — table-of-contents scroll highlighting.
// Progressive: the TOC is plain anchor links without this; the script only
// adds the "you are here" highlight as the reader scrolls.

(() => {
  'use strict';

  const toc = document.querySelector('.toc');
  if (!toc) return;

  const map = new Map();   // heading element -> its TOC link
  const targets = [];      // heading elements, in document order
  for (const a of toc.querySelectorAll('a')) {
    const el = document.getElementById(decodeURIComponent(a.hash.slice(1)));
    if (el) { map.set(el, a); targets.push(el); }
  }
  if (!targets.length) return;

  const OFFSET = 110;      // a heading counts as "reached" once near the top
  let active = null;

  const setActive = el => {
    if (el === active) return;
    if (active) map.get(active).classList.remove('is-active');
    active = el;
    if (el) map.get(el).classList.add('is-active');
  };

  const update = () => {
    const doc = document.documentElement;
    let current = targets[0];
    for (const el of targets) {
      if (el.getBoundingClientRect().top - OFFSET <= 0) current = el;
      else break;
    }
    // at the very bottom, the last section is the one being read
    if (innerHeight + Math.ceil(scrollY) >= doc.scrollHeight - 2) {
      current = targets[targets.length - 1];
    }
    setActive(current);
  };

  // update() is a handful of getBoundingClientRect reads, cheap enough to run
  // straight from the scroll handler. (Deliberately not rAF-throttled: a
  // backgrounded tab pauses rAF, which would freeze the highlight.)
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
})();
