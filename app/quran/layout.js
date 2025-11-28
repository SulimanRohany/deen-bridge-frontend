import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: "Quran Reader - Read & Study Quran Online | Deen Bridge",
  description: "Read and study the Holy Quran online with translations, tafsir, and audio recitations. Access the complete Quran with multiple translations and interpretations.",
  keywords: [
    "Quran online",
    "read Quran",
    "Quran with translation",
    "Quran tafsir",
    "Quran audio",
    "Holy Quran",
    "Quran recitation",
    "Quran study",
    "online Quran reader",
    "Deen Bridge Quran"
  ],
  type: "website",
  canonical: "/quran",
});

export default function QuranLayout({ children }) {
  return children;
}

