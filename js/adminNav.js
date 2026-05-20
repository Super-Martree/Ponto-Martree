const ADMIN_ACCESS_KEY = 'martree_admin_access';

export function initAdminMenu({ groupSelector = '.admin-nav-group', open = false } = {}) {
  const group = document.querySelector(groupSelector);
  if (!group) return;

  const toggle = group.querySelector('.submenu-toggle');
  const subLinks = group.querySelectorAll('.sidebar-subnav a');
  if (!toggle) return;

  group.classList.remove('hide');

  const setOpen = (value) => {
    group.classList.toggle('is-open', value);
    toggle.setAttribute('aria-expanded', String(value));
  };

  setOpen(open);

  toggle.addEventListener('click', (event) => {
    event.preventDefault();
    const next = !group.classList.contains('is-open');
    setOpen(next);
    if (next) sessionStorage.setItem(ADMIN_ACCESS_KEY, '1');
  });

  subLinks.forEach((link) => {
    link.addEventListener('click', () => {
      sessionStorage.setItem(ADMIN_ACCESS_KEY, '1');
    });
  });
}
