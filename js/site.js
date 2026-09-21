const root = document.documentElement;
const saved = localStorage.getItem('theme');

if (saved) {
  root.dataset.theme = saved;
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  root.dataset.theme = 'dark';
}

const header = document.querySelector('[data-site-header]');
const themeButton = document.querySelector('[data-theme-toggle]');

function getActiveTone() {
  const y = 48;
  const sections = [...document.querySelectorAll('[data-nav-tone]')];
  const active = sections.find((section) => {
    const rect = section.getBoundingClientRect();
    return rect.top <= y && rect.bottom > y;
  }) || sections[0];

  if (!active) return 'dark';
  const darkThemeTone = active.dataset.navToneDark;
  return root.dataset.theme === 'dark' && darkThemeTone ? darkThemeTone : active.dataset.navTone;
}

function syncHeaderTone() {
  if (!header) return;
  const tone = getActiveTone();
  header.classList.toggle('nav-on-dark', tone === 'dark');
  header.classList.toggle('nav-on-light', tone === 'light');
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
    syncHeaderTone();
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
window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      syncHeaderTone();
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });
window.addEventListener('resize', syncHeaderTone);
syncHeaderTone();

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
