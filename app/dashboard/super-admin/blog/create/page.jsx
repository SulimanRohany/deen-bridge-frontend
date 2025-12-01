// app/admin/blog/create/page.jsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import axios from 'axios'
import { config } from '@/lib/config'
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconEye
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
// import RichTextEditor from '@/components/blog/RichTextEditor'
import RichTextEditor from '@/components/blog/RichTextEditor'
import BlogContentRenderer from '@/components/blog/BlogContentRenderer'
import ImageUpload from '@/components/blog/ImageUpload'
import TagInput from '@/components/blog/TagInput'
import { Switch } from '@/components/ui/switch'
import { useContext } from 'react'
import AuthContext from '@/context/AuthContext'
import Link from 'next/link'
import { toast } from 'sonner'

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  slug: z.string().min(1, 'Slug is required'),
  body: z.string().min(1, 'Content is required'),
  featured_image: z.any().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']).default('draft'),
})

export default function CreateBlogPostPage() {
  const [previewMode, setPreviewMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { userData } = useContext(AuthContext)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      slug: '',
      body: '',
      tags: [],
      status: 'draft',
    }
  })

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  }

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
      toast.error('Invalid authentication data. Please login again.');
      router.push('/login');
      return null;
    }
  };



  const onSubmit = async (values) => {
    try {
      setLoading(true)
      
      const formData = new FormData()
      
      // Add basic fields
      formData.append('title', values.title)
      formData.append('slug', values.slug)
      formData.append('body', values.body)
      formData.append('status', values.status)
      
      // Add the current user as the author
      if (userData && userData.id) {
        formData.append('author', userData.id)
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

      // Check payload size before sending (warn if too large)
      const bodySize = new Blob([values.body]).size
      const bodySizeMB = bodySize / (1024 * 1024)
      
      if (bodySizeMB > 8) {
        toast.warning(`Blog content is ${bodySizeMB.toFixed(2)}MB. Large content may cause upload issues. Consider reducing embedded images.`)
      }

      const response = await axios.post(config.API_BASE_URL + 'blog/post/', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        maxContentLength: 100 * 1024 * 1024, // 100MB
        maxBodyLength: 100 * 1024 * 1024, // 100MB
      })

      if (response.status === 200 || response.status === 201) {
        toast.success('Blog post created successfully!')
        router.push('/dashboard/super-admin/blog')
      } else {
        toast.error('Failed to create post. Please try again.')
      }
    } catch (error) {
      
      // Provide helpful error messages
      if (error.response?.status === 413 || error.code === 'ERR_NETWORK') {
        if (error.response?.status === 413) {
          toast.error('Request too large. Please reduce the size of your content or images and try again.')
        } else {
          toast.error('Network error. The request may be too large. Please try reducing content size.')
        }
      } else if (error.response?.status === 400) {
        toast.error('Invalid data. Please check your form inputs.')
      } else if (error.response?.status === 401) {
        toast.error('Authentication required. Please login again.')
        router.push('/login')
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Please try again later.')
      } else {
        toast.error(error.response?.data?.message || 'An error occurred while creating the post.')
      }
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-3xl font-bold">Create New Post</h1>
          <p className="text-muted-foreground">Write and publish a new blog post</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setPreviewMode(!previewMode)}
          >
            <IconEye className="mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={loading}
          >
            <IconDeviceFloppy className="mr-2" />
            {form.watch('status') === 'draft' ? 'Save Draft' : 'Publish'}
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
                  <BlogContentRenderer 
                    html={form.watch('body')}
                    className="prose max-w-none"
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
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}