"use client"

import { useState } from "react"

type Props = {
  value: number        // calificacion actual (0-5)
  readonly?: boolean   // solo lectura o interactivo
  onChange?: (val: number) => void
  size?: "sm" | "md"
}

export function StarRating({ value, readonly = false, onChange, size = "md" }: Props) {
  const [hovered, setHovered] = useState(0)
  const sizeClass = size === "sm" ? "text-base" : "text-xl"

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value)
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={`${sizeClass} transition-colors leading-none ${
              readonly ? "cursor-default" : "cursor-pointer"
            } ${filled ? "text-yellow-400" : "text-muted-foreground/30"}`}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            onClick={() => !readonly && onChange?.(star)}
          >
            &#9733;
          </button>
        )
      })}
    </div>
  )
}
