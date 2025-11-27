import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }) {
  const { id } = await params;
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${baseUrl}/api/library/${id}/`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });
    
    if (!response.ok) {
      return generateSEOMetadata({
        title: "Resource Not Found | Deen Bridge",
        description: "The resource you're looking for doesn't exist.",
        noindex: true,
      });
    }
    
    const resource = await response.json();
    const resourceImage = resource.cover_image 
      ? `${baseUrl}${resource.cover_image}` 
      : undefined;
    
    return generateSEOMetadata({
      title: `${resource.title} - Islamic Resource | Deen Bridge Library`,
      description: resource.description || resource.summary || `Read ${resource.title} from Deen Bridge Library. Access Islamic books and educational resources.`,
      keywords: [
        resource.title,
        "Islamic book",
        "Islamic resource",
        "Islamic literature",
        "Islamic education",
        ...(resource.tags || []),
        "Deen Bridge library"
      ],
      image: resourceImage,
      type: "book",
      canonical: `/library/${id}`,
      publishedTime: resource.created_at,
      modifiedTime: resource.updated_at,
    });
  } catch (error) {
    console.error('Error generating library metadata:', error);
    return generateSEOMetadata({
      title: "Library Resource | Deen Bridge",
      description: "Browse our comprehensive Islamic library resources.",
    });
  }
}

