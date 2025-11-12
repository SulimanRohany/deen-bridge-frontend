'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  IconX,
  IconKeyboard,
  IconPlayerPlay,
  IconVolume,
  IconChevronLeft,
  IconChevronRight,
  IconRotateClockwise,
  IconBook2,
  IconBulb,
  IconInfoCircle
} from '@tabler/icons-react'

const TIPS = [
  {
    category: 'Keyboard Shortcuts',
    iconName: 'keyboard',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    tips: [
      { key: 'Space', action: 'Play/Pause', iconName: 'play' },
      { key: '←', action: 'Previous Ayah', iconName: 'chevronLeft' },
      { key: '→', action: 'Next Ayah', iconName: 'chevronRight' },
      { key: 'M', action: 'Mute/Unmute', iconName: 'volume' },
      { key: 'R', action: 'Replay Ayah', iconName: 'rotate' },
    ]
  },
  {
    category: 'Playback Modes',
    iconName: 'book',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    tips: [
      { key: '1️⃣', action: 'Single Ayah: Perfect for memorization' },
      { key: '📖', action: 'Whole Surah: Listen continuously' },
      { key: '🔁', action: 'Repeat Ayah: Practice pronunciation' },
    ]
  },
  {
    category: 'Pro Tips',
    iconName: 'lightbulb',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    tips: [
      { key: '💡', action: 'Click any ayah to start from that point' },
      { key: '⚙️', action: 'Use settings to choose different reciters' },
      { key: '🔖', action: 'Bookmark ayahs for quick access later' },
      { key: '📱', action: 'All settings auto-save for next time' },
    ]
  }
]

// Icon mapping
const getIcon = (iconName) => {
  switch (iconName) {
    case 'keyboard': return IconKeyboard
    case 'play': return IconPlayerPlay
    case 'volume': return IconVolume
    case 'chevronLeft': return IconChevronLeft
    case 'chevronRight': return IconChevronRight
    case 'rotate': return IconRotateClockwise
    case 'book': return IconBook2
    case 'lightbulb': return IconBulb
    default: return null
  }
}

export default function QuickTips({ onClose, className = '', forceShow = false }) {
  const [selectedCategory, setSelectedCategory] = useState(0)

  const handleClose = () => {
    localStorage.setItem('quran_tips_shown', 'true')
    if (onClose) onClose()
  }

  const handleDismiss = () => {
    if (onClose) onClose()
  }

  return (
    <Card className={`p-4 shadow-xl border-2 border-primary/20 bg-popover ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
            <IconInfoCircle className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              Quick Tips & Shortcuts
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                Pro
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Master the Quran reader
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive"
          onClick={handleClose}
        >
          <IconX className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-2">
        {TIPS.map((category, index) => {
          const isActive = selectedCategory === index
          const CategoryIcon = getIcon(category.iconName)
          return (
            <Button
              key={index}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={`flex items-center gap-1.5 h-8 px-3 text-xs transition-all ${
                isActive ? 'shadow-md' : 'hover:scale-105'
              }`}
              onClick={() => setSelectedCategory(index)}
            >
              {CategoryIcon && <CategoryIcon className="w-3.5 h-3.5" />}
              {category.category}
            </Button>
          )
        })}
      </div>

      {/* Tips Content */}
      <div className="space-y-2 min-h-[150px]">
        {TIPS[selectedCategory].tips.map((tip, index) => {
          const TipIcon = tip.iconName ? getIcon(tip.iconName) : null
          return (
            <div
              key={index}
              className="flex items-center gap-3 p-2 rounded-md bg-muted/50 hover:bg-muted transition-all duration-200 group"
            >
              {/* Key/Emoji */}
              <div className="flex-shrink-0">
                {tip.key.length === 1 || tip.key === '←' || tip.key === '→' ? (
                  <kbd className="px-2 py-1.5 bg-background border border-primary/30 rounded-md font-bold text-xs shadow-sm min-w-[2.5rem] text-center block">
                    {tip.key}
                  </kbd>
                ) : (
                  <div className="text-lg">{tip.key}</div>
                )}
              </div>

              {/* Arrow */}
              <div className="text-muted-foreground group-hover:text-primary transition-colors text-xs">
                →
              </div>

              {/* Action */}
              <div className="flex items-center gap-1.5 flex-1">
                {TipIcon && <TipIcon className="w-3.5 h-3.5 text-primary" />}
                <span className="text-xs font-medium">{tip.action}</span>
              </div>

              {/* Badge for shortcuts */}
              {selectedCategory === 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                  KB
                </Badge>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
          <span>Shortcuts work globally</span>
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={handleDismiss}
          >
            Dismiss
          </Button>
          <Button
            variant="default"
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={handleClose}
          >
            Got it!
          </Button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-center gap-1 mt-3">
        {TIPS.map((_, index) => (
          <button
            key={index}
            className={`h-1 rounded-full transition-all duration-300 ${
              selectedCategory === index 
                ? 'w-6 bg-primary' 
                : 'w-1 bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
            onClick={() => setSelectedCategory(index)}
            aria-label={`View ${TIPS[index].category}`}
          />
        ))}
      </div>

      <style jsx>{`
        kbd {
          font-family: ui-monospace, monospace;
          font-size: 0.75rem;
          font-weight: 700;
        }
      `}</style>
    </Card>
  )
}
