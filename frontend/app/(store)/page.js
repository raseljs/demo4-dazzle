import { Suspense } from 'react';
import Link from 'next/link';
import Image from '@/components/Img';
import { getBrands, getHome, getLayout, getProducts } from '@/lib/api';
import { discountPct, imgUrl } from '@/lib/format';
import HeroSlider from '@/components/store/HeroSlider';
import { ProductGrid, ProductRail } from '@/components/store/ProductCard';
import { SectionTitle, EmptyState } from '@/components/store/Bits';
import RailScroller from '@/components/store/RailScroller';
import HomeTabs from '@/components/store/HomeTabs';
import HomeBrands from '@/components/store/HomeBrands';
import HomeAbout from '@/components/store/HomeAbout';
import HomeTrack from '@/components/store/HomeTrack';
import { FlashSaleBand } from '@/components/store/FlashCountdown';

export const revalidate = 600;

// Everything below the banner and categories is wrapped in its own Suspense boundary. Nothing here waits for
// data (the HTML still arrives complete), but React then wakes up each part of the page in small
// pieces after the top of the page is ready, instead of in one long block. That long block is what
// made phones (and Lighthouse's slow-phone test) report a high "Total Blocking Time".
const Later = ({ children }) => <Suspense fallback={null}>{children}</Suspense>;

