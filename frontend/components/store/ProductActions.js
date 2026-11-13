'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import { discountPct, imgUrl, taka, telLink, waLink } from '@/lib/format';
import { useCart } from './CartProvider';
import { QtyStepper } from './CartDrawer';
import { flyToCart } from '@/lib/flyToCart';
import { productData, track } from '@/lib/pixel';
import { FlashSaleStrip } from './FlashCountdown';

/** Attribute list from the product, falling back to whatever the variants contain */
function useAttributes(product) {
  return useMemo(() => {
    const variants = product.variants || [];
    const names = [];
    for (const a of product.attributes || []) if (a?.name && !names.includes(a.name)) names.push(a.name);
    for (const v of variants) for (const k of Object.keys(v.attrs || {})) if (!names.includes(k)) names.push(k);
    return names.map((name) => {
      const declared = (product.attributes || []).find((a) => a.name === name)?.values || [];
      const used = [...new Set(variants.map((v) => v.attrs?.[name]).filter(Boolean))];
      return { name, values: declared.length ? declared.filter((x) => used.includes(x)) : used };
    }).filter((a) => a.values.length);
  }, [product]);
}

export default function ProductActions({ product: p, contact, summary = '', delivery = {} }) {
  const router = useRouter();
  const { add } = useCart();
  const variants = p.variants || [];
  const isVariable = p.type === 'variable' && variants.length > 0;
  const attrs = useAttributes(p);
  const [sel, setSel] = useState(() => {
    if (!isVariable) return {};
    const first = variants.find((v) => v.qty > 0) || variants[0];
    return { ...(first.attrs || {}) };
  });
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');
  const [sizeOpen, setSizeOpen] = useState(false);

  const variant = isVariable ? variants.find((v) => attrs.every((a) => v.attrs?.[a.name] === sel[a.name])) || null : null;
  const src = variant || p;
  const price = Number(src.sale_price) > 0 ? Number(src.sale_price) : Number(src.regular_price);
  const off = discountPct(src.regular_price, src.sale_price);
  const stock = isVariable ? (variant ? Number(variant.qty) : 0) : Number(p.qty);
  const inStock = stock > 0;

  useEffect(() => {
    track('ViewContent', { ...productData([{ product_id: p.id, price, qty: 1 }]), content_name: p.name });
  }, [p.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const available = (name, value) => variants.some((v) => v.attrs?.[name] === value && v.qty > 0
    && attrs.every((a) => a.name === name || !sel[a.name] || v.attrs?.[a.name] === sel[a.name]));

  const choose = (name, value) => {
    const next = { ...sel, [name]: value };
    // keep a valid combination: if none matches, pick the first variant with this value
    if (!variants.some((v) => attrs.every((a) => v.attrs?.[a.name] === next[a.name]))) {
      const fallback = variants.find((v) => v.attrs?.[name] === value && v.qty > 0) || variants.find((v) => v.attrs?.[name] === value);
      if (fallback) Object.assign(next, fallback.attrs);
    }
    setSel(next);
    setError('');
    setQty(1);
    const v = variants.find((x) => attrs.every((a) => x.attrs?.[a.name] === next[a.name]));
    if (v?.image) window.dispatchEvent(new CustomEvent('variant-image', { detail: v.image }));
  };

  const ready = () => {
    if (isVariable && !variant) { setError('Please choose an option'); return false; }
    if (!inStock) { setError('Sorry, this item is out of stock'); return false; }
    return true;
  };

  const addToCart = () => {
    if (!ready()) return;
    const item = {
      product_id: p.id, variant_id: variant?.id || null, name: p.name, variant_name: variant?.name || null, slug: p.slug,
      image: variant?.image || p.thumbnail, price, regular_price: Number(src.regular_price), stock,
    };
    const count = qty;
    const photo = [...document.querySelectorAll('[data-product-gallery] img')].find((el) => el.getBoundingClientRect().width > 0);
    flyToCart(photo, { onLand: () => add(item, count, { open: false }) });
  };
  const orderNow = () => {
    if (!ready()) return;
    router.push(`/checkout?buy=${p.id}${variant ? `&variant=${variant.id}` : ''}&qty=${qty}`);
  };

  const waText = `I want to order: ${p.name}${variant ? ` (${variant.name})` : ''} — Qty: ${qty}`;
  const openWhatsApp = (e) => {
    e.preventDefault();
    window.open(waLink(contact.whatsapp, `${waText}\n${window.location.href}`), '_blank', 'noopener');
  };

  const regular = Number(src.regular_price) || price;
  const saved = off > 0 ? regular - price : 0;
  const d = delivery;
  const tile = 'group flex flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-center text-white shadow-sm transition hover:brightness-110 sm:flex-row sm:justify-start sm:gap-3 sm:px-3 sm:text-left';
  const tileIcon = 'grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/20';

  return (
    <div className="mt-5 space-y-5">
      {p.flash ? <FlashSaleStrip title={p.flash.title} endsAt={p.flash.ends_at} /> : null}

      {/* price, quantity and key features */}
      <div className="rounded-2xl border border-[#7b4f1e]/20 bg-[#faf9f6] p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="text-[28px] font-extrabold leading-tight text-gold-deep">{taka(price)}</span>
            {off > 0 ? <span className="text-lg font-semibold text-sale line-through">{taka(regular)}</span> : null}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-700">Quantity:</span>
            <QtyStepper value={qty} onChange={setQty} max={stock > 0 ? stock : 1} />
          </div>
        </div>
        <p className={`mt-2 inline-flex items-center gap-1.5 text-sm font-semibold ${inStock ? 'text-instock' : 'text-rose-600'}`}>
          <span className={`h-2 w-2 rounded-full ${inStock ? 'bg-instock' : 'bg-rose-500'}`} />
          {inStock ? (stock <= 5 ? `Only ${stock} left in stock` : 'In Stock') : 'Out of Stock'}
        </p>
        {summary ? <div className="key-feats mt-4" dangerouslySetInnerHTML={{ __html: summary }} /> : null}
      </div>

      {/* options (colour, storage, size…) */}
      {attrs.length || p.size_chart ? (
        <div className="rounded-2xl border border-[#7b4f1e]/20 bg-[#faf9f6] p-4 md:p-5">
          <div className="space-y-4">
            {attrs.map((a) => (
              <div key={a.name} className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                <p className="shrink-0 pt-2 text-sm font-semibold text-ink-2 sm:min-w-28">{a.name}:</p>
                <div className="flex flex-wrap gap-2">
                  {a.values.map((val) => {
                    const active = sel[a.name] === val;
                    const ok = available(a.name, val);
                    return (
                      <button key={val} type="button" onClick={() => choose(a.name, val)} aria-pressed={active}
                        className={`rounded-xl border-2 px-3 py-1.5 text-sm font-medium transition ${active ? 'border-gold-line bg-gold-line text-black shadow-sm' : ok ? 'border-slate-200 bg-white text-slate-700 hover:border-gold-line' : 'border-slate-100 bg-white text-slate-400 line-through'}`}>
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {variant || p.size_chart ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#7b4f1e]/10 pt-3">
              {variant ? <p className="text-sm text-slate-600">{p.name} {variant.name}</p> : <span />}
              {p.size_chart ? (
                <button type="button" onClick={() => setSizeOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-bronze hover:underline">
                  <Icon name="ruler" className="h-4 w-4" /> Size Guide
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

      {/* quick ways to order */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {contact.phone ? (
          <a href={telLink(contact.phone)} className={`${tile} bg-gradient-to-r from-[#f2412f] to-[#ff9f1c]`}>
            <span className={tileIcon}><Icon name="phone" className="h-4 w-4" /></span>
            <span className="flex-1 text-[11px] font-semibold leading-tight sm:text-sm">Call For Order</span>
            <Icon name="chevron-right" className="hidden h-4 w-4 opacity-80 sm:block" />
          </a>
        ) : null}
        {contact.whatsapp ? (
          <a href={waLink(contact.whatsapp, waText)} onClick={openWhatsApp} target="_blank" rel="noopener noreferrer" className={`${tile} bg-gradient-to-r from-[#1f5e44] to-[#2fd08d]`}>
            <span className={tileIcon}><Icon name="whatsapp" className="h-4 w-4" /></span>
            <span className="flex-1 text-[11px] font-semibold leading-tight sm:text-sm">WhatsApp Order</span>
            <Icon name="chevron-right" className="hidden h-4 w-4 opacity-80 sm:block" />
          </a>
        ) : null}
        <Link prefetch={false} href="/outlets" className={`${tile} bg-gradient-to-r from-[#6a3cf5] to-[#a47bff]`}>
          <span className={tileIcon}><Icon name="store" className="h-4 w-4" /></span>
          <span className="flex-1 text-[11px] font-semibold leading-tight sm:text-sm">Store Locations</span>
          <Icon name="chevron-right" className="hidden h-4 w-4 opacity-80 sm:block" />
        </Link>
      </div>

      {/* offer price vs regular price */}
      {off > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-[#f28b2c] bg-white px-4 py-3">
            <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 border-[#f28b2c]"><span className="h-1.5 w-1.5 rounded-full bg-[#f28b2c]" /></span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-2">Offer Price: <span className="text-[#e8790e]">{taka(price)}</span></p>
              <p className="text-xs text-slate-500">Cash on delivery available</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <span className="h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-2">Regular Price: <span className="text-[#e8790e]">{taka(regular)}</span></p>
              <p className="text-xs text-slate-500">You save {taka(saved)}</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* delivery and payment */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-[#fffcd3] px-2 py-5 text-center sm:py-6">
          <Icon name="truck" className="h-6 w-6 text-[#d9480f]" />
          <p className="text-[10px] font-medium leading-tight text-ink-2 sm:text-xs">{d.insideLabel || 'Inside Dhaka'}</p>
          <p className="text-sm font-bold text-ink-2 sm:text-base">{d.inside}</p>
          {d.insideTime ? <p className="text-[10px] leading-tight text-slate-500 sm:text-[11px]">{d.insideTime}</p> : null}
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-[#ffefde] px-2 py-5 text-center sm:py-6">
          <Icon name="package" className="h-6 w-6 text-[#c2410c]" />
          <p className="text-[10px] font-medium leading-tight text-ink-2 sm:text-xs">{d.outsideLabel || 'Outside Dhaka'}</p>
          <p className="text-sm font-bold text-ink-2 sm:text-base">{d.outside}</p>
          {d.outsideTime ? <p className="text-[10px] leading-tight text-slate-500 sm:text-[11px]">{d.outsideTime}</p> : null}
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-[#edf2ff] px-2 py-5 text-center sm:py-6">
          <Icon name="shield" className="h-6 w-6 text-[#2f54eb]" />
          <p className="text-[10px] font-medium leading-tight text-ink-2 sm:text-xs">Payment</p>
          <p className="text-sm font-bold text-ink-2 sm:text-base">Cash on Delivery</p>
          <p className="text-[10px] leading-tight text-slate-500 sm:text-[11px]">100% original product</p>
        </div>
      </div>

      {/* bottom bar: always on screen, like a checkout counter */}
      <div data-product-bar className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-[#f5f5f7] shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between gap-3 px-3 sm:px-6 md:h-24 lg:px-8">
          <div className="hidden shrink-0 items-start gap-2 xl:flex">
            <Icon name="store" className="mt-0.5 h-5 w-5 text-slate-700" />
            <div>
              <p className="text-sm font-semibold leading-tight text-slate-800">Store Locations</p>
              <Link prefetch={false} href="/outlets" className="text-xs text-[#e8790e] hover:underline">View our outlets</Link>
            </div>
          </div>
          <span className="hidden h-11 w-px bg-slate-300 xl:block" />
          <div className="hidden shrink-0 items-start gap-2 lg:flex">
            <Icon name="truck" className="mt-0.5 h-5 w-5 text-slate-700" />
            <div>
              <p className="text-sm font-semibold leading-tight text-slate-800">Home Delivery</p>
              <p className="text-xs text-[#e8790e]">{d.insideLabel || 'Inside Dhaka'}: {d.inside}</p>
              <p className="text-xs text-slate-500">{d.outsideLabel || 'Outside Dhaka'}: {d.outside}</p>
            </div>
          </div>
          <span className="hidden h-11 w-px bg-slate-300 lg:block" />
          <div className="min-w-0 lg:text-center">
            <p className="text-lg font-bold leading-tight text-ink-2 md:text-2xl">{taka(price)}</p>
            {off > 0 ? (
              <p className="truncate text-xs text-slate-500"><span className="line-through">{taka(regular)}</span> <span className="font-semibold text-[#e8790e]">Save {taka(saved)}</span></p>
            ) : <p className="truncate text-xs text-slate-500">{variant ? variant.name : (inStock ? 'In Stock' : 'Out of Stock')}</p>}
          </div>
          <div className="hidden md:block"><QtyStepper value={qty} onChange={setQty} max={stock > 0 ? stock : 1} /></div>
          <div className="flex shrink-0 items-center gap-1.5 md:gap-3">
            <button type="button" onClick={addToCart} disabled={!inStock} className="whitespace-nowrap rounded-full bg-gold-line px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#e2bd96] disabled:opacity-50 md:px-6 md:text-base">
              Add to cart
            </button>
            <button type="button" onClick={orderNow} disabled={!inStock} className="font-bn whitespace-nowrap rounded-full bg-ink-2 px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50 md:px-6 md:text-base">
              অর্ডার করুন
            </button>
          </div>
        </div>
      </div>

      {sizeOpen && p.size_chart ? (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSizeOpen(false)} />
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">{p.size_chart.name || 'Size Guide'}</h3>
              <button type="button" onClick={() => setSizeOpen(false)} aria-label="Close"><Icon name="x" /></button>
            </div>
            {p.size_chart.image ? (
              <Image src={imgUrl(p.size_chart.image)} alt="Size chart" width={900} height={700} className="h-auto w-full rounded-xl" />
            ) : <p className="text-sm text-slate-500">No size chart image.</p>}
          </div>
        </div>
      ) : null}
    </div>
  );
}
