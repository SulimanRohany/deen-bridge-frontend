'use client'

import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IconBook2, IconPlayerPlay, IconStar } from '@tabler/icons-react'



function toArray(v){
  if (Array.isArray(v)) return v
  if (v && Array.isArray((v).results)) return (v).results
  return []
}

export default function CourseCard({ course }) {
  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
            {course.title}
          </CardTitle>
          {course.is_special_class && (
            <Badge variant="secondary" className="shrink-0">
              <IconStar className="h-3 w-3 mr-1" /> Special
            </Badge>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {toArray(course.subjects).map((s) => (
            <Badge key={s?.id ?? s?.name} variant="outline" className="text-xs">
              {s?.name}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="text-sm text-muted-foreground">
        <p className="line-clamp-3">{course.description}</p>
      </CardContent>

      {/* Footer buttons: stacked on mobile, side-by-side from sm+ */}
      <CardFooter className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button asChild className="w-full">
          <Link href={`/courses/${course.id}`}>
            <IconBook2 className="h-4 w-4 mr-2" />
            Continue
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/courses/${course.id}#recordings`}>
            <IconPlayerPlay className="h-4 w-4 mr-2" />
            Recordings
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
