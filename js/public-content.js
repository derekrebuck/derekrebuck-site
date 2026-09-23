(() => {
  const config = window.SITE_CONFIG || {};
  const fallback = window.PORTFOLIO_FALLBACK || { categories: [], projects: [] };
  const configured = Boolean(
    config.supabaseUrl &&
    config.supabaseKey &&
    !config.supabaseUrl.startsWith('YOUR_') &&
    !config.supabaseKey.startsWith('YOUR_') &&
    window.supabase
  );

  const supabaseClient = configured
    ? window.supabase.createClient(config.supabaseUrl, config.supabaseKey)
    : null;

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const safeImage = (value = '') => {
    const image = String(value).trim();
    if (!image) return 'logo-sketch.png';
    if (/^(https:\/\/|[A-Za-z0-9_.\-/ ]+$)/.test(image)) return image;
    return 'logo-sketch.png';
  };

  async function getSections() {
    if (!supabaseClient) {
      return {
        services: false,
        home_selected_work: true,
        about_featured_work: true,
        resume_link: true,
        accepting_freelance: false
      };
    }
    const { data, error } = await supabaseClient.from('site_sections').select('key,enabled');
    if (error) return { services: false, home_selected_work: true, about_featured_work: true, resume_link: true, accepting_freelance: false };
    return Object.fromEntries((data || []).map((row) => [row.key, Boolean(row.enabled)]));
  }

  async function applySectionVisibility() {
    const sections = await getSections();
    document.querySelectorAll('[data-section-toggle]').forEach((element) => {
      const key = element.dataset.sectionToggle;
      if (sections[key]) element.hidden = false;
      else element.hidden = true;
    });

    const requirement = document.body.dataset.requiresSection;
    if (requirement && !sections[requirement]) {
      const enabledContent = document.querySelector('[data-enabled-content]');
      const disabledContent = document.querySelector('[data-disabled-content]');
      if (enabledContent) enabledContent.hidden = true;
      if (disabledContent) disabledContent.hidden = false;
    }
  }

  async function getCategories() {
    if (!supabaseClient) return fallback.categories.filter((item) => item.published);
    const { data, error } = await supabaseClient
      .from('work_categories')
      .select('*')
      .eq('published', true)
      .order('sort_order', { ascending: true });
    return error || !data?.length ? fallback.categories.filter((item) => item.published) : data;
  }

  async function getProjects({ categorySlug = null, featured = false } = {}) {
    if (!supabaseClient) {
      return fallback.projects
        .filter((item) => item.published)
        .filter((item) => !categorySlug || item.category_slug === categorySlug)
        .filter((item) => !featured || item.featured)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }
    let query = supabaseClient
      .from('projects')
      .select('*')
      .eq('published', true)
      .order('sort_order', { ascending: true });
    if (categorySlug) query = query.eq('category_slug', categorySlug);
    if (featured) query = query.eq('featured', true);
    const { data, error } = await query;
    return error || !data?.length
      ? getProjectsFallback({ categorySlug, featured })
      : data;
  }

  function getProjectsFallback({ categorySlug = null, featured = false } = {}) {
    return fallback.projects
      .filter((item) => item.published)
      .filter((item) => !categorySlug || item.category_slug === categorySlug)
      .filter((item) => !featured || item.featured)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  async function renderCategories() {
    const container = document.querySelector('[data-category-grid]');
    if (!container) return;
    const categories = await getCategories();
    container.innerHTML = categories.map((category) => `
      <article class="discipline-card discipline-${escapeHtml(category.accent || 'green')}">
        <a class="discipline-image" href="category.html?slug=${encodeURIComponent(category.slug)}" aria-label="Explore ${escapeHtml(category.title)}">
          <img src="${escapeHtml(safeImage(category.image_url))}" alt="">
        </a>
        <div class="discipline-copy">
          <h2>${escapeHtml(category.title)}</h2>
          <p>${escapeHtml(category.description || '')}</p>
          <a class="button discipline-button" href="category.html?slug=${encodeURIComponent(category.slug)}">View ${escapeHtml(category.title)} work</a>
        </div>
      </article>
    `).join('');
  }

  async function renderFeaturedProjects() {
    const container = document.querySelector('[data-featured-projects]');
    if (!container) return;
    const projects = (await getProjects({ featured: true })).slice(0, 3);
    if (!projects.length) return;
    const accents = ['crimson', 'blue', 'yellow'];
    container.innerHTML = projects.map((project, index) => `
      <a class="work-tile ${index === 0 ? 'tile-large ' : ''}accent-${accents[index % accents.length]}" href="category.html?slug=${encodeURIComponent(project.category_slug)}">
        <img src="${escapeHtml(safeImage(project.image_url))}" alt="${escapeHtml(project.title)} project preview">
        <span class="work-tile-copy"><strong>${escapeHtml(project.title)}</strong><span>${escapeHtml(project.organization || '')}</span></span>
      </a>
    `).join('');
  }

  async function renderCategoryPage() {
    const page = document.querySelector('[data-category-page]');
    if (!page) return;
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    const categories = await getCategories();
    const category = categories.find((item) => item.slug === slug) || categories[0];
    if (!category) return;

    const title = document.querySelector('[data-category-title]');
    const description = document.querySelector('[data-category-description]');
    if (title) title.textContent = category.title;
    if (description) description.textContent = category.description || '';
    document.title = `${category.title} | Derek Rebuck`;

    const projects = await getProjects({ categorySlug: category.slug });
    const grid = document.querySelector('[data-category-projects]');
    if (!grid) return;
    grid.innerHTML = projects.length ? projects.map((project) => `
      <article class="category-project-card">
        <div class="category-project-image"><img src="${escapeHtml(safeImage(project.image_url))}" alt="${escapeHtml(project.title)} project preview"></div>
        <div class="category-project-copy">
          <p class="project-meta">${escapeHtml(project.organization || '')}${project.year ? ` · ${escapeHtml(project.year)}` : ''}</p>
          <h2>${escapeHtml(project.title)}</h2>
          <p>${escapeHtml(project.summary || '')}</p>
        </div>
      </article>
    `).join('') : '<p>No public projects are currently assigned to this category.</p>';
  }

  document.addEventListener('DOMContentLoaded', () => {
    applySectionVisibility();
    renderCategories();
    renderFeaturedProjects();
    renderCategoryPage();
  });
})();
