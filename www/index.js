// highlight the download link for the visitor's OS
const os = /android/i.test(navigator.userAgent) ? 'android'
  : /mac/i.test(navigator.platform) && navigator.maxTouchPoints < 2 ? 'mac' : null;
document.querySelectorAll(`[data-os="${os}"]`).forEach(a => a.classList.add('primary'));

const list = document.querySelector('.projects');
const projects = [...list.children];
projects.forEach((li, i) => {
  li.dataset.cool = i;
  // keep each project's number when the list is re-sorted
  li.style.counterSet = `project ${i + 1}`;
});

// "cool" puts the coolest first, "date" the oldest and "name" A to Z.
// A leading "-" flips it. "/dev/random" shuffles every time you pick it.
function sortProjects(by) {
  const flip = by.startsWith('-') ? -1 : 1;
  const key = by.replace('-', '');
  const shuffle = new Map(projects.map((li) => [li, Math.random()]));
  const title = (li) => li.querySelector('h2').textContent;
  const compare = {
    cool: (a, b) => a.dataset.cool - b.dataset.cool,
    date: (a, b) => a.dataset.date.localeCompare(b.dataset.date),
    name: (a, b) => title(a).localeCompare(title(b)),
    '/dev/random': (a, b) => shuffle.get(a) - shuffle.get(b),
  }[key];
  const sorted = [...projects].sort((a, b) => (
    flip * (compare(a, b) || a.dataset.cool - b.dataset.cool)
  ));
  list.append(...sorted);
}

const select = document.getElementById('sort');
select.addEventListener('change', () => sortProjects(select.value));

// the name is a real text box. Type anywhere to edit it, escape to undo
const ORIGINAL_NAME = 'andrew macheret';
const nameBox = document.getElementById('name');
const cursor = document.querySelector('h1 .cursor');
const ghost = document.querySelector('h1 .ghost');
const mark = document.createElement('span');
mark.textContent = '_';

function renderName() {
  const name = nameBox.textContent;
  const slug = name.replace(/[^a-z0-9]/gi, '');
  document.querySelectorAll('[data-slug]').forEach((el) => { el.textContent = slug; });
  document.title = name || '\u00a0';
}

// where the caret is in the name, as a letter count.
// null when the name isn't focused, -1 when some text is selected
function caretAt() {
  const sel = getSelection();
  if (document.activeElement !== nameBox || !sel.rangeCount) return null;
  const range = sel.getRangeAt(0);
  if (!range.collapsed) return -1;
  const before = document.createRange();
  before.selectNodeContents(nameBox);
  before.setEnd(range.endContainer, range.endOffset);
  return before.toString().length;
}

function setCaret(at) {
  const text = nameBox.firstChild;
  if (text) getSelection().collapse(text, Math.min(at, text.length));
}

function focusName() {
  nameBox.focus({ preventScroll: true });
  setCaret(nameBox.textContent.length);
}

// where the cursor would sit after the first n letters, measured on a hidden copy
function spot(n) {
  ghost.textContent = nameBox.textContent.slice(0, n);
  ghost.append(mark);
  return { x: mark.offsetLeft, y: mark.offsetTop };
}

// the _ cursor sits after the name. If the caret is earlier, slide it back under that letter
function placeCursor() {
  const at = caretAt();
  const end = nameBox.textContent.length;
  let x = 0;
  let y = 0;
  if (at !== null && at >= 0 && at < end) {
    const here = spot(at);
    const last = spot(end);
    x = here.x - last.x;
    y = here.y - last.y;
  }
  cursor.style.left = x ? `${x}px` : '';
  cursor.style.top = y ? `${y}px` : '';
  // hide it while text is selected so the highlight shows
  cursor.style.visibility = at === -1 ? 'hidden' : '';
  // keep the cursor solid while typing, like a real terminal
  cursor.style.animation = 'none';
  void cursor.offsetWidth;
  cursor.style.animation = '';
}

function resetName() {
  nameBox.textContent = ORIGINAL_NAME;
  if (document.activeElement === nameBox) setCaret(ORIGINAL_NAME.length);
  renderName();
  placeCursor();
}

nameBox.addEventListener('input', () => {
  // keep it one line of plain text, even after pasting
  const text = nameBox.textContent;
  const clean = text.replace(/[\r\n\t\u00a0]/g, ' ');
  if (clean !== text || nameBox.childElementCount) {
    const at = caretAt();
    nameBox.textContent = clean;
    setCaret(at ?? clean.length);
  }
  renderName();
  placeCursor();
});

document.addEventListener('selectionchange', placeCursor);
nameBox.addEventListener('blur', placeCursor);
addEventListener('resize', placeCursor);

