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

function getActiveHeaderSection() {
  const sections = [...document.querySelectorAll('[data-header-bg]')];
  if (!sections.length) return null;

  const sampleY = header ? Math.max(24, header.offsetHeight * 0.55) : 48;
  return sections.find((section) => {
    const rect = section.getBoundingClientRect();
    return rect.top <= sampleY && rect.bottom > sampleY;
  }) || sections[0];
}

function parseRgb(color) {
  const values = color.match(/[\d.]+/g);
  if (!values || values.length < 3) return null;
  return values.slice(0, 3).map(Number);
}

function isLightBackground(color) {
  const rgb = parseRgb(color);
  if (!rgb) return false;
  const [r, g, b] = rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
  return luminance > 0.42;
}

function syncHeader() {
  if (!header) return;

  const active = getActiveHeaderSection();
  if (!active) return;

  let background = getComputedStyle(active).backgroundColor;
  if (background === 'rgba(0, 0, 0, 0)' || background === 'transparent') {
    background = getComputedStyle(document.body).backgroundColor;
  }

  const lightBackground = isLightBackground(background);
  header.style.setProperty('--header-bg', background);
  header.style.setProperty('--header-fg', lightBackground ? '#1f342d' : '#ffffff');
  header.dataset.headerTone = lightBackground ? 'light' : 'dark';

  if (logo) {
    const src = lightBackground ? logo.dataset.logoLight : logo.dataset.logoDark;
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
