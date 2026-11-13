import { getImageProps } from 'next/image';

/** Keep only the listed widths in a next/image srcSet (shorter page, same picture quality). */
export function trimSrcSet(srcSet, widths) {
  if (!srcSet || !widths?.length) return srcSet;
  const kept = srcSet.split(', ').filter((part) => widths.includes(parseInt(part.slice(part.lastIndexOf(' ') + 1), 10)));
  return kept.length ? kept.join(', ') : srcSet;
}

/**
 * Same as next/image (optimised sizes, srcset, lazy loading), but rendered as a plain <img>, so the
 * browser has nothing to start up for it. Use it for pictures that need no client-side behaviour.
 * `widths` (optional) limits the photo sizes offered to the browser to the ones that can be used.
 */
export default function Img({ widths, ...props }) {
  const { props: img } = getImageProps(props);
  img.srcSet = trimSrcSet(img.srcSet, widths);
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img {...img} />;
}
