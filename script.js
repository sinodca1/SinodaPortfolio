/* ================================================
   SINODA TESFAY PORTFOLIO - script.js
   ================================================ */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ---------- HERO INTRO: typing + signature logo ---------- */
const ROLE_TEXT = 'Full-Stack & Systems Engineer';
const roleEl = document.getElementById('role-typing');
const logoEl = document.getElementById('logo-sig');

let roleTimer = null;

/* Type the role once, from empty, then stop. */
function typeRole() {
  if (!roleEl) return;
  if (roleTimer) clearTimeout(roleTimer);
  roleEl.textContent = '';
  let i = 0;
  const step = () => {
    roleEl.textContent = ROLE_TEXT.slice(0, i);
    if (i <= ROLE_TEXT.length) {
      i++;
      roleTimer = setTimeout(step, 55);
    }
  };
  step();
}

/* Replay the signature write-on. The underline shares the same keyframe
   timing, so both edges travel across the logo together. */
function playSignature() {
  if (!logoEl) return;
  logoEl.classList.remove('play');
  void logoEl.offsetWidth; // force reflow so the animation restarts
  logoEl.classList.add('play');
}

function playHeroIntro() {
  playSignature();
  typeRole();
}

/* Replay the intro when the user scrolls back to the top after going down. */
let scrolledAway = false;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (y > 500) scrolledAway = true;
  if (scrolledAway && y < 30) {
    scrolledAway = false;
    playHeroIntro();
  }
}, { passive: true });


/* ---------- LOADING SCREEN ----------
   Runs on every load: the ring and bar fill while the build log ticks
   over, then the whole panel dissolves into the hero. */
(function preloader() {
  const root = document.getElementById('preloader');
  if (!root) { playHeroIntro(); return; }

  const arcEl     = document.getElementById('pre-arc');
  const fillEl    = document.getElementById('pre-fill');
  const statusEl  = document.getElementById('pre-status');
  const modulesEl = document.getElementById('pre-modules');
  const pctEl     = document.getElementById('pre-pct');

  const STAGES = [
    { at:  0, text: 'initializing interface' },
    { at: 14, text: 'compiling design tokens' },
    { at: 30, text: 'loading project archive' },
    { at: 48, text: 'warming the inference layer' },
    { at: 64, text: 'linking systems telemetry' },
    { at: 80, text: 'calibrating scroll timeline' },
    { at: 94, text: 'ready' },
  ];

  const TOTAL_MODULES = 12;
  const ARC_LENGTH    = 364.4;              // 2 * PI * r, r = 58
  const DURATION      = REDUCED ? 600 : 2600;

  let finished = false;
  let pageReady = document.readyState === 'complete';
  window.addEventListener('load', () => { pageReady = true; });

  let stage = -1;
  function paint(p) {
    const pct = Math.round(p);
    if (fillEl) fillEl.style.width = pct + '%';
    if (arcEl)  arcEl.style.strokeDashoffset = ARC_LENGTH * (1 - p / 100);
    if (pctEl)  pctEl.textContent = pct + '%';
    if (modulesEl) {
      const done = Math.min(TOTAL_MODULES, Math.round((p / 100) * TOTAL_MODULES));
      modulesEl.textContent = 'modules ' + String(done).padStart(2, '0') + ' / ' + TOTAL_MODULES;
    }
    for (let i = STAGES.length - 1; i >= 0; i--) {
      if (pct >= STAGES[i].at) {
        if (stage !== i) { stage = i; if (statusEl) statusEl.textContent = STAGES[i].text; }
        break;
      }
    }
  }

  function dismiss() {
    if (finished) return;
    finished = true;
    document.body.classList.remove('preloading');
    playHeroIntro();
    setTimeout(() => root.classList.add('gone'), 950);
  }

  const started = performance.now();
  function frame(now) {
    const t = Math.min((now - started) / DURATION, 1);
    paint((1 - Math.pow(1 - t, 2.2)) * 100);
    if (t < 1) { requestAnimationFrame(frame); return; }
    // Sit at 100% until the page itself is ready, but never stall forever.
    const holdStarted = performance.now();
    (function hold() {
      if (pageReady || performance.now() - holdStarted > 2000) {
        setTimeout(dismiss, REDUCED ? 0 : 320);
      } else {
        requestAnimationFrame(hold);
      }
    })();
  }
  paint(0);
  requestAnimationFrame(frame);

  // Hard safety net: never trap the visitor behind the loader.
  setTimeout(dismiss, 7000);
})();


