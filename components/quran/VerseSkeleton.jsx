import { Card } from '@/components/ui/card'

export default function VerseSkeleton({ count = 5 }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="p-6 md:p-8 border-2 animate-pulse">
          {/* Verse Number Badge Skeleton */}
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-muted" />
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="w-8 h-8 rounded-full bg-muted" />
            </div>
          </div>

          {/* Arabic Text Skeleton */}
          <div className="mb-4 space-y-3">
            <div className="h-8 bg-muted rounded w-full" />
            <div className="h-8 bg-muted rounded w-5/6 ml-auto" />
            <div className="h-8 bg-muted rounded w-4/6 ml-auto" />
          </div>

          {/* Translation Skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-muted/70 rounded w-full" />
            <div className="h-4 bg-muted/70 rounded w-11/12" />
            <div className="h-4 bg-muted/70 rounded w-3/4" />
          </div>
        </Card>
      ))}
    </div>
  )
}

