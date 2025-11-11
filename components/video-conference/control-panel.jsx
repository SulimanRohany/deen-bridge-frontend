"use client"

import { Button } from "@/components/ui/button"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  Users,
  Copy,
  Check,
  Monitor,
  MonitorOff,
  MessageCircle,
  Maximize,
  Info,
  Calendar,
  SignalHigh,
  Signal,
  SignalMedium,
  SignalLow,
  Wifi,
  MoreVertical,
} from "lucide-react"
import { useState, useEffect } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ControlPanel({
  isVideoEnabled,
  isAudioEnabled,
  onToggleVideo,
  onToggleAudio,
  onLeaveCall,
  participantCount,
  roomId,
  onToggleScreenShare,
  isScreenSharing,
  isScreenShareSupported,
  onToggleChat,
  onToggleFullscreen,
  sessionData,
  formatDuration,
  participants,
  remoteParticipants,
  screenSharingParticipants,
  currentUserId,
  getConnectionStats,
  unreadMessageCount = 0,
  userRole = 'member',
  isObserverMode = false,
}) {
  const [copied, setCopied] = useState(false)
  const [isSessionInfoOpen, setIsSessionInfoOpen] = useState(false)
  const [connectionQuality, setConnectionQuality] = useState({
    quality: 'good',
    bandwidth: { upload: 0, download: 0 },
    latency: 0,
    packetLoss: 0,
  })

  // Fetch connection stats
  useEffect(() => {
    if (!getConnectionStats) return;

    const fetchStats = async () => {
      try {
        const stats = await getConnectionStats();
        if (stats) {
          setConnectionQuality(stats);
        }
      } catch (error) {
        console.error('Error fetching connection stats:', error);
      }
    };

    // Fetch immediately
    fetchStats();

    // Then fetch every 2 seconds
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, [getConnectionStats]);

  // Helper to get signal icon and color based on quality
  const getSignalDisplay = () => {
    switch (connectionQuality.quality) {
      case 'excellent':
        return { icon: SignalHigh, color: 'text-green-400', bgColor: 'bg-green-500/10', label: 'Excellent' };
      case 'good':
        return { icon: Signal, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', label: 'Good' };
      case 'fair':
        return { icon: SignalMedium, color: 'text-orange-400', bgColor: 'bg-orange-500/10', label: 'Fair' };
      case 'poor':
        return { icon: SignalLow, color: 'text-red-400', bgColor: 'bg-red-500/10', label: 'Poor' };
      default:
        return { icon: Wifi, color: 'text-gray-400', bgColor: 'bg-gray-500/10', label: 'Unknown' };
    }
  };

  const signalDisplay = getSignalDisplay();
  const SignalIcon = signalDisplay.icon;

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy room ID:", error)
    }
  }

  return (
    <div className="bg-gradient-to-t from-gray-900 via-gray-850 to-gray-800 border-t border-gray-700/50 backdrop-blur-xl p-3 md:p-4 shadow-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Connection Quality Indicator - Left Side */}
        {getConnectionStats && (
          <div className="flex-shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${signalDisplay.bgColor} cursor-help transition-all hover:scale-105`}>
                    <SignalIcon className={`w-4 h-4 ${signalDisplay.color}`} />
                    <div className="flex flex-col">
                      <span className={`text-xs font-semibold ${signalDisplay.color}`}>
                        {signalDisplay.label}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {connectionQuality.latency ? `${connectionQuality.latency}ms` : '--'}
                      </span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-gray-900 border-gray-700 text-white p-3">
                  <div className="space-y-1.5 text-xs">
                    <div className="font-semibold text-gray-300 mb-2 flex items-center gap-1.5">
                      <SignalIcon className={`w-3.5 h-3.5 ${signalDisplay.color}`} />
                      Connection Quality
                    </div>
                    <div className="flex justify-between gap-6">
                      <span className="text-gray-400">Upload:</span>
                      <span className="font-medium text-green-400">{connectionQuality.bandwidth.upload || 0} kbps</span>
                    </div>
                    <div className="flex justify-between gap-6">
                      <span className="text-gray-400">Download:</span>
                      <span className="font-medium text-primary">{connectionQuality.bandwidth.download || 0} kbps</span>
                    </div>
                    <div className="flex justify-between gap-6">
                      <span className="text-gray-400">Latency:</span>
                      <span className="font-medium text-yellow-400">{connectionQuality.latency || 0} ms</span>
                    </div>
                    <div className="flex justify-between gap-6">
                      <span className="text-gray-400">Packet Loss:</span>
                      <span className="font-medium text-orange-400">
                        {connectionQuality.packetLoss ? connectionQuality.packetLoss.toFixed(1) : '0.0'}%
                      </span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Control buttons - Center */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-center">
          {/* Hide camera/mic/screen share buttons in observer mode */}
          {!isObserverMode && (
            <>
              <Button
                variant={isAudioEnabled ? "secondary" : "destructive"}
                size="lg"
                onClick={onToggleAudio}
                className={`rounded-full w-11 h-11 sm:w-12 sm:h-12 p-0 transition-opacity duration-200 hover:opacity-70 shadow-lg ${
                  isAudioEnabled
                    ? "bg-gray-700/90 text-white border border-gray-600"
                    : "bg-red-600/90 text-white animate-pulse border border-red-500"
                }`}
                title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
              >
                {isAudioEnabled ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />}
              </Button>

              <Button
                variant={isVideoEnabled ? "secondary" : "destructive"}
                size="lg"
                onClick={onToggleVideo}
                className={`rounded-full w-11 h-11 sm:w-12 sm:h-12 p-0 transition-opacity duration-200 hover:opacity-70 shadow-lg ${
                  isVideoEnabled
                    ? "bg-gray-700/90 text-white border border-gray-600"
                    : "bg-red-600/90 text-white animate-pulse border border-red-500"
                }`}
                title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
              >
                {isVideoEnabled ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />}
              </Button>

              <Button
                variant={isScreenSharing ? "default" : "secondary"}
                size="lg"
                onClick={onToggleScreenShare}
                disabled={!isScreenShareSupported}
                className={`rounded-full w-11 h-11 sm:w-12 sm:h-12 p-0 transition-opacity duration-200 hover:opacity-70 shadow-lg ${
                  !isScreenShareSupported
                    ? "bg-gray-700/50 text-gray-500 cursor-not-allowed opacity-50"
                    : isScreenSharing
                      ? "bg-primary/90 text-white border border-primary"
                      : "bg-gray-700/90 text-white border border-gray-600"
                }`}
            title={
              !isScreenShareSupported
                ? "Screen sharing not available in this environment"
                : isScreenSharing
                  ? "Stop screen share"
                  : "Share screen"
            }
          >
            {isScreenSharing ? <MonitorOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />}
          </Button>
            </>
          )}

          <div className="w-px h-8 bg-gray-700 mx-1 hidden sm:block" />

          <Button
            variant="secondary"
            size="lg"
            onClick={onToggleChat}
            className="relative rounded-full w-11 h-11 sm:w-12 sm:h-12 p-0 bg-gray-700/90 text-white transition-opacity duration-200 hover:opacity-70 shadow-lg border border-gray-600"
            title="Toggle chat"
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadMessageCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-600 text-white text-xs font-bold rounded-full border-2 border-gray-900 shadow-lg animate-pulse">
                {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
              </span>
            )}
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => setIsSessionInfoOpen(true)}
            className="rounded-full w-11 h-11 sm:w-12 sm:h-12 p-0 bg-gray-700/90 text-white transition-opacity duration-200 hover:opacity-70 shadow-lg border border-gray-600 hidden md:flex"
            title="Session information"
          >
            <Info className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={onToggleFullscreen}
            className="rounded-full w-11 h-11 sm:w-12 sm:h-12 p-0 bg-gray-700/90 text-white transition-opacity duration-200 hover:opacity-70 shadow-lg border border-gray-600 hidden lg:flex"
            title="Toggle fullscreen"
          >
            <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          {/* More Menu - Shows on smaller screens to provide access to hidden features */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="lg"
                className="rounded-full w-11 h-11 sm:w-12 sm:h-12 p-0 bg-gray-700/90 text-white transition-opacity duration-200 hover:opacity-70 shadow-lg border border-gray-600 lg:hidden"
                title="More options"
              >
                <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              side="top"
              className="bg-gray-800 border-gray-700 text-white min-w-[200px]"
            >
              <DropdownMenuItem 
                onClick={() => setIsSessionInfoOpen(true)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-700 focus:bg-gray-700 md:hidden"
              >
                <Info className="w-4 h-4" />
                <span>Session Information</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onToggleFullscreen}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-700 focus:bg-gray-700"
              >
                <Maximize className="w-4 h-4" />
                <span>Toggle Fullscreen</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-8 bg-gray-700 mx-1 hidden sm:block" />

          <Button
            variant="destructive"
            size="lg"
            onClick={onLeaveCall}
            className="rounded-full w-11 h-11 sm:w-12 sm:h-12 p-0 bg-red-600/90 transition-opacity duration-200 hover:opacity-70 shadow-lg border border-red-500"
            title="Leave call"
          >
            <Phone className="w-4 h-4 sm:w-5 sm:h-5 rotate-[135deg]" />
          </Button>
        </div>

        {/* Spacer for balanced layout */}
        <div className="flex-shrink-0 w-24"></div>
      </div>

      {/* Session Info Sheet */}
      <Sheet open={isSessionInfoOpen} onOpenChange={setIsSessionInfoOpen}>
        <SheetContent className="bg-gray-800 border-gray-700 text-white w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white flex items-center gap-2">
              <Info className="w-5 h-5" />
              Session Information
            </SheetTitle>
            <SheetDescription className="text-gray-400">
              View details about the current session, participants, and timing
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 mx-4 my-4 space-y-4">
            {/* Session Timing */}
            {sessionData?.joinTime && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Session Timing</h3>
                <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Started:
                    </span>
                    <span className="text-white font-medium">
                      {new Date(sessionData.joinTime).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Duration:</span>
                    <span className="text-green-400 font-medium">
                      {formatDuration ? formatDuration(sessionData.duration) : `${sessionData.duration}s`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Current Participants with Mic/Camera Status */}
            {participants && participants.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Active Participants ({participants.length + 1})</h3>
                <div className="bg-gray-900 rounded-lg divide-y divide-gray-800">
                  {/* Current User */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-white font-medium">You</span>
                        {userRole === 'moderator' && (
                          <Badge className="text-[9px] px-1.5 py-0 bg-gradient-to-r from-amber-500 to-orange-500 border-0 flex items-center gap-0.5 flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Teacher
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={`p-1.5 rounded-full ${isAudioEnabled ? 'bg-green-600' : 'bg-red-600'}`}>
                        {isAudioEnabled ? (
                          <Mic className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <MicOff className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <div className={`p-1.5 rounded-full ${isVideoEnabled ? 'bg-green-600' : 'bg-red-600'}`}>
                        {isVideoEnabled ? (
                          <Video className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <VideoOff className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      {/* Screen Sharing Indicator for Local User */}
                      {screenSharingParticipants?.has(`local_${currentUserId}`) && (
                        <div className="p-1.5 rounded-full bg-primary" title="Sharing Screen">
                          <Monitor className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Remote Participants */}
                  {participants.map((participant) => {
                    const participantData = remoteParticipants?.get(participant.id) || participant;
                    const participantAudio = participantData.isAudioEnabled ?? false;
                    const participantVideo = participantData.isVideoEnabled ?? false;
                    const participantScreenSharing = screenSharingParticipants?.has(participant.id) || participantData.isScreenSharing || false;
                    const participantRole = participant.role || participant.metadata?.role || participantData.role || 'member';
                    
                    return (
                      <div key={participant.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-white font-medium truncate">{participant.displayName || participant.name}</span>
                            {participantRole === 'moderator' && (
                              <Badge className="text-[9px] px-1.5 py-0 bg-gradient-to-r from-amber-500 to-orange-500 border-0 flex items-center gap-0.5 flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                Teacher
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className={`p-1.5 rounded-full ${participantAudio ? 'bg-green-600' : 'bg-red-600'}`}>
                            {participantAudio ? (
                              <Mic className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <MicOff className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>
                          <div className={`p-1.5 rounded-full ${participantVideo ? 'bg-green-600' : 'bg-red-600'}`}>
                            {participantVideo ? (
                              <Video className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <VideoOff className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>
                          {/* Screen Sharing Indicator for Remote Participants */}
                          {participantScreenSharing && (
                            <div className="p-1.5 rounded-full bg-primary" title="Sharing Screen">
                              <Monitor className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Participant History - Left Participants */}
            {sessionData?.participantHistory && sessionData.participantHistory.filter(p => p.leaveTime).length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Previously in Call</h3>
                <div className="bg-gray-900 rounded-lg divide-y divide-gray-800">
                  {sessionData.participantHistory.filter(p => p.leaveTime).map((participant) => (
                    <div key={participant.id} className="p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 font-medium">{participant.name}</span>
                        <span className="text-gray-400 text-sm">
                          {formatDuration ? formatDuration(participant.duration) : `${participant.duration}s`}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(participant.joinTime).toLocaleTimeString()} - {new Date(participant.leaveTime).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No participants yet */}
            {(!participants || participants.length === 0) && (
              <div className="bg-gray-900 rounded-lg p-6 text-center">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Waiting for participants to join...</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function CallTimer() {
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return <span>{formatTime(duration)}</span>
}
