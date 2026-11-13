'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';

/**
 * Sideways row with snap scrolling, arrow buttons (desktop) and page dots.
 * `tone="dark"` is for rows on the brown / black bands. `track` sets the row layout (default: one flex row).
 */
export default function RailScroller({ children, tone = 'light', gap = 'gap-2.5 sm:gap-4', track = 'flex', more = null, itemClass = '', isNew = false }) {
  const ref = useRef(null);
  // the rest of the row (see ProductRail): fetched and drawn on the first touch, scroll or hover
  const [Card, setCard] = useState(null);
  const asked = useRef(false);
  const loadMore = useCallback(() => {
    if (!more?.length || asked.current) return;
    asked.current = true;
    import('./ProductCardClient').then((m) => setCard(() => m.default));
  }, [more]);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const [edge, setEdge] = useState({ start: true, end: false });

  // cards not drawn yet still count for the page dots and arrows, so the row looks the same before and after
  const pending = useRef(0);
  pending.current = Card ? 0 : more?.length || 0;

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const first = el.firstElementChild;
    const gapPx = parseFloat(getComputedStyle(el).columnGap) || 0;
    const full = el.scrollWidth + (pending.current && first ? pending.current * (first.offsetWidth + gapPx) : 0);
    setPages(Math.max(1, Math.ceil((full - 2) / w)));
    setPage(Math.round(el.scrollLeft / w));
    setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + w >= full - 4 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    // the observer's first call comes right after the browser has laid the row out, so measuring
    // there is free (calling measure() straight away forced an early layout of the whole page)
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const onScroll = () => { if (el.scrollLeft > 4) loadMore(); measure(); };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => { ro.disconnect(); el.removeEventListener('scroll', onScroll); };
  }, [measure, loadMore]);

  useEffect(() => { if (Card) measure(); }, [Card, measure]);

  const go = (dir) => { loadMore(); ref.current?.scrollBy({ left: dir * ref.current.clientWidth, behavior: 'smooth' }); };
  const toPage = (i) => { loadMore(); ref.current?.scrollTo({ left: i * ref.current.clientWidth, behavior: 'smooth' }); };
  const dark = tone === 'dark';
  const arrow = 'absolute top-[42%] z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-[0_8px_20px_-8px_rgba(0,0,0,0.45)] ring-1 ring-black/5 transition hover:bg-gold-soft disabled:pointer-events-none disabled:opacity-0 lg:grid';

  return (
    <div className="relative" onPointerEnter={loadMore} onTouchStart={loadMore} onFocus={loadMore}>
      <div ref={ref} className={`rail no-scrollbar -mx-3 overflow-x-auto scroll-px-3 px-3 pb-1 md:-mx-5 md:scroll-px-5 md:px-5 ${track} ${gap}`}>
        {children}
        {Card && more ? more.map((p, i) => (
          <div key={p.id} className={itemClass}>
            <Card product={p} index={i + 5} isNew={isNew} />
          </div>
        )) : null}
      </div>
      {pages > 1 ? (
        <>
          <button type="button" onClick={() => go(-1)} disabled={edge.start} className={`${arrow} -left-3`} aria-label="Previous">
            <Icon name="chevron-left" className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => go(1)} disabled={edge.end} className={`${arrow} -right-3`} aria-label="Next">
            <Icon name="chevron-right" className="h-5 w-5" />
          </button>
          <div className="mt-4 flex justify-center gap-1.5">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toPage(i)}
                aria-label={`Page ${i + 1}`}
                aria-current={i === page ? 'true' : undefined}
                className={`h-1.5 rounded-full transition-all ${i === page ? 'w-6 bg-gold' : `w-1.5 ${dark ? 'bg-white/40' : 'bg-slate-300'}`}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
