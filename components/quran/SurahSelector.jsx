'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { IconSearch, IconStar } from '@tabler/icons-react'
import { quranAPI } from '@/lib/api'

export default function SurahSelector({ selectedSurah, onSelectSurah }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [surahs, setSurahs] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch all surahs on mount
  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const response = await quranAPI.getSurahs()
        setSurahs(response.data)
      } catch (error) {
        console.error('Error fetching surahs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSurahs()
  }, [])

  // Filter surahs based on search query
  const filteredSurahs = surahs.filter(surah =>
    surah.name_arabic?.includes(searchQuery) ||
    surah.name_transliteration?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surah.name_translation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surah.number?.toString().includes(searchQuery)
  )

  return (
    <Card className="p-6 border-2 animate-slide-down">
      {/* Search Bar */}
      <div className="relative mb-6">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search Surah by name, number..."
          className="pl-10 h-12"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Surah Grid */}
      <ScrollArea className="h-[500px] pr-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading Surahs...</p>
          </div>
        ) : filteredSurahs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No Surahs found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSurahs.map((surah, index) => (
              <button
                key={surah.number}
                onClick={() => onSelectSurah(surah.number)}
                className={`surah-item group p-4 rounded-xl border-2 text-left transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:scale-105 ${
                  selectedSurah === surah.number
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-border bg-card'
                }`}
                style={{
                  animationDelay: `${index * 30}ms`
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="surah-number">
                    <span className="text-sm font-bold">{surah.number}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    surah.revelation_type === 'meccan' 
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' 
                      : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {surah.revelation_type?.charAt(0).toUpperCase() + surah.revelation_type?.slice(1)}
                  </span>
                </div>

                <h3 className="text-2xl font-bold mb-1 text-right" style={{ fontFamily: 'serif' }}>
                  {surah.name_arabic}
                </h3>

                <p className="font-semibold mb-1 group-hover:text-primary transition-colors">
                  {surah.name_transliteration}
                </p>

                <p className="text-sm text-muted-foreground mb-2">
                  {surah.name_translation}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{surah.total_verses} verses</span>
                  {selectedSurah === surah.number && (
                    <IconStar className="w-4 h-4 text-primary fill-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-down {
          animation: slide-down 0.5s ease-out;
        }

        .surah-item {
          animation: fade-in-up 0.5s ease-out backwards;
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .surah-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.1));
          border: 2px solid hsl(var(--primary) / 0.3);
          transition: all 0.3s ease;
        }

        .surah-item:hover .surah-number {
          transform: rotate(360deg) scale(1.1);
          background: linear-gradient(135deg, hsl(var(--primary) / 0.4), hsl(var(--primary) / 0.2));
        }
      `}</style>
    </Card>
  )
}

