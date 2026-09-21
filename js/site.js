const root = document.documentElement;
const saved = localStorage.getItem('theme');

if (saved) {
  root.dataset.theme = saved;
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  root.dataset.theme = 'dark';
}

const themeButton = document.querySelector('[data-theme-toggle]');
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
  });
}

const menuButton = document.querySelector('[data-menu]');
const navLinks = document.querySelector('.nav-links');
if (menuButton && navLinks) {
  menuButton.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
}

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
