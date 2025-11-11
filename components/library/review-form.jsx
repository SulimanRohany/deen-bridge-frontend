'use client'

import { useState, useEffect } from 'react'
import { IconStar } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RatingInput } from './rating-stars'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { libraryAPI } from '@/lib/api'
import { toast } from 'sonner'

export default function ReviewForm({
  open,
  onOpenChange,
  resourceId,
  existingReview = null,
  onSuccess,
}) {
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [review, setReview] = useState(existingReview?.review || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating)
      setReview(existingReview.review || '')
    } else {
      setRating(0)
      setReview('')
    }
  }, [existingReview, open])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    setIsSubmitting(true)

    try {
      const ratingData = {
        resource: resourceId,
        rating,
        review: review.trim(),
      }

      if (existingReview) {
        // Update existing review
        await libraryAPI.updateRating(existingReview.id, ratingData)
        toast.success('Review updated successfully')
      } else {
        // Create new review
        await libraryAPI.createRating(ratingData)
        toast.success('Review submitted successfully')
      }

      if (onSuccess) {
        onSuccess()
      }

      // Reset form
      setRating(0)
      setReview('')
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting review:', error)
      
      // Handle duplicate review error
      if (error.response?.data?.detail && error.response.data.detail.includes('already reviewed')) {
        toast.error('You have already reviewed this resource. Please edit your existing review instead.')
      } else if (error.response?.data?.error === 'duplicate_review') {
        toast.error('You have already reviewed this resource. Please edit your existing review instead.')
      } else {
        const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to submit review. Please try again.'
        toast.error(errorMessage)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconStar className="h-5 w-5 text-yellow-500" />
            {existingReview ? 'Edit Your Review' : 'Write a Review'}
          </DialogTitle>
          <DialogDescription>
            {existingReview 
              ? 'Update your rating and review for this resource.'
              : 'Share your thoughts about this resource with other learners.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div className="space-y-2">
            <Label>Your Rating *</Label>
            <div className="flex items-center gap-2">
              <RatingInput
                value={rating}
                onChange={setRating}
                size="lg"
              />
              <span className="text-sm text-muted-foreground">
                {rating > 0 ? `${rating} out of 5 stars` : 'Select rating'}
              </span>
            </div>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="review">Your Review (Optional)</Label>
            <Textarea
              id="review"
              placeholder="Share your experience with this resource... What did you learn? Would you recommend it to others?"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={5}
              maxLength={1000}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {review.length}/1000 characters
            </p>
          </div>

          {/* Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || rating === 0}>
              {isSubmitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