// clicking the _ or the empty space next to the name focuses it too
document.querySelector('h1').addEventListener('click', (e) => {
  if (e.target !== nameBox) focusName();
});

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
  if (e.target === nameBox) {
    if (e.key === 'Enter') {
      e.preventDefault();
      nameBox.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      resetName();
    }
    return;
  }
  // let the sort dropdown and links keep their own keys
  if (e.target.closest('select')) return;
  if ((e.key === ' ' || e.key === 'Enter') && e.target.closest('a, button')) return;

  if (e.key === 'Escape') {
    resetName();
  } else if (e.key.length === 1 || e.key === 'Backspace') {
    // moving focus here sends this key to the name box
    focusName();
  }
});

// 3d mode tilts the page toward the mouse and floats each part at its own depth
const root = document.documentElement;
const toggle3d = document.getElementById('toggle-3d');
const gaps = [...document.querySelectorAll('.filters feOffset')];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const noMouse = matchMedia('(hover: none)');
let on3d = false;
// 0 is flat, 1 is all the way 3d
let depth = 0;
// where you look from. 0.5, 0.5 is a little below and to the right
const eye = { x: 0.5, y: 0.5 };
const eyeGoal = { x: 0.5, y: 0.5 };
let frame = 0;

function render3d() {
  frame = 0;
  const ease = reduceMotion.matches ? 1 : 0.08;
  const goal = on3d ? 1 : 0;
  depth += (goal - depth) * ease;
  eye.x += (eyeGoal.x - eye.x) * ease;
  eye.y += (eyeGoal.y - eye.y) * ease;
  const settled = Math.max(
    Math.abs(goal - depth), Math.abs(eyeGoal.x - eye.x), Math.abs(eyeGoal.y - eye.y),
  ) < 0.001;
  if (settled) {
    depth = goal;
    Object.assign(eye, eyeGoal);
  }
  root.style.setProperty('--depth', depth);
  root.style.setProperty('--eye-x', eye.x);
  root.style.setProperty('--eye-y', eye.y);
  gaps.forEach((el) => el.setAttribute('dx', el.dataset.gap * depth));
  if (!on3d && depth === 0) root.classList.remove('three-d');
  if (!settled) frame = requestAnimationFrame(render3d);
}

function update3d() {
  if (!frame) frame = requestAnimationFrame(render3d);
}

// middle of an element on the page, ignoring the 3d tilt
function pageCenter(el) {
  let x = el.offsetWidth / 2;
  let y = el.offsetHeight / 2;
  for (; el; el = el.offsetParent) {
    x += el.offsetLeft;
    y += el.offsetTop;
  }
  return { x, y };
}

// tilt around the 3d button so it doesn't move.
// After scrolling half a screen, tilt around the middle of the screen instead
function trackScroll() {
  const main = document.querySelector('main');
  const button = pageCenter(toggle3d);
  const away = Math.min(scrollY / (innerHeight / 2), 1);
  const y = button.y + (scrollY + innerHeight / 2 - button.y) * away;
  // set on main, not the root, so scrolling doesn't restyle the whole page
  main.style.setProperty('--pivot-x', `${button.x - main.offsetLeft}px`);
  main.style.setProperty('--pivot-y', `${y - main.offsetTop}px`);
  drawFloor();
}

// the grid floor rolls toward you as you scroll. It's drawn on a canvas
// because thin far-off lines in a css 3d grid flicker
const floor = document.querySelector('.floor');
function drawFloor() {
  const dpr = devicePixelRatio || 1;
  const w = Math.round(innerWidth * dpr);
  const h = Math.round(innerHeight * dpr);
  if (floor.width !== w || floor.height !== h) {
    floor.width = w;
    floor.height = h;
  }
  const ctx = floor.getContext('2d');
  // the horizon is 18% up from the bottom, where the sun sets
  const horizon = h * 0.82;
  const near = h - horizon;
  const step = 0.25;
  ctx.clearRect(0, 0, w, h);
  // solid ground hides the bottom of the sun
  ctx.fillStyle = '#0b0d0c';
  ctx.fillRect(0, horizon, w, near);
  // fade out fast toward the horizon, where the lines bunch up
  const fade = ctx.createLinearGradient(0, horizon, 0, h);
  fade.addColorStop(0, 'rgb(126 231 135 / 0)');
  fade.addColorStop(0.3, 'rgb(126 231 135 / 0.03)');
  fade.addColorStop(1, 'rgb(126 231 135 / 0.3)');
  ctx.fillStyle = fade;
  ctx.strokeStyle = fade;
  ctx.lineWidth = dpr;

  // a line z away sits near / z below the horizon. z = 1 is the bottom of the screen
  const shift = ((scrollY / 192) * step) % step;
  for (let z = step - shift; near / z > dpr; z += step) {
    if (near / z < near + dpr) ctx.fillRect(0, horizon + near / z - dpr / 2, w, dpr);
  }

  // lines going into the distance all meet in the middle of the horizon
  const gap = step * near;
  const count = Math.ceil((1.5 * w) / gap);
  ctx.beginPath();
  for (let i = -count; i <= count; i++) {
    ctx.moveTo(w / 2, horizon);
    ctx.lineTo(w / 2 + i * gap, h);
  }
  ctx.stroke();
}

