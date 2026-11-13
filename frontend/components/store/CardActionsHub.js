'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from './CartProvider';
import { flyToCart } from '@/lib/flyToCart';

/**
 * One click listener for every product card on the page (see CardActions):
 *  - [data-card-cart] adds the item; the photo flies into the cart and the item lands with it
 *  - [data-card-go] opens a page (buy now, or the product page for items with options)
 */
export default function CardActionsHub() {
  const router = useRouter();
  const { add } = useCart();

  useEffect(() => {
    const onClick = (e) => {
      const go = e.target.closest?.('[data-card-go]');
      if (go) {
        e.preventDefault();
        router.push(go.dataset.cardGo);
        return;
      }
      const btn = e.target.closest?.('[data-card-cart]');
      if (!btn) return;
      e.preventDefault();
      let item;
      try { item = JSON.parse(btn.dataset.cardCart); } catch { return; }
      const photo = btn.closest('[data-product-card]')?.querySelector('img');
      flyToCart(photo, { onLand: () => add(item, 1, { open: false }) });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [router, add]);

  return null;
}
