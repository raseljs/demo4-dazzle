'use client';
import { useState } from 'react';
import { ProductGrid, ProductRail } from './ProductCard';

/**
 * Pill tabs above a product row (e.g. Newest / Best Deals). The first tab comes ready-made from the
 * server; the others only carry their product list and are drawn when tapped, which keeps the page
 * small and quick to start on phones.
 */
export default function HomeTabs({ tabs, tone = 'light' }) {
  const [active, setActive] = useState(tabs[0]?.key);
  const current = tabs.find((t) => t.key === active) || tabs[0];
  const dark = tone === 'dark';
  return (
    <>
      <div role="tablist" className="mb-4 flex flex-wrap gap-2 md:mb-5">
        {tabs.map((t) => {
          const on = t.key === current.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(t.key)}
              className={`rounded-[10px] px-4 py-2 text-sm font-semibold transition ${on
                ? 'bg-[#a8784a] text-white shadow-sm'
                : dark ? 'bg-white text-ink hover:bg-gold-soft' : 'bg-white text-ink ring-1 ring-black/5 hover:bg-gold-soft'}`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">
        {current.content ?? (current.view === 'grid'
          ? <ProductGrid products={current.products || []} />
          : <ProductRail products={current.products || []} tone={current.tone || 'light'} isNew={current.isNew} />)}
      </div>
    </>
  );
}
