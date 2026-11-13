import Icon from '@/components/Icon';
import { STATUS } from '@/lib/format';

// Same steps (and names) the customer will see on the tracking result page.
const STEPS = [['pending', 'package'], ['confirmed', 'check'], ['on_the_way', 'truck'], ['delivered', 'home']];

// Contact details live in the footer's help card right below, so this block is only about tracking.
export default function HomeTrack() {
  return (
    <section data-reveal suppressHydrationWarning className="container-x pb-4 pt-6 md:pt-10">
      <div className="bg-deal-band relative overflow-hidden rounded-[32px] text-white">
        {/* a delivery route drawn faintly across the panel */}
        <svg aria-hidden="true" className="pointer-events-none absolute -right-10 -top-6 h-[130%] w-[70%] text-gold/15" viewBox="0 0 600 400" fill="none">
          <path d="M20 380 C 140 300, 120 180, 260 170 S 420 260, 470 150 S 560 40, 600 20" stroke="currentColor" strokeWidth="3" strokeDasharray="10 12" strokeLinecap="round" />
          <circle cx="260" cy="170" r="9" fill="currentColor" />
          <circle cx="470" cy="150" r="9" fill="currentColor" />
        </svg>

        <div className="relative grid items-center gap-8 p-6 md:p-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <h2 className="title-gold-light w-fit text-2xl font-bold tracking-tight md:text-[32px] md:leading-tight">Track your order</h2>
            <p className="mt-2 max-w-[52ch] text-sm leading-6 text-white/75 md:text-[15px]">
              Enter your order number, or the phone number you ordered with, to see where your parcel is.
            </p>
            <form action="/track-order" className="mt-6 flex max-w-xl items-center gap-2 rounded-2xl bg-white p-1.5 shadow-xl shadow-black/20 focus-within:ring-4 focus-within:ring-gold/40">
              <Icon name="search" className="ml-3 h-5 w-5 shrink-0 text-slate-400" />
              <label htmlFor="home-track" className="sr-only">Order number or phone</label>
              <input id="home-track" name="q" required placeholder="Order number or phone" className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-sm text-ink outline-none placeholder:text-slate-400" />
              <button className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">Track</button>
            </form>
          </div>

          <ol className="grid grid-cols-4" aria-label="How an order moves">
            {STEPS.map(([key, icon], i) => (
              <li key={key} className="relative flex flex-col items-center text-center">
                {i < STEPS.length - 1 ? (
                  <span aria-hidden="true" className="absolute left-1/2 top-6 w-full border-t-2 border-dashed border-gold/40" />
                ) : null}
                <span className={`relative grid h-12 w-12 place-items-center rounded-full ${i === STEPS.length - 1 ? 'bg-gold-soft text-ink' : 'bg-white/5 text-gold-soft ring-1 ring-gold/40'}`}>
                  <Icon name={icon} className="h-5 w-5" />
                </span>
                <span className="mt-2 text-[11px] font-semibold text-white/85 md:text-sm">{STATUS[key].label}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
