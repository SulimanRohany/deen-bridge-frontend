/**
 * SEO Utility Functions
 * Provides helper functions for generating SEO metadata, structured data, and canonical URLs
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.deenbridge.com';
const SITE_NAME = 'Deen Bridge';
const SITE_DESCRIPTION = 'Empowering Muslims worldwide with quality Islamic education. Learn Quran and Islamic studies from expert teachers online.';
const DEFAULT_IMAGE = `${SITE_URL}/Transparent Version of Logo.png`;

/**
 * Generate comprehensive metadata object for Next.js metadata API
 */
export function generateMetadata({
  title,
  description,
  keywords = [],
  image = DEFAULT_IMAGE,
  type = 'website',
  publishedTime,
  modifiedTime,
  authors = [],
  noindex = false,
  nofollow = false,
  canonical,
  alternates = {},
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Online Islamic Education Platform`;
  const metaDescription = description || SITE_DESCRIPTION;
  const canonicalUrl = canonical || SITE_URL;
  const imageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  const metadata = {
    title: fullTitle,
    description: metaDescription,
    keywords: keywords.length > 0 ? keywords.join(', ') : undefined,
    authors: authors.length > 0 ? authors.map(author => ({ name: author })) : undefined,
    creator: SITE_NAME,
    publisher: SITE_NAME,
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type,
      locale: 'en_US',
      url: canonicalUrl,
      siteName: SITE_NAME,
      title: fullTitle,
      description: metaDescription,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title || SITE_NAME,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(authors.length > 0 && { authors }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: metaDescription,
      images: [imageUrl],
      creator: '@deenbridge',
      site: '@deenbridge',
    },
    alternates: {
      canonical: canonicalUrl,
      ...alternates,
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
      yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
      bing: process.env.NEXT_PUBLIC_BING_VERIFICATION,
    },
    category: 'Education',
    classification: 'Islamic Education Platform',
  };

  return metadata;
}

/**
 * Generate Organization structured data (JSON-LD)
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    logo: `${SITE_URL}/Transparent Version of Logo.png`,
    image: `${SITE_URL}/Transparent Version of Logo.png`,
    sameAs: [
      'https://www.facebook.com/deenbridge',
      'https://www.instagram.com/deenbridge',
      'https://www.twitter.com/deenbridge',
      'https://www.youtube.com/deenbridge',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+880-1234-567890',
      contactType: 'Customer Service',
      email: 'info@deenbridge.com',
      areaServed: 'Worldwide',
      availableLanguage: ['English', 'Arabic', 'Bengali'],
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Islamic Street',
      addressLocality: 'Dhaka',
      addressCountry: 'BD',
    },
    foundingDate: '2024',
    educationalCredentialAwarded: 'Certificate',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Islamic Education Courses',
      itemListElement: [
        {
          '@type': 'OfferCatalog',
          name: 'Quran Courses',
        },
        {
          '@type': 'OfferCatalog',
          name: 'Islamic Studies',
        },
      ],
    },
  };
}

/**
 * Generate Course structured data (JSON-LD)
 */
export function generateCourseSchema(course) {
  if (!course) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title || course.name,
    description: course.description || course.short_description,
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      sameAs: SITE_URL,
    },
    image: course.thumbnail ? `${SITE_URL}${course.thumbnail}` : DEFAULT_IMAGE,
    courseCode: course.id?.toString(),
    educationalLevel: course.level || 'Beginner',
    teaches: course.learning_outcomes || [],
    inLanguage: 'en',
    isAccessibleForFree: course.price === 0 || course.is_free,
    ...(course.price > 0 && {
      offers: {
        '@type': 'Offer',
        price: course.price,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/courses/${course.id}`,
      },
    }),
    aggregateRating: course.rating
      ? {
          '@type': 'AggregateRating',
          ratingValue: course.rating,
          ratingCount: course.enrollments_count || 0,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
  };
}

/**
 * Generate BlogPost structured data (JSON-LD)
 */
export function generateBlogPostSchema(post) {
  if (!post) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.content?.substring(0, 200),
    image: post.featured_image
      ? `${SITE_URL}${post.featured_image}`
      : DEFAULT_IMAGE,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    author: {
      '@type': 'Person',
      name: post.author?.name || post.author?.username || 'Deen Bridge Team',
      url: post.author?.profile_url || SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/Transparent Version of Logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blogs/${post.slug}`,
    },
    keywords: post.tags?.join(', ') || '',
    articleSection: post.category || 'Islamic Education',
    wordCount: post.content?.split(' ').length || 0,
  };
}

/**
 * Generate WebSite structured data with search action (JSON-LD)
 */
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/courses?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/Transparent Version of Logo.png`,
      },
    },
  };
}

/**
 * Generate BreadcrumbList structured data (JSON-LD)
 */
export function generateBreadcrumbSchema(items) {
  if (!items || items.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url ? `${SITE_URL}${item.url}` : undefined,
    })),
  };
}

/**
 * Generate FAQPage structured data (JSON-LD)
 */
export function generateFAQSchema(faqs) {
  if (!faqs || faqs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate VideoObject structured data (JSON-LD)
 */
export function generateVideoSchema(video) {
  if (!video) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnail || DEFAULT_IMAGE,
    uploadDate: video.created_at || video.upload_date,
    duration: video.duration,
    contentUrl: video.video_url,
    embedUrl: video.embed_url,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/Transparent Version of Logo.png`,
      },
    },
  };
}

/**
 * Combine multiple schemas into a single script tag content
 */
export function combineSchemas(schemas) {
  return schemas.filter(Boolean).map((schema) => JSON.stringify(schema));
}

