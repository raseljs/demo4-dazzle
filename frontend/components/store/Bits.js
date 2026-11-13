// Small server-rendered building blocks
import Link from 'next/link';
import Icon from '@/components/Icon';

export function Breadcrumb({ items }) {
  const list = items.filter(Boolean);
  return (
    <nav aria-label="Breadcrumb" className="overflow-x-auto text-[13px] text-slate-500 no-scrollbar">
      <ol className="flex items-center gap-1.5 whitespace-nowrap">
        {list.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 ? <Icon name="chevron-right" className="h-3.5 w-3.5 text-slate-300" /> : null}
            {it.href && i < list.length - 1 ? (
              <Link prefetch={false} href={it.href} className="transition hover:text-gold-deep">{it.name}</Link>
            ) : (
              <span className="max-w-[60vw] truncate font-semibold text-ink">{it.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function SectionTitle({ title, subtitle, href, linkLabel = 'See All', reveal = false, tone = 'light', children }) {
  return (
    <div data-reveal={reveal ? '' : undefined} suppressHydrationWarning className="mb-4 flex items-center justify-between gap-3 md:mb-6">
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 className={`w-fit text-[22px] font-bold leading-tight tracking-tight md:text-[32px] ${tone === 'dark' ? 'text-white' : 'title-gold'}`}>{title}</h2>
          {subtitle ? <p className={`mt-1 line-clamp-1 text-sm ${tone === 'dark' ? 'text-white/70' : 'text-slate-500'}`}>{subtitle}</p> : null}
        </div>
        {children}
      </div>
      {href ? <Link prefetch={false} href={href} className="pill-link">{linkLabel}</Link> : null}
    </div>
  );
}

export function Stars({ rating = 0, className = 'h-4 w-4' }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name={i <= Math.round(rating) ? 'star-fill' : 'star'} className={`${className} ${i <= Math.round(rating) ? '' : 'text-slate-300'}`} />
      ))}
    </span>
  );
}

const TRUST = [
  ['truck', 'Nationwide delivery', 'To all 64 districts'],
  ['shield', 'Safe payments', 'Cash on delivery available'],
  ['refresh', 'Easy returns', 'Simple return process'],
  ['tag', 'Fair prices', 'Regular deals & discounts'],
  ['award', '100% authentic', 'Original products only'],
  ['wrench', 'After-sales service', 'Help after you buy'],
];

// One continuous strip: hairline dividers come from the 1px gap over a light background
export function TrustBar() {
  return (
    <section aria-label="Why shop with us" className="container-x my-6 md:my-8">
      <ul className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-slate-200/70 ring-1 ring-slate-200/70 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)] lg:grid-cols-6">
        {TRUST.map(([icon, title, note]) => (
          <li key={title} className="flex flex-col items-center gap-2 bg-white px-1.5 py-3.5 text-center md:gap-2.5 md:px-3 md:py-[18px]">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white md:h-10 md:w-10">
              <Icon name={icon} className="h-[18px] w-[18px] md:h-5 md:w-5" />
            </span>
            <span>
              <span className="block text-xs font-semibold leading-tight text-slate-900 md:text-[13px]">{title}</span>
              <span className="mt-0.5 hidden text-xs leading-tight text-slate-500 sm:block">{note}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Pagination({ page, lastPage, hrefFor }) {
  if (lastPage <= 1) return null;
  const pages = [];
  for (let i = 1; i <= lastPage; i++) {
    if (i === 1 || i === lastPage || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  const cls = 'grid h-10 min-w-10 place-items-center rounded-lg border px-3 text-sm font-medium transition';
  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
      {page > 1 ? <Link prefetch={false} href={hrefFor(page - 1)} className={`${cls} border-slate-200 bg-white hover:border-gold hover:text-bronze`}>Previous</Link> : null}
      {pages.map((p, i) => (p === '…' ? (
        <span key={`e${i}`} className="px-1 text-slate-400">…</span>
      ) : (
        <Link prefetch={false} key={p} href={hrefFor(p)} aria-current={p === page ? 'page' : undefined}
          className={`${cls} ${p === page ? 'border-ink bg-ink text-white' : 'border-slate-200 bg-white hover:border-gold hover:text-bronze'}`}>{p}</Link>
      )))}
      {page < lastPage ? <Link prefetch={false} href={hrefFor(page + 1)} className={`${cls} border-slate-200 bg-white hover:border-gold hover:text-bronze`}>Next</Link> : null}
    </nav>
  );
}

export function EmptyState({ icon = 'package', title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gold-line bg-white px-6 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-slate-400 shadow-sm"><Icon name={icon} className="h-7 w-7" /></span>
      <p className="text-base font-semibold text-slate-800">{title}</p>
      {text ? <p className="max-w-sm text-sm text-slate-500">{text}</p> : null}
      {action}
    </div>
  );
}
