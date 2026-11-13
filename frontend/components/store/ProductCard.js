import ProductCard from './ProductCardClient';
import RailScroller from './RailScroller';

export default ProductCard;

/** Just what a card needs (keeps data sent to the browser small) */
export const slimProduct = (p) => ({
  id: p.id, name: p.name, slug: p.slug, thumbnail: p.thumbnail, type: p.type,
  regular_price: p.regular_price, sale_price: p.sale_price, price: p.price, in_stock: p.in_stock,
});

export function ProductGrid({ products, priorityCount = 0, cols = 5 }) {
  return (
    <div className={`grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 ${cols === 5 ? 'xl:grid-cols-5' : ''}`}>
      {products.map((p, i) => <ProductCard key={p.id} product={slimProduct(p)} index={i} priority={i < priorityCount} />)}
    </div>
  );
}

/** One row that slides sideways: 2 cards on phones, 3 on tablets, 4–5 on desktops.
 *  Only the first five cards are drawn with the page; the rest are added the first time the row is
 *  touched, scrolled or hovered, so long pages stay light and quick to start on phones. */
const RAIL_FIRST = 5;
export function ProductRail({ products, isNew = false, tone = 'light', priorityCount = 0, perRow = 5 }) {
  const itemClass = `w-[calc((100%-0.625rem)/2)] shrink-0 sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)] ${perRow === 5 ? 'xl:w-[calc((100%-4rem)/5)]' : ''}`;
  return (
    <RailScroller tone={tone} more={products.slice(RAIL_FIRST).map(slimProduct)} itemClass={itemClass} isNew={isNew}>
      {products.slice(0, RAIL_FIRST).map((p, i) => (
        <div key={p.id} className={itemClass}>
          <ProductCard product={slimProduct(p)} index={i} isNew={isNew} priority={i < priorityCount} />
        </div>
      ))}
    </RailScroller>
  );
}
