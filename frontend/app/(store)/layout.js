import { Suspense } from 'react';
import { getLayout } from '@/lib/api';
import { waLink } from '@/lib/format';
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import MobileNav from '@/components/store/MobileNav';
import CartDrawer from '@/components/store/CartDrawer';
import RevealOnScroll from '@/components/store/RevealOnScroll';
import ProductPreviewCapture from '@/components/store/ProductPreviewCapture';
import CardActionsHub from '@/components/store/CardActionsHub';
import FacebookPixel from '@/components/store/FacebookPixel';
import Preloader from '@/components/store/Preloader';
import Icon from '@/components/Icon';

// The shop's black / gold / cream look. Shared pieces (cart drawer, checkout, login, buttons) read
// --primary and --brand, so setting them here re-colours them for the shop only (the admin panel keeps its own).
const SHOP_THEME = { '--primary': '#a0650a', '--brand': '#111111' };

export default async function StoreLayout({ children }) {
  const { settings, menus, categories } = await getLayout();
  const menu = menus.header?.length ? menus.header : categories.map((c) => ({
    label: c.name, url: `/category/${c.slug}`, children: c.children.map((ch) => ({ label: ch.name, url: `/category/${ch.slug}` })),
  }));
  return (
    <div style={SHOP_THEME} className="min-h-screen bg-cream text-ink">
      <Preloader settings={settings} />
      <Header settings={settings} menu={menu} categories={categories} />
      <main className="min-h-[60vh] pb-24 lg:pb-0">{children}</main>
      {/* own boundary: the footer wakes up after the rest of the page (see the home page) */}
      <Suspense fallback={null}><Footer settings={settings} menus={menus} categories={categories} /></Suspense>
      <MobileNav menu={menu} />
      <CartDrawer />
      <RevealOnScroll />
      <ProductPreviewCapture />
      <CardActionsHub />
      <FacebookPixel pixelId={settings.fb_pixel_id} />
      {settings.whatsapp ? (
        <a
          href={waLink(settings.whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="wa-float no-print fixed bottom-28 right-4 z-30 grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 lg:bottom-24"
        >
          <Icon name="whatsapp" className="h-7 w-7" />
        </a>
      ) : null}
    </div>
  );
}
