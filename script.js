/* ================================================
   SINODA TESFAY PORTFOLIO - script.js
   ================================================ */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ---------- HERO INTRO: typing + signature logo ---------- */
const ROLE_TEXT = 'Full-Stack & Systems Engineer';
const roleEl = document.getElementById('role-typing');
const logoEl = document.getElementById('logo-sig');

const ROLE_SPEED = 68;        // ms per character
let roleFrame = null;

/* Type the role once, from empty, then stop.
   Driven off the frame clock rather than a chain of setTimeouts: a timeout
   chain drifts under load and lands characters unevenly, which is what made
   the line stutter. Here the character count is derived from elapsed time, so
   the cadence stays even, and the DOM is only touched when the count actually
   changes. The span is also held at the line's full width (see --role-len),
   so characters appear in place instead of shunting the centred line sideways
   on every keystroke. */
/* Reserve exactly the finished line's width. Counting `ch` undershoots it -
   letter-spacing is not part of a character cell - and the line wrapped, so
   measure the real thing at the current font size instead. */
function measureRoleWidth() {
  if (!roleEl) return;
  const prev = roleEl.textContent;
  roleEl.style.width = 'auto';
  roleEl.textContent = ROLE_TEXT;
  const w = Math.ceil(roleEl.getBoundingClientRect().width) + 1;
  roleEl.style.width = '';
  roleEl.style.setProperty('--role-len', w + 'px');
  roleEl.textContent = prev;
}

if (roleEl) {
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureRoleWidth);
  window.addEventListener('resize', measureRoleWidth);
}

function typeRole() {
  if (!roleEl) return;
  if (roleFrame) cancelAnimationFrame(roleFrame);

  measureRoleWidth();
  roleEl.textContent = '';
  if (REDUCED) { roleEl.textContent = ROLE_TEXT; return; }

  const started = performance.now();
  let shown = -1;

  const step = (now) => {
    const i = Math.min(ROLE_TEXT.length, Math.floor((now - started) / ROLE_SPEED));
    if (i !== shown) {
      shown = i;
      roleEl.textContent = ROLE_TEXT.slice(0, i);
    }
    roleFrame = i < ROLE_TEXT.length ? requestAnimationFrame(step) : null;
  };
  roleFrame = requestAnimationFrame(step);
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


/* ---------- FULL NAME REVEAL ----------
   The middle name unfolds by animating max-width. Guessing that width in `ch`
   overshot the real word, so the easing spent its last stretch travelling past
   text that had already finished moving - which is what read as a stutter.
   Measuring the word and handing the exact px to CSS makes the curve land
   right on it. Re-measured once the display webfont swaps in, and on resize. */
const heroName = document.getElementById('hero-name');
if (heroName) {
  const midEl = heroName.querySelector('.nm-mid');

  function measureMiddleName() {
    if (!midEl) return;
    const w = midEl.scrollWidth;           // full content width despite max-width: 0
    if (w > 0) heroName.style.setProperty('--mid-w', w + 'px');
  }

  measureMiddleName();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureMiddleName);
  window.addEventListener('resize', measureMiddleName);

  // Tap support on touch devices, where there is no hover.
  heroName.addEventListener('click', () => heroName.classList.toggle('show-mid'));
}


/* ---------- THEME: light -> dark -> system ----------
   The inline head script already resolved and painted the mode before first
   paint; this mirrors it into the toggle and cycles it on click. */
const themeToggle = document.getElementById('theme-toggle');
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const THEME_KEY = 'folio-theme';
const THEME_MODES = ['light', 'dark', 'system'];
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(mode) {
  const resolved = mode === 'system' ? (systemDark.matches ? 'dark' : 'light') : mode;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themeMode = mode;
  if (themeToggle) {
    themeToggle.dataset.mode = mode;
    themeToggle.setAttribute('aria-label', 'Theme: ' + mode + ' (click to switch)');
    themeToggle.setAttribute('title', 'Theme: ' + mode);
  }
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', resolved === 'dark' ? '#070907' : '#fafbf8');
  }
}

