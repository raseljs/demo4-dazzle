'use client';
// Flash sale countdown. Sale times come from the server in Bangladesh time (UTC+6).
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';

const endOf = (s) => new Date(`${String(s).replace(' ', 'T').slice(0, 19)}+06:00`).getTime();
const pad = (n) => String(n).padStart(2, '0');

function parts(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** Seconds left until endsAt, ticking every second. null before the first tick (avoids a server/browser mismatch). */
function useLeft(endsAt) {
  const [left, setLeft] = useState(null);
  useEffect(() => {
    const end = endOf(endsAt);
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  return left;
}

function Digits({ left, size = 'md' }) {
  const t = left === null ? null : parts(left);
  const box = size === 'sm'
    ? 'h-6 min-w-6 px-1 text-xs'
    : 'h-8 min-w-8 px-1.5 text-sm md:h-9 md:min-w-9 md:text-base';
  const units = [
    ...(t && t.d ? [['d', t.d]] : []),
    ['h', t ? t.h : null], ['m', t ? t.m : null], ['s', t ? t.s : null],
  ];
  return (
    <span className="inline-flex items-center gap-1" role="timer" aria-label={t ? `${t.d ? `${t.d} days ` : ''}${t.h} hours ${t.m} minutes ${t.s} seconds left` : 'Time left'}>
      {units.map(([u, v], i) => (
        <span key={u} className="inline-flex items-center gap-1">
          {i ? <span className="font-bold text-white/60">:</span> : null}
          <span className={`grid place-items-center rounded-full bg-[#b8894f] font-bold tabular-nums text-white ${box}`}>{v === null ? '--' : pad(v)}</span>
          {u === 'd' ? <span className="text-xs font-semibold text-white/70">d</span> : null}
        </span>
      ))}
    </span>
  );
}

/** Home page band (brown, full width): hides itself when the countdown reaches zero. */
export function FlashSaleBand({ title, endsAt, href = '/shop', children }) {
  const left = useLeft(endsAt);
  if (left === 0) return null;
  return (
    <section className="bg-umber-band py-8 md:py-12">
      <div className="container-x">
        <div className="mb-4 flex items-center justify-between gap-3 md:mb-6">
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
            <h2 className="text-[22px] font-bold leading-tight tracking-tight text-white md:text-[32px]">{title || 'Flash Sale'}</h2>
            <Digits left={left} />
          </div>
          <a href={href} className="pill-link">See All</a>
        </div>
        {children}
      </div>
    </section>
  );
}

/** Product page strip above the price. */
export function FlashSaleStrip({ title, endsAt }) {
  const left = useLeft(endsAt);
  if (left === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-umber-band px-4 py-2.5 text-white">
      <span className="flex items-center gap-1.5 text-sm font-bold"><Icon name="zap" className="h-4 w-4 text-gold-soft" /> {title}</span>
      <span className="flex items-center gap-2 text-xs font-medium">Ends in <Digits left={left} size="sm" /></span>
    </div>
  );
}
