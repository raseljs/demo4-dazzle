import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLayout, getProduct } from '@/lib/api';
import { imgUrl, stripHtml, taka, telLink, waLink } from '@/lib/format';
import { splitSpecs } from '@/lib/specs';
import { Breadcrumb, SectionTitle, Stars } from '@/components/store/Bits';
import { ProductRail } from '@/components/store/ProductCard';
import ProductGallery from '@/components/store/ProductGallery';
import ProductActions from '@/components/store/ProductActions';
import ProductTabs from '@/components/store/ProductTabs';
import ShareButtons from '@/components/store/ShareButtons';
import Icon from '@/components/Icon';

export const revalidate = 600;
export async function generateStaticParams() { return []; } // build on first visit, then cached

const decode = (s) => { try { return decodeURIComponent(s); } catch { return s; } };

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getProduct(decode(slug));
  if (!p) return { title: 'Product not found' };
  return {
    title: p.meta_title || p.name,
    description: p.meta_description || stripHtml(p.short_des || p.long_des) || p.name,
    openGraph: { title: p.name, images: p.thumbnail ? [imgUrl(p.thumbnail)] : undefined, type: 'website' },
    alternates: { canonical: `/product/${p.slug}` },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const [p, { settings }] = await Promise.all([getProduct(decode(slug)), getLayout()]);
  if (!p) notFound();

  const images = [...new Set([p.thumbnail, ...(p.images || [])].filter(Boolean))];
  const cat = p.categories?.[p.categories.length - 1] || p.categories?.[0];
  const ship = settings.shipping || {};
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    image: images.map(imgUrl),
    sku: p.sku || undefined,
    description: stripHtml(p.short_des || p.long_des, 300),
    brand: p.brand ? { '@type': 'Brand', name: p.brand.name } : undefined,
    offers: { '@type': 'Offer', priceCurrency: 'BDT', price: p.price, availability: p.qty > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' },
    aggregateRating: p.reviews?.length ? { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.reviews.length } : undefined,
  };

  const { groups: specs, rest: description } = splitSpecs(p.long_des);
  const fee = (own, dflt) => (p.free_shipping ? 'Free' : taka(Number(own) > 0 ? own : dflt));
  const delivery = {
    insideLabel: ship.inside_label, insideTime: ship.inside_time, inside: fee(p.shipping_inside, ship.shipping_inside_dhaka),
    outsideLabel: ship.outside_label, outsideTime: ship.outside_time, outside: fee(p.shipping_outside, ship.shipping_outside_dhaka),
  };
  // "Also order from": WhatsApp, Messenger (when a Facebook page is set) or email, and a phone call
  const fbPage = String(settings.fb_link || '').match(/facebook\.com\/([^/?#]+)/i)?.[1];
  const orderFrom = [
    settings.whatsapp ? { href: waLink(settings.whatsapp, `I want to order: ${p.name}`), icon: 'whatsapp', color: 'text-[#25d366]', label: 'WhatsApp Us', ext: true } : null,
    fbPage ? { href: `https://m.me/${fbPage}`, icon: 'message', color: 'text-[#a033ff]', label: 'Messenger', ext: true }
      : settings.email ? { href: `mailto:${settings.email}`, icon: 'mail', color: 'text-gold-deep', label: 'Email Us' } : null,
    settings.phone ? { href: telLink(settings.phone), icon: 'phone', color: 'text-bronze', label: 'Call Us' } : null,
  ].filter(Boolean);

  return (
    <div className="container-x py-4 md:py-6">
      <Breadcrumb items={[{ name: 'Home', href: '/' }, cat ? { name: cat.name, href: `/category/${cat.slug}` } : null, { name: p.name }]} />

      <div className="mt-4 grid gap-5 lg:grid-cols-12 lg:gap-6">
        <div className="min-w-0 rounded-2xl bg-white p-3 shadow-sm lg:sticky lg:top-6 lg:col-span-5 lg:self-start">
          <ProductGallery images={images} name={p.name} />
          {orderFrom.length ? (
            <div className="mt-6 hidden space-y-2 lg:block">
              <h4 className="text-xl font-bold text-ink-2">Also Order From</h4>
              <div className={`grid gap-2 ${orderFrom.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {orderFrom.map((o) => (
                  <a key={o.label} href={o.href} {...(o.ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-[#e9ccae47] py-[30px] transition hover:opacity-80">
                    <Icon name={o.icon} className={`h-5 w-5 ${o.color}`} />
                    <span className="text-sm font-semibold text-ink-2">{o.label}</span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="min-w-0 lg:col-span-7">
          <h1 className="text-xl font-bold leading-snug text-ink-2 sm:text-2xl">{p.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1.5">
            {p.brand ? <span className="text-slate-500">By: <Link prefetch={false} href={`/shop?brand=${p.brand.slug}`} className="font-semibold text-gold-deep hover:underline">{p.brand.name}</Link></span> : null}
            {p.sku ? <span className="text-sm text-slate-500">SKU: <b className="font-semibold text-ink-2">{p.sku}</b></span> : null}
            <span className="flex items-center gap-1.5 text-sm text-slate-500"><Stars rating={p.rating} /> <span>{Number(p.rating).toFixed(1)} ({p.reviews.length} reviews)</span></span>
          </div>

          <ProductActions
            product={{
              id: p.id, name: p.name, slug: p.slug, type: p.type, thumbnail: p.thumbnail, qty: p.qty,
              regular_price: p.regular_price, sale_price: p.sale_price, price: p.price,
              attributes: p.attributes, variants: p.variants, size_chart: p.size_chart, flash: p.flash || null,
            }}
            summary={p.short_des || ''}
            contact={{ phone: settings.phone, whatsapp: settings.whatsapp }}
            delivery={delivery}
          />

          <ShareButtons name={p.name} />
        </div>
      </div>

      <ProductTabs specs={specs} description={description} video={p.video} reviews={p.reviews} productId={p.id} rating={p.rating} />

      {p.related?.length ? (
        <section className="mt-8 md:mt-10">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-800">Related Products</h2>
            <Link prefetch={false} href={cat ? `/category/${cat.slug}` : '/shop'} className="pill-link">See All</Link>
          </div>
          <ProductRail products={p.related} />
        </section>
      ) : null}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </div>
  );
}
