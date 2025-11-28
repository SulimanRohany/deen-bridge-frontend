"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Users, Mic, MicOff, Video, VideoOff, UserX, Crown, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export function ParticipantManagement({ participants, isOpen, onToggle }) {
  const [isHost] = useState(true) // Simulate host privileges

  const handleMuteParticipant = (participantId) => {
    // In a real app, this would send a signal to mute the participant
  }

  const handleRemoveParticipant = (participantId) => {
    // In a real app, this would disconnect the participant
  }

  if (!isOpen) return null
  const allParticipants = [
    {
      id: "local",
      name: "You (Host)",
      isLocal: true,
      isHost: true,
      isAudioEnabled: true,
      isVideoEnabled: true,
      connectionQuality: "excellent",
    },
    ...participants.map((p) => ({
      ...p,
      name: p.name || `Participant ${p.id.slice(-4)}`,
      isLocal: false,
      isHost: false,
      connectionQuality: Math.random() > 0.3 ? "good" : "poor",
    })),
  ]

  const getQualityColor = (quality) => {
    switch (quality) {
      case "excellent":
        return "text-green-400"
      case "good":
        return "text-yellow-400"
      case "poor":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  return (
    <Card className="fixed left-4 bottom-20 w-80 max-h-96 bg-gray-800 border-gray-700 text-white flex flex-col z-50">
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span className="font-medium">Participants ({allParticipants.length})</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onToggle} className="text-gray-400 hover:text-white p-1">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {allParticipants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center justify-between p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-semibold">
                {participant.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{participant.name}</span>
                  {participant.isHost && <Crown className="w-3 h-3 text-yellow-400" />}
                </div>
                <div className={`text-xs ${getQualityColor(participant.connectionQuality)}`}>
                  {participant.connectionQuality} connection
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <div className={`p-1 rounded ${participant.isAudioEnabled ? "bg-green-600" : "bg-red-600"}`}>
                {participant.isAudioEnabled ? (
                  <Mic className="w-3 h-3 text-white" />
                ) : (
                  <MicOff className="w-3 h-3 text-white" />
                )}
              </div>
              <div className={`p-1 rounded ${participant.isVideoEnabled ? "bg-green-600" : "bg-red-600"}`}>
                {participant.isVideoEnabled ? (
                  <Video className="w-3 h-3 text-white" />
                ) : (
                  <VideoOff className="w-3 h-3 text-white" />
                )}
              </div>

              {!participant.isLocal && isHost && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-1">
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleMuteParticipant(participant.id)}>
                      <MicOff className="w-4 h-4 mr-2" />
                      Mute
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleRemoveParticipant(participant.id)} className="text-red-600">
                      <UserX className="w-4 h-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
