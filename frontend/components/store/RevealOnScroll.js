'use client';
import { useEffect } from 'react';

// Elements marked data-reveal fade and rise into place the first time they scroll into view.
// Nothing is hidden until this script runs (html gets data-reveal-on), so content is always
// visible without JavaScript, and elements added later (pagination, client navigation) are picked up too.
// This can mark an element before React has hydrated it, so every data-reveal element also carries
// suppressHydrationWarning (otherwise development mode reports a harmless attribute mismatch).
export default function RevealOnScroll() {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    let reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* ignore */ }
    if (reduce) return undefined;

    // The observer's first report on each element says where it is, so nothing has to be measured
    // here (measuring every card at start-up forced the phone to lay out the whole page at once).
    const io = new IntersectionObserver((entries) => {
      // read once, before anything below changes the page (reading it between changes forces a layout)
      const vh = window.innerHeight;
      for (const e of entries) {
        const el = e.target;
        if (!el.dataset.revealed) {
          // Already on screen (or scrolled past) when it appears → leave it as it is. Only things further
          // down are hidden and rise in on scroll. Hiding content people can already see and fading it back
          // in looks like a flash, and it delays when the page counts as loaded (Lighthouse LCP/Speed Index).
          if (e.isIntersecting || e.boundingClientRect.top < vh) {
            el.dataset.revealed = 'shown';
            io.unobserve(el);
          } else {
            el.dataset.revealed = 'wait';
          }
        } else if (e.isIntersecting) {
          el.dataset.revealed = '1';
          io.unobserve(el);
        }
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    const scan = (root) => {
      if (root.matches?.('[data-reveal]') && !root.dataset.revealed) io.observe(root);
      root.querySelectorAll?.('[data-reveal]:not([data-revealed])').forEach((el) => io.observe(el));
    };

    document.documentElement.dataset.revealOn = '1';
    scan(document.body);
    const mo = new MutationObserver((muts) => {
      for (const m of muts) m.addedNodes.forEach((n) => { if (n.nodeType === 1) scan(n); });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
      delete document.documentElement.dataset.revealOn;
      document.querySelectorAll('[data-reveal]').forEach((el) => { el.dataset.revealed = 'shown'; });
    };
  }, []);
  return null;
}
