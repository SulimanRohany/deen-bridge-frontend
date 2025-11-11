'use client'

import { useState, useEffect } from 'react'
import { IconX, IconFilter, IconChevronDown } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

export default function ResourceFilters({
  onFilterChange,
  initialFilters = {},
  className = '',
}) {
  const [filters, setFilters] = useState({
    languages: initialFilters.languages || [],
    minRating: initialFilters.minRating || 0,
    ...initialFilters,
  })

  const [languagesOpen, setLanguagesOpen] = useState(true)
  const [ratingOpen, setRatingOpen] = useState(true)

  const languages = [
    { value: 'arabic', label: 'Arabic (العربية)' },
    { value: 'english', label: 'English' },
    { value: 'urdu', label: 'Urdu (اردو)' },
    { value: 'farsi', label: 'Farsi (فارسی)' },
    { value: 'pashto', label: 'Pashto (پښتو)' },
    { value: 'turkish', label: 'Turkish (Türkçe)' },
  ]

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filters)
    }
  }, [filters])

  const handleLanguageToggle = (language) => {
    setFilters(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }))
  }

  const handleRatingChange = (value) => {
    setFilters(prev => ({ ...prev, minRating: value[0] }))
  }

  const clearFilters = () => {
    const emptyFilters = {
      languages: [],
      minRating: 0,
    }
    setFilters(emptyFilters)
  }

  const activeFilterCount = 
    filters.languages.length +
    (filters.minRating > 0 ? 1 : 0)

  return (
    <div className={cn('space-y-4', className)}>
      {/* Enhanced Header */}
      <div className="flex items-center justify-between pb-3 border-b-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <IconFilter className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Filters</h3>
            {activeFilterCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
              </p>
            )}
          </div>
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 px-3 text-destructive hover:text-destructive hover:bg-destructive/10 font-medium"
          >
            <IconX className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-250px)]">
        <div className="space-y-1 pr-3">
          {/* Languages Section */}
          <Collapsible open={languagesOpen} onOpenChange={setLanguagesOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted rounded-lg transition-colors group">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold cursor-pointer">Language</Label>
                {filters.languages.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-2">
                    {filters.languages.length}
                  </Badge>
                )}
              </div>
              <IconChevronDown className={cn(
                "h-4 w-4 transition-transform text-muted-foreground",
                languagesOpen && "rotate-180"
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 pb-3 px-3">
              <div className="space-y-2.5">
                {languages.map((language) => (
                  <div key={language.value} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={`lang-${language.value}`}
                      checked={filters.languages.includes(language.value)}
                      onCheckedChange={() => handleLanguageToggle(language.value)}
                      className="border-2"
                    />
                    <Label
                      htmlFor={`lang-${language.value}`}
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      {language.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Minimum Rating Section */}
          <Collapsible open={ratingOpen} onOpenChange={setRatingOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted rounded-lg transition-colors group">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold cursor-pointer">Minimum Rating</Label>
                {filters.minRating > 0 && (
                  <Badge variant="secondary" className="h-5 px-2">
                    {filters.minRating}+★
                  </Badge>
                )}
              </div>
              <IconChevronDown className={cn(
                "h-4 w-4 transition-transform text-muted-foreground",
                ratingOpen && "rotate-180"
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 pb-3 px-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    {filters.minRating > 0 ? `${filters.minRating}+ Stars` : 'Any Rating'}
                  </span>
                </div>
                <Slider
                  value={[filters.minRating]}
                  onValueChange={handleRatingChange}
                  max={5}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                  <span>Any</span>
                  <span>★★★</span>
                  <span>★★★★★</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  )
}

