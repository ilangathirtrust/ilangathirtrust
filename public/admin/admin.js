const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
let admin = null, currentPage = 'overview', currentType = '', editingId = null, cache = [];

const configs = {
    activities: {
        title: 'Activities',
        desc: 'Create and publish verified trust activities.',
        fields: [
            ['title', 'Activity title', 'text', true],
            ['description', 'Activity description', 'textarea', true],
            ['image_path', 'Activity banner image', 'image'],
            ['activity_date', 'Activity date', 'date'],
            ['location', 'Location / venue', 'text'],
            ['status', 'Status', 'select', ['draft', 'published']]
        ]
    },
    news: {
        title: 'News & events',
        desc: 'Manage upcoming events, announcements, and confirmed event details.',
        fields: [
            ['title', 'Event title / Announcement', 'text', true],
            ['cover_image', 'Event banner image', 'image'],
            ['event_date', 'Event date', 'date'],
            ['location', 'Event location / venue', 'text'],
            ['body', 'Event details & full description', 'textarea', true],
            ['status', 'Publication status', 'select', ['draft', 'published']]
        ]
    },
    gallery: {
        title: 'Gallery',
        desc: 'Manage approved photographs and verified community moments.',
        fields: [
            ['image_path', 'Upload photograph', 'image', true],
            ['caption', 'Caption / description', 'text'],
            ['category', 'Category', 'select', ['Events', 'Community Service', 'Meetings', 'Other Activities']],
            ['event_date', 'Event date', 'date']
        ]
    },
    team: {
        title: 'Team members',
        desc: 'Add verified member names and biographies.',
        fields: [
            ['name', 'Full name', 'text', true],
            ['designation', 'Designation', 'text', true],
            ['biography', 'Biography', 'textarea'],
            ['image_path', 'Profile photo', 'image'],
            ['sort_order', 'Display order', 'number']
        ]
    },
    enquiries: {
        title: 'Contact enquiries',
        desc: 'Private messages submitted through the public contact form.',
        inbox: true,
        fields: [['status', 'Status', 'select', ['new', 'read', 'closed']]]
    },
    volunteers: {
        title: 'Volunteer applications',
        desc: 'Personal information is visible only to authorized admins.',
        inbox: true,
        fields: [['status', 'Status', 'select', ['new', 'reviewing', 'contacted', 'closed']]]
    }
};

const PREVIEW_STORE_KEY = 'ilangathir_preview_store';
const PREVIEW_SESSION_KEY = 'ilangathir_preview_admin';

function getPreviewStore() {
    try {
        const raw = localStorage.getItem(PREVIEW_STORE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { }
    return {
        activities: [
            { id: 1, title: 'Community Welfare & Medical Camp', description: 'Providing free health checkups, basic medicines, and healthcare awareness for rural families in need.', image_path: '/assets/hero-healthcamp.jpg', activity_date: '2026-11-10', location: 'V. Kallupatti, Dindigul', status: 'published' },
            { id: 2, title: 'Educational Aid & School Supplies', description: 'Distributing books, stationery, and learning aids to underprivileged students to encourage education.', image_path: '/assets/hero-education.jpg', activity_date: '2026-10-25', location: 'Dindigul Rural', status: 'published' }
        ],
        news: [
            { id: 1, title: 'Annual Community Health & Eye Care Camp', body: 'Join Ilangathir Arakattalai for our upcoming comprehensive health and eye screening camp.', cover_image: '/assets/hero-healthcamp.jpg', event_date: '2026-12-20', location: 'Community Hall, V. Kallupatti', status: 'published' },
            { id: 2, title: 'Winter Relief & Student Support Drive', body: 'A special volunteer initiative to distribute winter essentials and educational aid to deserving school children.', cover_image: '/assets/hero-relief.jpg', event_date: '2027-01-10', location: 'Government High School, Dindigul', status: 'published' }
        ],
        gallery: [
            { id: 1, image_path: '/assets/hero-healthcamp.jpg', caption: 'Free Medical Checkup Camp', category: 'Community Service', event_date: '2026-11-10' }
        ],
        team: [],
        enquiries: [],
        volunteers: []
    };
}

function savePreviewStore(store) {
    try { localStorage.setItem(PREVIEW_STORE_KEY, JSON.stringify(store)); } catch { }
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Could not read image file.'));
        reader.readAsDataURL(file);
    });
}

