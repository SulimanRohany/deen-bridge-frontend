
"use client"

import React, { useEffect, useRef, useState } from "react"
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
  
  console.log('🔄 VideoGrid re-render triggered, streamUpdateCounter:', streamUpdateCounter)

  // Create local participant object (only if not in observer mode)
  const localParticipantId = `local_${currentUserId}`;
  const localParticipant = !isObserverMode ? {
    id: localParticipantId,
    userId: currentUserId,
    stream: localStream,
    isLocal: true,
    name: "You",
    role: userRole, // Add role for local participant
    isVideoEnabled: isVideoEnabled,
    isAudioEnabled: isAudioEnabled,
    isScreenSharing: screenSharingParticipants?.has(localParticipantId) || false,
  } : null

  // Filter remote participants to exclude current user, hidden participants, and map them properly
  const filteredRemoteParticipants = participants
    .filter((p) => {
      // Safety check: ensure currentUserId is defined
      if (!currentUserId) {
        console.warn('currentUserId is undefined in VideoGrid, cannot filter participants properly');
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
      
      console.log(`🔍 Mapping participant ${p.displayName || p.name}:`, {
        participantId: p.id,
        participantIdType: typeof p.id,
        hasStreamInMap: remoteStreams.has(p.id),
        hasStreamInMapAsString: remoteStreams.has(String(p.id)),
        remoteStream: remoteStream,
        hasVideo: !!remoteStream?.video,
        hasAudio: !!remoteStream?.audio,
        hasScreenShare: !!remoteStream?.screenShare,
        allStreamKeys: Array.from(remoteStreams.keys()),
        streamKeysTypes: Array.from(remoteStreams.keys()).map(k => typeof k)
      });
      
      // Check if tracks are actually enabled AND not muted (producer paused)
      const videoTrack = remoteStream?.video?.getTracks().find(t => t.kind === 'video');
      const audioTrack = remoteStream?.audio?.getTracks().find(t => t.kind === 'audio');
      
      console.log(`🎯 Track state for ${p.displayName || p.name}:`, {
        hasVideoStream: !!remoteStream?.video,
        hasAudioStream: !!remoteStream?.audio,
        videoTrack: videoTrack ? {
          id: videoTrack.id,
          enabled: videoTrack.enabled,
          muted: videoTrack.muted,
          readyState: videoTrack.readyState
        } : null,
        audioTrack: audioTrack ? {
          id: audioTrack.id,
          enabled: audioTrack.enabled,
          muted: audioTrack.muted,
          readyState: audioTrack.readyState
        } : null
      });
      
      // Get producer state from remoteParticipants map if available
      const remoteParticipantState = remoteParticipant || {};
      
      console.log(`📊 Remote participant state for ${p.displayName || p.name}:`, {
        hasRemoteParticipantState: !!remoteParticipant,
        isVideoEnabledFromState: remoteParticipantState.isVideoEnabled,
        isAudioEnabledFromState: remoteParticipantState.isAudioEnabled
      });
      
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
    })

  // Combine local and remote participants (filter out null local participant in observer mode)
  const allParticipants = [localParticipant, ...filteredRemoteParticipants].filter(p => p !== null)
  
  // Split participants into visible and hidden
  // If more than MAX_VISIBLE_PARTICIPANTS, show MAX_VISIBLE_PARTICIPANTS-1 participants + "more" button
  const shouldShowMoreButton = allParticipants.length > MAX_VISIBLE_PARTICIPANTS
  const visibleParticipants = shouldShowMoreButton 
    ? allParticipants.slice(0, MAX_VISIBLE_PARTICIPANTS - 1)
    : allParticipants
  const hiddenParticipants = shouldShowMoreButton 
    ? allParticipants.slice(MAX_VISIBLE_PARTICIPANTS - 1)
    : []
  const hasHiddenParticipants = hiddenParticipants.length > 0

  console.log('👥 All participants to render:', {
    totalCount: allParticipants.length,
    visibleCount: visibleParticipants.length,
    hiddenCount: hiddenParticipants.length,
    participants: allParticipants.map(p => ({
      id: p.id,
      name: p.name,
      isLocal: p.isLocal,
      hasStream: !!p.stream
    }))
  });

  // Debug logging
  useEffect(() => {
    console.log('📺 VideoGrid rendering:', {
      currentUserId,
      localParticipantId: localParticipant?.id,
      localParticipantUserId: localParticipant?.userId,
      isObserverMode,
      localStream: !!localStream,
      totalParticipants: participants.length,
      participantsFromProps: participants.map(p => ({ 
        id: p.id, 
        userId: p.userId, 
        name: p.displayName || p.name 
      })),
      remoteStreamsMapSize: remoteStreams.size,
      remoteStreamsEntries: Array.from(remoteStreams.entries()).map(([id, streams]) => ({
        participantId: id,
        hasAudio: !!streams?.audio,
        hasVideo: !!streams?.video,
        audioTracks: streams?.audio?.getTracks().length || 0,
        videoTracks: streams?.video?.getTracks().length || 0
      })),
      filteredRemoteCount: filteredRemoteParticipants.length,
      filteredRemote: filteredRemoteParticipants.map(p => ({ 
        id: p.id, 
        userId: p.userId, 
        name: p.name,
        hasStream: !!p.stream,
        stream: p.stream,
        audioStream: p.audioStream
      })),
      totalRendered: allParticipants.length,
      allRendered: allParticipants.map(p => ({ 
        id: p.id, 
        userId: p.userId, 
        name: p.name,
        isLocal: p.isLocal,
        hasStream: !!p.stream,
        isVideoEnabled: p.isVideoEnabled
      }))
    });
  }, [participants, currentUserId, filteredRemoteParticipants.length, remoteStreams]);

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

  const displayCount = hasHiddenParticipants 
    ? visibleParticipants.length + 1  // +1 for the "more" button
    : allParticipants.length

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
    return (
      <div className="h-full w-full flex flex-col lg:flex-row gap-3 p-3">
        {/* Main spotlight view */}
        <div className="flex-1 flex items-center justify-center min-h-0">
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
        <div className="w-full lg:w-72 h-auto lg:h-full overflow-y-auto">
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {unpinnedParticipants.slice(0, 6).map((participant) => (
              <div key={participant.id} className="flex-shrink-0 w-40 lg:w-full lg:aspect-video">
                <VideoTile
                  participant={participant}
                  isLocal={participant.isLocal}
                  localVideoRef={participant.isLocal ? localVideoRef : null}
                  participantCount={unpinnedParticipants.length}
                  isCompact={true}
                  onPin={() => handlePinParticipant(participant.id)}
                  isActiveSpeaker={activeSpeakerId === participant.id}
                />
              </div>
            ))}
            {unpinnedParticipants.length > 6 && (
              <Button
                variant="secondary"
                className="flex-shrink-0 w-40 lg:w-full aspect-video bg-gray-800/90 hover:bg-gray-700 border border-gray-600"
                onClick={() => setShowAllParticipants(true)}
              >
                <div className="text-center">
                  <Users className="w-6 h-6 mx-auto mb-1" />
                  <div className="text-xs">+{unpinnedParticipants.length - 6} more</div>
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
    const videoElement = isLocal ? localVideoRef?.current : videoRef.current;
    
    console.log(`🎬 VideoTile useEffect for ${participant.name}:`, {
      participantId: participant.id,
      isLocal,
      hasStream: !!participant.stream,
      streamId: participant.stream?.id,
      streamActive: participant.stream?.active,
      streamTracks: participant.stream?.getTracks().length || 0,
      hasVideoElement: !!videoElement,
      videoElementId: videoElement?.id,
      isVideoEnabled: participant.isVideoEnabled
    });

    if (videoElement && participant.stream) {
      console.log(`✅ Setting ${isLocal ? 'local' : 'remote'} video stream for ${participant.name}:`, {
        participantId: participant.id,
        streamId: participant.stream.id,
        streamActive: participant.stream.active,
        tracks: participant.stream.getTracks().map(t => ({ 
          kind: t.kind, 
          enabled: t.enabled, 
          readyState: t.readyState,
          muted: t.muted 
        }))
      });
      
      videoElement.srcObject = participant.stream;
      
      // Force play for remote streams to handle autoplay restrictions
      if (!isLocal) {
        videoElement.play().catch(err => {
          console.warn(`⚠️ Failed to autoplay video for ${participant.name}:`, err.message);
        });
      }
    } else if (!isLocal && !participant.stream) {
      // For remote participants without a stream yet, this is normal during initial join
      // Don't log as an error, just as info
      console.log(`ℹ️ No video stream available yet for ${participant.name} (this is normal during initial join):`, {
        participantId: participant.id,
        hasVideoElement: !!videoElement,
        isVideoEnabled: participant.isVideoEnabled
      });
      
      // Clear any existing srcObject to avoid showing stale video
      if (videoElement && videoElement.srcObject) {
        videoElement.srcObject = null;
      }
    } else if (isLocal && !participant.stream) {
      // For local participant, this might happen during cleanup/unmount
      // Log as warning instead of error
      console.warn(`⚠️ Local participant missing stream (may be during cleanup):`, {
        participantId: participant.id,
        hasVideoElement: !!videoElement
      });
      
      // Clear srcObject to avoid showing stale video
      if (videoElement && videoElement.srcObject) {
        videoElement.srcObject = null;
      }
    }
  }, [participant.stream, participant.id, isLocal, localVideoRef, participant.name, participant.isVideoEnabled])

  // Handle audio stream separately (for remote participants only)
  useEffect(() => {
    if (isLocal) return; // Local audio is muted in the video element
    
    const audioElement = audioRef.current;
    
    console.log(`🔊 AudioTile useEffect for ${participant.name}:`, {
      participantId: participant.id,
      hasAudioStream: !!participant.audioStream,
      audioStreamId: participant.audioStream?.id,
      audioStreamActive: participant.audioStream?.active,
      audioTracks: participant.audioStream?.getTracks().length || 0,
      hasAudioElement: !!audioElement
    });

    if (audioElement && participant.audioStream) {
      console.log(`✅ Setting audio stream for ${participant.name}:`, {
        participantId: participant.id,
        streamId: participant.audioStream.id,
        streamActive: participant.audioStream.active,
        tracks: participant.audioStream.getTracks().map(t => ({ 
          kind: t.kind, 
          enabled: t.enabled, 
          readyState: t.readyState,
          muted: t.muted 
        }))
      });
      
      audioElement.srcObject = participant.audioStream;
      
      // Ensure audio plays automatically
      audioElement.play().catch(e => {
        console.error(`❌ Failed to auto-play audio for ${participant.name}:`, e.message);
      });
    } else if (!participant.audioStream) {
      console.log(`ℹ️ No audio stream for ${participant.name}`);
    } else if (!audioElement) {
      console.error(`❌ No audio element for ${participant.name}`);
    }
  }, [participant.audioStream, participant.id, isLocal, participant.name])

  // CRITICAL FIX: Use producer state from server for remote participants
  const hasVideo = participant.stream
  
  // Use participant.isVideoEnabled which now comes from producer state events
  // This ensures remote participants' video state is synchronized properly
  // ALSO check if screen sharing - show video stream even if camera is off
  const shouldShowVideo = (participant.isVideoEnabled || participant.isScreenSharing) && participant.stream
  
  // Debug logging for track state
  if (!isLocal && participant.stream) {
    const videoTrack = participant.stream.getTracks().find(t => t.kind === 'video')
    if (videoTrack) {
      console.log(`🔍 Track check for ${participant.name}:`, {
        trackEnabled: videoTrack.enabled,
        trackMuted: videoTrack.muted,
        participantIsVideoEnabled: participant.isVideoEnabled,
        willShowVideo: shouldShowVideo
      })
    }
  }

  console.log(`📺 VideoTile RENDER for ${participant.name}:`, {
    participantId: participant.id,
    isLocal,
    hasVideo,
    shouldShowVideo,
    isVideoEnabled: participant.isVideoEnabled,
    WILL_SHOW_AVATAR: !shouldShowVideo,
    isAudioEnabled: participant.isAudioEnabled,
    hasStream: !!participant.stream,
    streamDetails: participant.stream ? {
      id: participant.stream.id,
      active: participant.stream.active,
      tracks: participant.stream.getTracks().map(t => ({
        kind: t.kind,
        enabled: t.enabled,
        readyState: t.readyState,
        muted: t.muted  // ← Important for debugging
      }))
    } : null,
    willRenderVideoElement: hasVideo,
    willShowVideo: shouldShowVideo,
    willShowAvatar: !shouldShowVideo
  });

  return (
    <Card 
      className={`relative aspect-video bg-gray-900 overflow-hidden transition-all duration-200 min-h-0 w-full max-h-full group rounded-lg
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
          ref={isLocal ? localVideoRef : videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      )}
      
      {/* Show avatar if video should NOT be shown */}
      {!shouldShowVideo && (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
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
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 transition-all duration-200">
        <div className="flex items-center justify-between gap-2">
          {/* Name and local indicator */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className={`text-white ${getNameTextSize()} font-medium truncate`}>
              {participant.name}
            </span>
            {isLocal && (
              <Badge className={`${isCompact ? 'text-[8px] px-1 py-0' : 'text-[9px] px-1.5 py-0'} bg-primary border-0`}>
                You
              </Badge>
            )}
            {participant.role === 'moderator' && (
              <Badge className={`${isCompact ? 'text-[8px] px-1 py-0' : 'text-[9px] px-1.5 py-0'} bg-gradient-to-r from-amber-500 to-orange-500 border-0 flex items-center gap-0.5`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`${isCompact ? 'h-2 w-2' : 'h-2.5 w-2.5'}`} viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Teacher
              </Badge>
            )}
          </div>
          
          {/* Audio/Video indicators */}
          <div className="flex items-center gap-1 flex-shrink-0">
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
      {isActiveSpeaker && (
        <div className="absolute top-2 left-2">
          <Badge className="bg-green-500 text-white text-xs px-2 py-0.5">
            Speaking
          </Badge>
        </div>
      )}

      {/* Screen sharing indicator */}
      {participant.isScreenSharing && (
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