let themeMode = document.documentElement.dataset.themeMode || 'system';
if (THEME_MODES.indexOf(themeMode) === -1) themeMode = 'system';
applyTheme(themeMode);

// In system mode, follow the OS if it flips while the page is open.
systemDark.addEventListener('change', () => {
  if (themeMode === 'system') applyTheme('system');
});

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    themeMode = THEME_MODES[(THEME_MODES.indexOf(themeMode) + 1) % THEME_MODES.length];
    try { localStorage.setItem(THEME_KEY, themeMode); } catch (e) { /* storage blocked */ }
    applyTheme(themeMode);
  });
}

/* ---------- CURSOR-TRAILING DOT ----------
   Spring physics: hard acceleration toward the pointer, slightly
   underdamped, so quick direction changes overshoot and snap back.
   The dot stays hidden until the pointer has actually moved. */
const cursorDot = document.querySelector('.cursor-dot');
if (cursorDot && !REDUCED && !window.matchMedia('(pointer: coarse)').matches) {
  const lag = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--cursor-dot-lag')
  ) || 0.18;
  const stiffness = 320 * lag / 0.18;
  const damping = 2 * Math.sqrt(stiffness) * 0.62;   // under critical -> overshoot on turns

  let tx = -100, ty = -100, x = -100, y = -100, vx = 0, vy = 0, seen = false, lastT = 0;

  document.addEventListener('mousemove', e => {
    tx = e.clientX; ty = e.clientY;
    if (!seen) { seen = true; x = tx; y = ty; cursorDot.style.opacity = '1'; }
  }, { passive: true });

  document.documentElement.addEventListener('mouseleave', () => {
    seen = false;
    cursorDot.style.opacity = '0';
  });

  (function loopDot(t) {
    requestAnimationFrame(loopDot);
    const dt = Math.min((t - (lastT || t)) / 1000, 0.05);
    lastT = t;
    vx += (stiffness * (tx - x) - damping * vx) * dt;
    vy += (stiffness * (ty - y) - damping * vy) * dt;
    x += vx * dt; y += vy * dt;
    const half = cursorDot.offsetWidth / 2;
    cursorDot.style.transform = `translate(${(x - half).toFixed(2)}px, ${(y - half).toFixed(2)}px)`;
  })(0);
}


/* ---------- ACTIVE NAV + MAGNETIC PILL ----------
   One lozenge glides between nav items instead of each link carrying its
   own underline. It stretches slightly in the direction of travel, so a
   long jump reads as momentum rather than a teleport. */
const sections  = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('nav a');
const navEl     = document.querySelector('nav');
const navPill   = document.getElementById('nav-pill');

function activeLink() {
  return document.querySelector('nav a.active') || navLinks[0];
}

function movePill(link) {
  if (!navPill || !navEl || !link) return;
  const nav = navEl.getBoundingClientRect();
  const box = link.getBoundingClientRect();
  if (!box.width) return;

  const x    = box.left - nav.left;
  const prev = parseFloat(navPill.style.getPropertyValue('--pill-x')) || 0;
  const trip = Math.abs(x - prev);

  navPill.style.width = box.width + 'px';
  navPill.style.top   = (box.top - nav.top + box.height / 2) + 'px';
  navPill.style.setProperty('--pill-x', x + 'px');

  // Stretch along the direction of travel, then settle back.
  if (!REDUCED && trip > 8) {
    navPill.style.setProperty('--pill-squash', Math.min(1 + trip / 900, 1.14));
    clearTimeout(navPill._settle);
    navPill._settle = setTimeout(() => navPill.style.setProperty('--pill-squash', 1), 200);
  }
  navPill.classList.add('ready');
}

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
  if (!navEl || !navEl.matches(':hover')) movePill(activeLink());
}

