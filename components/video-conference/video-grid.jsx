
"use client"

import React, { useEffect, useRef, useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Mic, MicOff, Video, VideoOff, Users, Pin, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

export function VideoGrid({ localStream, participants, remoteStreams, remoteParticipants, screenSharingParticipants, isVideoEnabled, isAudioEnabled, isScreenSharing, currentUserId, streamUpdateCounter, userRole = 'member', isObserverMode = false }) {
  const localVideoRef = useRef(null)
  const [showAllParticipants, setShowAllParticipants] = useState(false)
  const [pinnedParticipantId, setPinnedParticipantId] = useState(null)
  const [activeSpeakerId, setActiveSpeakerId] = useState(null)
  const MAX_VISIBLE_PARTICIPANTS = 9
  
  // Memoize local participant ID to prevent unnecessary recalculations
  const localParticipantId = useMemo(() => `local_${currentUserId}`, [currentUserId]);

  // Memoize local participant object to prevent unnecessary re-renders
  const localParticipant = useMemo(() => {
    if (isObserverMode) return null;
    return {
      id: localParticipantId,
      userId: currentUserId,
      stream: localStream,
      isLocal: true,
      name: "You",
      role: userRole,
      isVideoEnabled: isVideoEnabled,
      isAudioEnabled: isAudioEnabled,
      isScreenSharing: screenSharingParticipants?.has(localParticipantId) || false,
    };
  }, [isObserverMode, localParticipantId, currentUserId, localStream, userRole, isVideoEnabled, isAudioEnabled, screenSharingParticipants]);

  // Memoize filtered remote participants to prevent unnecessary recalculations
  const filteredRemoteParticipants = useMemo(() => participants
    .filter((p) => {
      // Safety check: ensure currentUserId is defined
      if (!currentUserId) {
        return true; // Include all if we can't filter
      }
      // IMPORTANT: Convert currentUserId to string for comparison (Django returns number, SFU returns string)
      const currentUserIdString = String(currentUserId);
      
      // Filter out:
      // 1. Current user (to avoid duplicates)
      // 2. Hidden participants (observers should not be visible)
      const isCurrentUser = p.userId === currentUserIdString || p.id === `local_${currentUserIdString}`;
      const isHidden = p.isHidden === true;
      
      return !isCurrentUser && !isHidden;
    })
    .map((p) => {
      // Try to get stream with original key first, then try string-converted key as fallback
      let remoteStream = remoteStreams.get(p.id);
      let remoteParticipant = remoteParticipants.get(p.id);
      
      // Fallback: if not found, try with string conversion (handles type mismatches)
      if (!remoteStream) {
        const stringKey = String(p.id);
        remoteStream = remoteStreams.get(stringKey);
        remoteParticipant = remoteParticipants.get(stringKey);
      }
      
      // Check if tracks are actually enabled AND not muted (producer paused)
      const videoTrack = remoteStream?.video?.getTracks().find(t => t.kind === 'video');
      const audioTrack = remoteStream?.audio?.getTracks().find(t => t.kind === 'audio');
      
      // Get producer state from remoteParticipants map if available
      const remoteParticipantState = remoteParticipant || {};
      
      return {
        ...p,
        isLocal: false,
        name: p.displayName || p.name || `Participant ${p.id ? p.id.slice(-4) : 'Unknown'}`,
        role: p.role || p.metadata?.role || 'member', // Include role from participant data
        // Prioritize screen share stream over camera video
        // When screen sharing: show screen share
        // When not screen sharing: show camera video
        stream: remoteStream?.screenShare || remoteStream?.video || null,
        audioStream: remoteStream?.audio || null,
        // Use producer state from remoteParticipants if available, otherwise fall back to track state
        // This ensures we respect the producer pause/resume state from the server
        isVideoEnabled: remoteParticipantState.isVideoEnabled !== undefined 
          ? remoteParticipantState.isVideoEnabled 
          : !!(remoteStream?.video && videoTrack?.enabled && !videoTrack?.muted),
        isAudioEnabled: remoteParticipantState.isAudioEnabled !== undefined 
          ? remoteParticipantState.isAudioEnabled 
          : !!(remoteStream?.audio && audioTrack?.enabled && !audioTrack?.muted),
        // Check if this participant is screen sharing
        isScreenSharing: screenSharingParticipants?.has(p.id) || remoteParticipantState.isScreenSharing || false,
        // Add a flag to indicate if we're still waiting for the stream
        hasStream: !!remoteStream,
      }
    }), [participants, currentUserId, remoteStreams, remoteParticipants, screenSharingParticipants]);

  // Memoize all participants to prevent unnecessary recalculations
  const allParticipants = useMemo(() => {
    return [localParticipant, ...filteredRemoteParticipants].filter(p => p !== null);
  }, [localParticipant, filteredRemoteParticipants]);
  
  // Memoize visible and hidden participants
  const { visibleParticipants, hiddenParticipants, hasHiddenParticipants, shouldShowMoreButton } = useMemo(() => {
    const shouldShowMore = allParticipants.length > MAX_VISIBLE_PARTICIPANTS;
    const visible = shouldShowMore 
      ? allParticipants.slice(0, MAX_VISIBLE_PARTICIPANTS - 1)
      : allParticipants;
    const hidden = shouldShowMore 
      ? allParticipants.slice(MAX_VISIBLE_PARTICIPANTS - 1)
      : [];
    return {
      visibleParticipants: visible,
      hiddenParticipants: hidden,
      hasHiddenParticipants: hidden.length > 0,
      shouldShowMoreButton: shouldShowMore
    };
  }, [allParticipants]);

  // Debug logging - only log when actual values change, not on every render
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
    }
  }, [participants.length, currentUserId, remoteStreams.size, filteredRemoteParticipants.length, allParticipants.length, streamUpdateCounter, localParticipant?.id, isObserverMode]);

  const getGridClass = (count) => {
    const displayCount = Math.min(count, MAX_VISIBLE_PARTICIPANTS)
    
    // If there's a pinned participant, use spotlight layout
    if (pinnedParticipantId && displayCount > 1) {
      return "grid-cols-1"
    }
    
    // Single participant - full view
    if (displayCount === 1) return "grid-cols-1"
    
    // 2 participants - responsive stacking
    if (displayCount === 2) return "grid-cols-1 md:grid-cols-2 gap-3"
    
    // 3-4 participants - 2x2 grid
    if (displayCount <= 4) return "grid-cols-1 sm:grid-cols-2 gap-3"
    
    // 5-6 participants - 2x3 grid
    if (displayCount <= 6) return "grid-cols-2 md:grid-cols-3 gap-2"
    
    // 7-9 participants - 3x3 grid
    if (displayCount <= 9) return "grid-cols-2 sm:grid-cols-3 gap-2"
    
    // 10+ participants - 4 columns
    return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
  }

  const displayCount = useMemo(() => {
    return hasHiddenParticipants 
      ? visibleParticipants.length + 1  // +1 for the "more" button
      : allParticipants.length;
  }, [hasHiddenParticipants, visibleParticipants.length, allParticipants.length]);

  // Handle pin/spotlight mode
  const pinnedParticipant = pinnedParticipantId 
    ? allParticipants.find(p => p.id === pinnedParticipantId)
    : null
  
  const unpinnedParticipants = pinnedParticipant
    ? allParticipants.filter(p => p.id !== pinnedParticipantId)
    : []

  const handlePinParticipant = (participantId) => {
    setPinnedParticipantId(pinnedParticipantId === participantId ? null : participantId)
  }

  // Render in spotlight mode (pinned participant)
  if (pinnedParticipant && unpinnedParticipants.length > 0) {
    const unpinnedCount = unpinnedParticipants.length
    const maxVisible = 6
    const visibleParticipants = unpinnedParticipants.slice(0, maxVisible)
    const hasMore = unpinnedCount > maxVisible
    
    return (
      <div className="h-full w-full flex flex-col md:flex-row gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-3">
        {/* Main spotlight view */}
        <div className="flex-1 flex items-center justify-center min-h-0 w-full md:w-auto">
          <VideoTile
            participant={pinnedParticipant}
            isLocal={pinnedParticipant.isLocal}
            localVideoRef={pinnedParticipant.isLocal ? localVideoRef : null}
            participantCount={1}
            isPinned={true}
            onPin={() => handlePinParticipant(pinnedParticipant.id)}
            isActiveSpeaker={activeSpeakerId === pinnedParticipant.id}
          />
        </div>
        
        {/* Sidebar with other participants */}
        <div className="w-full md:w-56 lg:w-64 xl:w-56 h-auto md:h-full overflow-y-auto">
          {/* Desktop/Tablet grid layout - smaller compact tiles */}
          <div className="hidden md:flex flex-col gap-1.5 h-full">
            {visibleParticipants.map((participant) => (
              <div key={participant.id} className="flex-shrink-0 h-32 lg:h-36 xl:h-32 w-full relative">
                <VideoTile
                  participant={participant}
                  isLocal={participant.isLocal}
                  localVideoRef={null}
                  participantCount={unpinnedParticipants.length}
                  isCompact={true}
                  onPin={() => handlePinParticipant(participant.id)}
                  isActiveSpeaker={activeSpeakerId === participant.id}
                />
              </div>
            ))}
            {hasMore && (
              <Button
                variant="secondary"
                className="flex-shrink-0 h-32 lg:h-36 xl:h-32 bg-gray-800/90 hover:bg-gray-700 border border-gray-600"
                onClick={() => setShowAllParticipants(true)}
              >
                <div className="text-center">
                  <Users className="w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-1" />
                  <div className="text-[10px] lg:text-xs">+{unpinnedCount - maxVisible} more</div>
                </div>
              </Button>
            )}
          </div>
          
          {/* Mobile horizontal scroll layout */}
          <div className="flex md:hidden flex-row gap-1.5 overflow-x-auto pb-2">
            {visibleParticipants.map((participant) => (
              <div key={participant.id} className="flex-shrink-0 w-32 sm:w-36 aspect-[4/3]">
                <VideoTile
                  participant={participant}
                  isLocal={participant.isLocal}
                  localVideoRef={null}
                  participantCount={unpinnedParticipants.length}
                  isCompact={true}
                  onPin={() => handlePinParticipant(participant.id)}
                  isActiveSpeaker={activeSpeakerId === participant.id}
                />
              </div>
            ))}
            {hasMore && (
              <Button
                variant="secondary"
                className="flex-shrink-0 w-32 sm:w-36 aspect-[4/3] bg-gray-800/90 hover:bg-gray-700 border border-gray-600"
                onClick={() => setShowAllParticipants(true)}
              >
                <div className="text-center">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1" />
                  <div className="text-[10px] sm:text-xs">+{unpinnedCount - maxVisible} more</div>
                </div>
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex items-center justify-center p-3">
      <div className={`grid w-full h-full ${getGridClass(displayCount)}`} style={{ maxHeight: '100%' }}>
        {visibleParticipants.map((participant) => (
          <VideoTile
            key={participant.id}
            participant={participant}
            isLocal={participant.isLocal}
            localVideoRef={participant.isLocal ? localVideoRef : null}
            participantCount={visibleParticipants.length}
            onPin={() => handlePinParticipant(participant.id)}
            isActiveSpeaker={activeSpeakerId === participant.id}
          />
        ))}
        
        {hasHiddenParticipants && (
          <Dialog open={showAllParticipants} onOpenChange={setShowAllParticipants}>
            <DialogTrigger asChild>
              <Card className="relative aspect-video bg-gradient-to-br from-primary to-secondary overflow-hidden cursor-pointer hover:from-primary/90 hover:to-secondary/90 transition-all duration-200 flex items-center justify-center group border-2 border-primary/50">
                <div className="text-center text-white">
                  <Users className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold">
                    +{hiddenParticipants.length}
                  </div>
                  <div className="text-xs sm:text-sm md:text-base mt-1">
                    {hiddenParticipants.length === 1 ? 'More Participant' : 'More Participants'}
                  </div>
                </div>
              </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>All Participants ({allParticipants.length})</DialogTitle>
                <DialogDescription>
                  List of all participants in this video conference
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-[400px] w-full pr-4">
                <div className="space-y-2">
                  {allParticipants.map((participant) => (
                    <Card key={participant.id} className="p-3 hover:bg-accent transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary text-white font-semibold">
                            {participant.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {participant.name}
                              {participant.isLocal && <span className="text-primary text-sm ml-2">(You)</span>}
                            </span>
                            {participant.role === 'moderator' && (
                              <Badge className="text-[9px] px-1.5 py-0 bg-gradient-to-r from-amber-500 to-orange-500 border-0 flex items-center gap-0.5 flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                Teacher
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <div className={`flex items-center gap-1 text-xs ${participant.isAudioEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                              {participant.isAudioEnabled ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                            </div>
                            <div className={`flex items-center gap-1 text-xs ${participant.isVideoEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                              {participant.isVideoEnabled ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}

const VideoTile = function VideoTile({ 
  participant, 
  isLocal, 
  localVideoRef, 
  participantCount = 1, 
  isPinned = false, 
  isCompact = false,
  onPin,
  isActiveSpeaker = false
}) {
  const videoRef = useRef(null)
  const audioRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)
  const [volume, setVolume] = useState(100)

  // Dynamically adjust sizes based on participant count and mode
  const getAvatarSize = () => {
    if (isPinned) return "w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40"
    if (isCompact) return "w-12 h-12 sm:w-14 sm:h-14"
    if (participantCount === 1) return "w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36"
    if (participantCount === 2) return "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24"
    if (participantCount <= 4) return "w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20"
    if (participantCount <= 9) return "w-12 h-12 sm:w-14 sm:h-14"
    return "w-10 h-10 sm:w-12 sm:h-12"
  }

  const getAvatarTextSize = () => {
    if (isPinned) return "text-3xl sm:text-4xl md:text-5xl"
    if (isCompact) return "text-base sm:text-lg"
    if (participantCount === 1) return "text-2xl sm:text-3xl md:text-4xl"
    if (participantCount === 2) return "text-xl sm:text-2xl md:text-3xl"
    if (participantCount <= 4) return "text-lg sm:text-xl md:text-2xl"
    if (participantCount <= 9) return "text-sm sm:text-base md:text-lg"
    return "text-sm sm:text-base"
  }

  const getNameTextSize = () => {
    if (isPinned) return "text-sm sm:text-base md:text-lg"
    if (isCompact) return "text-[10px] sm:text-xs"
    if (participantCount <= 4) return "text-xs sm:text-sm"
    if (participantCount <= 9) return "text-[10px] sm:text-xs"
    return "text-[10px] sm:text-xs"
  }

  const getIconSize = () => {
    if (isPinned) return "w-4 h-4"
    if (isCompact) return "w-3 h-3"
    if (participantCount <= 4) return "w-3 h-3 sm:w-3.5 sm:h-3.5"
    return "w-2.5 h-2.5 sm:w-3 sm:h-3"
  }

  // Handle video stream - with track state monitoring
  useEffect(() => {
    // For local video in sidebar (when localVideoRef is null), use videoRef
    // For local video when pinned (when localVideoRef is provided), use localVideoRef
    // For remote video, always use videoRef
    const videoElement = isLocal && localVideoRef?.current
      ? localVideoRef.current
      : videoRef.current;
    

    if (videoElement && participant.stream) {
      
      videoElement.srcObject = participant.stream;
      
      // Force play for all streams to handle autoplay restrictions
      setTimeout(() => {
        if (videoElement && videoElement.srcObject) {
          videoElement.play().catch(err => {
            // Silently handle play errors
          });
        }
      }, isLocal ? 50 : 100);
    } else if (!participant.stream) {
      // Clear any existing srcObject to avoid showing stale video
      if (videoElement && videoElement.srcObject) {
        videoElement.srcObject = null;
      }

    }
  }, [participant.stream, participant.id, isLocal, localVideoRef, participant.name, participant.isVideoEnabled])

  // Handle audio stream separately (for remote participants only)
  useEffect(() => {
    if (isLocal) return; // Local audio is muted in the video element
    
    const audioElement = audioRef.current;
    

    if (audioElement && participant.audioStream) {
      
      audioElement.srcObject = participant.audioStream;
      
      // Ensure audio plays automatically
      audioElement.play().catch(e => {
      });
    } else if (!participant.audioStream) {
    } else if (!audioElement) {
    }
  }, [participant.audioStream, participant.id, isLocal, participant.name])

  // CRITICAL FIX: Use producer state from server for remote participants
  const hasVideo = participant.stream
  
  // Use participant.isVideoEnabled which now comes from producer state events
  // This ensures remote participants' video state is synchronized properly
  // ALSO check if screen sharing - show video stream even if camera is off
  const shouldShowVideo = (participant.isVideoEnabled || participant.isScreenSharing) && participant.stream
  
  // Debug logging for track state - only in development and only log changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !isLocal && participant.stream) {
      const videoTrack = participant.stream.getTracks().find(t => t.kind === 'video')
      if (videoTrack) {
      }
    }
  }, [participant.stream, participant.isVideoEnabled, shouldShowVideo, isLocal, participant.name]);

  return (
    <Card 
      className={`relative ${isCompact ? 'h-full w-full' : 'aspect-video'} bg-gray-900 overflow-hidden transition-all duration-200 min-h-0 w-full max-h-full group rounded-lg p-0
        ${isActiveSpeaker ? 'ring-2 ring-green-500' : ''}
        ${isPinned ? 'ring-2 ring-primary' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hidden audio element for remote participants */}
      {!isLocal && (
        <audio
          ref={audioRef}
          autoPlay
          playsInline
          className="hidden"
          volume={volume / 100}
        />
      )}
      
      {/* Render video element ONLY when should show video */}
      {shouldShowVideo && hasVideo && (
        <video
          ref={isLocal && localVideoRef ? localVideoRef : videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      
      {/* Show loading state ONLY if video is enabled but stream isn't ready yet (for remote participants) */}
      {participant.isVideoEnabled && !participant.stream && !isLocal && !participant.isScreenSharing && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50 z-10">
          <div className="text-center text-white">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-1" />
            <p className="text-[10px]">Loading...</p>
          </div>
        </div>
      )}
      
      {/* Show avatar placeholder when video is disabled or not available */}
      {(!participant.isVideoEnabled || !shouldShowVideo) && !(participant.isVideoEnabled && !participant.stream && !isLocal) && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 z-0">
          <Avatar className={`${getAvatarSize()}`}>
            <AvatarFallback className={`bg-gradient-to-br from-primary to-secondary text-white ${getAvatarTextSize()} font-semibold`}>
              {participant.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Top overlay - Pin button */}
      {onPin && !isCompact && (isHovered || isPinned) && (
        <div className="absolute top-2 right-2 z-10">
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 rounded-full transition-all duration-200 ${
              isPinned 
                ? 'bg-primary hover:bg-primary/90 text-white' 
                : 'bg-black/60 hover:bg-black/80 text-white'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              onPin()
            }}
            title={isPinned ? "Unpin participant" : "Pin participant"}
          >
            <Pin className={`w-3.5 h-3.5 transition-transform ${isPinned ? 'rotate-45' : ''}`} />
          </Button>
        </div>
      )}

      {/* Bottom overlay - Name and controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent transition-all duration-200 ${isCompact ? 'p-1 sm:p-1.5' : 'p-2'}`}>
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          {/* Name and local indicator */}
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <span className={`text-white ${getNameTextSize()} font-medium truncate`}>
              {participant.name}
            </span>
            {isLocal && !isCompact && (
              <Badge className={`text-[9px] px-1.5 py-0 bg-primary border-0`}>
                You
              </Badge>
            )}
            {participant.role === 'moderator' && !isCompact && (
              <Badge className={`text-[9px] px-1.5 py-0 bg-gradient-to-r from-amber-500 to-orange-500 border-0 flex items-center gap-0.5`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Teacher
              </Badge>
            )}
          </div>
          
          {/* Audio/Video indicators */}
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
            <div 
              className={`${isCompact ? 'p-0.5' : 'p-1'} rounded-full transition-colors ${
                participant.isAudioEnabled 
                  ? 'bg-white/20' 
                  : 'bg-red-500/80'
              }`}
              title={participant.isAudioEnabled ? "Microphone on" : "Microphone off"}
            >
              {participant.isAudioEnabled ? (
                <Mic className={`${getIconSize()} text-white`} />
              ) : (
                <MicOff className={`${getIconSize()} text-white`} />
              )}
            </div>
            <div 
              className={`${isCompact ? 'p-0.5' : 'p-1'} rounded-full transition-colors ${
                participant.isVideoEnabled 
                  ? 'bg-white/20' 
                  : 'bg-red-500/80'
              }`}
              title={participant.isVideoEnabled ? "Camera on" : "Camera off"}
            >
              {participant.isVideoEnabled ? (
                <Video className={`${getIconSize()} text-white`} />
              ) : (
                <VideoOff className={`${getIconSize()} text-white`} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active speaker indicator */}
      {isActiveSpeaker && !isCompact && (
        <div className="absolute top-2 left-2">
          <Badge className="bg-green-500 text-white text-xs px-2 py-0.5">
            Speaking
          </Badge>
        </div>
      )}

      {/* Screen sharing indicator */}
      {participant.isScreenSharing && !isCompact && (
        <div className={`absolute ${isActiveSpeaker ? 'top-10' : 'top-2'} left-2 z-10`}>
          <Badge className="bg-primary text-white text-xs px-2 py-0.5 flex items-center gap-1">
            <Monitor className="w-3 h-3" />
            Sharing Screen
          </Badge>
        </div>
      )}

      {/* Loading state */}
      {!participant.hasStream && !isLocal && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="text-center text-white">
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Connecting...</p>
          </div>
        </div>
      )}
    </Card>
  )
}