async function previewApi(url, opts = {}) {
    const method = (opts.method || 'GET').toUpperCase();
    const path = url.replace(/^\/api\/admin/, '');
    const body = opts.body && !(opts.body instanceof FormData) ? JSON.parse(opts.body) : {};

    if (path === '/login' && method === 'POST') {
        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '');
        if (email === 'ilangathirtrust@gmail.com' && password === '1012') {
            const user = { email: 'ilangathirtrust@gmail.com', role: 'admin' };
            sessionStorage.setItem(PREVIEW_SESSION_KEY, JSON.stringify(user));
            return user;
        }
        throw new Error('Invalid login details.');
    }
    if (path === '/logout') {
        sessionStorage.removeItem(PREVIEW_SESSION_KEY);
        return { message: 'Signed out.' };
    }
    if (path === '/me') {
        const raw = sessionStorage.getItem(PREVIEW_SESSION_KEY);
        if (!raw) throw new Error('Not signed in');
        return JSON.parse(raw);
    }
    if (path === '/upload' && method === 'POST') {
        const file = opts.body?.get?.('image');
        if (!file) throw new Error('No image selected.');
        const dataUrl = await fileToDataUrl(file);
        return { path: dataUrl };
    }

    const store = getPreviewStore();
    if (path === '/summary') {
        return {
            activities: (store.activities || []).filter(a => a.status === 'published').length,
            gallery: (store.gallery || []).length,
            news: (store.news || []).filter(n => n.status === 'published').length,
            upcoming: (store.news || []).filter(n => n.status === 'published').length,
            enquiries: (store.enquiries || []).filter(e => e.status === 'new').length,
            volunteers: (store.volunteers || []).filter(v => v.status === 'new').length
        };
    }

    const parts = path.split('/').filter(Boolean);
    const type = parts[0];
    const id = parts[1] ? Number(parts[1]) : null;
    const action = parts[2];
    store[type] = store[type] || [];

    if (method === 'GET') return store[type].slice().reverse();
    if (method === 'POST') {
        const item = { id: Date.now(), ...body, created_at: new Date().toISOString() };
        store[type].push(item);
        savePreviewStore(store);
        return { id: item.id, message: 'Saved in local preview.' };
    }
    if (method === 'PUT' && id) {
        const idx = store[type].findIndex(r => Number(r.id) === id);
        if (idx !== -1) { store[type][idx] = { ...store[type][idx], ...body }; savePreviewStore(store); }
        return { message: 'Updated.' };
    }
    if (method === 'DELETE' && id) {
        store[type] = store[type].filter(r => Number(r.id) !== id);
        savePreviewStore(store);
        return { message: 'Deleted.' };
    }
    if (method === 'PATCH' && id && action === 'status') {
        const item = store[type].find(r => Number(r.id) === id);
        if (item) { item.status = body.status; savePreviewStore(store); }
        return { message: 'Status updated.' };
    }
    throw new Error('Request failed');
}

const API_BASE = (location.port === '3000' || (location.protocol === 'https:' && !location.port))
    ? ''
    : 'http://localhost:3000';

async function api(url, opts = {}) {
    const isFormData = opts.body instanceof FormData;
    const headers = isFormData ? (opts.headers || {}) : { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    try {
        const r = await fetch(API_BASE + url, { credentials: 'include', headers, ...opts });
        if (r.status === 404 || r.status === 405) {
            return await previewApi(url, opts);
        }
        let data = {};
        try { data = await r.json(); } catch { }
        if (!r.ok) throw new Error(data.error || 'Request failed');
        return data;
    } catch (err) {
        if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
            return await previewApi(url, opts);
        }
        throw err;
    }
}

function showMessage(el, msg, error = false) {
    el.textContent = msg;
    el.classList.toggle('error', error);
}

$('#show-password').onclick = () => {
    const p = $('#password');
    p.type = p.type === 'password' ? 'text' : 'password';
    $('#show-password').textContent = p.type === 'password' ? 'Show' : 'Hide';
};

$('#login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const msg = $('#login-message');
    showMessage(msg, 'Signing in…');
    try {
        admin = await api('/api/admin/login', {
            method: 'POST',
            body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)))
        });
        openDashboard();
    } catch (err) {
        showMessage(msg, err.message, true);
    }
});

