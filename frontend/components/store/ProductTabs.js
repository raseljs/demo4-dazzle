'use client';
import Link from 'next/link';
import { useState } from 'react';
import Icon from '@/components/Icon';
import { api, getUser } from '@/lib/client';
import { fmtDate } from '@/lib/format';

export function youtubeId(url) {
  const m = String(url || '').match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function StarsInput({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)} aria-label={`${i} stars`} className="text-amber-400">
          <Icon name={i <= value ? 'star-fill' : 'star'} className={`h-7 w-7 ${i <= value ? '' : 'text-slate-300'}`} />
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ productId }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const user = typeof window !== 'undefined' ? getUser() : null;

  if (!user) {
    return (
      <div className="rounded-2xl bg-sand p-5 text-sm text-slate-600">
        Please <Link href={`/login?next=${typeof window !== 'undefined' ? encodeURIComponent(location.pathname) : '/'}`} className="font-semibold text-bronze underline">log in</Link> to write a review.
      </div>
    );
  }
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api('/reviews', { method: 'POST', body: { product_id: productId, rating, comment } });
      setMsg({ ok: true, text: r.message });
      setComment('');
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl bg-sand p-5">
      <p className="font-semibold">Write a review</p>
      <StarsInput value={rating} onChange={setRating} />
      <textarea className="input" required value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience with this product" />
      {msg ? <p className={`text-sm ${msg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{msg.text}</p> : null}
      <button className="btn btn-ink rounded-full px-6" disabled={busy}>{busy ? 'Submitting…' : 'Submit Review'}</button>
    </form>
  );
}

export default function ProductTabs({ specs = [], description, video, reviews, productId, rating }) {
  const [tab, setTab] = useState(specs.length ? 'spec' : 'desc');
  const vid = youtubeId(video);
  const tabs = [
    specs.length ? ['spec', 'Specification'] : null,
    ['desc', 'Description'],
    ['reviews', `Reviews (${reviews.length})`],
  ].filter(Boolean);
  const tabCls = (t) => `rounded-xl px-5 py-2.5 text-sm font-semibold transition ${tab === t ? 'bg-gold-line text-black shadow-sm' : 'bg-[#f7f7f7] text-slate-700 hover:bg-[#efefef]'}`;
  return (
    <section className="mt-8 md:mt-10">
      <div className="flex flex-wrap items-center gap-3" role="tablist">
        {tabs.map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} className={tabCls(key)} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'spec' ? (
          <div className="flex flex-col gap-4">
            {specs.map((g, gi) => (
              <div key={gi} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
                  <span className="text-sm font-semibold text-slate-700">{g.name}</span>
                </div>
                <div className="bg-[#f7f7f7] p-3">
                  {g.rows.map(([label, value], ri) => (
                    <div key={ri} className="mb-1 grid grid-cols-[96px_1fr] gap-3 rounded-lg bg-white px-4 py-2.5 last:mb-0 sm:grid-cols-[200px_1fr] sm:gap-4 sm:px-5 md:py-3.5">
                      <span className="text-sm leading-relaxed text-slate-500" dangerouslySetInnerHTML={{ __html: label }} />
                      <span className="min-w-0 break-words text-sm leading-relaxed text-slate-800" dangerouslySetInnerHTML={{ __html: value }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {tab === 'desc' ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-8">
            {description ? <div className="prose-content" dangerouslySetInnerHTML={{ __html: description }} /> : <p className="text-slate-500">No description yet.</p>}
            {vid ? (
              <div className="mt-6 aspect-video overflow-hidden rounded-2xl">
                <iframe src={`https://www.youtube.com/embed/${vid}`} title="Product video" loading="lazy" allowFullScreen className="h-full w-full" />
              </div>
            ) : null}
          </div>
        ) : null}

        {tab === 'reviews' ? (
          <div className="grid gap-8 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2 md:p-8">
            <div>
              <h3 className="mb-1 text-lg font-semibold">Customer Reviews</h3>
              <p className="mb-4 text-sm text-slate-500">{reviews.length ? `${Number(rating).toFixed(1)} out of 5 · ${reviews.length} reviews` : 'No reviews yet.'}</p>
              <ul className="space-y-4">
                {reviews.map((r) => (
                  <li key={r.id} className="border-b border-slate-100 pb-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{r.user_name || 'Customer'}</span>
                      <span className="text-xs text-slate-400">{fmtDate(r.created_at)}</span>
                    </div>
                    <div className="mt-1 flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((i) => <Icon key={i} name={i <= r.rating ? 'star-fill' : 'star'} className={`h-4 w-4 ${i <= r.rating ? '' : 'text-slate-300'}`} />)}
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{r.comment}</p>
                  </li>
                ))}
              </ul>
            </div>
            <ReviewForm productId={productId} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
