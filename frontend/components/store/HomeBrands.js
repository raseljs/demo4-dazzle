'use client';
import { useState } from 'react';
import { ProductRail } from './ProductCard';
import { SectionTitle } from './Bits';

/** "Shop by Brand": brand tiles; picking one shows that brand's products underneath. */
export default function HomeBrands({ brands, initial }) {
  const [active, setActive] = useState(brands[0]?.slug);
  const [lists, setLists] = useState({ [brands[0]?.slug]: initial });
  const [loading, setLoading] = useState(false);

  const pick = async (slug) => {
    setActive(slug);
    if (lists[slug]) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products?brand=${encodeURIComponent(slug)}&per_page=10`);
      const data = res.ok ? await res.json() : null;
      setLists((l) => ({ ...l, [slug]: data?.data || [] }));
    } catch {
      setLists((l) => ({ ...l, [slug]: [] }));
    } finally {
      setLoading(false);
    }
  };

  const products = lists[active];
  return (
    <section data-reveal suppressHydrationWarning className="container-x py-6 md:py-10">
      <SectionTitle title="Shop by Brand" href={`/shop?brand=${active}`} />
      <div className="no-scrollbar -mx-3 flex gap-2.5 overflow-x-auto px-3 pb-1 md:-mx-5 md:gap-3 md:px-5" role="tablist" aria-label="Brands">
        {brands.map((b) => {
          const on = b.slug === active;
          return (
            <button
              key={b.slug}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => pick(b.slug)}
              className={`grid h-16 w-[calc((100%-1.875rem)/4)] shrink-0 place-items-center rounded-2xl px-2 transition sm:w-32 md:h-20 md:w-36 ${on ? 'bg-sand ring-2 ring-gold-line' : 'bg-surface hover:bg-sand'}`}
            >
              <span className={`truncate text-base font-extrabold tracking-tight md:text-xl ${on ? 'text-bronze' : 'text-ink-2'}`}>{b.name}</span>
            </button>
          );
        })}
      </div>
      <div className={`mt-5 transition-opacity md:mt-6 ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
        {products?.length ? (
          <ProductRail products={products} />
        ) : products ? (
          <p className="rounded-2xl bg-white px-4 py-10 text-center text-sm text-slate-500">No products from this brand yet.</p>
        ) : (
          <div className="h-80 animate-pulse rounded-3xl bg-white" />
        )}
      </div>
    </section>
  );
}
