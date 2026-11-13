import Link from 'next/link';
import { getBrands, getLayout, getProducts } from '@/lib/api';
import { discountPct, qs } from '@/lib/format';
import Icon from '@/components/Icon';
import { ProductGrid, ProductRail } from './ProductCard';
import { Breadcrumb, EmptyState, Pagination } from './Bits';
import SortControls from './SortControls';

const KEYS = ['q', 'brand', 'min', 'max', 'sort', 'per_page', 'category'];

// One filter block in the sidebar: a tan header with a chevron, opens and closes without JavaScript
function Block({ title, open = true, children }) {
  return (
    <details open={open} className="group mb-4 border-b border-slate-100 pb-4 last:mb-0 last:border-0 last:pb-0">
      <summary className="flex h-9 cursor-pointer list-none items-center justify-between rounded-lg bg-[#fbeee0] px-3 text-sm font-semibold text-ink-2 [&::-webkit-details-marker]:hidden">
        {title}
        <Icon name="chevron-down" className="h-4 w-4 text-slate-500 transition group-open:rotate-180" />
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function Filters({ base, query, categories, brands, activeCategory, fixedCategory }) {
  const href = (patch) => base + qs({ ...query, ...patch, page: undefined });
  const activeBrands = (query.brand || '').split(',').filter(Boolean);
  const toggleBrand = (slug) => {
    const next = activeBrands.includes(slug) ? activeBrands.filter((b) => b !== slug) : [...activeBrands, slug];
    return href({ brand: next.join(',') || undefined });
  };
  const catLink = (slug) => (fixedCategory ? `/category/${slug}${qs({ ...query, category: undefined, page: undefined })}` : href({ category: slug === activeCategory ? undefined : slug }));
  const check = (on) => (
    <span className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${on ? 'border-[#6d3f0e] bg-[#6d3f0e] text-white' : 'border-slate-300 bg-white'}`}>
      {on ? <Icon name="check" className="h-3 w-3" strokeWidth={3} /> : null}
    </span>
  );
  const Cat = ({ c, depth = 0 }) => (
    <li>
      <Link prefetch={false} href={catLink(c.slug)} className={`flex items-center gap-2 py-1 text-sm transition hover:text-gold-deep ${c.slug === activeCategory ? 'font-semibold text-ink-2' : 'text-slate-700'}`} style={{ paddingLeft: depth * 14 }}>
        {check(c.slug === activeCategory)} {c.name}
      </Link>
      {c.children?.length ? <ul>{c.children.map((ch) => <Cat key={ch.id} c={ch} depth={depth + 1} />)}</ul> : null}
    </li>
  );
  return (
    <>
      <Block title="Budgets">
        <form action={base} className="flex items-center gap-2">
          {Object.entries(query).filter(([k, v]) => v && !['min', 'max', 'page'].includes(k)).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          <label className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
            <span className="mb-0.5 block text-[10px] tracking-wide text-slate-400">Minimum</span>
            <input name="min" type="number" min="0" defaultValue={query.min || ''} placeholder="৳0" className="w-full bg-transparent text-center text-sm font-semibold text-ink-2 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
          </label>
          <span className="text-slate-400">–</span>
          <label className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
            <span className="mb-0.5 block text-[10px] tracking-wide text-slate-400">Maximum</span>
            <input name="max" type="number" min="0" defaultValue={query.max || ''} placeholder="Any" className="w-full bg-transparent text-center text-sm font-semibold text-ink-2 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
          </label>
          <button className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#6d3f0e] text-white transition hover:bg-[#5a330b]" aria-label="Apply price">
            <Icon name="chevron-right" className="h-4 w-4" />
          </button>
        </form>
      </Block>
      <Block title="Category">
        <ul className="max-h-72 space-y-0.5 overflow-y-auto pr-1">{categories.map((c) => <Cat key={c.id} c={c} />)}</ul>
      </Block>
      {brands?.length ? (
        <Block title="Brand">
          <ul className="grid max-h-72 grid-cols-2 gap-x-2 gap-y-1.5 overflow-y-auto pr-1">
            {brands.map((b) => (
              <li key={b.id}>
                <Link prefetch={false} href={toggleBrand(b.slug)} className="flex items-center gap-2 text-sm text-slate-700 transition hover:text-gold-deep">
                  {check(activeBrands.includes(b.slug))}
                  <span className="truncate">{b.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Block>
      ) : null}
      <Link prefetch={false} href={base} className="mt-4 inline-block text-sm font-semibold text-bronze hover:underline">Clear all filters</Link>
    </>
  );
}

export default async function ShopView({ searchParams, category = null }) {
  const query = {};
  for (const k of KEYS) if (searchParams[k]) query[k] = String(searchParams[k]);
  if (category) delete query.category;
  const page = Math.max(1, Number(searchParams.page) || 1);
  const base = category ? `/category/${category.slug}` : '/shop';
  const activeCategory = category ? category.slug : query.category;
  const filtered = Object.keys(query).some((k) => k !== 'per_page' && k !== 'sort');
  const showPicks = Boolean(category) && page === 1 && !filtered;

  const [data, brands, layout, pool] = await Promise.all([
    getProducts({ ...query, category: activeCategory, page, per_page: query.per_page || 16 }),
    getBrands(),
    getLayout(),
    showPicks ? getProducts({ category: activeCategory, per_page: 40 }) : null,
  ]);
  const products = data?.data || [];
  const total = data?.total || 0;
  const title = category ? category.name : query.q ? `Search: “${query.q}”` : 'Shop';

  // "Top Selling" = biggest savings in this category, "Trending" = the newest ones
  const poolList = pool?.data || [];
  const topSelling = poolList.filter((p) => p.in_stock).sort((a, b) => discountPct(b.regular_price, b.sale_price) - discountPct(a.regular_price, a.sale_price)).slice(0, 8);
  const trending = poolList.slice(0, 8);

  // pills above the page: sub-categories on a category page, main categories on the shop page
  const pills = category ? (category.children || []) : layout.categories;
  const pillCls = (on) => `shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-semibold transition ${on ? 'border-[#6d3f0e] bg-[#6d3f0e] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-gold-line hover:text-ink'}`;

  const filters = <Filters base={base} query={query} categories={layout.categories} brands={brands} activeCategory={activeCategory} fixedCategory={!!category} />;
  const gradTitle = 'w-fit bg-[linear-gradient(90deg,#101518_0%,#e9ccae_46%,#b57908_100%)] bg-clip-text text-[20px] font-bold leading-tight text-transparent md:text-[32px]';

  return (
    <div className="container-x py-4 md:py-6">
      <Breadcrumb items={[{ name: 'Home', href: '/' }, category ? { name: 'Categories', href: '/shop' } : null, ...(category?.breadcrumb?.slice(0, -1).map((b) => ({ name: b.name, href: `/category/${b.slug}` })) || []), { name: title }]} />

      {pills.length ? (
        <div className="no-scrollbar mt-1 flex gap-2 overflow-x-auto py-2 md:flex-wrap md:overflow-visible">
          <Link prefetch={false} href={category ? base : '/shop'} className={pillCls(category ? true : !query.category)}>All</Link>
          {pills.map((c) => (
            <Link prefetch={false} key={c.id} href={`/category/${c.slug}`} className={pillCls(false)}>{c.name}</Link>
          ))}
        </div>
      ) : null}

      <div className="mt-2 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <aside className="hidden self-stretch lg:col-span-3 lg:block">
          <div className="no-scrollbar sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border border-slate-100 bg-white px-5 pb-6 pt-5 shadow-sm">{filters}</div>
        </aside>

        <div className="min-w-0 lg:col-span-9">
          {showPicks && topSelling.length >= 4 ? (
            <section className="mb-6 rounded-lg bg-[#eeeeee] p-3">
              <h2 className={`${gradTitle} mb-4 md:px-4`}>Top Selling</h2>
              <ProductRail products={topSelling} perRow={4} priorityCount={4} />
            </section>
          ) : null}
          {showPicks && trending.length >= 4 ? (
            <section className="mb-6 rounded-lg bg-[#6d3f0e] px-2 py-3">
              <h2 className="mb-4 w-fit bg-gradient-to-r from-white to-[#cb843b] bg-clip-text px-2 text-[20px] font-bold leading-tight text-transparent md:px-4 md:text-[32px]">Trending</h2>
              <ProductRail products={trending} perRow={4} tone="dark" />
            </section>
          ) : null}

          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className={gradTitle}>{category ? `Products of ${category.name}` : title}</h1>
              <p className="mt-0.5 text-xs text-slate-400">{total ? `${total.toLocaleString('en-US')} products found` : 'No results'}</p>
            </div>
            <SortControls base={base} query={query} />
          </div>

          <details className="mb-4 rounded-2xl border border-slate-100 bg-white shadow-sm lg:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold">
              <Icon name="filter" className="h-4 w-4" /> Filters
            </summary>
            <div className="border-t border-slate-100 p-4">{filters}</div>
          </details>

          {products.length ? (
            <ProductGrid products={products} priorityCount={showPicks ? 0 : 4} cols={4} />
          ) : (
            <EmptyState title="No products found" text="Try another category, a wider price range or a different search word." action={<Link prefetch={false} href="/shop" className="btn btn-ink rounded-full px-6">View all products</Link>} />
          )}
          <Pagination page={page} lastPage={data?.last_page || 1} hrefFor={(p) => base + qs({ ...query, page: p > 1 ? p : undefined })} />
        </div>
      </div>
    </div>
  );
}
