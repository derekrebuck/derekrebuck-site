const root = document.documentElement;
const saved = localStorage.getItem('theme');

if (saved) {
  root.dataset.theme = saved;
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  root.dataset.theme = 'dark';
}

const header = document.querySelector('[data-site-header]');
const logo = document.querySelector('[data-logo]');
const themeButton = document.querySelector('[data-theme-toggle]');

const lightLogoStates = new Set(['beige', 'yellow']);

function getActiveHeaderState() {
  const sections = [...document.querySelectorAll('[data-header-bg]')];
  if (!sections.length) return 'darkgreen';

  const sampleY = header ? Math.max(24, header.offsetHeight * 0.55) : 48;
  const active = sections.find((section) => {
    const rect = section.getBoundingClientRect();
    return rect.top <= sampleY && rect.bottom > sampleY;
  }) || sections[0];

  if (root.dataset.theme === 'dark' && active.dataset.headerBgDark) {
    return active.dataset.headerBgDark;
  }
  return active.dataset.headerBg || 'darkgreen';
}

function syncHeader() {
  if (!header) return;
  const state = getActiveHeaderState();
  header.dataset.headerState = state;

  if (logo) {
    const src = lightLogoStates.has(state) ? logo.dataset.logoLight : logo.dataset.logoDark;
    if (src && logo.getAttribute('src') !== src) logo.setAttribute('src', src);
  }
}

if (themeButton) {
  const syncThemeButton = () => {
    const isDark = root.dataset.theme === 'dark';
    themeButton.setAttribute('aria-label', isDark ? 'Use light theme' : 'Use dark theme');
    const icon = themeButton.querySelector('span');
    if (icon) icon.textContent = isDark ? '☀' : '◐';
  };

  syncThemeButton();
  themeButton.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', root.dataset.theme);
    syncThemeButton();
    syncHeader();
  });
}

const menuButton = document.querySelector('[data-menu]');
const navLinks = document.querySelector('.nav-links');
if (menuButton && navLinks) {
  menuButton.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation menu');
    });
  });
}

let ticking = false;
function requestHeaderSync() {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(() => {
    syncHeader();
    ticking = false;
  });
}
window.addEventListener('scroll', requestHeaderSync, { passive: true });
window.addEventListener('resize', requestHeaderSync);
syncHeader();

document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach((item) => item.setAttribute('aria-pressed', 'false'));
    button.setAttribute('aria-pressed', 'true');
    const filter = button.dataset.filter;
    document.querySelectorAll('[data-tags]').forEach((card) => {
      card.hidden = filter !== 'all' && !card.dataset.tags.split(' ').includes(filter);
    });
  });
});