async function init() {
    try {
        admin = await api('/api/admin/me');
        openDashboard();
    } catch { }
}

function openDashboard() {
    $('#login-view').classList.add('hidden');
    $('#dashboard-view').classList.remove('hidden');
    $('#admin-email').textContent = admin.email;
    loadSummary();
}

async function loadSummary() {
    try {
        const s = await api('/api/admin/summary');
        const labels = {
            activities: 'Published activities',
            gallery: 'Gallery images',
            news: 'Published news & events',
            upcoming: 'Upcoming events',
            enquiries: 'New enquiries',
            volunteers: 'Volunteer applications'
        };
        const icons = {
            activities: '▣',
            gallery: '▧',
            news: '▤',
            upcoming: '◷',
            enquiries: '✉',
            volunteers: '♡'
        };
        $('#stats').innerHTML = Object.keys(labels).map(k => `
            <article class="stat-card">
                <span class="stat-icon">${icons[k]}</span>
                <span>${labels[k]}</span>
                <strong>${s[k] ?? 0}</strong>
            </article>
        `).join('');
    } catch (e) {
        notice(e.message, true);
    }
}

function notice(msg, error = false) {
    showMessage($('#notice'), msg, error);
    setTimeout(() => $('#notice').textContent = '', 4500);
}

function go(page) {
    currentPage = page;
    $$('.side-link').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    $('#overview-page').classList.toggle('hidden', page !== 'overview');
    $('#content-page').classList.toggle('hidden', page === 'overview');
    $('#page-title').textContent = page === 'overview' ? 'Dashboard overview' : configs[page]?.title || page;
    $('.sidebar').classList.remove('open');
    if (page !== 'overview') loadTable(page);
}

$$('.side-link').forEach(b => b.addEventListener('click', () => go(b.dataset.page)));
$$('[data-goto]').forEach(b => b.addEventListener('click', () => go(b.dataset.goto)));
$('#sidebar-toggle').onclick = () => $('.sidebar').classList.toggle('open');
$('#logout').onclick = async () => {
    try { await api('/api/admin/logout', { method: 'POST' }); } catch { }
    location.reload();
};

async function loadTable(type) {
    currentType = type;
    const c = configs[type];
    $('#page-description').textContent = c.desc;
    $('#add-new').classList.toggle('hidden', !!c.inbox);
    $('#table-search').value = '';
    try {
        cache = await api('/api/admin/' + type);
        renderRows(cache);
    } catch (e) {
        notice(e.message, true);
        cache = [];
        renderRows([]);
    }
}

