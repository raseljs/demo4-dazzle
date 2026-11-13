import Link from 'next/link';
import Icon from '@/components/Icon';
import { telLink, waLink } from '@/lib/format';
import { Logo } from './Header';

// Developer credit: opens a WhatsApp chat with DreamSpaceIT with this message already typed
const DEVELOPER_WHATSAPP = waLink(
  '8801317768213',
  'আপনাদের তৈরি করা ওয়েবসাইটটি দেখলাম, খুব ভালো লেগেছে। আমি ওয়েবসাইট তৈরি করা বিষয়ে কথা বলতে চাই।',
);

const heading = 'mb-5 border-b border-gray-800 pb-3 text-base font-medium text-white';
const linkCls = 'transition hover:text-[#ba975f]';

export default function Footer({ settings: s, menus, categories = [] }) {
  const socials = [
    ['facebook', s.fb_link],
    ['instagram', s.insta_link],
    ['youtube', s.yt_link],
    ['twitter', s.x_link],
  ].filter(([, url]) => url);
  const columns = [
    ['Company', menus.footer_1 || []],
    ['Help Center', menus.footer_2 || []],
    ['Categories', categories.slice(0, 9).map((c) => ({ label: c.name, url: `/category/${c.slug}` }))],
  ].filter(([, items]) => items.length);
  const help = s.phone || s.whatsapp;

  return (
    <footer className="no-print relative mt-12 md:mt-16">
      {help ? (
        <div className="relative z-10 px-3.5">
          <div className="mx-auto max-w-4xl rounded-[28px] bg-white px-4 py-6 text-center shadow-lg sm:px-6 sm:py-8 md:px-10">
            <h2 className="text-base font-medium uppercase tracking-wide text-ink-2 sm:text-2xl">Need help with your order?</h2>
            <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">Call or message us for price, stock and delivery. We reply every day.</p>
            <div className="mx-auto mt-4 flex max-w-2xl items-center overflow-hidden rounded-2xl border border-slate-200 bg-white sm:mt-6">
              <span className="flex min-w-0 flex-1 items-center gap-2.5 px-3 text-sm text-slate-500 sm:px-4">
                <Icon name="phone" className="h-4 w-4 shrink-0" />
                {s.phone ? <a href={telLink(s.phone)} className="truncate font-medium text-ink-2">{s.phone}</a> : <span className="truncate">WhatsApp us any time</span>}
              </span>
              {s.whatsapp ? (
                <a href={waLink(s.whatsapp)} target="_blank" rel="noopener noreferrer"
                  className="m-1 shrink-0 rounded-xl px-3 py-2 text-xs font-medium text-ink-2 transition hover:bg-black hover:text-white sm:px-6 sm:py-3 sm:text-sm">
                  WhatsApp
                </a>
              ) : null}
              {s.phone ? (
                <a href={telLink(s.phone)} className="m-1 shrink-0 rounded-xl bg-ink-2 px-3 py-2 text-xs font-medium text-white transition hover:bg-black sm:px-6 sm:py-3 sm:text-sm">
                  Call now
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className={`footer-dark relative overflow-hidden rounded-t-[32px] bg-[#101518] px-4 pb-28 text-white sm:px-6 md:px-10 lg:px-16 lg:pb-8 ${help ? '-mt-20 pt-28 sm:-mt-28 sm:pt-40' : 'pt-14'}`}>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[90%] bg-[radial-gradient(ellipse_55%_75%_at_50%_100%,rgba(233,204,174,0.20),transparent_70%)]" />

        <div className="relative z-10 mx-auto grid max-w-[1290px] gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,3fr)] lg:gap-12">
          <div>
            <Link prefetch={false} href="/" className="inline-block"><Logo settings={s} className="h-10" /></Link>
            {s.address ? <p className="mt-6 max-w-xs text-sm leading-6 text-gray-300">{s.address}</p> : null}
            {s.tagline ? <p className="mt-3 max-w-xs text-sm leading-6 text-gray-400">{s.tagline}</p> : null}
            {socials.length ? (
              <div className="mt-6 flex gap-3">
                {socials.map(([name, url]) => (
                  <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={name}
                    className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.06] text-gold-soft transition hover:bg-white/15">
                    <Icon name={name} className="h-[18px] w-[18px]" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-10">
            {columns.map(([title, items]) => (
              <div key={title}>
                <h3 className={heading}>{title}</h3>
                <ul className="space-y-4 text-sm text-gray-300">
                  {items.map((it, i) => (
                    <li key={i}><Link prefetch={false} href={it.url || '#'} className={linkCls}>{it.label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="col-span-2 md:col-span-1">
              <h3 className={heading}>Contact</h3>
              <ul className="space-y-4 text-sm leading-6 text-gray-300">
                {s.address ? <li><b className="font-semibold text-white">Address:</b> {s.address}</li> : null}
                {s.phone ? <li><b className="font-semibold text-white">Hotline:</b> <a href={telLink(s.phone)} className={linkCls}>{s.phone}</a></li> : null}
                {s.whatsapp ? <li><b className="font-semibold text-white">WhatsApp:</b> <a href={waLink(s.whatsapp)} target="_blank" rel="noopener noreferrer" className={linkCls}>{s.whatsapp}</a></li> : null}
                {s.email ? <li><b className="font-semibold text-white">Email:</b> <a href={`mailto:${s.email}`} className={`break-all ${linkCls}`}>{s.email}</a></li> : null}
              </ul>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-12 flex max-w-[1290px] flex-col items-center justify-between gap-2 border-t border-gray-800 pt-5 text-xs text-gray-400 sm:flex-row">
          <p>{s.copyright || `© ${new Date().getFullYear()} ${s.site_title}. All rights reserved.`}</p>
          <p>
            Developed by{' '}
            <a
              href={DEVELOPER_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              title="Chat with DreamSpaceIT on WhatsApp"
              className="font-semibold text-white underline-offset-4 transition hover:text-gold-soft hover:underline"
            >
              DreamSpaceIT
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
