import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  onRate?: (rating: number) => void;
  size?: "sm" | "md";
  readOnly?: boolean;
}

export function StarRating({ rating, onRate, size = "md", readOnly = false }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const starSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const gap = size === "sm" ? "gap-0.5" : "gap-1";

  return (
    <div
      className={`flex items-center ${gap}`}
      onMouseLeave={() => !readOnly && setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const active = hovered ? star <= hovered : star <= rating;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            data-testid={`star-${star}`}
            className={`transition-colors ${readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
            onMouseEnter={() => !readOnly && setHovered(star)}
            onClick={() => !readOnly && onRate?.(star)}
            aria-label={`${star} ster${star > 1 ? "ren" : ""}`}
          >
            <Star
              className={`${starSize} ${
                active
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground/40"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
