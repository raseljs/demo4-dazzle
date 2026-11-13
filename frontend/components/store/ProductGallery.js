'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import { imgUrl } from '@/lib/format';

export default function ProductGallery({ images, name }) {
  const list = images.length ? images : [null];
  const [active, setActive] = useState(list[0]);
  const [zoom, setZoom] = useState(null);

  // Variant pickers broadcast their image
  useEffect(() => {
    const onVariant = (e) => e.detail && setActive(e.detail);
    window.addEventListener('variant-image', onVariant);
    return () => window.removeEventListener('variant-image', onVariant);
  }, []);

  const strip = useRef(null);
  const scrollThumbs = (dir) => strip.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });

  return (
    <div>
      <div
        data-product-gallery
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl bg-white"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        <Image
          src={imgUrl(active)}
          alt={name}
          fill
          priority
          fetchPriority="high"
          sizes="(max-width: 768px) 100vw, 560px"
          className="object-contain p-3 transition-transform duration-200 md:p-6"
          style={zoom ? { transform: 'scale(1.8)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        />
      </div>
      {list.length > 1 ? (
        <div className="relative mt-3">
          <div ref={strip} className="no-scrollbar flex gap-2.5 overflow-x-auto p-0.5 pr-10">
            {list.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(src)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white transition md:h-[72px] md:w-[72px] ${active === src ? 'border-2 border-[#f28b2c]' : 'border border-slate-200 hover:border-gold'}`}
                aria-label={`Image ${i + 1}`}
              >
                <Image src={imgUrl(src)} alt="" fill sizes="72px" className="object-contain p-1.5" />
              </button>
            ))}
          </div>
          {list.length > 5 ? (
            <button type="button" onClick={() => scrollThumbs(1)} aria-label="More images"
              className="absolute right-0 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-700 shadow-md ring-1 ring-black/5 hover:text-ink">
              <Icon name="chevron-right" className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
