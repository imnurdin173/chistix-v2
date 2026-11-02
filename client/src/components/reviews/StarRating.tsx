import { Star } from "lucide-react";

type StarRatingProps = {
  score: number; // 1–5
  size?: "sm" | "md";
};

// Read-only stars, e.g. ★★★★☆
export default function StarRating({ score, size = "sm" }: StarRatingProps) {
  const iconSize = size === "sm" ? "size-4" : "size-5";

  return (
    <div className="flex gap-0.5" role="img" aria-label={`${score} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={`${iconSize} ${
            i <= score ? "fill-amber-400 text-amber-400" : "fill-neutral-200 text-neutral-200"
          }`}
        />
      ))}
    </div>
  );
}