/* ---------- FULL NAME REVEAL (tap support on touch devices) ---------- */
const heroName = document.getElementById('hero-name');
if (heroName) {
  heroName.addEventListener('click', () => heroName.classList.toggle('show-mid'));
}


/* ---------- THEME TOGGLE + LIVE FAVICON ---------- */
const themeToggle = document.getElementById('theme-toggle');
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const faviconLink = document.querySelector('link[rel="icon"]');

/* The tile mark from favicon.svg is redrawn on a canvas so it can morph
   between the dark and light palettes as the in-page toggle flips. */
const faviconCanvas = document.createElement('canvas');
faviconCanvas.width = faviconCanvas.height = 64;

const FAV_BG_DARK   = [11, 11, 13],   FAV_BG_LIGHT   = [255, 255, 255];
const FAV_TILE_DARK = [155, 224, 0],  FAV_TILE_LIGHT = [63, 122, 0];
const FAV_DOT_DARK  = [47, 106, 0],   FAV_DOT_LIGHT  = [155, 224, 0];

function favMix(a, b, t) {
  const c = i => Math.round(a[i] + (b[i] - a[i]) * t);
  return `rgb(${c(0)},${c(1)},${c(2)})`;
}

function favRoundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

/* t = 0 -> dark theme, t = 1 -> light theme */
function drawFavicon(t) {
  if (!faviconLink) return;
  const ctx = faviconCanvas.getContext('2d');
  const S = faviconCanvas.width;
  ctx.clearRect(0, 0, S, S);
  ctx.save();
  ctx.scale(S / 512, S / 512);

  // squircle background
  ctx.fillStyle = favMix(FAV_BG_DARK, FAV_BG_LIGHT, t);
  favRoundRect(ctx, 0, 0, 512, 512, 120);
  ctx.fill();

  // three rounded tiles
  ctx.fillStyle = favMix(FAV_TILE_DARK, FAV_TILE_LIGHT, t);
  [[92, 92], [270, 92], [92, 270]].forEach(([x, y]) => {
    favRoundRect(ctx, x, y, 150, 150, 40);
    ctx.fill();
  });

  // the fourth cell, as a dot
  ctx.fillStyle = favMix(FAV_DOT_DARK, FAV_DOT_LIGHT, t);
  ctx.beginPath();
  ctx.arc(345, 345, 75, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  faviconLink.type = 'image/png';
  faviconLink.href = faviconCanvas.toDataURL('image/png');
}

let faviconT = 0;
let faviconAnim = null;
function animateFavicon(target) {
  if (faviconAnim) cancelAnimationFrame(faviconAnim);
  const start = faviconT;
  const t0 = performance.now();
  const dur = 450;
  function step(now) {
    const p = Math.min((now - t0) / dur, 1);
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // easeInOutQuad
    faviconT = start + (target - start) * e;
    drawFavicon(faviconT);
    faviconAnim = p < 1 ? requestAnimationFrame(step) : null;
  }
  faviconAnim = requestAnimationFrame(step);
}

function applyThemeChrome(isLight) {
  if (themeColorMeta) themeColorMeta.setAttribute('content', isLight ? '#f6f6f4' : '#09090b');
}

if (themeToggle) {
  // The inline head script already painted body.light-theme; mirror it here.
  const isLightNow = document.body.classList.contains('light-theme');
  if (isLightNow) themeToggle.classList.add('light');
  applyThemeChrome(isLightNow);

  // paint the initial favicon to match the starting theme (no animation)
  faviconT = isLightNow ? 1 : 0;
  drawFavicon(faviconT);

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    themeToggle.classList.toggle('light');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    applyThemeChrome(isLight);
    animateFavicon(isLight ? 1 : 0); // smooth morph between palettes
  });
}


/* ---------- CURSOR-FOLLOWING GLOW DOT ---------- */
const cursorDot = document.querySelector('.cursor-dot');
if (cursorDot && window.matchMedia('(hover: hover)').matches) {
  let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
  let cx = tx, cy = ty;

  window.addEventListener('mousemove', e => {
    tx = e.clientX; ty = e.clientY;
    cursorDot.style.opacity = '';
  }, { passive: true });

  document.addEventListener('mouseleave', () => { cursorDot.style.opacity = '0'; });

  const interactive = 'a, button, .project-card, .exp-card, .theme-switch, .social-pill, .tag, .hero-title';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(interactive)) cursorDot.classList.add('hovering');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(interactive)) cursorDot.classList.remove('hovering');
  });

  (function loopDot() {
    cx += (tx - cx) * 0.16;
    cy += (ty - cy) * 0.16;
    cursorDot.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(loopDot);
  })();
}