function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function isImageVal(v) {
    if (!v) return false;
    const s = String(v).toLowerCase();
    return s.startsWith('/uploads/') || s.startsWith('uploads/') || s.startsWith('/assets/') || s.startsWith('assets/') || s.startsWith('data:image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(s);
}

function resolveImg(v) {
    if (!v) return '';
    const s = String(v).trim();
    if (API_BASE && (s.startsWith('/uploads/') || s.startsWith('uploads/'))) {
        return API_BASE + (s.startsWith('/') ? s : '/' + s);
    }
    return s;
}

function renderRows(rows) {
    const c = configs[currentType];
    const fields = c.inbox
        ? (currentType === 'enquiries' ? ['name', 'email', 'subject', 'status', 'created_at'] : ['full_name', 'email', 'phone', 'interest', 'status', 'created_at'])
        : (currentType === 'news' ? ['cover_image', 'title', 'event_date', 'location', 'status'] : c.fields.slice(0, 5).map(f => f[0]));

    $('#table-head').innerHTML = '<tr>' + fields.map(f => `<th>${f.replaceAll('_', ' ')}</th>`).join('') + '<th>Actions</th></tr>';
    const q = $('#table-search').value.toLowerCase();
    const filtered = rows.filter(r => fields.some(f => String(r[f] ?? '').toLowerCase().includes(q)));
    $('#entry-count').textContent = filtered.length + ' entries';
    $('#empty-state').classList.toggle('hidden', filtered.length > 0);

    $('#table-body').innerHTML = filtered.map(r => `
        <tr>
            ${fields.map(f => {
                const val = r[f];
                if (f === 'status') {
                    return `<td><span class="status ${val}">${esc(val)}</span></td>`;
                }
                if (isImageVal(val)) {
                    return `<td><img src="${esc(resolveImg(val))}" class="table-thumbnail" alt=""></td>`;
                }
                return `<td>${esc(String(val ?? '').slice(0, 90))}</td>`;
            }).join('')}
            <td>
                <div class="actions">
                    ${c.inbox
                        ? `<button class="small-btn" data-status="${r.id}">Update status</button>`
                        : `<button class="small-btn" data-edit="${r.id}">Edit</button>
                           <button class="small-btn delete" data-delete="${r.id}">Delete</button>
                           ${['activities', 'news'].includes(currentType)
                                ? `<button class="small-btn" data-publish="${r.id}" data-state="${r.status}">${r.status === 'published' ? 'Unpublish' : 'Publish'}</button>`
                                : ''
                           }`
                    }
                </div>
            </td>
        </tr>
    `).join('');

    $$('[data-edit]').forEach(b => b.onclick = () => openEditor(rows.find(r => String(r.id) === b.dataset.edit)));
    $$('[data-delete]').forEach(b => b.onclick = () => deleteRow(b.dataset.delete));
    $$('[data-publish]').forEach(b => b.onclick = () => togglePublish(b.dataset.publish, b.dataset.state));
    $$('[data-status]').forEach(b => b.onclick = () => updateInboxStatus(rows.find(r => String(r.id) === b.dataset.status)));
}

$('#table-search').addEventListener('input', () => renderRows(cache));
$('#add-new').onclick = () => openEditor(null);

function openEditor(row) {
    editingId = row?.id ?? null;
    const c = configs[currentType];
    $('#modal-title').textContent = (row ? 'Edit ' : 'Add ') + c.title.replace(/s$/, '');
    $('#editor-message').textContent = '';

    $('#editor-fields').innerHTML = c.fields.map(([key, label, type, extra]) => {
        let value = row?.[key] ?? (key === 'status' ? 'draft' : '');
        let input = '';

        if (type === 'image') {
            const hasImg = !!value;
            input = `
                <div class="image-upload-wrap" data-key="${key}">
                    <input type="hidden" name="${key}" value="${esc(value)}" id="input-${key}">
                    <div class="upload-dropzone ${hasImg ? 'has-image' : ''}" id="dropzone-${key}">
                        <div class="upload-preview-wrap ${hasImg ? '' : 'hidden'}" id="preview-wrap-${key}">
                            <img src="${esc(resolveImg(value))}" alt="Preview" class="upload-preview-img" id="preview-${key}">
                        </div>
                        <div class="upload-prompt ${hasImg ? 'hidden' : ''}" id="prompt-${key}">
                            <span class="upload-icon">📸</span>
                            <span class="upload-title">Click to upload or drag & drop</span>
                            <small class="upload-hint">JPG, PNG, or WEBP (up to 5MB)</small>
                        </div>
                        <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden" id="file-${key}">
                    </div>
                    <div class="upload-actions-bar">
                        <span class="upload-status-badge ${hasImg ? '' : 'hidden'}" id="status-${key}">
                            ${hasImg ? '✓ Image attached' : ''}
                        </span>
                        <div class="upload-btn-group">
                            <button type="button" class="upload-btn-mini" id="btn-browse-${key}">Choose image</button>
                            <button type="button" class="upload-btn-mini danger ${hasImg ? '' : 'hidden'}" id="btn-remove-${key}">Remove</button>
                        </div>
                    </div>
                </div>
            `;
        } else if (type === 'textarea') {
            input = `<textarea name="${key}" ${extra === true ? 'required' : ''}>${esc(value)}</textarea>`;
        } else if (type === 'select') {
            input = `<select name="${key}">${extra.map(o => `<option ${o === value ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
        } else {
            input = `<input name="${key}" type="${['date', 'number'].includes(type) ? type : 'text'}" value="${esc(value)}" ${extra === true ? 'required' : ''}>`;
        }

        const isFullWidth = type === 'textarea' || type === 'image';
        return `<label class="${isFullWidth ? 'full' : ''}">${label}${input}</label>`;
    }).join('');

    // Wire Image Upload Handlers
    c.fields.forEach(([key, _label, type]) => {
        if (type === 'image') {
            initImageUploader(key);
        }
    });

    $('#editor-modal').classList.remove('hidden');
}

function initImageUploader(key) {
    const dropzone = $(`#dropzone-${key}`);
    const fileInput = $(`#file-${key}`);
    const hiddenInput = $(`#input-${key}`);
    const previewWrap = $(`#preview-wrap-${key}`);
    const previewImg = $(`#preview-${key}`);
    const prompt = $(`#prompt-${key}`);
    const status = $(`#status-${key}`);
    const btnBrowse = $(`#btn-browse-${key}`);
    const btnRemove = $(`#btn-remove-${key}`);

    if (!dropzone || !fileInput) return;

    function triggerFile() {
        fileInput.click();
    }

    dropzone.onclick = e => {
        if (e.target.tagName !== 'BUTTON') triggerFile();
    };
    btnBrowse.onclick = triggerFile;

    btnRemove.onclick = () => {
        hiddenInput.value = '';
        previewImg.src = '';
        previewWrap.classList.add('hidden');
        prompt.classList.remove('hidden');
        dropzone.classList.remove('has-image');
        btnRemove.classList.add('hidden');
        status.textContent = '';
        status.className = 'upload-status-badge hidden';
    };

    dropzone.ondragover = e => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    };
    dropzone.ondragleave = () => dropzone.classList.remove('dragover');
    dropzone.ondrop = e => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer?.files?.length) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    fileInput.onchange = () => {
        if (fileInput.files?.length) {
            handleUpload(fileInput.files[0]);
        }
    };

    async function handleUpload(file) {
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            alert('Please select a JPG, PNG, or WEBP image file.');
            return;
        }

        status.textContent = '⏳ Uploading image…';
        status.className = 'upload-status-badge uploading';
        status.classList.remove('hidden');

        // Immediate local preview
        const localUrl = URL.createObjectURL(file);
        previewImg.src = localUrl;
        previewWrap.classList.remove('hidden');
        prompt.classList.add('hidden');
        dropzone.classList.add('has-image');

        const fd = new FormData();
        fd.append('image', file);

        try {
            const res = await api('/api/admin/upload', {
                method: 'POST',
                body: fd
            });
            hiddenInput.value = res.path;
            previewImg.src = resolveImg(res.path);
            btnRemove.classList.remove('hidden');
            status.textContent = '✓ Uploaded successfully';
            status.className = 'upload-status-badge';
        } catch (err) {
            status.textContent = '✕ Upload failed: ' + err.message;
            status.className = 'upload-status-badge error';
        }
    }
}

