// src/features/rankings/RankingCard.jsx
import { Link } from "react-router-dom";

export default function RankingCard({ ranking }) {
  return (
    <Link
      to={`/rankings/${ranking.id}`}
      className="card block w-full hover:bg-background-soft transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{ranking.title}</h3>
        <span className="text-xs muted">{ranking.itemsCount ?? 0} manga(s)</span>
      </div>
      <p className="muted text-sm mt-1">Créé récemment</p>
    </Link>
  );
}
