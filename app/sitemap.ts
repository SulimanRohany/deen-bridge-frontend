import { MetadataRoute } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.deenbridge.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blogs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/library`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/quran`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Dynamic pages - Courses
  let coursePages: MetadataRoute.Sitemap = [];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const coursesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/?page_size=1000`, {
      next: { revalidate: 3600 }, // Revalidate every hour
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (coursesResponse.ok) {
      const coursesData = await coursesResponse.json();
      const courses = coursesData.results || coursesData || [];
      
      coursePages = courses.map((course: any) => ({
        url: `${baseUrl}/courses/${course.id}`,
        lastModified: course.updated_at ? new Date(course.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch (error: any) {
    // Only log errors in development, not during build
    if (process.env.NODE_ENV === 'development' && error.code !== 'ECONNREFUSED') {
      console.error('Error fetching courses for sitemap:', error);
    }
  }

  // Dynamic pages - Blog posts
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const blogsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/blogs/?status=published&page_size=1000`, {
      next: { revalidate: 3600 }, // Revalidate every hour
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (blogsResponse.ok) {
      const blogsData = await blogsResponse.json();
      const blogs = blogsData.results || blogsData || [];
      
      blogPages = blogs.map((blog: any) => ({
        url: `${baseUrl}/blogs/${blog.slug}`,
        lastModified: blog.updated_at || blog.published_at ? new Date(blog.updated_at || blog.published_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch (error: any) {
    // Only log errors in development, not during build
    if (process.env.NODE_ENV === 'development' && error.code !== 'ECONNREFUSED') {
      console.error('Error fetching blogs for sitemap:', error);
    }
  }

  // Dynamic pages - Library items
  let libraryPages: MetadataRoute.Sitemap = [];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const libraryResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/library/?page_size=1000`, {
      next: { revalidate: 3600 }, // Revalidate every hour
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (libraryResponse.ok) {
      const libraryData = await libraryResponse.json();
      const libraryItems = libraryData.results || libraryData || [];
      
      libraryPages = libraryItems.map((item: any) => ({
        url: `${baseUrl}/library/${item.id}`,
        lastModified: item.updated_at ? new Date(item.updated_at) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
    }
  } catch (error: any) {
    // Only log errors in development, not during build
    if (process.env.NODE_ENV === 'development' && error.code !== 'ECONNREFUSED') {
      console.error('Error fetching library items for sitemap:', error);
    }
  }

  return [...staticPages, ...coursePages, ...blogPages, ...libraryPages];
}

