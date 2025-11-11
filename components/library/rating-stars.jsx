'use client'

import { useState } from 'react'
import { IconStar, IconStarFilled, IconStarHalfFilled } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

/**
 * RatingStars Component
 * 
 * Displays star ratings with support for:
 * - Read-only display mode
 * - Interactive rating input mode
 * - Half-star display for averages
 * - Customizable size and color
 */

export default function RatingStars({
  rating = 0,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
  showCount = false,
  count = 0,
  className = '',
}) {
  const [hoverRating, setHoverRating] = useState(0)

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
  }

  const handleClick = (value) => {
    if (interactive && onChange) {
      onChange(value)
    }
  }

  const handleMouseEnter = (value) => {
    if (interactive) {
      setHoverRating(value)
    }
  }

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0)
    }
  }

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating

  const renderStar = (index) => {
    const value = index + 1
    const filled = displayRating >= value
    const halfFilled = !filled && displayRating >= value - 0.5

    const starClass = cn(
      sizeClasses[size],
      interactive ? 'cursor-pointer transition-all hover:scale-110' : '',
      filled || halfFilled ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
    )

    if (halfFilled && !interactive) {
      return (
        <IconStarHalfFilled
          key={index}
          className={starClass}
          onClick={() => handleClick(value)}
          onMouseEnter={() => handleMouseEnter(value)}
        />
      )
    }

    return filled ? (
      <IconStarFilled
        key={index}
        className={starClass}
        onClick={() => handleClick(value)}
        onMouseEnter={() => handleMouseEnter(value)}
      />
    ) : (
      <IconStar
        key={index}
        className={starClass}
        onClick={() => handleClick(value)}
        onMouseEnter={() => handleMouseEnter(value)}
      />
    )
  }

  return (
    <div className={cn('inline-flex items-center gap-1', className)} onMouseLeave={handleMouseLeave}>
      <div className="flex items-center gap-0.5">
        {[...Array(maxRating)].map((_, index) => renderStar(index))}
      </div>
      {showCount && count > 0 && (
        <span className="text-sm text-muted-foreground ml-1">({count})</span>
      )}
    </div>
  )
}

/**
 * RatingInput Component
 * 
 * Simplified component specifically for rating input
 */
export function RatingInput({ value = 0, onChange, size = 'lg', className = '' }) {
  return (
    <RatingStars
      rating={value}
      interactive={true}
      onChange={onChange}
      size={size}
      className={className}
    />
  )
}

/**
 * RatingDisplay Component
 * 
 * Simplified component specifically for displaying ratings
 */
export function RatingDisplay({ rating = 0, count = 0, size = 'md', showCount = true, className = '' }) {
  return (
    <RatingStars
      rating={rating}
      interactive={false}
      showCount={showCount}
      count={count}
      size={size}
      className={className}
    />
  )
}

