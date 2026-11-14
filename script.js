// Вставь сюда URL проекта и publishable/anon key из Supabase Dashboard.
// Service role key сюда добавлять нельзя.
const SUPABASE_URL = 'https://wdctojexgowfpcohptta.supabase.co';
const SUPABASE_KEY = 'sb_publishable_9syJXstlWs8Fi_4I6AAaHA_uU7otrUr';
const supabaseReady = Boolean(
  window.supabase &&
  SUPABASE_URL.startsWith('https://') &&
  !SUPABASE_URL.includes('ТВОЙ_') &&
  !SUPABASE_KEY.includes('ТВОЙ_')
);
const supabaseClient = supabaseReady
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
menuToggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('.main-nav a').forEach(link => link.addEventListener('click', () => nav.classList.remove('open')));

const modal = document.querySelector('#success-modal');
const form = document.querySelector('#request-form');
const closeModal = () => modal.classList.remove('open');
form?.addEventListener('submit', async event => {
  event.preventDefault();

  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = 'Sender ...';

  if (!supabaseReady) {
    alert('Supabase er ikke konfigurert ennå. Legg inn Project URL og publishable key i script.js.');
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
    return;
  }

  const formData = new FormData(form);
  const id = `FN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;
  const { error } = await supabaseClient.from('bookings').insert({
    request_number: id,
    category: formData.get('category'),
    description: formData.get('description'),
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    preferred_time: formData.get('preferred_time'),
    address: formData.get('address'),
    flexible_time: formData.get('flexible_time') === 'on'
  });

  if (error) {
    console.error('Supabase booking error:', error);
    alert('Noe gikk galt. Kontroller Supabase-tabellen og prøv igjen.');
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
    return;
  }

  document.querySelector('.request-id strong').textContent = id;
  modal.classList.add('open');
  form.reset();
  submitButton.disabled = false;
  submitButton.innerHTML = originalButtonText;
});
document.querySelector('.modal-close')?.addEventListener('click', closeModal);
document.querySelector('.modal-done')?.addEventListener('click', closeModal);
modal?.addEventListener('click', event => { if (event.target === modal) closeModal(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); });
