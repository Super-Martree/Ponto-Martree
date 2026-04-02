export function initMobileMenu() {
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.getElementById('mobileMenuBtn');
  if (!sidebar || !toggleBtn) return;

  const closeMenu = () => {
    sidebar.classList.remove('mobile-open');
    toggleBtn.setAttribute('aria-expanded', 'false');
  };

  toggleBtn.addEventListener('click', () => {
    const willOpen = !sidebar.classList.contains('mobile-open');
    sidebar.classList.toggle('mobile-open', willOpen);
    toggleBtn.setAttribute('aria-expanded', String(willOpen));
  });

  sidebar.querySelectorAll('.sidebar-nav a, .sidebar-nav button').forEach((item) => {
    item.addEventListener('click', closeMenu);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
      closeMenu();
    }
  });
}
