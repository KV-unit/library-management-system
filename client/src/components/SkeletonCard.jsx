// A grey placeholder shaped like a BookCard, shown while books are loading.
export default function SkeletonCard() {
  return (
    <li className="book-card book-card--skeleton" aria-hidden="true">
      <div className="skeleton skeleton--cover" />
      <div className="skeleton skeleton--line" />
      <div className="skeleton skeleton--line skeleton--short" />
    </li>
  );
}
