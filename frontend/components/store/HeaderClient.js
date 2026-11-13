'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { getUser } from '@/lib/client';
import { useCart } from './CartProvider';

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const load = () => setUser(getUser());
    load();
    window.addEventListener('auth-change', load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('auth-change', load);
      window.removeEventListener('storage', load);
    };
  }, []);
  return user;
}

const square = (compact) => `relative grid place-items-center rounded-xl bg-white text-ink shadow-sm transition hover:bg-gold-soft ${compact ? 'h-10 w-10' : 'h-[54px] w-[54px]'}`;

export function AccountButton({ compact = false }) {
  const user = useCurrentUser();
  const href = user ? (user.is_staff ? '/admin' : '/dashboard') : '/login';
  const label = user ? (user.is_staff ? 'Admin panel' : 'My account') : 'Log in';
  return (
    <Link prefetch={false} href={href} className={square(compact)} aria-label={label} title={label}>
      <Icon name="user" className="h-5 w-5" />
    </Link>
  );
}

export function HeaderCart({ compact = false }) {
  const { count, setOpen, popKey } = useCart();
  return (
    <button type="button" onClick={() => setOpen(true)} className={square(compact)} aria-label={`Open cart, ${count} items`}>
      <span data-cart-target="header" className="grid place-items-center">
        <Icon name="cart" className="h-5 w-5" />
      </span>
      <span key={popKey} className={`${popKey ? 'cart-badge-pop ' : ''}absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-gold-deep px-1 text-[10px] font-bold text-white ring-2 ring-[#111]`}>
        {count}
      </span>
    </button>
  );
}

/** Opens the category drawer (MobileNav listens for this event) */
export function MenuButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('open-shop-menu'))}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/25 text-white transition hover:bg-white/10"
      aria-label="Open categories"
    >
      <Icon name="menu" className="h-5 w-5" />
    </button>
  );
}
