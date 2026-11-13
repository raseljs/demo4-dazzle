import { discountPct, taka } from '@/lib/format';

const Bar = ({ className }) => <div className={`animate-pulse rounded-lg bg-black/[0.06] ${className}`} />;

/**
 * Product-page-shaped placeholder: shows the clicked card's photo, name and price in the exact
 * spots the product page will put them, with the rest pulsing until the page arrives.
 * Keep this in step with app/(store)/product/[slug]/page.js and ProductActions.
 */
export default function ProductPreviewView({ p }) {
  const off = p ? discountPct(p.regular, p.sale) : 0;
  return (
    <div className="container-x py-4 md:py-6" aria-busy="true">
      <Bar className="h-4 w-56" />
      <div className="mt-4 grid gap-5 lg:grid-cols-12 lg:gap-6">
        <div className="min-w-0 rounded-2xl bg-white p-3 shadow-sm lg:col-span-5 lg:self-start">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-white">
            {p?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image} alt={p.name || ''} className="absolute inset-0 h-full w-full object-contain p-3 md:p-6" />
            ) : <div className="absolute inset-0 animate-pulse bg-black/[0.04]" />}
          </div>
          <div className="mt-3 flex gap-2.5 overflow-hidden">
            {[0, 1, 2, 3, 4].map((i) => <Bar key={i} className="h-16 w-16 shrink-0 rounded-xl md:h-[72px] md:w-[72px]" />)}
          </div>
        </div>

        <div className="min-w-0 lg:col-span-7">
          {p?.name ? <h1 className="text-xl font-bold leading-snug text-ink-2 sm:text-2xl">{p.name}</h1> : <Bar className="h-7 w-3/4" />}
          <Bar className="mt-2 h-5 w-48" />

          <div className="mt-5 rounded-2xl border border-[#7b4f1e]/20 bg-[#faf9f6] p-4 md:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {p ? (
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className="text-[28px] font-extrabold leading-tight text-gold-deep">{taka(p.price)}</span>
                  {off > 0 ? <span className="text-lg font-semibold text-sale line-through">{taka(p.regular)}</span> : null}
                </div>
              ) : <Bar className="h-9 w-40" />}
              <Bar className="h-9 w-40" />
            </div>
            <Bar className="mt-3 h-4 w-20" />
            <div className="mt-4 space-y-2">
              <Bar className="h-4 w-full" />
              <Bar className="h-4 w-5/6" />
              <Bar className="h-4 w-2/3" />
              <Bar className="h-4 w-3/4" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            <Bar className="h-[62px] rounded-xl sm:h-14" /><Bar className="h-[62px] rounded-xl sm:h-14" /><Bar className="h-[62px] rounded-xl sm:h-14" />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            <Bar className="h-28 rounded-2xl" /><Bar className="h-28 rounded-2xl" /><Bar className="h-28 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
