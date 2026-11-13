'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import { imgUrl, taka } from '@/lib/format';

export default function SearchBox({ compact = false }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    if (q.trim().length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        setResults(res.ok ? await res.json() : []);
        setOpen(true);
      } catch { setResults([]); }
    }, 250);
    return () => clearTimeout(timer.current);
  }, [q]);

  const submit = (e) => {
    e.preventDefault();
    setOpen(false);
    router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <form onSubmit={submit} className="relative w-full" role="search">
      <div className={`flex items-center overflow-hidden bg-white ${compact ? 'h-11 rounded-xl' : 'h-[54px] rounded-[10px]'}`}>
        <button type="submit" className="grid h-full w-12 shrink-0 place-items-center text-slate-500 transition hover:text-gold-deep" aria-label="Search">
          <Icon name="search" className="h-5 w-5" />
        </button>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="Search for the item"
          className="h-full min-w-0 flex-1 bg-transparent pr-4 text-[15px] text-ink outline-none placeholder:text-slate-400"
          aria-label="Search products"
        />
      </div>
      {open && q.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl bg-white text-ink shadow-2xl ring-1 ring-black/5">
          {results.length ? (
            <>
              {results.map((p) => (
                <Link prefetch={false} key={p.id} href={`/product/${p.slug}`} className="flex items-center gap-3 px-3 py-2 transition hover:bg-sand" onClick={() => setOpen(false)}>
                  <Image src={imgUrl(p.thumbnail)} alt="" width={44} height={44} className="h-11 w-11 rounded-lg bg-surface object-contain mix-blend-multiply" />
                  <span className="line-clamp-1 flex-1 text-sm">{p.name}</span>
                  <span className="text-sm font-bold text-gold-deep">{taka(p.price)}</span>
                </Link>
              ))}
              <button type="submit" className="block w-full border-t border-slate-100 px-3 py-2.5 text-center text-sm font-semibold text-bronze transition hover:bg-sand">
                See all results for “{q}”
              </button>
            </>
          ) : (
            <p className="px-4 py-3 text-sm text-slate-500">No products found</p>
          )}
        </div>
      ) : null}
    </form>
  );
}
