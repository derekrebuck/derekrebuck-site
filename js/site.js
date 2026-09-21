const root = document.documentElement;
const savedTheme = localStorage.getItem('theme');

if (savedTheme) {
  root.dataset.theme = savedTheme;
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  root.dataset.theme = 'dark';
}

const header = document.querySelector('.site-header');
const themeButton = document.querySelector('[data-theme-toggle]');
const menuButton = document.querySelector('[data-menu]');
const navLinks = document.querySelector('.nav-links');
const navSections = [...document.querySelectorAll('main [data-nav-tone], footer[data-nav-tone]')];

function syncThemeButton() {
  if (!themeButton) return;
  const isDark = root.dataset.theme === 'dark';
  themeButton.setAttribute('aria-label', isDark ? 'Use light theme' : 'Use dark theme');
  const icon = themeButton.querySelector('span');
  if (icon) icon.textContent = isDark ? '☀' : '◐';
}

if (themeButton) {
  syncThemeButton();
  themeButton.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', root.dataset.theme);
    syncThemeButton();
    syncNavTone();
  });
}

if (menuButton && navLinks) {
  menuButton.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation');
    });
  });
}

function syncNavTone() {
  if (!header || !navSections.length) return;
  const sampleY = Math.min(header.offsetHeight * 0.5, window.innerHeight - 1);
  let active = navSections[0];

  for (const section of navSections) {
    const rect = section.getBoundingClientRect();
    if (rect.top <= sampleY && rect.bottom > sampleY) {
      active = section;
      break;
    }
  }

  const isDarkTheme = root.dataset.theme === 'dark';
  header.dataset.navTone = isDarkTheme
    ? (active.dataset.navToneDark || active.dataset.navTone || 'light')
    : (active.dataset.navTone || 'light');
}

syncNavTone();
window.addEventListener('scroll', syncNavTone, { passive: true });
window.addEventListener('resize', syncNavTone);

// Hidden archive filters, intentionally unused by the public navigation.
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
