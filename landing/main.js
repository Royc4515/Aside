// Sticky-nav border on scroll
const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 4);
document.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Reveal-on-scroll for major content blocks
const targets = document.querySelectorAll(
  '.hero-copy, .hero-art, .feature, .provider, .steps li, .priv-card, .install-card, .showcase, .cta-band-inner'
);
targets.forEach((el) => el.classList.add('reveal'));

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  targets.forEach((el) => io.observe(el));
} else {
  targets.forEach((el) => el.classList.add('is-visible'));
}