function closeEditor() {
    $('#editor-modal').classList.add('hidden');
}

$('#close-modal').onclick = closeEditor;
$('#cancel-editor').onclick = closeEditor;
$('#editor-modal').addEventListener('click', e => {
    if (e.target.id === 'editor-modal') closeEditor();
});

$('#editor-form').addEventListener('submit', async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
        const url = '/api/admin/' + currentType + (editingId ? '/' + editingId : '');
        await api(url, {
            method: editingId ? 'PUT' : 'POST',
            body: JSON.stringify(data)
        });
        closeEditor();
        notice('Saved successfully.');
        loadTable(currentType);
        loadSummary();
    } catch (err) {
        showMessage($('#editor-message'), err.message, true);
    }
});

async function deleteRow(id) {
    if (!confirm('Delete this entry permanently? This cannot be undone.')) return;
    try {
        await api('/api/admin/' + currentType + '/' + id, { method: 'DELETE' });
        notice('Entry deleted.');
        loadTable(currentType);
        loadSummary();
    } catch (e) {
        notice(e.message, true);
    }
}

async function togglePublish(id, status) {
    try {
        await api(`/api/admin/${currentType}/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: status === 'published' ? 'draft' : 'published' })
        });
        notice('Publication status updated.');
        loadTable(currentType);
        loadSummary();
    } catch (e) {
        notice(e.message, true);
    }
}

async function updateInboxStatus(row) {
    const choices = configs[currentType].fields[0][3];
    const next = prompt('Set status: ' + choices.join(', '), row.status);
    if (!next || !choices.includes(next)) return notice('No valid status selected.', true);
    try {
        await api(`/api/admin/${currentType}/${row.id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: next })
        });
        notice('Status updated.');
        loadTable(currentType);
        loadSummary();
    } catch (e) {
        notice(e.message, true);
    }
}

init();
