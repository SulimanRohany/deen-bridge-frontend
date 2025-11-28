// components/blog/CommentSection.jsx
'use client'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  IconUser, 
  IconCalendar, 
  IconMessage,
  IconSend,
  IconTrash,
  IconEdit
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { useContext } from 'react'
import AuthContext from '@/context/AuthContext'
import { blogAPI } from '@/lib/api'
import { toast } from 'sonner'

const commentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment is too long'),
})

export default function CommentSection({ postId, comments: initialComments = [] }) {
  const [comments, setComments] = useState(initialComments)
  const [loading, setLoading] = useState(false)
  const [activeComment, setActiveComment] = useState(null) // { id: string, type: 'replying' | 'editing' }
  const { userData } = useContext(AuthContext)
  
  const form = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      body: '',
    }
  })

  const replyForm = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      body: '',
    }
  })

  const editForm = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      body: '',
    }
  })

  // Fetch comments when component mounts or postId changes
  useEffect(() => {
    if (postId) {
      fetchComments()
    }
  }, [postId])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const response = await blogAPI.getComments(postId)
      setComments(response.data)
    } catch (error) {
      toast.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const commentData = {
        post: postId,
        body: data.body,
        // If we're replying to a comment, include the parent ID
        ...(activeComment?.type === 'replying' && { parent: activeComment.id }),
      }
      
      const response = await blogAPI.createComment(commentData)
      
      if (activeComment?.type === 'replying') {
        // If replying to a comment, update the parent comment with the new reply
        setComments(prev => 
          prev.map(comment => 
            comment.id === activeComment.id 
              ? { 
                  ...comment, 
                  replies: [...(comment.replies || []), response.data] 
                } 
              : comment
          )
        )
      } else {
        // If it's a top-level comment, add it to the beginning
        setComments(prev => [response.data, ...prev])
      }
      
      form.reset()
      setActiveComment(null)
      toast.success('Comment posted successfully!')
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Please log in to post a comment')
      } else {
        toast.error('Failed to post comment. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const onEditSubmit = async (data) => {
    try {
      setLoading(true)
      const response = await blogAPI.updateComment(activeComment.id, { body: data.body })
      
      // Function to recursively update comments
      const updateCommentInTree = (comments, commentId, newData) => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, ...newData }
          }
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: updateCommentInTree(comment.replies, commentId, newData)
            }
          }
          return comment
        })
      }
      
      setComments(prev => 
        updateCommentInTree(prev, activeComment.id, { 
          body: data.body, 
          updated_at: response.data.updated_at 
        })
      )
      
      editForm.reset()
      setActiveComment(null)
      toast.success('Comment updated successfully!')
    } catch (error) {
      toast.error('Failed to update comment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const deleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return
    
    try {
      setLoading(true)
      await blogAPI.deleteComment(commentId)
      
      // Function to recursively remove comments
      const removeCommentFromTree = (comments, commentId) => {
        return comments.filter(comment => {
          if (comment.id === commentId) return false
          if (comment.replies && comment.replies.length > 0) {
            comment.replies = removeCommentFromTree(comment.replies, commentId)
          }
          return true
        })
      }
      
      setComments(prev => removeCommentFromTree(prev, commentId))
      toast.success('Comment deleted successfully!')
    } catch (error) {
      toast.error('Failed to delete comment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const startReplying = (comment) => {
    setActiveComment({ id: comment.id, type: 'replying' })
    form.reset({ body: '' })
  }

  const startEditing = (comment) => {
    setActiveComment({ id: comment.id, type: 'editing' })
    editForm.reset({ body: comment.body })
  }

  const cancelActive = () => {
    setActiveComment(null)
    form.reset()
    editForm.reset()
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const canReply = (comment, depth) => {
    // Check if we're at the maximum depth (3 levels)
    if (depth >= 2) return false
    
    // Check if this comment already has 3 or more replies
    if (comment.replies && comment.replies.length >= 3) return false
    
    return true
  }

  const renderComments = (comments, depth = 0) => {
    return comments.map((comment) => (
      <div key={comment.id} className={`${depth > 0 ? 'ml-8 border-l-2 pl-4' : ''}`}>
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <IconUser size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-semibold">
                    {comment.author_data?.full_name || comment.author_data?.email || 'Anonymous'}
                  </h4>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <IconCalendar size={14} />
                    {formatDate(comment.created_at)}
                    {comment.updated_at !== comment.created_at && (
                      <span className="text-xs">(edited)</span>
                    )}
                  </span>
                </div>
                
                {/* Comment actions for author */}
                {userData && comment.author === userData.id && (
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => startEditing(comment)}
                      className="text-sm"
                    >
                      <IconEdit size={16} className="mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteComment(comment.id)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      <IconTrash size={16} className="mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
              
              {activeComment?.id === comment.id && activeComment.type === 'editing' ? (
                <Form {...editForm}>
                  <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-3">
                    <FormField
                      control={editForm.control}
                      name="body"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              placeholder="Edit your comment..." 
                              className="resize-none"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={cancelActive}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" disabled={loading}>
                        <IconSend size={16} className="mr-1" />
                        Update
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <>
                  <p className="text-gray-700 mb-3">{comment.body}</p>
                  
                  {userData && canReply(comment, depth) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => startReplying(comment)}
                      className="text-sm"
                    >
                      <IconMessage size={16} className="mr-1" />
                      Reply
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Reply form */}
          {activeComment?.id === comment.id && activeComment.type === 'replying' && (
            <div className="mt-4 pl-12">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                  <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="Write your reply..." 
                            className="resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={cancelActive}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={loading}>
                      <IconSend size={16} className="mr-1" />
                      Post Reply
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </div>

        {/* Render nested comments */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {renderComments(comment.replies, depth + 1)}
          </div>
        )}
      </div>
    ))
  }


  // Helper to count all comments and replies recursively
  const countAllComments = (comments) => {
    let count = 0;
    for (const comment of comments) {
      count += 1;
      if (comment.replies && comment.replies.length > 0) {
        count += countAllComments(comment.replies);
      }
    }
    return count;
  };

  const totalComments = countAllComments(comments);

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <IconMessage />
        Comments ({totalComments})
      </h3>

      {userData ? (
        <div className="mb-8">
          {/* Main comment form */}
          {!activeComment && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="Share your thoughts..." 
                          className="resize-none min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    <IconSend size={16} className="mr-1" />
                    {loading ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      ) : (
        <div className="bg-muted p-4 rounded-lg text-center mb-8">
          <p className="text-muted-foreground">
            Please <a href="/login" className="text-primary hover:underline">sign in</a> to leave a comment.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading comments...</p>
          </div>
        ) : comments.length > 0 ? (
          renderComments(comments)
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <IconMessage size={48} className="mx-auto mb-4 opacity-50" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    </div>
  )
}