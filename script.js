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
form?.addEventListener('submit', event => {
  event.preventDefault();
  const id = `FN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;
  document.querySelector('.request-id strong').textContent = id;
  modal.classList.add('open');
  form.reset();
});
document.querySelector('.modal-close')?.addEventListener('click', closeModal);
document.querySelector('.modal-done')?.addEventListener('click', closeModal);
modal?.addEventListener('click', event => { if (event.target === modal) closeModal(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); });
