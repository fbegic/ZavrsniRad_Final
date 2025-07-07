document.addEventListener('DOMContentLoaded', () => {
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userMenu = document.getElementById('userMenu');

  if (!userMenuBtn || !userMenu) return;

  userMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = userMenu.style.display === 'block';
    userMenu.style.display = isVisible ? 'none' : 'block';
    userMenuBtn.setAttribute('aria-expanded', (!isVisible).toString());
  });

  document.addEventListener('click', (e) => {
    if (!userMenu.contains(e.target) && e.target !== userMenuBtn) {
      userMenu.style.display = 'none';
      userMenuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await auth.signOut();
        window.location.href = 'dashboard.html';
      } catch (error) {
        alert('Greška pri odjavi: ' + error.message);
      }
    });
  }
});


