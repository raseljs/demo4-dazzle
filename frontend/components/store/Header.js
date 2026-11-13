import Link from 'next/link';
import Image from '@/components/Img';
import { imgUrl, telLink } from '@/lib/format';
import Icon from '@/components/Icon';
import SearchBox from './SearchBox';
import { AccountButton, HeaderCart, MenuButton } from './HeaderClient';
import HoverMenu from './HoverMenu';

/** The header is dark, so it shows the main logo (white). `variant="light"` is for light backgrounds. */
export function Logo({ settings, className = 'h-9 md:h-10', variant = 'dark' }) {
  const src = variant === 'light' ? settings.logo_light || settings.logo : settings.logo || settings.logo_light;
  if (src) {
    return (
      <Image
        src={imgUrl(src)}
        alt={settings.site_title || 'Logo'}
        width={180}
        height={45}
        loading="eager"
        className={`${className} w-auto object-contain`}
      />
    );
  }
  return <span className="text-xl font-extrabold tracking-tight md:text-2xl">{settings.site_title}</span>;
}

const NAV = [
  { label: 'Shop', href: '/shop' },
  { label: 'New Arrivals', href: '/shop?sort=latest' },
  { label: 'Track Order', href: '/track-order', pill: true },
];

export default function Header({ settings, menu, categories = [] }) {
  return (
    <>
      <header className="no-print sticky top-0 z-40 text-white lg:static">
        {/* ── Desktop ─────────────────────────────── */}
        <div className="bg-night hidden rounded-b-[20px] lg:block">
          <div className="mx-auto max-w-[1420px] px-4">
            <TopStrip settings={settings} />
          </div>
          <div className="container-x">
            <div className="flex h-[87px] items-center gap-8 border-b border-white/5">
              <Link prefetch={false} href="/" className="shrink-0" aria-label="Home">
                <Logo settings={settings} className="h-10" />
              </Link>
              <nav aria-label="Quick links" className="flex shrink-0 items-center gap-1 text-sm font-medium">
                {NAV.map((n) => (
                  <Link
                    key={n.href}
                    prefetch={false}
                    href={n.href}
                    className={n.pill
                      ? 'rounded-lg border border-[#deb475] bg-[#ffc04a]/30 px-3 py-1.5 text-white transition hover:bg-[#ffc04a]/40'
                      : 'rounded-lg px-3 py-1.5 text-slate-300 transition hover:bg-white/5 hover:text-white'}
                  >
                    {n.label}
                  </Link>
                ))}
              </nav>
              <div className="flex min-w-0 flex-1 justify-center">
                <div className="w-full max-w-[540px]"><SearchBox /></div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <AccountButton />
                <HeaderCart />
              </div>
            </div>

            <div className="flex h-[68px] items-center gap-3">
              <ExploreAll categories={categories} />
              <CategoryBar menu={menu} phone={settings.phone} />
            </div>
          </div>
        </div>

        {/* ── Phone / tablet ──────────────────────── */}
        <div className="bg-night rounded-b-[28px] px-4 pb-4 pt-3 shadow-[0_10px_24px_-14px_rgba(0,0,0,0.55)] lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link prefetch={false} href="/" aria-label="Home" className="shrink-0">
              <Logo settings={settings} className="h-8" />
            </Link>
            <div className="flex items-center gap-2.5">
              <AccountButton compact />
              <HeaderCart compact />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <div className="min-w-0 flex-1"><SearchBox compact /></div>
            <MenuButton />
          </div>
        </div>
      </header>
      <Announcements settings={settings} />
    </>
  );
}