export default async function HomePage() {
  const [home, { settings: s }, brands] = await Promise.all([getHome(), getLayout(), getBrands()]);
  if (!home) {
    return (
      <div className="container-x py-16">
        <EmptyState title="Shop is getting ready" text="We could not load products right now. Please refresh in a moment." />
      </div>
    );
  }
  const sections = home.sections;
  const everything = [...new Map([...sections.flatMap((sec) => sec.products), ...home.latest].map((p) => [p.id, p])).values()];
  // one product from each home section (TV, fan, fridge…) shows the range of the shop in the About block
  const shelf = [...new Map([...sections.map((sec) => sec.products[0]), ...home.latest].filter(Boolean).map((p) => [p.id, p])).values()];
  // brands with the most products on the home page come first
  const names = everything.map((p) => p.name.toLowerCase());
  const rankedBrands = (brands || [])
    .map((b) => ({ ...b, n: names.filter((n) => n.startsWith(b.name.toLowerCase())).length }))
    .sort((a, b) => b.n - a.n);
  const brandTabs = rankedBrands.filter((b) => b.n > 0).slice(0, 10);
  const firstBrandProducts = brandTabs.length > 1 ? (await getProducts({ brand: brandTabs[0].slug, per_page: 10 }))?.data || [] : [];
  // biggest discounts across the shop
  const deals = everything
    .filter((p) => p.in_stock && discountPct(p.regular_price, p.sale_price) > 0)
    .sort((a, b) => discountPct(b.regular_price, b.sale_price) - discountPct(a.regular_price, a.sale_price))
    .slice(0, 10);
  const bestValue = [...home.latest].sort((a, b) => discountPct(b.regular_price, b.sale_price) - discountPct(a.regular_price, a.sale_price));

  // Dazzle-style home: hero → categories → brown band → banners → trending → banners → brands →
  // brown band → banners → grid → hot deals → feature grid. Admin "home sections" fill the tabbed rows in order.
  const flashOn = Boolean(home.flash?.products?.length);
  // only the first tab is drawn on the server; the rest send just their products (see HomeTabs)
  const slim = (p) => ({ id: p.id, name: p.name, slug: p.slug, thumbnail: p.thumbnail, regular_price: p.regular_price, sale_price: p.sale_price, price: p.price, in_stock: p.in_stock, type: p.type });
  const tabsOf = (list, render, later = {}) => list.map((sec, i) => ({
    key: sec.category.slug || String(i),
    label: sec.category.name,
    ...(i === 0 ? { content: render(sec.products) } : { products: sec.products.slice(0, later.view === 'grid' ? 10 : sec.products.length).map(slim), ...later }),
  }));
  const trending = sections.slice(0, 3);
  const picks = sections.slice(3, 6);
  const more = sections.slice(6, 9);
  const banners = home.banners || [];
  const featured = [...everything].sort((a, b) => Number(b.price) - Number(a.price)).slice(0, 10);
  const latestTabs = [
    { key: 'new', label: 'Newest', content: <ProductRail products={home.latest} isNew tone="dark" /> },
    ...(deals.length ? [{ key: 'value', label: 'Best Value', products: bestValue.map(slim), tone: 'dark' }] : []),
  ];

  const bannerRow = (list, key) => (list.length ? (
    <section key={key} data-reveal suppressHydrationWarning className="container-x grid grid-cols-1 gap-3 py-5 sm:grid-cols-2 md:gap-4 md:py-6">
      {list.map((b) => (
        <Link prefetch={false} key={b.id} href={b.link || '#'} className="relative block aspect-[1302/710] overflow-hidden rounded-xl bg-surface">
          <Image src={imgUrl(b.desktop_media)} alt={b.title || 'Offer'} fill widths={[480, 640, 768, 1024, 1280]} sizes="(max-width: 640px) 100vw, 660px" className="object-cover transition duration-500 hover:scale-[1.03]" />
        </Link>
      ))}
    </section>
  ) : null);

  const band = (title, href, tabs) => (tabs.length ? (
    <section className="bg-umber-band py-8 md:py-12">
      <div className="container-x">
        <SectionTitle tone="dark" title={title} href={href} />
        {tabs.length > 1 ? <HomeTabs tone="dark" tabs={tabs} /> : tabs[0].content}
      </div>
    </section>
  ) : null);

  const whiteTabs = (title, href, tabs) => (tabs.length ? (
    <section className="container-x py-6 md:py-10">
      <SectionTitle reveal title={title} href={href} />
      {tabs.length > 1 ? <HomeTabs tabs={tabs} /> : tabs[0].content}
    </section>
  ) : null);

  return (
    <>
      {home.sliders.length ? <HeroSlider slides={home.sliders} /> : null}

      {home.featured_categories.length ? (
        <section data-reveal suppressHydrationWarning className="container-x py-6 md:py-10">
          <SectionTitle title="Categories" href="/shop" linkLabel="See all" />
          <RailScroller
            gap="gap-x-2.5 gap-y-4 sm:gap-x-4"
            track="grid grid-flow-col grid-rows-1 auto-cols-[calc((100%-1.875rem)/4)] sm:auto-cols-[calc((100%-5rem)/6)] lg:auto-cols-[calc((100%-7rem)/8)]"
          >
            {home.featured_categories.map((c) => (
              <Link prefetch={false} key={c.id} href={`/category/${c.slug}`} className="group flex flex-col items-center gap-2 text-center">
                <span className="relative block aspect-square w-full overflow-hidden rounded-[18px] bg-surface md:rounded-[24px]">
                  <Image src={imgUrl(c.image)} alt="" fill widths={[128, 200, 256, 320]} sizes="(max-width: 640px) 25vw, 160px" className="object-contain p-3 mix-blend-multiply transition duration-500 group-hover:scale-105 md:p-4" />
                </span>
                <span className="line-clamp-2 text-xs font-medium leading-tight text-ink-2 transition group-hover:text-gold-deep md:text-sm">{c.name}</span>
              </Link>
            ))}
          </RailScroller>
        </section>
      ) : null}

      <Later>{flashOn ? (
        <FlashSaleBand title={home.flash.title} endsAt={home.flash.ends_at}>
          <ProductRail products={home.flash.products} tone="dark" />
        </FlashSaleBand>
      ) : band('New Arrivals', '/shop?sort=latest', home.latest.length ? latestTabs : [])}</Later>

      <Later>{bannerRow(banners.slice(0, 2), 'b1')}</Later>

      <Later>{whiteTabs('Trending Now', trending[0]?.category.slug ? `/category/${trending[0].category.slug}` : '/shop', tabsOf(trending, (ps) => <ProductRail products={ps} />, { view: 'rail' }))}</Later>

      <Later>{bannerRow(banners.slice(2, 4), 'b2')}</Later>

      <Later>{brandTabs.length > 1 ? <HomeBrands brands={brandTabs.map(({ name, slug }) => ({ name, slug }))} initial={firstBrandProducts.map(slim)} /> : null}</Later>

      <Later>{flashOn
        ? band('New Arrivals', '/shop?sort=latest', home.latest.length ? latestTabs : [])
        : band('Top Picks', picks[0]?.category.slug ? `/category/${picks[0].category.slug}` : '/shop', tabsOf(picks, (ps) => <ProductRail products={ps} tone="dark" />, { view: 'rail', tone: 'dark' }))}</Later>

      <Later>{bannerRow(banners.slice(4, 6), 'b3')}</Later>

      <Later>{whiteTabs('Explore More', more[0]?.category.slug ? `/category/${more[0].category.slug}` : '/shop', tabsOf(flashOn ? sections.slice(3, 6) : more, (ps) => <ProductGrid products={ps.slice(0, 10)} />, { view: 'grid' }))}</Later>

      <Later>{deals.length >= 4 ? (
        <section className="bg-deal-band py-8 md:py-12">
          <div className="container-x">
            <div className="mb-4 flex items-center justify-between gap-3 md:mb-6">
              <h2 className="title-gold-light w-fit text-[22px] font-bold leading-tight tracking-tight md:text-[32px]">Hot Deal of the Day</h2>
              <Link prefetch={false} href="/shop" className="pill-link">See All</Link>
            </div>
            <ProductRail products={deals} tone="dark" />
          </div>
        </section>
      ) : null}</Later>

      <Later>{featured.length ? (
        <section className="container-x py-6 md:py-10">
          <SectionTitle reveal title="Feature Products" href="/shop" />
          <ProductGrid products={featured.slice(0, 10)} />
        </section>
      ) : null}</Later>

      <Later>{s.about_text ? <HomeAbout settings={s} products={shelf} brands={rankedBrands} /> : null}</Later>

      <Later><HomeTrack /></Later>
    </>
  );
}
