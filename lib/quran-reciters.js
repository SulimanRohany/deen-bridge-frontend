/**
 * Quran Reciters Configuration
 * Audio source: EveryAyah.com
 */

export const RECITERS = [
  {
    id: 'alafasy',
    name: 'Mishary Rashid Al-Afasy',
    nameArabic: 'مشاري بن راشد العفاسي',
    folder: 'Alafasy_128kbps',
    quality: '128kbps',
    style: 'Melodious and clear',
    country: 'Kuwait',
    popular: true,
  },
  {
    id: 'abdulbasit',
    name: 'Abdul Basit Abdus-Samad',
    nameArabic: 'عبد الباسط عبد الصمد',
    folder: 'Abdul_Basit_Murattal_192kbps',
    quality: '192kbps',
    style: 'Murattal (slow, clear)',
    country: 'Egypt',
    popular: true,
  },
  {
    id: 'sudais',
    name: 'Abdurrahman As-Sudais',
    nameArabic: 'عبد الرحمن السديس',
    folder: 'Abdurrahmaan_As-Sudais_192kbps',
    quality: '192kbps',
    style: 'Imam of Masjid al-Haram',
    country: 'Saudi Arabia',
    popular: true,
  },
  {
    id: 'husary',
    name: 'Mahmoud Khalil Al-Husary',
    nameArabic: 'محمود خليل الحصري',
    folder: 'Husary_128kbps',
    quality: '128kbps',
    style: 'Classic Murattal',
    country: 'Egypt',
    popular: true,
  },
  {
    id: 'minshawi',
    name: 'Mohamed Siddiq El-Minshawi',
    nameArabic: 'محمد صديق المنشاوي',
    folder: 'Minshawy_Murattal_128kbps',
    quality: '128kbps',
    style: 'Murattal, emotional',
    country: 'Egypt',
    popular: true,
  },
  {
    id: 'shuraim',
    name: 'Saud Ash-Shuraim',
    nameArabic: 'سعود الشريم',
    folder: 'Saood_ash-Shuraym_128kbps',
    quality: '128kbps',
    style: 'Imam of Masjid al-Haram',
    country: 'Saudi Arabia',
    popular: false,
  },
  {
    id: 'ajmi',
    name: 'Ahmad Al-Ajmi',
    nameArabic: 'أحمد العجمي',
    folder: 'Ahmed_ibn_Ali_al-Ajamy_64kbps_QuranExplorer.Com',
    quality: '64kbps',
    style: 'Beautiful and emotional',
    country: 'Saudi Arabia',
    popular: false,
  },
  {
    id: 'ghamdi',
    name: 'Saad Al-Ghamdi',
    nameArabic: 'سعد الغامدي',
    folder: 'Ghamadi_40kbps',
    quality: '40kbps',
    style: 'Warm and soothing',
    country: 'Saudi Arabia',
    popular: true,
  },
  {
    id: 'muaiqly',
    name: 'Maher Al-Muaiqly',
    nameArabic: 'ماهر المعيقلي',
    folder: 'MaherAlMuaiqly128kbps',
    quality: '128kbps',
    style: 'Imam of Masjid al-Haram',
    country: 'Saudi Arabia',
    popular: true,
  },
  {
    id: 'shatri',
    name: 'Abu Bakr Ash-Shatri',
    nameArabic: 'أبو بكر الشاطري',
    folder: 'Abu_Bakr_Ash-Shaatree_128kbps',
    quality: '128kbps',
    style: 'Emotional and powerful',
    country: 'Saudi Arabia',
    popular: true,
  },
]

/**
 * Generate audio URL for a specific verse and reciter
 * @param {number} surahNumber - Surah number (1-114)
 * @param {number} verseNumber - Verse number
 * @param {string} reciterId - Reciter ID (from RECITERS array)
 * @returns {string} Audio URL
 */
export function getAudioUrl(surahNumber, verseNumber, reciterId = 'alafasy') {
  const reciter = RECITERS.find(r => r.id === reciterId)
  if (!reciter) {
    console.warn(`Reciter ${reciterId} not found, using default`)
    return getAudioUrl(surahNumber, verseNumber, 'alafasy')
  }

  // Format: SSSSVVV.mp3 (e.g., 001001.mp3 for Surah 1, Verse 1)
  const surahFormatted = String(surahNumber).padStart(3, '0')
  const verseFormatted = String(verseNumber).padStart(3, '0')
  const filename = `${surahFormatted}${verseFormatted}.mp3`
  
  return `https://everyayah.com/data/${reciter.folder}/${filename}`
}

/**
 * Get reciter by ID
 * @param {string} reciterId - Reciter ID
 * @returns {object} Reciter object
 */
export function getReciter(reciterId) {
  return RECITERS.find(r => r.id === reciterId) || RECITERS[0]
}

/**
 * Get popular reciters
 * @returns {array} Array of popular reciters
 */
export function getPopularReciters() {
  return RECITERS.filter(r => r.popular)
}

