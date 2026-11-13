'use client';
import Link from 'next/link';
import { getImageProps } from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { preload } from 'react-dom';
import { imgUrl } from '@/lib/format';

const SIZES = '(max-width: 767px) 100vw, 880px';

function Slide({ s, priority, mobileAspect, later }) {
  const cls = `block w-full rounded-2xl object-cover ${mobileAspect ? 'aspect-[4/3] md:aspect-[935/440]' : 'aspect-[935/440]'}`;
  // banners that aren't on screen yet wait until the page has finished loading, so they don't slow the first one down
  if (later) return <div className={`${cls} bg-black/[0.05]`} />;
  if (s.type === 'video') {
    return <video src={imgUrl(s.desktop_media)} autoPlay muted loop playsInline className={cls} />;
  }
  const common = { alt: s.title || 'Banner', sizes: SIZES };
  const { props: { srcSet: desktop, ...rest } } = getImageProps({ ...common, src: imgUrl(s.desktop_media), width: 1870, height: 880, quality: 80, priority });
  const { props: { srcSet: mobile, src: mobileSrc } } = getImageProps({ ...common, src: imgUrl(s.desktop_media), width: 800, height: 376, quality: 75, priority });
  if (priority) {
    // The first banner is the biggest thing on screen (LCP): start downloading it with the HTML,
    // and only the one that fits the screen (phone or desktop).
    preload(mobileSrc, { as: 'image', imageSrcSet: mobile, imageSizes: SIZES, media: '(max-width: 767px)', fetchPriority: 'high' });
    preload(rest.src, { as: 'image', imageSrcSet: desktop, imageSizes: SIZES, media: '(min-width: 768px)', fetchPriority: 'high' });
  }
  return (
    <picture>
      <source media="(max-width: 767px)" srcSet={mobile} sizes={SIZES} />
      <source media="(min-width: 768px)" srcSet={desktop} sizes={SIZES} />
      {/* eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element */}
      <img {...rest} fetchPriority={priority ? 'high' : undefined} decoding={priority ? 'sync' : 'async'} className={cls} />
    </picture>
  );
}

/**
 * Banner carousel: on desktop the current banner takes two thirds of the row and the next one peeks in
 * from the right; on phones one banner fills the width. It loops forever (the first banners are repeated
 * at the end so the wrap-around is seamless).
 */
export default function HeroSlider({ slides }) {
  const n = slides.length;
  const loop = n > 1;
  const list = loop ? [...slides, ...slides.slice(0, Math.min(2, n))] : slides;
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const [loadRest, setLoadRest] = useState(false);
  const [peek, setPeek] = useState(false);
  const touch = useRef(null);
  // phones show the same wide banner as desktops (as Dazzle does), so every slide keeps one shape
  const mobileAspect = false;
  const current = loop ? index % n : 0;

  // Desktops show the next banner peeking in, so that one is needed straight away there. On phones it
  // is off screen, so it waits with the others and the first banner gets the whole connection.
  useEffect(() => {
    if (loop && window.matchMedia('(min-width: 768px)').matches) setPeek(true);
  }, [loop]);

  // The other banners (and the auto-slide) start a few seconds after the page has finished loading,
  // or as soon as the visitor touches the slider.
  useEffect(() => {
    if (!loop) return undefined;
    const go = () => setTimeout(() => setLoadRest(true), 3000);
    if (document.readyState === 'complete') { const t = go(); return () => clearTimeout(t); }
    let t;
    const onLoad = () => { t = go(); };
    window.addEventListener('load', onLoad, { once: true });
    return () => { window.removeEventListener('load', onLoad); clearTimeout(t); };
  }, [loop]);

  useEffect(() => {
    if (!loop || paused || !loadRest) return undefined;
    const t = setInterval(() => { if (!document.hidden) { setAnimate(true); setIndex((i) => i + 1); } }, 5000);
    return () => clearInterval(t);
  }, [loop, paused, loadRest]);

  // after sliding onto a repeated banner, jump back to the real one without animation
  const onEnd = () => {
    if (index >= n) {
      setAnimate(false);
      setIndex(index - n);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    }
  };
  const next = () => { setLoadRest(true); setAnimate(true); setIndex((i) => (i >= n ? i - n + 1 : i + 1)); };
  const prev = () => {
    setLoadRest(true);
    if (index === 0) {
      setAnimate(false);
      setIndex(n);
      requestAnimationFrame(() => requestAnimationFrame(() => { setAnimate(true); setIndex(n - 1); }));
    } else {
      setAnimate(true);
      setIndex(index - 1);
    }
  };

  return (
    <section className="container-x pt-3 pb-5 md:pb-6" aria-roledescription="carousel">
      <div
        className="overflow-hidden [--gap:12px] [--slide:100%] md:[--gap:24px] md:[--slide:66.1%]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(e) => { touch.current = e.touches[0].clientX; setLoadRest(true); }}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
          touch.current = null;
        }}
      >
        <div
          className={`flex ${animate ? 'transition-transform duration-700 ease-out' : ''}`}
          style={{ transform: `translateX(calc(${-index} * (var(--slide) + var(--gap))))` }}
          onTransitionEnd={onEnd}
        >
          {list.map((s, i) => (
            <Link
              prefetch={false}
              key={`${s.id}-${i}`}
              href={s.link || '#'}
              className="shrink-0"
              style={{ width: 'var(--slide)', marginRight: 'var(--gap)' }}
              aria-hidden={i % n !== current}
              tabIndex={i === index ? 0 : -1}
            >
              <Slide s={s} priority={i === 0} mobileAspect={mobileAspect} later={i > 0 && !loadRest && i !== index && !(peek && i === index + 1)} />
            </Link>
          ))}
        </div>
      </div>
      {loop ? (
        <div className="mt-[18px] flex items-center justify-center gap-1.5">
          {slides.map((s, i) => (
            <button key={s.id} type="button" onClick={() => { setLoadRest(true); setAnimate(true); setIndex(i); }} aria-label={`Slide ${i + 1}`} aria-current={i === current ? 'true' : undefined}
              className={`h-2 rounded-full transition-all ${i === current ? 'w-7 bg-gradient-to-r from-[#e2a33e] to-[#b57908]' : 'w-2 bg-slate-300'}`} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
