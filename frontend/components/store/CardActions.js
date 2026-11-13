// The card buttons are plain HTML: they carry what they need in data-* attributes and one shared
// listener (CardActionsHub, mounted once in the shop layout) handles every click. A page full of
// product cards then has nothing to start up per card, which keeps phones quick on first load.

const cartItem = (p) => ({
  product_id: p.id, variant_id: null, name: p.name, variant_name: null, slug: p.slug, image: p.thumbnail,
  price: p.price, regular_price: p.regular_price, stock: p.in_stock ? 9999 : 0,
});

/** "Add to Cart" at the bottom of a product card */
export default function CardCartButton({ product: p }) {
  if (!p.in_stock) {
    return (
      <button type="button" disabled className="h-10 w-full rounded-[13px] bg-white/70 text-sm font-semibold text-slate-400 sm:h-11">
        Out of Stock
      </button>
    );
  }
  const variable = p.type === 'variable';
  return (
    <button
      type="button"
      data-card-cart={variable ? undefined : JSON.stringify(cartItem(p))}
      data-card-go={variable ? `/product/${p.slug}` : undefined}
      className="flex h-10 w-full items-center justify-center gap-2 rounded-[13px] border border-[#f0d3b0] bg-white px-1 text-[13px] font-semibold leading-none text-[#6d3f0e] shadow-[0_0_8px_4px_rgba(233,204,174,0.3)] transition active:scale-95 hover:bg-gold-soft sm:h-11 sm:gap-2.5 sm:text-base"
    >
      <span aria-hidden="true" className="i-mask i-cart h-4 w-4" />
      {variable ? 'Choose Options' : 'Add to Cart'}
    </button>
  );
}

/** The round "buy now" button in the card's grey tab */
export function CardQuickActions({ product: p }) {
  if (!p.in_stock) return null;
  const href = p.type === 'variable' ? `/product/${p.slug}` : `/checkout?buy=${p.id}&qty=1`;
  return (
    <button
      type="button"
      data-card-go={href}
      aria-label={`Buy ${p.name} now`}
      title="Buy now"
      className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-gold hover:text-bronze sm:h-8 sm:w-8"
    >
      <span aria-hidden="true" className="i-mask i-zap h-3.5 w-3.5 sm:h-4 sm:w-4" />
    </button>
  );
}
