'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  IconPlayerPlay, 
  IconReload, 
  IconBook2,
  IconCheck,
  IconVolume
} from '@tabler/icons-react'

const PLAYBACK_MODES = [
  { 
    id: 'single', 
    name: 'Single Ayah', 
    icon: IconPlayerPlay,
    emoji: '1️⃣',
    description: 'Play one ayah at a time',
    detail: 'Perfect for memorization and deep reflection',
    color: 'from-blue-500/20 to-blue-600/10',
    borderColor: 'border-blue-500/30',
    hoverColor: 'hover:border-blue-500/60'
  },
  { 
    id: 'continuous', 
    name: 'Whole Surah', 
    icon: IconBook2,
    emoji: '📖',
    description: 'Play entire Surah continuously',
    detail: 'Ideal for listening and understanding the complete message',
    color: 'from-emerald-500/20 to-emerald-600/10',
    borderColor: 'border-emerald-500/30',
    hoverColor: 'hover:border-emerald-500/60'
  },
  { 
    id: 'repeat', 
    name: 'Repeat Ayah', 
    icon: IconReload,
    emoji: '🔁',
    description: 'Repeat current ayah',
    detail: 'Best for learning pronunciation and memorization',
    color: 'from-purple-500/20 to-purple-600/10',
    borderColor: 'border-purple-500/30',
    hoverColor: 'hover:border-purple-500/60'
  },
]

export default function PlaybackModeSelector({ currentMode, onModeChange, className = '' }) {
  const [hoveredMode, setHoveredMode] = useState(null)

  const handleModeSelect = (modeId) => {
    onModeChange(modeId)
  }

  const currentModeData = PLAYBACK_MODES.find(m => m.id === currentMode) || PLAYBACK_MODES[1]

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Mode Display - Prominent */}
      <Card className="p-4 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/30">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <currentModeData.icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm">Playback Mode</h4>
              <Badge variant="secondary" className="text-xs">
                {currentModeData.emoji} Active
              </Badge>
            </div>
            <p className="text-sm font-medium text-primary">
              {currentModeData.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {currentModeData.description}
            </p>
          </div>
          <div className="flex-shrink-0">
            <IconVolume className="w-5 h-5 text-primary animate-pulse" />
          </div>
        </div>
      </Card>

      {/* Mode Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PLAYBACK_MODES.map((mode) => {
          const isActive = currentMode === mode.id
          const isHovered = hoveredMode === mode.id
          const Icon = mode.icon

          return (
            <div
              key={mode.id}
              className="mode-card-wrapper"
            >
              <Card
                className={`relative p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                  isActive 
                    ? `bg-gradient-to-br ${mode.color} border-2 ${mode.borderColor} shadow-lg` 
                    : `hover:shadow-md border-2 border-border ${mode.hoverColor}`
                }`}
                onClick={() => handleModeSelect(mode.id)}
                onMouseEnter={() => setHoveredMode(mode.id)}
                onMouseLeave={() => setHoveredMode(null)}
              >
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute -top-2 -right-2 animate-scale-in">
                    <div className="bg-primary text-primary-foreground rounded-full p-1 shadow-lg">
                      <IconCheck className="w-3 h-3" />
                    </div>
                  </div>
                )}

                {/* Mode Icon */}
                <div className={`mb-3 flex items-center justify-between transition-colors duration-300 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  <Icon className={`w-6 h-6 transition-transform duration-300 ${isHovered || isActive ? 'scale-110' : ''}`} />
                  <span className="text-2xl">{mode.emoji}</span>
                </div>

                {/* Mode Info */}
                <h3 className={`font-semibold text-sm mb-1 transition-colors duration-300 ${isActive ? 'text-primary' : 'text-foreground'}`}>
                  {mode.name}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {mode.detail}
                </p>

                {/* Hover/Active State Indicator */}
                {(isHovered || isActive) && (
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r animate-slide-in-bottom ${
                      isActive 
                        ? 'from-primary via-primary/80 to-primary' 
                        : 'from-muted-foreground/30 via-muted-foreground/50 to-muted-foreground/30'
                    }`}
                    style={{ borderBottomLeftRadius: '0.5rem', borderBottomRightRadius: '0.5rem' }}
                  />
                )}
              </Card>
            </div>
          )
        })}
      </div>

      {/* Quick Guide */}
      <Card className="p-3 bg-muted/30">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <div className="mt-0.5">💡</div>
          <div className="space-y-1">
            <p><strong className="text-foreground">Single Ayah:</strong> Stops after each verse - great for focused study</p>
            <p><strong className="text-foreground">Whole Surah:</strong> Plays all verses sequentially - perfect for continuous listening</p>
            <p><strong className="text-foreground">Repeat Ayah:</strong> Loops the same verse - excellent for memorization</p>
          </div>
        </div>
      </Card>

      <style jsx>{`
        @keyframes shimmer {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes slide-in-bottom {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-slide-in-bottom {
          animation: slide-in-bottom 0.3s ease-out;
        }

        .mode-card-wrapper {
          transition: transform 0.2s ease;
        }
      `}</style>
    </div>
  )
}

