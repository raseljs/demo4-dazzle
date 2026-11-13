'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { taka } from '@/lib/format';
import { useCart } from './CartProvider';
import { useCurrentUser } from './HeaderClient';

export default function MobileNav({ menu }) {
  const pathname = usePathname();
  const user = useCurrentUser();
  const { count, subtotal, setOpen: openCart, popKey } = useCart();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => setOpen(false), [pathname]);
  // the ☰ button in the header opens this drawer
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener('open-shop-menu', show);
    return () => window.removeEventListener('open-shop-menu', show);
  }, []);

  // product pages have their own bottom bar (price + Add to cart), so the nav steps aside there
  const onProduct = pathname.startsWith('/product/');
  const accountHref = user ? (user.is_staff ? '/admin' : '/dashboard') : '/login';
  const tabs = [
    { href: '/', icon: 'home', label: 'Home', active: pathname === '/' },
    { href: '/shop', icon: 'store', label: 'Shop', active: pathname.startsWith('/shop') },
    { icon: 'grid', label: 'Category', onClick: () => setOpen(true), active: open || pathname.startsWith('/category') },
    { href: '/track-order', icon: 'truck', label: 'Track', active: pathname.startsWith('/track-order') },
    { href: accountHref, icon: 'user', label: 'Account', active: pathname.startsWith('/dashboard') || pathname === '/login' },
  ];

  return (
    <>
      {/* Floating cart summary */}
      {pathname !== '/checkout' && pathname !== '/cart' ? (
        <button
          type="button"
          onClick={() => openCart(true)}
          className="no-print fixed right-0 top-1/2 z-30 -translate-y-1/2 overflow-hidden rounded-l-2xl text-center text-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]"
          aria-label="Open cart"
        >
          <span data-cart-target="float" className="block bg-ink px-2.5 py-2.5">
            <Icon name="cart" className="mx-auto h-5 w-5 text-gold-soft" />
            <span key={popKey} className={`${popKey ? 'cart-badge-pop ' : ''}mt-1 block text-[10px] font-bold tracking-wide`}>{count} ITEMS</span>
          </span>
          <span className="block bg-gold-deep px-2 py-1.5 text-xs font-bold">{taka(subtotal)}</span>
        </button>
      ) : null}

      {onProduct ? null : (
      <nav aria-label="Main" className="no-print fixed inset-x-3 bottom-3 z-40 flex items-center gap-1 rounded-[26px] bg-[#1a1a1a]/95 p-1.5 shadow-[0_14px_34px_-10px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur lg:hidden">
        {tabs.map((t) => {
          const cls = `flex flex-1 flex-col items-center gap-0.5 rounded-[20px] py-2 text-[11px] font-semibold transition ${t.active ? 'bg-white/10 text-gold-soft' : 'text-slate-400'}`;
          const body = (<><Icon name={t.icon} className="h-5 w-5" />{t.label}</>);
          return t.href ? (
            <Link prefetch={false} key={t.label} href={t.href} className={cls} aria-current={t.active ? 'page' : undefined}>{body}</Link>
          ) : (
            <button key={t.label} type="button" onClick={t.onClick} className={cls}>{body}</button>
          );
        })}
      </nav>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Categories">
          <div className="absolute inset-0 bg-black/55 animate-fade" onClick={() => setOpen(false)} />
          <aside className="animate-slide-left absolute inset-y-0 left-0 flex w-[84%] max-w-sm flex-col bg-cream">
            <div className="bg-night flex items-center justify-between px-5 py-4 text-white">
              <span className="text-lg font-bold">Categories</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="grid h-9 w-9 place-items-center rounded-xl border border-white/20">
                <Icon name="x" className="h-5 w-5" />
              </button>
            </div>
            <ul className="flex-1 overflow-y-auto px-3 py-3 text-[15px]">
              <li><Link prefetch={false} href="/shop" className="block rounded-xl px-3 py-3 font-semibold text-ink">All Products</Link></li>
              {menu.map((item, i) => (
                <li key={i} className="mt-1 rounded-xl bg-white">
                  <div className="flex items-center">
                    <Link prefetch={false} href={item.url || '#'} className="flex-1 px-3 py-3 font-semibold text-ink">{item.label}</Link>
                    {item.children?.length ? (
                      <button type="button" className="grid h-11 w-11 place-items-center text-gold-deep" onClick={() => setExpanded(expanded === i ? null : i)} aria-label={`Show ${item.label}`} aria-expanded={expanded === i}>
                        <Icon name="chevron-down" className={`h-4 w-4 transition ${expanded === i ? 'rotate-180' : ''}`} />
                      </button>
                    ) : null}
                  </div>
                  {expanded === i ? (
                    <ul className="border-t border-slate-100 pb-2">
                      {item.children.map((c, j) => (
                        <li key={j}><Link prefetch={false} href={c.url || '#'} className="block px-6 py-2 text-slate-600">{c.label}</Link></li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
              <li className="mt-1"><Link prefetch={false} href="/track-order" className="block rounded-xl px-3 py-3 font-semibold text-ink">Track Order</Link></li>
            </ul>
          </aside>
        </div>
      ) : null}
    </>
  );
}
