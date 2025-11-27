'use client';

import Script from 'next/script';
import {
  generateOrganizationSchema,
  generateCourseSchema,
  generateBlogPostSchema,
  generateWebSiteSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateVideoSchema,
} from '@/lib/seo';

/**
 * StructuredData component for rendering JSON-LD structured data
 */
export function StructuredData({ type, data }) {
  let schema = null;

  switch (type) {
    case 'organization':
      schema = generateOrganizationSchema();
      break;
    case 'website':
      schema = generateWebSiteSchema();
      break;
    case 'course':
      schema = generateCourseSchema(data);
      break;
    case 'blogPost':
      schema = generateBlogPostSchema(data);
      break;
    case 'breadcrumb':
      schema = generateBreadcrumbSchema(data);
      break;
    case 'faq':
      schema = generateFAQSchema(data);
      break;
    case 'video':
      schema = generateVideoSchema(data);
      break;
    default:
      return null;
  }

  if (!schema) return null;

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}

/**
 * MultipleStructuredData component for rendering multiple schemas
 */
export function MultipleStructuredData({ schemas }) {
  return (
    <>
      {schemas.map((schema, index) => {
        if (!schema || !schema.type) return null;
        return (
          <StructuredData
            key={`${schema.type}-${index}`}
            type={schema.type}
            data={schema.data}
          />
        );
      })}
    </>
  );
}