/* ---------- ACTIVE NAV HIGHLIGHT ---------- */
const sections  = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('nav a');

function updateNav() {
  const scrollY = window.scrollY + 180;
  sections.forEach(sec => {
    const id = sec.getAttribute('id');
    if (scrollY >= sec.offsetTop && scrollY < sec.offsetTop + sec.offsetHeight) {
      navLinks.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + id);
      });
    }
  });
}

window.addEventListener('scroll', updateNav, { passive: true });
document.addEventListener('DOMContentLoaded', updateNav);


/* ---------- SMOOTH SCROLL ---------- */
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    if (!href.startsWith('#')) return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});


/* ---------- SECTION TITLES: SPLIT INTO RISING WORDS ---------- */
document.querySelectorAll('.section-title').forEach(title => {
  if (title.dataset.split) return;
  title.dataset.split = '1';

  const frag = document.createDocumentFragment();
  let index = 0;

  const addWords = (text, accent) => {
    text.split(/\s+/).filter(Boolean).forEach(word => {
      const outer = document.createElement('span');
      outer.className = accent ? 'w w-accent' : 'w';
      outer.style.setProperty('--i', index++);
      const inner = document.createElement('span');
      inner.className = 'w-in';
      inner.textContent = word;
      outer.appendChild(inner);
      frag.appendChild(outer);
      frag.appendChild(document.createTextNode(' '));
    });
  };

  Array.from(title.childNodes).forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) addWords(node.textContent, false);
    else addWords(node.textContent, true);   // the <span> accent fragment
  });

  title.textContent = '';
  title.appendChild(frag);
});


/* ---------- SCROLL REVEAL ---------- */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const delay = parseInt(entry.target.dataset.delay || 0, 10);
    setTimeout(() => entry.target.classList.add('visible'), delay);
    revealObs.unobserve(entry.target);
  });
}, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));


/* ---------- STAGGERED CHIP CASCADES ---------- */
const staggerObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('shown');
    staggerObs.unobserve(entry.target);
  });
}, { threshold: 0.2 });

document.querySelectorAll('[data-stagger]').forEach(group => {
  Array.from(group.children).forEach((child, i) => child.style.setProperty('--i', i));
  staggerObs.observe(group);
});


/* ---------- TIMELINE SPINE DRAW-IN ---------- */
const timelineObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('drawn');
    timelineObs.unobserve(entry.target);
  });
}, { threshold: 0.05 });

document.querySelectorAll('.timeline').forEach(el => timelineObs.observe(el));


/* ---------- SCROLL PROGRESS + HERO PARALLAX ---------- */
const progressBar = document.getElementById('scroll-progress-bar');
const heroInner   = document.getElementById('hero-inner');
const headerEl    = document.getElementById('site-header');

let scrollTicking = false;
function onScrollFrame() {
  scrollTicking = false;
  const y = window.scrollY;

  if (progressBar) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (max > 0 ? Math.min(y / max, 1) * 100 : 0) + '%';
  }

  if (heroInner && !REDUCED) {
    const vh = window.innerHeight || 1;
    const p = Math.min(y / vh, 1);
    heroInner.style.setProperty('--hero-shift', (p * 90).toFixed(1) + 'px');
    heroInner.style.setProperty('--hero-fade', Math.max(0, 1 - p * 1.25).toFixed(3));
  }

  if (headerEl) {
    headerEl.style.boxShadow = y > 20 ? '0 1px 30px rgba(0,0,0,0.3)' : 'none';
  }
}

window.addEventListener('scroll', () => {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(onScrollFrame);
}, { passive: true });
onScrollFrame();


/* ---------- EXPERIENCE CARD CURSOR-TILT ---------- */
(function () {
  const canHover = window.matchMedia('(hover: hover)').matches;
  if (!canHover || REDUCED) return;

  document.querySelectorAll('.exp-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;   // 0 = left edge, 1 = right edge
      const py = (e.clientY - r.top) / r.height;   // 0 = top,  1 = bottom
      const rotY = (px - 0.5) * 9;                 // lean toward the cursor side
      const rotX = (0.5 - py) * 5;
      card.style.transform =
        `perspective(900px) rotateY(${rotY.toFixed(2)}deg) rotateX(${rotX.toFixed(2)}deg) scale(1.025)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
})();
