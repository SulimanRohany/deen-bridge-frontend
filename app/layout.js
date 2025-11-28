import { generateMetadata as generateSEOMetadata, generateOrganizationSchema, generateWebSiteSchema } from '@/lib/seo';
import RootLayoutClient from './layout-client';
import Script from 'next/script';
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

// Generate default metadata (homepage metadata)
// This applies to the homepage and serves as fallback for other pages
export const metadata = generateSEOMetadata({
  title: "Deen Bridge - Online Islamic Education Platform | Learn Quran Online",
  description: "Join thousands of students learning Quran and Islamic studies online. Expert teachers, comprehensive courses, flexible schedules. Start your Islamic education journey today with Deen Bridge.",
  keywords: [
    "online Quran classes",
    "Islamic education online",
    "learn Quran",
    "Quran courses",
    "Islamic studies",
    "Quran teacher online",
    "Tajweed course",
    "Quran memorization",
    "Islamic knowledge",
    "Muslim education platform",
    "Deen Bridge",
    "Quran learning app",
    "online Islamic school",
    "Quran recitation",
    "Islamic scholarship"
  ],
  type: "website",
  canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.deenbridge.com'}/`,
});

export default function RootLayout({ children }) {
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebSiteSchema();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        
        {/* DNS Prefetch for better performance */}
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" href="/Logo.png" />
        <link rel="apple-touch-icon" href="/Logo.png" />
        <link rel="shortcut icon" href="/Logo.png" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        
        {/* Structured Data - Organization */}
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        
        {/* Structured Data - Website */}
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-K0NNSJM4PF"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-K0NNSJM4PF', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
        
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
