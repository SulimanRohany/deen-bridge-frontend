import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${baseUrl}/api/blogs/${slug}/`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });
    
    if (!response.ok) {
      return generateSEOMetadata({
        title: "Blog Post Not Found | Deen Bridge",
        description: "The blog post you're looking for doesn't exist.",
        noindex: true,
      });
    }
    
    const post = await response.json();
    const postImage = post.featured_image 
      ? `${baseUrl}${post.featured_image}` 
      : undefined;
    
    return generateSEOMetadata({
      title: `${post.title} | Deen Bridge Blog`,
      description: post.excerpt || post.content?.substring(0, 160) || `Read ${post.title} on Deen Bridge. Islamic education insights and knowledge.`,
      keywords: [
        ...(post.tags || []),
        "Islamic blog",
        "Islamic education",
        "Quran learning",
        "Islamic knowledge",
        "Deen Bridge"
      ],
      image: postImage,
      type: "article",
      canonical: `/blogs/${slug}`,
      publishedTime: post.published_at || post.created_at,
      modifiedTime: post.updated_at || post.published_at || post.created_at,
      authors: post.author?.name ? [post.author.name] : ["Deen Bridge Team"],
    });
  } catch (error) {
    return generateSEOMetadata({
      title: "Blog Post | Deen Bridge",
      description: "Read our latest Islamic education articles and insights.",
    });
  }
}