// Follow the cursor across the nav, then snap back to the current section.
navLinks.forEach(link => link.addEventListener('mouseenter', () => movePill(link)));
if (navEl) navEl.addEventListener('mouseleave', () => movePill(activeLink()));

window.addEventListener('scroll', updateNav, { passive: true });
window.addEventListener('resize', () => movePill(activeLink()));
document.addEventListener('DOMContentLoaded', updateNav);
// Nav widths shift once the webfont swaps in - re-measure when it lands.
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => movePill(activeLink()));
}
updateNav();


/* ---------- SMOOTH SCROLL ---------- */
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    if (!href.startsWith('#')) return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
    movePill(link);
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


/* ---------- SCROLL: HERO PARALLAX + NAV ELEVATION ---------- */
const heroInner = document.getElementById('hero-inner');
const headerEl  = document.getElementById('site-header');

let scrollTicking = false;
function onScrollFrame() {
  scrollTicking = false;
  const y = window.scrollY;

  if (heroInner && !REDUCED) {
    const vh = window.innerHeight || 1;
    const p = Math.min(y / vh, 1);
    heroInner.style.setProperty('--hero-shift', (p * 90).toFixed(1) + 'px');
    heroInner.style.setProperty('--hero-fade', Math.max(0, 1 - p * 1.25).toFixed(3));
  }

  // The floating pill deepens its shadow once it lifts off the top of the page.
  if (headerEl) headerEl.classList.toggle('scrolled', y > 20);
}

window.addEventListener('scroll', () => {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(onScrollFrame);
}, { passive: true });
onScrollFrame();


/* ---------- CARD PHYSICS ----------
   A resting tilted card straightens the moment the pointer enters (CSS
   handles that), then tracks the cursor in 3D: the edge under the pointer
   recedes while the opposite edge pops. The boundary glow is CSS too. */
(function () {
  const canHover = window.matchMedia('(hover: hover)').matches;
  if (!canHover || REDUCED) return;

  const MAX = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--card-tilt-max')
  ) || 5;

  document.querySelectorAll('.project-card, .exp-card, .contact-card').forEach(card => {
    card.addEventListener('mouseenter', () => card.classList.add('tracking'));

    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width  - 0.5;   // -0.5 … 0.5
      const py = (e.clientY - r.top)  / r.height - 0.5;
      const rotX = ( py * MAX * 2).toFixed(2);
      const rotY = (-px * MAX * 2).toFixed(2);
      card.style.transform =
        `perspective(var(--card-perspective)) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-2px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.classList.remove('tracking');
      card.style.transform = '';   // settles back to its resting tilt
    });
  });
})();


/* ---------- STARFIELD ----------
   Grain-size stars scattered over the canvas light up one by one and fade,
   like a night sky. Whisper-quiet in light, the signature ambience in dark.
   Colors are read from --star / --star-glow so it follows the theme. */
(function starfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas || REDUCED) return;

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let stars = [], w = 0, h = 0, last = 0;

  function seed() {
    const count = Math.round((w * h) / 30000);   // present, not attention-grabbing
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1 + Math.random() * 1.9,
      t: Math.random() * Math.PI * 2,        // twinkle phase
      v: 0.25 + Math.random() * 0.65,        // twinkle speed
      drift: Math.random() * 0.02 - 0.01,
    }));
  }

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < 40) return;             // ~25fps is plenty for twinkle
    last = now;

    const css = getComputedStyle(document.documentElement);
    const color = css.getPropertyValue('--star').trim() || '#5da635';
    const glow  = css.getPropertyValue('--star-glow').trim() || 'rgba(93,166,53,0.5)';

    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      s.t += 0.06 * s.v;
      s.x += s.drift;
      const a = Math.max(0, Math.sin(s.t));   // dark for half the cycle: appear, then fade
      if (a < 0.02) continue;
      ctx.globalAlpha = Math.pow(a, 1.3);     // ease the pop-in, but stay lit longer
      ctx.shadowBlur = 8 + 10 * a;
      ctx.shadowColor = glow;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
})();