function TopStrip({ settings: s }) {
  return (
    <div className="flex h-[34px] items-center justify-between rounded-b-[10px] bg-white px-12 text-xs text-ink-2">
      <div className="flex items-center gap-5 font-semibold">
        <Link prefetch={false} href="/shop?sort=latest" className="title-gold">New Arrivals</Link>
        <Link prefetch={false} href="/track-order" className="title-gold">Track Your Order</Link>
      </div>
      <div className="flex items-center gap-5">
        {s.phone ? (
          <a href={telLink(s.phone)} className="flex items-center gap-1.5 hover:text-gold-deep">
            <Icon name="phone" className="h-3.5 w-3.5" /> {s.phone}
          </a>
        ) : null}
        {s.address ? (
          <span className="flex max-w-80 items-center gap-1.5 truncate">
            <Icon name="map-pin" className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{s.address}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Gold "Explore all" button: every category and its sub-categories in one panel. */
function ExploreAll({ categories }) {
  if (!categories.length) return null;
  const panel = (
    <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
      <div className="grid w-[min(860px,85vw)] grid-cols-4 gap-x-6 gap-y-5 rounded-2xl bg-white p-6 text-ink shadow-2xl ring-1 ring-black/5">
        {categories.map((c) => (
          <div key={c.id}>
            <Link prefetch={false} href={`/category/${c.slug}`} className="text-sm font-bold text-ink hover:text-gold-deep">{c.name}</Link>
            {c.children?.length ? (
              <ul className="mt-2 space-y-1.5">
                {c.children.map((ch) => (
                  <li key={ch.id}>
                    <Link prefetch={false} href={`/category/${ch.slug}`} className="text-[13px] text-slate-600 transition hover:text-gold-deep">{ch.name}</Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <HoverMenu className="group relative shrink-0" panel={panel}>
      <Link
        prefetch={false}
        href="/shop"
        className="flex h-11 items-center gap-2 rounded-[10px] bg-gold px-4 text-xs font-bold tracking-wide text-ink transition hover:bg-gold-line"
      >
        <Icon name="grid" className="h-4 w-4" /> EXPLORE ALL <Icon name="chevron-down" className="h-3.5 w-3.5 transition group-hover:rotate-180" />
      </Link>
    </HoverMenu>
  );
}

function CategoryBar({ menu, phone }) {
  return (
    <nav aria-label="Categories" className="flex min-w-0 flex-1 items-center rounded-[10px] bg-white px-2 text-ink-2">
      <ul className="flex min-w-0 flex-1 items-center text-sm font-medium">
        {menu.map((item, i) => (
          <HoverMenu
            key={i}
            as="li"
            className="group relative"
            panel={item.children?.length ? (
              <div className="invisible absolute left-0 top-full z-50 pt-1 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <ul className="min-w-56 rounded-xl bg-white py-2 shadow-xl ring-1 ring-black/5">
                  {item.children.map((c, j) => (
                    <li key={j}>
                      <Link prefetch={false} href={c.url || '#'} className="block px-4 py-2 text-sm text-slate-700 transition hover:bg-sand hover:text-gold-deep">{c.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          >
            <Link prefetch={false} href={item.url || '#'} className="flex h-11 items-center gap-1 whitespace-nowrap px-3.5 transition hover:text-gold-deep">
              {item.label}
              {item.children?.length ? <Icon name="chevron-down" className="h-3.5 w-3.5 text-slate-400 transition group-hover:rotate-180" /> : null}
            </Link>
          </HoverMenu>
        ))}
      </ul>
      {phone ? (
        <a href={telLink(phone)} className="hidden shrink-0 items-center gap-2 pr-3 text-sm xl:flex">
          <span className="text-slate-500">Hotline</span>
          <span className="font-bold text-ink">{phone}</span>
        </a>
      ) : null}
    </nav>
  );
}

/** Scrolling strip of shop promises under the header */
function Announcements({ settings: s }) {
  const items = [
    '🚚 সারা দেশে হোম ডেলিভারি',
    '💵 ক্যাশ অন ডেলিভারি সুবিধা',
    '✅ ১০০% অরিজিনাল প্রোডাক্ট',
    '🔁 সহজ রিটার্ন ও এক্সচেঞ্জ',
    '🛠️ কেনার পরেও সার্ভিস সাপোর্ট',
    s.phone ? `📞 অর্ডার করতে কল করুন ${s.phone}` : null,
  ].filter(Boolean);
  const row = (hidden) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((t, i) => (
        <li key={i} className="flex items-center whitespace-nowrap px-6 text-[13px] font-medium text-ink-2">
          {t}<span className="ml-12 h-1 w-1 rounded-full bg-gold" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="no-print marquee font-bn overflow-hidden border-b border-gold-line/40 py-2">
      <div className="marquee-track flex w-max">{row(false)}{row(true)}</div>
    </div>
  );
}