toggle3d.addEventListener('click', () => {
  on3d = !on3d;
  toggle3d.setAttribute('aria-pressed', on3d);
  if (on3d) {
    trackScroll();
    root.classList.add('three-d');
    // phones have no mouse to follow, so lean a bit in a random direction instead
    if (noMouse.matches) {
      const angle = Math.random() * 2 * Math.PI;
      const lean = 0.25 + Math.random() * 0.15;
      eyeGoal.x = 0.5 + lean * Math.cos(angle);
      eyeGoal.y = 0.5 + lean * Math.sin(angle);
    }
  } else {
    Object.assign(eyeGoal, { x: 0.5, y: 0.5 });
  }
  update3d();
});

for (const type of ['scroll', 'resize']) {
  addEventListener(type, () => {
    if (!root.classList.contains('three-d')) return;
    // phones use a fixed tilt, so scrolling has nothing to update
    if (type === 'scroll' && noMouse.matches) return;
    trackScroll();
  }, { passive: true });
}

// touches don't steer the tilt. Lifting a finger would snap it back to flat
addEventListener('pointermove', (e) => {
  if (!on3d || reduceMotion.matches || e.pointerType === 'touch') return;
  eyeGoal.x = 0.5 + 0.7 * ((e.clientX / innerWidth) * 2 - 1);
  eyeGoal.y = 0.5 + 0.7 * ((e.clientY / innerHeight) * 2 - 1);
  update3d();
});

root.addEventListener('pointerleave', (e) => {
  if (e.pointerType === 'touch') return;
  Object.assign(eyeGoal, { x: 0.5, y: 0.5 });
  update3d();
});

const punReady = fetch('https://pun.andrewmacheret.com/', { headers: { Accept: 'text/plain' } })
  .then((res) => (res.ok ? res.text() : Promise.reject()))
  .then((pun) => {
    document.getElementById('pun-text').textContent = pun.trim();
    document.getElementById('pun').hidden = false;
    return true;
  })
  .catch(() => false);

// on load, type out each command and then show its output
// a click skips to the end
let skip = false;
const wait = (ms) => (skip ? Promise.resolve() : new Promise((r) => setTimeout(r, ms)));
const show = (...els) => els.forEach((el) => el.classList.add('on'));

// wait until el is fully scrolled into view
let stopWaiting = () => {};
function inView(el) {
  if (skip) return Promise.resolve();
  return new Promise((resolve) => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) stopWaiting();
    }, { threshold: 1 });
    stopWaiting = () => {
      observer.disconnect();
      resolve();
    };
    observer.observe(el);
  });
}

const caret = cursor.cloneNode(true);

async function typeLine(prompt) {
  await inView(prompt);
  const cmd = prompt.querySelector('.cmd');
  const walker = document.createTreeWalker(cmd, NodeFilter.SHOW_TEXT);
  const parts = [];
  while (walker.nextNode()) parts.push([walker.currentNode, walker.currentNode.data]);
  parts.forEach(([node]) => { node.data = ''; });

  caret.style.animation = '';
  cmd.append(caret);
  show(prompt);
  await wait(300);
  caret.style.animation = 'none';
  for (const [node, text] of parts) {
    for (const ch of text) {
      if (skip) break;
      node.data += ch;
      await wait(15 + Math.random() * 35);
    }
    node.data = text;
  }
  caret.remove();
}

async function boot() {
  const header = document.querySelector('header');
  await typeLine(header.querySelector('.prompt'));
  await wait(150);
  show(...header.children);
  if (document.activeElement === document.body) focusName();
  await wait(400);

  await typeLine(select.closest('.prompt'));
  show(select);
  await wait(200);
  for (const li of [...list.children]) {
    show(li);
    await wait(80);
  }
  await wait(300);

  if (await Promise.race([punReady, wait(2000).then(() => false)])) {
    await typeLine(document.querySelector('#pun .prompt'));
    await wait(400);
    show(document.getElementById('pun-text'));
    await wait(300);
  }

  const exit = document.querySelector('footer .prompt');
  await inView(exit);
  show(exit.parentElement);
  await typeLine(exit);
  document.documentElement.classList.remove('boot');
}

addEventListener('click', () => {
  skip = true;
  stopWaiting();
}, { once: true });
boot();
