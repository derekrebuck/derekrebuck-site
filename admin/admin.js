(() => {
  const config = window.SITE_CONFIG || {};
  const isConfigured = Boolean(
    config.supabaseUrl && config.supabaseKey &&
    !config.supabaseUrl.startsWith('YOUR_') &&
    !config.supabaseKey.startsWith('YOUR_') &&
    window.supabase
  );

  const loginSection = document.querySelector('[data-admin-login]');
  const dashboard = document.querySelector('[data-admin-dashboard]');
  const configNote = document.querySelector('[data-config-note]');
  const loginForm = document.querySelector('[data-login-form]');
  const loginStatus = document.querySelector('[data-login-status]');
  const userLabel = document.querySelector('[data-admin-user]');
  const sectionList = document.querySelector('[data-section-list]');
  const categoryList = document.querySelector('[data-category-list]');
  const projectList = document.querySelector('[data-project-list]');
  const categoryForm = document.querySelector('[data-category-form]');
  const projectForm = document.querySelector('[data-project-form]');
  const categoryStatus = document.querySelector('[data-category-status]');
  const projectStatus = document.querySelector('[data-project-status]');
  let client = null;
  let categories = [];
  let projects = [];

  const setStatus = (element, message, error = false) => {
    if (!element) return;
    element.textContent = message || '';
    element.classList.toggle('is-error', error);
  };

  const slugify = (value) => String(value || '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!isConfigured) {
    if (configNote) configNote.hidden = false;
    if (loginForm) loginForm.querySelector('button[type="submit"]').disabled = true;
    return;
  }

  client = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);

  async function verifyAdmin(session) {
    const user = session?.user;
    if (!user) return false;
    const { data, error } = await client.from('site_admins').select('user_id,email').eq('user_id', user.id).maybeSingle();
    if (error || !data) return false;
    return String(data.email).toLowerCase() === String(config.adminEmail || '').toLowerCase();
  }

  async function showDashboard(session) {
    const isAdmin = await verifyAdmin(session);
    if (!isAdmin) {
      await client.auth.signOut();
      setStatus(loginStatus, 'This account is not authorized to manage the portfolio.', true);
      return;
    }
    loginSection.hidden = true;
    dashboard.hidden = false;
    userLabel.textContent = session.user.email || '';
    await Promise.all([loadSections(), loadCategories(), loadProjects()]);
  }

  async function loadSections() {
    const { data, error } = await client.from('site_sections').select('*').order('label');
    if (error) {
      sectionList.innerHTML = '<p>Could not load visibility controls.</p>';
      return;
    }
    sectionList.innerHTML = (data || []).map((item) => `
      <label class="toggle-item">
        <span><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.key)}</small></span>
        <span class="toggle-switch">
          <input type="checkbox" data-section-key="${escapeHtml(item.key)}" ${item.enabled ? 'checked' : ''}>
          <span aria-hidden="true"></span>
        </span>
      </label>
    `).join('');
    sectionList.querySelectorAll('[data-section-key]').forEach((input) => {
      input.addEventListener('change', async () => {
        input.disabled = true;
        const { error: updateError } = await client
          .from('site_sections')
          .update({ enabled: input.checked, updated_at: new Date().toISOString() })
          .eq('key', input.dataset.sectionKey);
        if (updateError) {
          input.checked = !input.checked;
          alert(`Could not update ${input.dataset.sectionKey}.`);
        }
        input.disabled = false;
      });
    });
  }

  async function loadCategories() {
    const { data, error } = await client.from('work_categories').select('*').order('sort_order');
    if (error) return;
    categories = data || [];
    categoryList.innerHTML = categories.map((item) => `
      <button type="button" class="admin-list-item" data-category-id="${item.id}">
        <strong>${escapeHtml(item.title)}</strong>
        <span>${item.published ? 'Published' : 'Draft'} · ${escapeHtml(item.slug)}</span>
      </button>
    `).join('') || '<p>No categories yet.</p>';
    categoryList.querySelectorAll('[data-category-id]').forEach((button) => {
      button.addEventListener('click', () => editCategory(button.dataset.categoryId));
    });
    populateProjectCategoryOptions();
  }

  async function loadProjects() {
    const { data, error } = await client.from('projects').select('*').order('sort_order');
    if (error) return;
    projects = data || [];
    projectList.innerHTML = projects.map((item) => `
      <button type="button" class="admin-list-item" data-project-id="${item.id}">
        <strong>${escapeHtml(item.title)}</strong>
        <span>${item.published ? 'Published' : 'Draft'}${item.featured ? ' · Featured' : ''} · ${escapeHtml(item.category_slug)}</span>
      </button>
    `).join('') || '<p>No projects yet.</p>';
    projectList.querySelectorAll('[data-project-id]').forEach((button) => {
      button.addEventListener('click', () => editProject(button.dataset.projectId));
    });
  }

  function populateProjectCategoryOptions() {
    const select = document.querySelector('[data-project-category]');
    if (!select) return;
    const current = select.value;
    select.innerHTML = categories.map((item) => `<option value="${escapeHtml(item.slug)}">${escapeHtml(item.title)}</option>`).join('');
    if (current) select.value = current;
  }

  function editCategory(id) {
    const item = categories.find((category) => category.id === id);
    if (!item) return;
    categoryForm.hidden = false;
    categoryForm.elements.id.value = item.id;
    categoryForm.elements.title.value = item.title || '';
    categoryForm.elements.slug.value = item.slug || '';
    categoryForm.elements.description.value = item.description || '';
    categoryForm.elements.image_url.value = item.image_url || '';
    categoryForm.elements.accent.value = item.accent || 'green';
    categoryForm.elements.sort_order.value = item.sort_order ?? 0;
    categoryForm.elements.published.checked = Boolean(item.published);
    document.querySelector('[data-category-form-title]').textContent = 'Edit category';
    document.querySelector('[data-delete-category]').hidden = false;
    setStatus(categoryStatus, '');
  }

  function newCategory() {
    categoryForm.reset();
    categoryForm.hidden = false;
    categoryForm.elements.id.value = '';
    categoryForm.elements.published.checked = true;
    categoryForm.elements.sort_order.value = categories.length + 1;
    document.querySelector('[data-category-form-title]').textContent = 'Add category';
    document.querySelector('[data-delete-category]').hidden = true;
    setStatus(categoryStatus, '');
  }

  function editProject(id) {
    const item = projects.find((project) => project.id === id);
    if (!item) return;
    projectForm.hidden = false;
    projectForm.elements.id.value = item.id;
    projectForm.elements.title.value = item.title || '';
    projectForm.elements.slug.value = item.slug || '';
    projectForm.elements.category_slug.value = item.category_slug || '';
    projectForm.elements.organization.value = item.organization || '';
    projectForm.elements.summary.value = item.summary || '';
    projectForm.elements.image_url.value = item.image_url || '';
    projectForm.elements.year.value = item.year || '';
    projectForm.elements.sort_order.value = item.sort_order ?? 0;
    projectForm.elements.featured.checked = Boolean(item.featured);
    projectForm.elements.published.checked = Boolean(item.published);
    document.querySelector('[data-project-form-title]').textContent = 'Edit project';
    document.querySelector('[data-delete-project]').hidden = false;
    setStatus(projectStatus, '');
  }

  function newProject() {
    projectForm.reset();
    projectForm.hidden = false;
    projectForm.elements.id.value = '';
    projectForm.elements.published.checked = true;
    projectForm.elements.sort_order.value = projects.length + 1;
    populateProjectCategoryOptions();
    document.querySelector('[data-project-form-title]').textContent = 'Add project';
    document.querySelector('[data-delete-project]').hidden = true;
    setStatus(projectStatus, '');
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus(loginStatus, 'Signing in...');
    const form = new FormData(loginForm);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(loginStatus, 'The email or password was not accepted.', true);
      return;
    }
    await showDashboard(data.session);
  });

  document.querySelector('[data-signout]').addEventListener('click', async () => {
    await client.auth.signOut();
    dashboard.hidden = true;
    loginSection.hidden = false;
    loginForm.reset();
    loginForm.elements.email.value = config.adminEmail || 'Derekrebuck@gmail.com';
  });

  document.querySelectorAll('[data-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach((item) => item.classList.toggle('is-active', item === tab));
      document.querySelectorAll('[data-panel]').forEach((panel) => {
        const active = panel.dataset.panel === tab.dataset.tab;
        panel.hidden = !active;
        panel.classList.toggle('is-active', active);
      });
    });
  });

  document.querySelector('[data-new-category]').addEventListener('click', newCategory);
  document.querySelector('[data-cancel-category]').addEventListener('click', () => { categoryForm.hidden = true; });
  document.querySelector('[data-new-project]').addEventListener('click', newProject);
  document.querySelector('[data-cancel-project]').addEventListener('click', () => { projectForm.hidden = true; });

  categoryForm.elements.title.addEventListener('input', () => {
    if (!categoryForm.elements.id.value) categoryForm.elements.slug.value = slugify(categoryForm.elements.title.value);
  });
  projectForm.elements.title.addEventListener('input', () => {
    if (!projectForm.elements.id.value) projectForm.elements.slug.value = slugify(projectForm.elements.title.value);
  });

  categoryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(categoryForm);
    const id = String(form.get('id') || '');
    const record = {
      title: String(form.get('title') || '').trim(),
      slug: slugify(form.get('slug')),
      description: String(form.get('description') || '').trim(),
      image_url: String(form.get('image_url') || '').trim(),
      accent: String(form.get('accent') || 'green'),
      sort_order: Number(form.get('sort_order') || 0),
      published: categoryForm.elements.published.checked,
      updated_at: new Date().toISOString()
    };
    const result = id
      ? await client.from('work_categories').update(record).eq('id', id)
      : await client.from('work_categories').insert(record);
    if (result.error) return setStatus(categoryStatus, result.error.message, true);
    setStatus(categoryStatus, 'Category saved.');
    await loadCategories();
    categoryForm.hidden = true;
  });

  projectForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(projectForm);
    const id = String(form.get('id') || '');
    const record = {
      title: String(form.get('title') || '').trim(),
      slug: slugify(form.get('slug')),
      category_slug: String(form.get('category_slug') || ''),
      organization: String(form.get('organization') || '').trim(),
      summary: String(form.get('summary') || '').trim(),
      image_url: String(form.get('image_url') || '').trim(),
      year: String(form.get('year') || '').trim(),
      sort_order: Number(form.get('sort_order') || 0),
      featured: projectForm.elements.featured.checked,
      published: projectForm.elements.published.checked,
      updated_at: new Date().toISOString()
    };
    const result = id
      ? await client.from('projects').update(record).eq('id', id)
      : await client.from('projects').insert(record);
    if (result.error) return setStatus(projectStatus, result.error.message, true);
    setStatus(projectStatus, 'Project saved.');
    await loadProjects();
    projectForm.hidden = true;
  });

  document.querySelector('[data-delete-category]').addEventListener('click', async () => {
    const id = categoryForm.elements.id.value;
    if (!id || !confirm('Delete this category? Projects assigned to it must be moved or deleted first.')) return;
    const { error } = await client.from('work_categories').delete().eq('id', id);
    if (error) return setStatus(categoryStatus, error.message, true);
    categoryForm.hidden = true;
    await loadCategories();
  });

  document.querySelector('[data-delete-project]').addEventListener('click', async () => {
    const id = projectForm.elements.id.value;
    if (!id || !confirm('Delete this project?')) return;
    const { error } = await client.from('projects').delete().eq('id', id);
    if (error) return setStatus(projectStatus, error.message, true);
    projectForm.hidden = true;
    await loadProjects();
  });

  function escapeHtml(value = '') {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  client.auth.getSession().then(({ data }) => {
    if (data.session) showDashboard(data.session);
  });
})();
