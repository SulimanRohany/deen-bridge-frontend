import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: "Islamic Courses - Quran & Islamic Studies | Deen Bridge",
  description: "Browse our comprehensive catalog of Islamic courses. Learn Quran, Tajweed, Arabic, Islamic history, and more from qualified teachers. Flexible schedules and personalized learning.",
  keywords: [
    "Islamic courses",
    "Quran courses online",
    "Tajweed course",
    "Arabic language course",
    "Islamic studies",
    "Quran memorization course",
    "Islamic history",
    "Fiqh course",
    "Hadith course",
    "Islamic education",
    "online Islamic courses",
    "Deen Bridge courses"
  ],
  type: "website",
  canonical: "/courses",
});

export default function CoursesLayout({ children }) {
  return children;
}

