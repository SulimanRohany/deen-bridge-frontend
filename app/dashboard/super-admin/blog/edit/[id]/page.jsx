// app/admin/blog/edit/[id]/page.jsx
'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconEye,
  IconTrash
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import RichTextEditor from '@/components/blog/RichTextEditor'
import ImageUpload from '@/components/blog/ImageUpload'
import TagInput from '@/components/blog/TagInput'
import { useContext } from 'react'
import AuthContext from '@/context/AuthContext'
import { Switch } from '@/components/ui/switch'
import axios from 'axios'
import { toast } from 'sonner'
import { config } from '@/lib/config'
import Link from 'next/link'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  slug: z.string().min(1, 'Slug is required'),
  body: z.string().min(1, 'Content is required'),
  featured_image: z.any().optional(),
  meta_description: z.string().max(160, 'Meta description must be 160 characters or less').optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']).default('draft'),
})

export default function EditBlogPostPage({ params }) {
  const { id } = use(params)
  const [previewMode, setPreviewMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const { userData } = useContext(AuthContext)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      slug: '',
      body: '',
      meta_description: '',
      tags: [],
      status: 'draft',
    }
  })

  useEffect(() => {
    if (userData && id) {
      fetchPost()
    }
  }, [userData, id])


  const getAccessToken = () => {
    if (typeof window === 'undefined') return null;
    const authTokens = localStorage.getItem('authTokens');
    if (!authTokens) {
      toast.error('Authentication required. Please login again.');
      router.push('/login');
      return null;
    }
    try {
      const parsedTokens = JSON.parse(authTokens);
      return parsedTokens.access;
    } catch (error) {
      console.error('Error parsing authTokens:', error);
      toast.error('Invalid authentication data. Please login again.');
      router.push('/login');
      return null;
    }
  };



  const fetchPost = async () => {
    try {
      setLoading(true)
      const token = getAccessToken();
      const response = await axios.get(config.API_BASE_URL + `blog/post/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const postData = response.data
      setPost(postData)
      
      // Set form values
      form.reset({
        title: postData.title,
        slug: postData.slug,
        body: postData.body,
        meta_description: postData.meta_description || '',
        tags: postData.tags || [],
        status: postData.status,
      })
      
      // Set image preview if exists
      if (postData.featured_image) {
        setImagePreview(postData.featured_image)
      }
    } catch (error) {
      console.error('Error fetching post:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  }

  const onSubmit = async (values) => {
    try {
      setLoading(true)
      
      const formData = new FormData()
      
      // Add basic fields
      formData.append('title', values.title)
      formData.append('slug', values.slug)
      formData.append('body', values.body)
      formData.append('status', values.status)
      
      // Add meta description if it exists
      if (values.meta_description) {
        formData.append('meta_description', values.meta_description)
      }
      
      // Add tags if they exist
      if (values.tags && values.tags.length > 0) {
        values.tags.forEach(tag => formData.append('tags', tag))
      }
      
      // Add featured image only if it's a valid file
      if (values.featured_image && values.featured_image instanceof File) {
        formData.append('featured_image', values.featured_image)
      }

      const token = getAccessToken();
      const response = await axios.put(config.API_BASE_URL + `blog/post/${id}/`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.status === 200 || response.status === 201) {
        router.push('/dashboard/super-admin/blog')
      } else {
        console.error('Failed to update post')
      }
    } catch (error) {
      console.error('Error updating post:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const token = getAccessToken();
      const response = await axios.delete(config.API_BASE_URL + `blog/post/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      })

      if (response.status === 200 || response.status === 204) {
        router.push('/dashboard/super-admin/blog')
      } else {
        console.error('Failed to delete post')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-12 bg-muted rounded w-3/4 mb-6"></div>
          <div className="h-96 bg-muted rounded mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <Button asChild>
            <Link href="/dashboard/super-admin/blog">
              <IconArrowLeft className="mr-2" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="ghost">
          <Link href="/dashboard/super-admin/blog">
            <IconArrowLeft className="mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Post</h1>
          <p className="text-muted-foreground">Update your blog post</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setPreviewMode(!previewMode)}
          >
            <IconEye className="mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <IconTrash className="mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your post.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={loading}
          >
            <IconDeviceFloppy className="mr-2" />
            {form.watch('status') === 'draft' ? 'Save Draft' : 'Update Post'}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter post title..." 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          if (!form.getValues('slug')) {
                            form.setValue('slug', generateSlug(e.target.value))
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="Post URL slug..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {previewMode ? (
                <div className="border rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-4">Preview</h2>
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: form.watch('body') }}
                  />
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          content={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Publish</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        {field.value === 'published' ? 'This post will be visible to everyone' : 'This post will be saved as a draft'}
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 'published'}
                        onCheckedChange={(checked) => {
                          field.onChange(checked ? 'published' : 'draft')
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="featured_image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Featured Image</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value}
                        onChange={field.onChange}
                        existingImage={imagePreview}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <TagInput
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meta_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description for SEO..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <div className="text-sm text-muted-foreground">
                      {field.value?.length || 0}/160 characters
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}