document.addEventListener('DOMContentLoaded', () => {
  // Boot the Three.js hero icon
  if (window.initHeroScene) {
    window.initHeroScene('robot-canvas');
  }

  // Mobile nav
  const burger = document.getElementById('burger');
  const links = document.querySelector('.nav__links');
  if (burger && links) {
    burger.addEventListener('click', () => {
      const open = links.classList.toggle('nav__links--open');
      if (open) {
        links.style.cssText = 'display:flex;flex-direction:column;position:absolute;top:100%;left:0;right:0;background:var(--cream);padding:1.5rem 2.5rem;border-bottom:1px solid var(--line);gap:1rem;';
      } else {
        links.removeAttribute('style');
      }
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      links.removeAttribute('style');
      links.classList.remove('nav__links--open');
    }));
  }

  // Gentle reveal-on-scroll
  const revealTargets = document.querySelectorAll(
    '.mini-card, .skill-card, .timeline__item, .project-card, .contact__box'
  );
  revealTargets.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealTargets.forEach(el => io.observe(el));
});