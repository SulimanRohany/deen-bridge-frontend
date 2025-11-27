import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }) {
  const { id } = await params;
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${baseUrl}/api/courses/${id}/`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });
    
    if (!response.ok) {
      return generateSEOMetadata({
        title: "Course Not Found | Deen Bridge",
        description: "The course you're looking for doesn't exist.",
        noindex: true,
      });
    }
    
    const course = await response.json();
    const courseImage = course.thumbnail 
      ? `${baseUrl}${course.thumbnail}` 
      : undefined;
    
    return generateSEOMetadata({
      title: `${course.title || course.name} - Islamic Course | Deen Bridge`,
      description: course.description || course.short_description || `Learn ${course.title || course.name} with expert teachers. Comprehensive Islamic education course with flexible scheduling.`,
      keywords: [
        course.title || course.name,
        "Islamic course",
        "Quran course",
        "online Islamic education",
        "Islamic studies",
        ...(course.tags || []),
        "Deen Bridge"
      ],
      image: courseImage,
      type: "website",
      canonical: `/courses/${id}`,
      publishedTime: course.created_at,
      modifiedTime: course.updated_at,
    });
  } catch (error) {
    console.error('Error generating course metadata:', error);
    return generateSEOMetadata({
      title: "Course | Deen Bridge",
      description: "Browse our comprehensive Islamic courses.",
    });
  }
}

