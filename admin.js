const SUPABASE_URL = 'https://wdctojexgowfpcohptta.supabase.co';
const SUPABASE_KEY = 'sb_publishable_9syJXstlWs8Fi_4I6AAaHA_uU7otrUr';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const loginScreen = document.querySelector('#admin-login');
const loginForm = document.querySelector('#login-form');
const loginError = document.querySelector('#login-error');
const body = document.querySelector('#requests-body');
const drawer = document.querySelector('#request-drawer');
let allRequests = [];
let selectedRequest = null;

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]));
const formatDate = value => new Intl.DateTimeFormat('en-GB', { day:'2-digit', month:'short', year:'numeric' }).format(new Date(value));
const statusClass = status => status === 'Completed' ? 'done' : ['In progress','Accepted','Offer sent'].includes(status) ? 'progress' : ['Cancelled','Rejected'].includes(status) ? 'cancelled' : '';
const isAdmin = async userId => {
  const { data, error } = await supabaseClient.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle();
  return !error && Boolean(data);
};

async function loadRequests() {
  body.innerHTML = '<tr><td colspan="7" class="table-message">Loading requests...</td></tr>';
  const { data, error } = await supabaseClient.from('bookings').select('*').order('created_at', { ascending: false });
  if (error) { body.innerHTML = `<tr><td colspan="7" class="table-message">Could not load requests. Check your admin RLS policy.</td></tr>`; return; }
  allRequests = data || [];
  updateStats();
  renderRequests();
}

function updateStats() {
  document.querySelector('#total-count').textContent = allRequests.length;
  document.querySelector('#new-count').textContent = allRequests.filter(item => item.status === 'New').length;
  document.querySelector('#progress-count').textContent = allRequests.filter(item => item.status === 'In progress').length;
  document.querySelector('#completed-count').textContent = allRequests.filter(item => item.status === 'Completed').length;
}

function renderRequests() {
  const query = document.querySelector('#search-input').value.trim().toLowerCase();
  const status = document.querySelector('#status-filter').value;
  const filtered = allRequests.filter(item => {
    const matchesStatus = status === 'all' || item.status === status;
    const searchable = `${item.request_number} ${item.name} ${item.email} ${item.category}`.toLowerCase();
    return matchesStatus && searchable.includes(query);
  });
  if (!filtered.length) { body.innerHTML = '<tr><td colspan="7" class="table-message">No requests found.</td></tr>'; return; }
  body.innerHTML = filtered.map(item => `<tr><td><span class="request-number">${escapeHtml(item.request_number)}</span></td><td><span class="customer-name">${escapeHtml(item.name)}</span><br><small>${escapeHtml(item.email)}</small></td><td>${escapeHtml(item.category)}</td><td>${escapeHtml(item.preferred_time || 'Flexible')}</td><td><span class="status-pill ${statusClass(item.status)}">${escapeHtml(item.status)}</span></td><td>${formatDate(item.created_at)}</td><td><button class="view-request" data-id="${item.id}">View →</button></td></tr>`).join('');
  body.querySelectorAll('.view-request').forEach(button => button.addEventListener('click', () => openDrawer(button.dataset.id)));
}

function openDrawer(id) {
  selectedRequest = allRequests.find(item => item.id === id);
  if (!selectedRequest) return;
  document.querySelector('#drawer-title').textContent = selectedRequest.request_number;
  document.querySelector('#drawer-meta').textContent = `Received ${formatDate(selectedRequest.created_at)} · ${selectedRequest.status}`;
  document.querySelector('#drawer-status').value = selectedRequest.status;
  document.querySelector('#drawer-details').innerHTML = [['Customer', selectedRequest.name],['Contact', `${selectedRequest.email}\n${selectedRequest.phone}`],['Category', selectedRequest.category],['Preferred time', selectedRequest.preferred_time || 'Flexible'],['Address', selectedRequest.address],['Description', selectedRequest.description]].map(([label,value]) => `<div class="drawer-detail"><small>${label}</small><strong>${escapeHtml(value)}</strong></div>`).join('');
  drawer.classList.add('open');
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault(); loginError.textContent = '';
  const button = loginForm.querySelector('button'); button.disabled = true; button.textContent = 'Signing in...';
  const formData = new FormData(loginForm);
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email: formData.get('email'), password: formData.get('password') });
  if (error || !data.user || !(await isAdmin(data.user.id))) { await supabaseClient.auth.signOut(); loginError.textContent = error?.message || 'This account is not an admin.'; button.disabled = false; button.innerHTML = 'Sign in <span>↗</span>'; return; }
  loginScreen.classList.add('hidden'); document.querySelector('#admin-email').textContent = data.user.email; loadRequests();
});

document.querySelector('#logout-button').addEventListener('click', async () => { await supabaseClient.auth.signOut(); location.reload(); });
document.querySelector('#search-input').addEventListener('input', renderRequests);
document.querySelector('#status-filter').addEventListener('change', renderRequests);
document.querySelector('#drawer-close').addEventListener('click', () => drawer.classList.remove('open'));
document.querySelector('#save-status').addEventListener('click', async () => {
  if (!selectedRequest) return;
  const button = document.querySelector('#save-status'); const nextStatus = document.querySelector('#drawer-status').value;
  button.disabled = true; button.textContent = 'Saving...';
  const { error } = await supabaseClient.from('bookings').update({ status: nextStatus }).eq('id', selectedRequest.id);
  if (error) { document.querySelector('#drawer-error').textContent = error.message; } else { selectedRequest.status = nextStatus; drawer.classList.remove('open'); updateStats(); renderRequests(); }
  button.disabled = false; button.innerHTML = 'Save status <span>↗</span>';
});

(async () => { const { data: { session } } = await supabaseClient.auth.getSession(); if (session?.user && await isAdmin(session.user.id)) { loginScreen.classList.add('hidden'); document.querySelector('#admin-email').textContent = session.user.email; loadRequests(); } })();
