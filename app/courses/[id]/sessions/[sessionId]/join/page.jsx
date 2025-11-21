"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { VideoGrid } from "@/components/video-conference/video-grid"
import { ControlPanel } from "@/components/video-conference/control-panel"
import { ChatPanel } from "@/components/video-conference/chat-panel"
import { useSessionTracking } from "@/hooks/use-session-tracking"
import { useSFU } from "@/hooks/use-sfu"
import { useAuth } from "@/hooks/use-auth"

import { useParams, useRouter } from "next/navigation"
import { config } from "@/lib/config"

export default function VideoConference() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId
  const courseId = params.id
  const { userData } = useAuth()
  const [isInCall, setIsInCall] = useState(false)
  const [roomId, setRoomId] = useState(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const isJoiningRef = useRef(false)
  const isLeavingRef = useRef(false) // Flag to prevent rejoining when leaving
  const [error, setError] = useState(null)
  const hasConnectedRef = useRef(false)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const chatRef = useRef(null)
  const [userRole, setUserRole] = useState('member') // Track user role (member or moderator)
  const [isObserverMode, setIsObserverMode] = useState(false) // Track if user is in observer mode (super admin monitoring)
  
  // Check if screen sharing is supported
  const isScreenShareSupported = navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia

  // Setup media stream
  const sessionTracking = useSessionTracking(roomId || sessionId)
  
  // SFU hook for video conferencing
  const {
    localStream,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    remoteStreams,
    remoteParticipants,
    screenSharingParticipants,
    participants,
    streamUpdateCounter,
    joinRoom,
    leaveRoom,
    isConnected,
    isInRoom,
    isConnecting,
    startMedia,
    stopMedia,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    connect,
    getConnectionStats,
  } = useSFU({
    autoConnect: false,
    onError: (error) => {
      console.error('SFU Error:', error);
      setError(error.message);
    }
  })

  // Connect to SFU when component mounts (only once)
  useEffect(() => {
    if (!isConnected && !isConnecting && !hasConnectedRef.current) {
      hasConnectedRef.current = true;
      console.log('Connecting to SFU...');
      connect();
    }
  }, []); // Empty dependency array to run only once

  // Refs to track latest values without causing re-renders
  const isInRoomRef = useRef(isInRoom)
  const isInCallRef = useRef(isInCall)
  const roomIdRef = useRef(roomId)
  const leaveRoomRef = useRef(leaveRoom)
  const sessionTrackingRef = useRef(sessionTracking)

  // Update refs when values change
  useEffect(() => {
    isInRoomRef.current = isInRoom
    isInCallRef.current = isInCall
    roomIdRef.current = roomId
    leaveRoomRef.current = leaveRoom
    sessionTrackingRef.current = sessionTracking
  }, [isInRoom, isInCall, roomId, leaveRoom, sessionTracking])

  // Cleanup when navigating away or closing the page
  // Only run this effect once on mount, use refs for latest values
  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      // This handles browser tab/window close or refresh
      // Use refs to get latest values
      if (isInRoomRef.current || isInCallRef.current) {
        console.log('⚠️ Page is unloading, cleaning up session...');
        
        // Use synchronous cleanup for beforeunload
        // Send beacon to ensure server gets the leave message
        const authTokens = localStorage.getItem('authTokens');
        if (authTokens && roomIdRef.current) {
          const tokens = JSON.parse(authTokens);
          // Use sendBeacon for reliable delivery during page unload
          const blob = new Blob([JSON.stringify({ action: 'leave' })], { type: 'application/json' });
          navigator.sendBeacon(
            config.API_BASE_URL + `course/session/${sessionId}/leave/`,
            blob
          );
        }
        
        // Attempt cleanup (may not complete before unload)
        try {
          if (leaveRoomRef.current) leaveRoomRef.current();
          if (sessionTrackingRef.current?.endSession) sessionTrackingRef.current.endSession();
        } catch (err) {
          console.error('Error in beforeunload cleanup:', err);
        }
      }
    };

    // Add beforeunload listener
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function for component unmount (navigation within app)
    return () => {
      console.log('🧹 Session page unmounting - cleaning up...');
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Set leaving flag to prevent any rejoin attempts during cleanup
      isLeavingRef.current = true
      isJoiningRef.current = false
      
      // Use refs to get latest values
      // If we're in a call/room when unmounting, clean up
      if (isInRoomRef.current || isInCallRef.current) {
        console.log('🚪 User navigating away from session, leaving room...');
        
        // Call async cleanup but don't wait
        (async () => {
          try {
            if (leaveRoomRef.current) await leaveRoomRef.current();
            if (sessionTrackingRef.current?.endSession) sessionTrackingRef.current.endSession();
          } catch (err) {
            console.error('Error during unmount cleanup:', err);
          }
        })();
      }
    };
  }, [sessionId]) // Only sessionId in dependencies - effect runs once on mount

  // Debug logging
  useEffect(() => {
    console.log('Video Conference State:', {
      isInCall,
      isInRoom,
      isConnected,
      isConnecting,
      participantsCount: participants.length,
      participants: participants.map(p => ({ id: p.id, name: p.name })),
      remoteStreamsCount: remoteStreams.size,
      localStream: !!localStream,
    })
  }, [isInCall, isInRoom, isConnected, isConnecting, participants, localStream, remoteStreams])


  // Join session after SFU is connected
  useEffect(() => {
    const joinSession = async () => {
      // Don't rejoin if we're leaving or already joining
      if (sessionId && isConnected && !isInRoom && !isJoiningRef.current && !isLeavingRef.current) {
        isJoiningRef.current = true
        try {
          console.log('Attempting to join session:', { 
            sessionId, 
            sessionIdType: typeof sessionId,
            userData: userData?.id,
            userDataKeys: userData ? Object.keys(userData) : 'null'
          })
          
          // Check if user is authenticated
          if (!userData?.id) {
            throw new Error('User not authenticated. Please log in again.')
          }
          
          // Call the backend session join API
          const authTokens = localStorage.getItem('authTokens')
          if (!authTokens) {
            throw new Error('Authentication tokens not found. Please log in again.')
          }
          
          const tokens = JSON.parse(authTokens)
          
          // Detect if user is super admin and determine endpoint
          const isSuperAdmin = userData?.role === 'super_admin'
          const endpoint = isSuperAdmin 
            ? config.API_BASE_URL + `course/session/${sessionId}/monitor/`
            : config.API_BASE_URL + `course/session/${sessionId}/join/`
          
          console.log('User type:', isSuperAdmin ? 'Super Admin (Observer)' : 'Regular User', {
            userRole: userData?.role,
            isSuperAdmin
          })
          
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tokens.access}`
            },
            body: JSON.stringify({
              display_name: userData?.full_name || 'Student'
            })
          })
          
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
          }
          
          const sessionData = await response.json()
          console.log('Session join response:', sessionData)
          
          // Extract room ID and user role from the session data
          // Convert to string since SFU server expects string IDs
          const actualRoomId = String(sessionData.session.id)
          const displayName = sessionData.user?.display_name || userData?.full_name || 'Student'
          const role = sessionData.user?.role || 'member' // Get role from backend response
          const isHidden = sessionData.user?.is_hidden === true
          
          setUserRole(role) // Store role for later use
          setIsObserverMode(isHidden) // Set observer mode if user is hidden
          
          console.log('Joining SFU room:', { actualRoomId, displayName, role, isObserverMode: isHidden })
          
          // Set the room ID for the session
          setRoomId(actualRoomId)
          
          // Start session tracking
          sessionTracking.startSession()
          
          // Join the SFU room with the actual room ID, role, and observer flag
          console.log('Calling joinRoom...');
          const joinResult = await joinRoom(actualRoomId, displayName, { 
            role,
            isHidden // Pass hidden flag to SFU
          });
          console.log('joinRoom completed:', joinResult);
          
          // Wait a bit longer to ensure room join is fully processed
          console.log('Waiting for room join to complete...');
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Only start media if NOT in observer mode
          if (!isHidden) {
            console.log('Calling startMedia...');
            await startMedia();
            console.log('startMedia completed');
          } else {
            console.log('Observer mode - skipping media start (no camera/mic)');
          }
          
          setIsInCall(true)
          console.log('Successfully joined session')
        } catch (error) {
          console.error("Failed to join session:", {
            message: error.message,
            originalError: error.originalError,
            response: error.response,
            status: error.status || error.response?.status
          })
          
          // Provide more specific error messages
          let errorMessage = "Failed to join session. Please try again."
          
          if (error.message?.includes('not currently live') || error.message?.includes('not live')) {
            errorMessage = "This session is not currently live. Please wait for the instructor to start the session."
          } else if (error.message?.includes('403') || error.message?.includes('permission')) {
            errorMessage = "You don't have permission to join this session."
          } else if (error.message?.includes('404') || error.message?.includes('not found')) {
            errorMessage = "Session not found or no longer available."
          } else if (error.message?.includes('401') || error.message?.includes('authentication')) {
            errorMessage = "Authentication failed. Please log in again."
          } else if (error.message?.includes('full')) {
            errorMessage = "Session is full. Please try again later."
          }
          
          setError(errorMessage)
        } finally {
          isJoiningRef.current = false
        }
      }
    }
    
    joinSession()
  }, [sessionId, isConnected, isInRoom, userData])

  const handleLeaveCall = async () => {
    try {
      console.log('User is leaving the call...')
      
      // Set leaving flag to prevent rejoin attempts
      isLeavingRef.current = true
      isJoiningRef.current = false
      
      // Hide UI FIRST before cleanup to prevent rendering errors
      setIsInCall(false)
      setIsChatOpen(false)
      
      // Small delay to let React unmount the video grid
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Leave the SFU room (this will stop all media including camera, mic, and screen share)
      await leaveRoom()
      
      // End session tracking
      sessionTracking.endSession()
      
      console.log('Call ended successfully, redirecting...')
      
      // Redirect based on user role
      if (userData?.role === 'super_admin') {
        router.push('/dashboard/super-admin/sessions')
      } else if (userData?.role === 'teacher') {
        router.push('/dashboard/teacher')
      } else {
        router.push(`/courses/${courseId}/sessions`)
      }
    } catch (error) {
      console.error("Error leaving session:", error)
      // Still redirect even if there's an error, based on user role
      if (userData?.role === 'super_admin') {
        router.push('/dashboard/super-admin/sessions')
      } else if (userData?.role === 'teacher') {
        router.push('/dashboard/teacher')
      } else {
        router.push(`/courses/${courseId}/sessions`)
      }
    }
  }

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  // Handle opening/closing chat
  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen)
    // Note: Unread count will be reset automatically when ChatPanel marks messages as read
  }


  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md p-8 space-y-6 text-center">
          <h1 className="text-3xl font-bold text-red-900 dark:text-white">Connection Error</h1>
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  if (!isInCall) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md p-8 space-y-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isConnecting ? 'Connecting to SFU...' : 'Connecting to Live Session...'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {isConnecting ? 'Establishing connection to video server...' : 'Please wait while we connect you to the live class.'}
          </p>
          {!isConnected && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>SFU Status: {isConnecting ? 'Connecting...' : 'Not Connected'}</p>
              <p>Room ID: {roomId}</p>
            </div>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-black flex flex-col overflow-hidden">
      {/* Observer Mode Banner */}
      {isObserverMode && (
        <div className="bg-purple-900/50 border-b border-purple-700/50 px-4 py-2 flex items-center justify-center gap-2 text-sm text-purple-200 z-50">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="font-medium">Observer Mode</span>
          <span className="opacity-75">- You are invisible to other participants</span>
        </div>
      )}
      
      {/* Main video area with improved layout */}
      <div className="flex-1 overflow-hidden relative">
        <VideoGrid
          localStream={isObserverMode ? null : localStream}
          participants={participants}
          remoteStreams={remoteStreams}
          remoteParticipants={remoteParticipants}
          screenSharingParticipants={screenSharingParticipants}
          isVideoEnabled={isVideoEnabled}
          isAudioEnabled={isAudioEnabled}
          isScreenSharing={isScreenSharing}
          currentUserId={userData?.id}
          streamUpdateCounter={streamUpdateCounter}
          userRole={userRole}
          isObserverMode={isObserverMode}
        />
        
        {/* Subtle grid pattern overlay for visual interest */}
        <div className="absolute inset-0 pointer-events-none opacity-5" 
             style={{
               backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
               backgroundSize: '50px 50px'
             }} 
        />
      </div>

      {/* Control panel with improved styling */}
      <div className="relative z-10">
        <ControlPanel
          isVideoEnabled={isVideoEnabled}
          isAudioEnabled={isAudioEnabled}
          isScreenSharing={isScreenSharing}
          isScreenShareSupported={isScreenShareSupported}
          onToggleVideo={toggleVideo}
          onToggleAudio={toggleAudio}
          onToggleScreenShare={toggleScreenShare}
          onToggleChat={handleToggleChat}
          unreadMessageCount={unreadMessageCount}
          onToggleFullscreen={handleToggleFullscreen}
          onLeaveCall={handleLeaveCall}
          participantCount={participants.filter(p => p.userId !== userData?.id).length + 1}
          roomId={roomId}
          sessionData={sessionTracking.sessionData}
          formatDuration={sessionTracking.formatDuration}
          participants={participants}
          remoteParticipants={remoteParticipants}
          screenSharingParticipants={screenSharingParticipants}
          currentUserId={userData?.id}
          getConnectionStats={getConnectionStats}
          userRole={userRole}
          isObserverMode={isObserverMode}
        />
      </div>

      {/* Side panels */}
      <ChatPanel 
        roomId={sessionId} 
        isOpen={isChatOpen} 
        onToggle={handleToggleChat}
        onUnreadCountChange={setUnreadMessageCount}
        isObserverMode={isObserverMode}
      />
    </div>
  )
}
