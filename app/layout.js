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

// Generate default metadata
const baseMetadata = generateSEOMetadata({
  title: "Deen Bridge - Online Islamic Education Platform",
  description: "Empowering Muslims worldwide with quality Islamic education. Learn Quran and Islamic studies from expert teachers online. Join thousands of students in our comprehensive courses.",
  keywords: [
    "Islamic education",
    "Quran learning",
    "Online Quran classes",
    "Islamic studies",
    "Quran courses",
    "Learn Arabic",
    "Islamic knowledge",
    "Muslim education",
    "Quran teacher",
    "Islamic online courses",
    "Tajweed",
    "Quran memorization",
    "Islamic scholarship",
    "Deen Bridge"
  ],
  type: "website",
});

// Add icon to metadata
export const metadata = {
  ...baseMetadata,
  icons: {
    icon: [
      { url: '/Logo.png', type: 'image/png' },
    ],
    apple: [
      { url: '/Logo.png', type: 'image/png' },
    ],
    shortcut: '/Logo.png',
  },
};

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
        
        {/* Favicon - Using Logo.png */}
        <link rel="icon" type="image/png" sizes="32x32" href="/Logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/Logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/Logo.png" />
        <link rel="shortcut icon" href="/Logo.png" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        
        {/* Permissions Policy - Allow camera and microphone for live sessions */}
        <meta httpEquiv="Permissions-Policy" content="camera=(self), microphone=(self), geolocation=()" />
        
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
