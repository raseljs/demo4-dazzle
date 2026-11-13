'use client';
import Link from 'next/link';
import { getImageProps } from 'next/image';
import { discountPct, imgUrl, taka } from '@/lib/format';
import { trimSrcSet } from '@/components/Img';
import CardCartButton, { CardQuickActions } from './CardActions';

// A product card. It is a client component on purpose: the page then sends each card as a few fields
// of data (name, price, photo…) instead of its whole HTML layout a second time, which keeps the page
// much lighter for phones. It has no state or effects, so it costs almost nothing to start.

const pill = 'rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white sm:px-3 sm:py-1 sm:text-xs';
// cards are at most ~260px wide, so these photo sizes cover every screen (incl. high-density phones)
const CARD_WIDTHS = [200, 320, 360, 480, 640];

export default function ProductCard({ product: p, priority = false, index = 0, isNew = false }) {
  const off = discountPct(p.regular_price, p.sale_price);
  const saved = off > 0 ? Number(p.regular_price) - Number(p.price) : 0;
  const label = !p.in_stock ? null : off >= 20 ? '🔥 Hot Deal' : isNew ? '✨ New Arrival' : null;
  const href = `/product/${p.slug}`;
  // A plain <img> with the same optimised sizes as next/image, but nothing to start up in the browser
  // (a page has dozens of cards, so this keeps phones quick when the page first loads).
  const { props: photo } = getImageProps({
    src: imgUrl(p.thumbnail),
    alt: p.name,
    fill: true,
    priority,
    sizes: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px',
    className: 'object-contain p-1 transition duration-500 group-hover:scale-105',
  });
  photo.srcSet = trimSrcSet(photo.srcSet, CARD_WIDTHS);
  return (
    <div
      data-product-card
      data-preview={JSON.stringify({ name: p.name, price: p.price, regular: p.regular_price, sale: p.sale_price })}
      data-reveal
      suppressHydrationWarning
      style={{ '--reveal-delay': `${(index % 5) * 70}ms` }}
      className="group relative flex h-full flex-col rounded-2xl bg-white shadow-lg transition-shadow duration-500 hover:shadow-sm sm:rounded-3xl"
    >
      {/* photo */}
      <div className="px-2 pt-2 sm:px-3 sm:pt-3 lg:px-4 lg:pt-4">
        <div className="flex min-h-5 items-start justify-between gap-1 sm:min-h-6">
          {off > 0 ? <span className={`${pill} bg-sale`}>{off}%</span> : <span />}
          {label ? <span className={`${pill} bg-[linear-gradient(93deg,#222222_-29%,#6d3f0e_93%)]`}>{label}</span> : null}
        </div>
        <Link prefetch={false} href={href} className="relative mt-1 block aspect-[5/4] overflow-hidden" tabIndex={-1} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img {...photo} fetchPriority={priority ? 'high' : undefined} />
        </Link>
        <div className="flex items-end justify-between">
          {saved > 0 ? (
            <span className="mb-1.5 rounded-full bg-[#087400] px-2 py-0.5 text-[9px] font-bold text-white sm:mb-2 sm:px-3 sm:py-1 sm:text-[11px]">Save {taka(saved)}</span>
          ) : <span />}
          <div className="card-tab -mr-2 flex gap-1 rounded-tl-2xl bg-surface p-1 pl-1.5 sm:-mr-3 sm:gap-1.5 sm:pl-2 lg:-mr-4">
            <CardQuickActions product={p} />
          </div>
        </div>
      </div>

      {/* details */}
      <div className="flex flex-1 flex-col rounded-b-2xl rounded-tl-2xl bg-surface p-2 sm:rounded-b-3xl sm:p-3 lg:p-4">
        <Link prefetch={false} href={href}>
          <h3 className="line-clamp-2 min-h-[2.6em] text-[13px] font-semibold leading-[1.3] text-[#575757] transition group-hover:text-ink sm:text-[15px]">
            {p.name}{' '}
            <span className={`font-bold ${p.in_stock ? 'text-instock' : 'text-rose-600'}`}>{p.in_stock ? 'In Stock' : 'Stock Out'}</span>
          </h3>
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="text-base font-bold text-ink sm:text-xl">{taka(p.price)}</span>
          {off > 0 ? <span className="text-xs text-slate-400 line-through sm:text-sm">{taka(p.regular_price)}</span> : null}
        </div>
        <div className="mt-auto flex items-center gap-1.5 pt-3 sm:gap-2">
          <div className="min-w-0 flex-1"><CardCartButton product={p} /></div>
          <Link prefetch={false} href={href} aria-label={`View ${p.name}`} title="View details"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-slate-200 bg-white text-slate-500 transition hover:border-slate-400 hover:text-slate-700 lg:h-11 lg:w-11">
            <span aria-hidden="true" className="i-mask i-eye h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
