'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SFUClient } from '@/lib/sfu-client';
import { useAuth } from '@/hooks/use-auth';
import { config } from '@/lib/config';

// Custom hook for SFU functionality
export function useSFU(options = {}) {
  const { userData, authTokens } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInRoom, setIsInRoom] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [remoteParticipants, setRemoteParticipants] = useState(new Map());
  const [screenSharingParticipants, setScreenSharingParticipants] = useState(new Set()); // Track who is screen sharing
  const [streamUpdateCounter, setStreamUpdateCounter] = useState(0); // Force re-render on track changes
  
  const sfuClientRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null); // Track screen share stream separately
  const audioProducerRef = useRef(null);
  const videoProducerRef = useRef(null);
  const screenProducerRef = useRef(null);
  const consumersRef = useRef(new Map());

  const sfuUrl = options.sfuUrl || config.SFU_URL;

  // Initialize SFU client
  useEffect(() => {
    // Prevent creating multiple clients
    if (sfuClientRef.current) {
      return;
    }

    // Wait for auth tokens and user data to be available
    if (!authTokens?.access || !userData?.id) {
      console.log('Waiting for auth tokens and user data...');
      return;
    }

    // Create client with available data
    console.log('Creating SFU client...');

    const config = {
      sfuUrl,
      token: authTokens?.access || '',
      userId: userData?.id || '',
      onConnected: () => {
        console.log('SFU Connected');
        setIsConnected(true);
        setIsConnecting(false);
      },
      onDisconnected: () => {
        console.log('⚠️ SFU Disconnected - clearing all state');
        setIsConnected(false);
        setIsInRoom(false);
        setCurrentRoom(null);
        setParticipants([]);
        setLocalStream(null);
        setRemoteStreams(new Map());
        // Reset connection attempt flag to allow reconnection
        hasAttemptedConnectionRef.current = false;
      },
      onError: (error) => {
        console.error('SFU Error:', error);
        options.onError?.(error);
        setIsConnecting(false);
        // Reset connection attempt flag to allow reconnection
        hasAttemptedConnectionRef.current = false;
      },
      onParticipantJoined: (participant) => {
        // IMPORTANT: Convert userData.id to string for comparison (Django returns number, SFU returns string)
        const currentUserIdString = String(userData?.id);
        
        console.log('🔔 onParticipantJoined triggered:', {
          participantUserId: participant.userId,
          participantUserIdType: typeof participant.userId,
          currentUserId: userData?.id,
          currentUserIdString: currentUserIdString,
          currentUserIdType: typeof userData?.id,
          isCurrentUser: participant.userId === currentUserIdString,
          participantId: participant.id,
          displayName: participant.displayName,
          fullParticipant: participant
        });
        
        // Don't add ourselves to the participants list
        if (participant.userId === currentUserIdString) {
          console.log('✅ CORRECTLY ignoring participantJoined event for current user');
          return;
        }
        
        setParticipants(prev => {
          // Check if participant already exists to avoid duplicates
          const exists = prev.some(p => p.id === participant.id);
          if (exists) {
            console.log('⚠️ Participant already exists, not adding:', participant.id);
            return prev;
          }
          console.log('✨ Adding new remote participant:', participant.id);
          return [...prev, participant];
        });
        
        // Initialize remote participant with default media states
        setRemoteParticipants(prev => {
          const newMap = new Map(prev);
          newMap.set(participant.id, {
            ...participant,
            isAudioEnabled: false, // Will be updated when producer events arrive
            isVideoEnabled: false, // Will be updated when producer events arrive
            isScreenSharing: false, // Will be updated when screen share starts
          });
          return newMap;
        });
      },
      onParticipantLeft: (participantId) => {
        setParticipants(prev => prev.filter(p => p.id !== participantId));
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.delete(participantId);
          return newMap;
        });
        setRemoteParticipants(prev => {
          const newMap = new Map(prev);
          newMap.delete(participantId);
          return newMap;
        });
        // Remove from screen sharing participants if they were sharing
        setScreenSharingParticipants(prev => {
          const newSet = new Set(prev);
          newSet.delete(participantId);
          return newSet;
        });
      },
      onProducerCreated: (producer, participantId) => {
        // Handle new producer from other participants
        console.log('Producer created:', producer, 'for participant:', participantId);
      },
      onProducerMediaStateChanged: (data) => {
        // Handle when a producer is created (media enabled) or removed (media disabled)
        console.log('🎬 Producer media state changed:', {
          participantId: data.participantId,
          kind: data.kind,
          enabled: data.enabled,
          isScreenShare: data.isScreenShare
        });
        
        // Update the remote participant state
        setRemoteParticipants(prev => {
          const newMap = new Map(prev);
          const participant = newMap.get(data.participantId);
          if (participant) {
            if (data.kind === 'audio') {
              participant.isAudioEnabled = data.enabled;
            } else if (data.kind === 'video' && !data.isScreenShare) {
              // Only update camera video state if this is NOT a screen share
              // Screen share state is handled separately by onScreenShareStateChanged
              participant.isVideoEnabled = data.enabled;
            }
            // If it's a screen share video, don't update isVideoEnabled (camera state)
            // The screen share state is managed by onScreenShareStateChanged callback
            newMap.set(data.participantId, participant);
            console.log('✅ Updated participant media state:', {
              participantId: data.participantId,
              kind: data.kind,
              enabled: data.enabled,
              isScreenShare: data.isScreenShare,
              participantState: participant
            });
          } else {
            console.warn('⚠️ Participant not found for media state update:', data.participantId);
          }
          return newMap;
        });
        
        // Force re-render to update UI
        setStreamUpdateCounter(prev => prev + 1);
      },
      onScreenShareStateChanged: (data) => {
        // Handle screen share state changes from remote participants
        console.log('🖥️ Screen share state changed:', {
          participantId: data.participantId,
          isScreenSharing: data.isScreenSharing
        });
        
        setScreenSharingParticipants(prev => {
          const newSet = new Set(prev);
          if (data.isScreenSharing) {
            newSet.add(data.participantId);
          } else {
            newSet.delete(data.participantId);
          }
          return newSet;
        });
        
        // Update remote participant state
        setRemoteParticipants(prev => {
          const newMap = new Map(prev);
          const participant = newMap.get(data.participantId);
          if (participant) {
            participant.isScreenSharing = data.isScreenSharing;
            newMap.set(data.participantId, participant);
          }
          return newMap;
        });
        
        // If screen sharing stopped, clear the screen share stream so camera video shows
        if (!data.isScreenSharing) {
          console.log('🖥️ Screen share stopped, clearing screen share stream for participant:', data.participantId);
          setRemoteStreams(prev => {
            const newMap = new Map(prev);
            const streams = newMap.get(data.participantId);
            if (streams) {
              streams.screenShare = null;
              newMap.set(data.participantId, streams);
              console.log('✅ Cleared screen share stream, camera video should now show');
            }
            return newMap;
          });
        }
        
        // Force re-render
        setStreamUpdateCounter(prev => prev + 1);
      },
      onProducerClosed: (producerId) => {
        // Handle producer closed from other participants
        console.log('Producer closed:', producerId);
      },
      onConsumerCreated: (consumer) => {
        // Handle new consumer for remote streams
        console.log('Consumer created:', consumer);
      },
      onConsumerClosed: (consumerId) => {
        // Handle consumer closed
        console.log('Consumer closed:', consumerId);
      },
      onRemoteStream: (streamData) => {
        // Handle new remote stream
        const { participantId, stream, kind, producerId, consumer } = streamData;
        const isScreenShare = consumer?.appData?.isScreenShare || false;
        
        console.log('🎥 onRemoteStream callback triggered:', {
          participantId,
          participantIdType: typeof participantId,
          kind,
          producerId,
          isScreenShare,
          hasStream: !!stream,
          streamId: stream?.id,
          trackCount: stream?.getTracks().length,
          trackMuted: stream?.getTracks()[0]?.muted
        });
        
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          const participantStreams = newMap.get(participantId) || { audio: null, video: null, screenShare: null };
          
          // Store screen share separately from camera video
          if (kind === 'video' && isScreenShare) {
            participantStreams.screenShare = stream;
            console.log('📺 Stored as SCREEN SHARE stream');
          } else {
            participantStreams[kind] = stream;
            console.log(`📺 Stored as ${kind.toUpperCase()} stream`);
          }
          
          newMap.set(participantId, participantStreams);
          
          console.log('📊 Updated remote streams MAP:', {
            storedWithParticipantId: participantId,
            storedWithParticipantIdType: typeof participantId,
            audioStream: !!participantStreams.audio,
            videoStream: !!participantStreams.video,
            screenShareStream: !!participantStreams.screenShare,
            totalParticipantsWithStreams: newMap.size,
            allKeysInMap: Array.from(newMap.keys()),
            allKeysTypes: Array.from(newMap.keys()).map(k => typeof k)
          });
          
          return newMap;
        });
        
        // Force re-render by incrementing counter
        console.log('🔄 Forcing re-render due to stream update');
        setStreamUpdateCounter(prev => prev + 1);
        
        // Also log current participants to compare IDs
        console.log('🔄 Current participants in state:', participants.map(p => ({
          id: p.id,
          idType: typeof p.id,
          name: p.displayName || p.name
        })));
      },
      onRemoteStreamClosed: (producerId) => {
        // Handle remote stream closed
        console.log('🚫 Remote stream closed, producerId:', producerId);
        
        // Find which participant and which stream type (video/audio/screenShare) this producer belongs to
        // and remove it from the remoteStreams map
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          
          // Search through all participants to find the stream with this producer
          for (const [participantId, streams] of newMap.entries()) {
            let streamRemoved = false;
            
            // Check if this is the audio, video, or screenShare stream by checking the consumer
            // Since we don't have direct producer->stream mapping, we'll remove based on closure
            // The consumer's track will be ended, so we check for that
            
            // For now, we'll handle screen share closure via the onScreenShareStateChanged callback
            // which is triggered by the backend when a screen share producer is closed
            
            console.log('🔍 Checking participant:', participantId, 'for closed producer:', producerId);
          }
          
          return newMap;
        });
        
        // Force re-render
        setStreamUpdateCounter(prev => prev + 1);
      },
      onProducerPaused: (data) => {
        // Handle remote producer paused (participant turned off their camera/mic)
        console.log('🔇 Remote producer paused:', {
          participantId: data.participantId,
          producerId: data.producerId,
          kind: data.kind
        });
        
        // Update the remote participant state
        setRemoteParticipants(prev => {
          const newMap = new Map(prev);
          const participant = newMap.get(data.participantId);
          if (participant) {
            if (data.kind === 'audio') {
              participant.isAudioEnabled = false;
            } else if (data.kind === 'video') {
              participant.isVideoEnabled = false;
            }
            newMap.set(data.participantId, participant);
          }
          return newMap;
        });
        
        // Force re-render to update UI
        setStreamUpdateCounter(prev => prev + 1);
      },
      onProducerResumed: (data) => {
        // Handle remote producer resumed (participant turned on their camera/mic)
        console.log('🔊 Remote producer resumed:', {
          participantId: data.participantId,
          producerId: data.producerId,
          kind: data.kind
        });
        
        // Update the remote participant state
        setRemoteParticipants(prev => {
          const newMap = new Map(prev);
          const participant = newMap.get(data.participantId);
          if (participant) {
            if (data.kind === 'audio') {
              participant.isAudioEnabled = true;
            } else if (data.kind === 'video') {
              participant.isVideoEnabled = true;
            }
            newMap.set(data.participantId, participant);
          }
          return newMap;
        });
        
        // Force re-render to update UI
        setStreamUpdateCounter(prev => prev + 1);
      },
    };

    sfuClientRef.current = new SFUClient(config);

    if (options.autoConnect) {
      connect();
    }

    // Cleanup function - DON'T disconnect to prevent React Strict Mode issues
    // The client will be reused across re-mounts
    return () => {
      // Don't disconnect here - it causes React Strict Mode issues
      // The client persists via sfuClientRef
      console.log('useEffect cleanup called (not disconnecting to prevent strict mode issues)');
    };
  }, [authTokens?.access, userData?.id, sfuUrl]); // Run when auth tokens or user data become available

  const connect = useCallback(async () => {
    if (!sfuClientRef.current) return;
    
    // Prevent multiple connection attempts
    if (isConnected || isConnecting) {
      console.log('Already connected or connecting to SFU');
      return;
    }

    // Prevent rapid reconnection attempts (but allow after longer delay)
    const now = Date.now();
    if (sfuClientRef.current.lastConnectionAttempt && (now - sfuClientRef.current.lastConnectionAttempt) < 1000) {
      console.log('Preventing rapid reconnection attempt (wait 1 second)');
      return;
    }

    try {
      console.log('Starting SFU connection...');
      setIsConnecting(true);
      sfuClientRef.current.lastConnectionAttempt = now;
      await sfuClientRef.current.connect();
      console.log('SFU connection successful');
    } catch (error) {
      console.error('Failed to connect to SFU:', error);
      options.onError?.(error);
      setIsConnecting(false);
    }
  }, [isConnected, isConnecting, options]);

  // Handle connection when auth tokens become available
  const hasAttemptedConnectionRef = useRef(false);
  useEffect(() => {
    if (sfuClientRef.current && authTokens?.access && userData?.id && !isConnected && !isConnecting && !hasAttemptedConnectionRef.current) {
      hasAttemptedConnectionRef.current = true;
      console.log('Auth tokens available, attempting to connect...');
      connect();
    }
  }, [authTokens?.access, userData?.id, isConnected, isConnecting]);

  const disconnect = useCallback(async () => {
    if (!sfuClientRef.current) return;

    try {
      await stopMedia();
      await sfuClientRef.current.disconnect();
    } catch (error) {
      console.error('Failed to disconnect from SFU:', error);
    }
  }, []);

  const createRoom = useCallback(async (name, description, maxParticipants = 100) => {
    if (!sfuClientRef.current) {
      throw new Error('SFU client not initialized');
    }

    try {
      const room = await sfuClientRef.current.createRoom(name, description, maxParticipants);
      setCurrentRoom(room);
      setParticipants(room.participants);
      setIsInRoom(true);
      return room;
    } catch (error) {
      console.error('Failed to create room:', error);
      throw error;
    }
  }, []);

  const joinRoom = useCallback(async (roomId, displayName, metadata = {}) => {
    if (!sfuClientRef.current) {
      throw new Error('SFU client not initialized');
    }

    // Prevent duplicate join attempts
    if (isInRoom && currentRoom?.id === roomId) {
      console.log('Already in room:', roomId);
      return currentRoom;
    }

    try {
      // Wait for connection if not connected
      if (!sfuClientRef.current.isConnected) {
        console.log('Waiting for SFU connection before joining room...');
        
        // Wait up to 10 seconds for connection
        const maxWait = 10000;
        const startTime = Date.now();
        
        while (!sfuClientRef.current.isConnected && (Date.now() - startTime) < maxWait) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (!sfuClientRef.current.isConnected) {
          throw new Error('Failed to connect to SFU server. Please check that the SFU backend is running.');
        }
        
        console.log('SFU connection established, proceeding with room join');
      }

      const room = await sfuClientRef.current.joinRoom(roomId, displayName, metadata);
      console.log('🎯 Room joined successfully:', {
        roomId: room.roomId,
        totalParticipants: room.participants?.length || 0,
        allParticipants: room.participants?.map(p => ({
          id: p.id,
          userId: p.userId,
          displayName: p.displayName,
          producers: p.producers?.length || 0
        }))
      });
      
      // Create recv transport early to receive remote streams
      if (!sfuClientRef.current.recvTransport) {
        console.log('📥 Creating recv transport for receiving remote streams...');
        await sfuClientRef.current.createTransport('recv');
      }
      
      // Filter out the current user from participants to avoid duplicates
      // The current user is shown separately as "You"
      // IMPORTANT: Convert userData.id to string for comparison (Django returns number, SFU returns string)
      const currentUserIdString = String(userData?.id);
      
      console.log('🔍 Filtering participants:', {
        currentUserId: userData?.id,
        currentUserIdString,
        beforeFilter: room.participants?.length || 0
      });
      
      const otherParticipants = (room.participants || []).filter(
        p => {
          const matches = p.userId !== currentUserIdString;
          console.log(`  Participant ${p.displayName} (userId: ${p.userId}): ${matches ? 'KEEP' : 'FILTER OUT'}`);
          return matches;
        }
      );
      
      console.log('✅ Filtered participants:', {
        afterFilter: otherParticipants.length,
        participants: otherParticipants.map(p => ({
          id: p.id,
          userId: p.userId,
          displayName: p.displayName
        }))
      });
      
      // SET PARTICIPANTS STATE FIRST before subscribing to avoid race conditions
      console.log('📝 Setting participants state BEFORE subscribing to producers');
      setCurrentRoom(room);
      setParticipants(otherParticipants);
      setIsInRoom(true);
      
      // Initialize remoteParticipants map with existing participants and their media states
      console.log('📝 Initializing remoteParticipants map with existing participants');
      setRemoteParticipants(prev => {
        const newMap = new Map(prev);
        otherParticipants.forEach(participant => {
          // Add participant with their current media state from the backend
          newMap.set(participant.id, {
            ...participant,
            isAudioEnabled: participant.isAudioEnabled || false,
            isVideoEnabled: participant.isVideoEnabled || false,
          });
          console.log('  ✅ Initialized participant:', {
            id: participant.id,
            displayName: participant.displayName,
            isAudioEnabled: participant.isAudioEnabled,
            isVideoEnabled: participant.isVideoEnabled,
            producerCount: participant.producers?.length || 0
          });
        });
        return newMap;
      });
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Subscribe to existing producers from other participants
      console.log('🔍 Checking for existing producers to subscribe to...');
      for (const participant of otherParticipants) {
        if (participant.producers && participant.producers.length > 0) {
          console.log(`📡 Found ${participant.producers.length} existing producers from participant:`, participant.displayName);
          for (const producer of participant.producers) {
            console.log(`  └─ Subscribing to ${producer.kind} producer:`, producer.id);
            // Subscribe to existing producers now that we have recv transport
            if (sfuClientRef.current.handleRemoteProducer) {
              await sfuClientRef.current.handleRemoteProducer(producer.id, participant.id);
            }
          }
        } else {
          console.log(`ℹ️ Participant ${participant.displayName} has no producers yet`);
        }
      }
      
      console.log('✅ Room join completed successfully with participants:', {
        participantsCount: otherParticipants.length,
        participantNames: otherParticipants.map(p => p.displayName)
      });
      
      return room;
    } catch (error) {
      console.error('Failed to join room:', error);
      throw error;
    }
  }, [isInRoom, currentRoom, userData?.id]);

  const stopMedia = useCallback(async () => {
    try {
      console.log('🛑 Stopping all media streams and releasing camera/microphone access...');
      
      // First, unpublish all producers from the server
      if (sfuClientRef.current) {
        if (audioProducerRef.current) {
          console.log('📡 Unpublishing audio producer...');
          try {
            await sfuClientRef.current.unpublish(audioProducerRef.current.id);
          } catch (err) {
            console.warn('Error unpublishing audio:', err);
          }
          audioProducerRef.current = null;
        }

        if (videoProducerRef.current) {
          console.log('📡 Unpublishing video producer...');
          try {
            await sfuClientRef.current.unpublish(videoProducerRef.current.id);
          } catch (err) {
            console.warn('Error unpublishing video:', err);
          }
          videoProducerRef.current = null;
        }

        if (screenProducerRef.current) {
          console.log('📡 Unpublishing screen producer...');
          try {
            await sfuClientRef.current.unpublish(screenProducerRef.current.id);
          } catch (err) {
            console.warn('Error unpublishing screen:', err);
          }
          screenProducerRef.current = null;
        }
      }
      
      // Stop all local camera/mic tracks and release access
      if (localStreamRef.current) {
        console.log('🎥 Stopping camera and microphone tracks...');
        const tracks = localStreamRef.current.getTracks();
        tracks.forEach(track => {
          if (track.readyState === 'live') {
            console.log(`  ⏹️  Stopping ${track.kind} track: ${track.label}`);
            track.stop(); // This releases the camera/mic hardware access
            track.enabled = false;
          }
        });
        
        // Remove all tracks from the stream
        tracks.forEach(track => {
          localStreamRef.current.removeTrack(track);
        });
        
        localStreamRef.current = null;
        setLocalStream(null);
        console.log('✅ Camera and microphone access released');
      }

      // Stop all screen share tracks
      if (screenStreamRef.current) {
        console.log('🖥️  Stopping screen share tracks...');
        const screenTracks = screenStreamRef.current.getTracks();
        screenTracks.forEach(track => {
          if (track.readyState === 'live') {
            console.log(`  ⏹️  Stopping screen ${track.kind} track: ${track.label}`);
            track.stop();
            track.enabled = false;
          }
        });
        
        // Remove all tracks from the stream
        screenTracks.forEach(track => {
          screenStreamRef.current.removeTrack(track);
        });
        
        screenStreamRef.current = null;
        console.log('✅ Screen share stopped');
      }

      // Reset all media states
      setIsAudioEnabled(false);
      setIsVideoEnabled(false);
      setIsScreenSharing(false);

      console.log('✅ All media streams stopped and hardware access released successfully');

    } catch (error) {
      console.error('❌ Failed to stop media:', error);
      
      // Even if there's an error, try to force stop all tracks
      try {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
          localStreamRef.current = null;
          setLocalStream(null);
        }
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
          screenStreamRef.current = null;
        }
      } catch (cleanupError) {
        console.error('Error in cleanup fallback:', cleanupError);
      }
    }
  }, []);

  const leaveRoom = useCallback(async () => {
    if (!sfuClientRef.current) {
      console.log('⚠️ No SFU client available for leaving room');
      return;
    }

    try {
      console.log('🚪 Leaving room and cleaning up...', {
        isInRoom,
        hasRoomId: !!sfuClientRef.current.currentRoomId,
        hasWs: !!sfuClientRef.current.ws,
        wsState: sfuClientRef.current.ws?.readyState
      });
      
      // Stop all media (camera, mic, screen share) FIRST
      await stopMedia();
      
      // Leave the room on the server (sends leaveRoom message)
      if (sfuClientRef.current.currentRoomId) {
        try {
          console.log('📤 Sending leaveRoom message to server...');
          await sfuClientRef.current.leaveRoom();
          console.log('✅ leaveRoom message sent successfully');
        } catch (error) {
          // If server communication fails, still continue with local cleanup
          console.warn('⚠️ Failed to send leaveRoom to server (server may already know):', error.message);
        }
      }
      
      // Close all consumers
      for (const [consumerId, consumer] of sfuClientRef.current.consumers.entries()) {
        try {
          consumer.close();
        } catch (err) {
          console.warn('Error closing consumer:', err);
        }
      }
      sfuClientRef.current.consumers.clear();
      
      // Close all producers
      for (const [producerId, producer] of sfuClientRef.current.producers.entries()) {
        try {
          producer.close();
        } catch (err) {
          console.warn('Error closing producer:', err);
        }
      }
      sfuClientRef.current.producers.clear();
      
      // Close transports
      if (sfuClientRef.current.transport) {
        try {
          sfuClientRef.current.transport.close();
          sfuClientRef.current.transport = null;
        } catch (err) {
          console.warn('Error closing send transport:', err);
        }
      }
      
      if (sfuClientRef.current.recvTransport) {
        try {
          sfuClientRef.current.recvTransport.close();
          sfuClientRef.current.recvTransport = null;
        } catch (err) {
          console.warn('Error closing recv transport:', err);
        }
      }
      
      // Clear all state
      setCurrentRoom(null);
      setParticipants([]);
      setRemoteStreams(new Map());
      setRemoteParticipants(new Map());
      setScreenSharingParticipants(new Set());
      setIsInRoom(false);
      
      console.log('✅ Room left and cleaned up successfully');
    } catch (error) {
      console.error('❌ Error during leaveRoom:', error);
      
      // Force cleanup even if there's an error
      setCurrentRoom(null);
      setParticipants([]);
      setRemoteStreams(new Map());
      setRemoteParticipants(new Map());
      setScreenSharingParticipants(new Set());
      setIsInRoom(false);
    }
  }, [isInRoom, stopMedia]);

  const startMedia = useCallback(async () => {
    if (!sfuClientRef.current) {
      console.error('Cannot start media: SFU client not initialized');
      return;
    }

    // Check if actually in a room by checking the client's roomId (not React state)
    if (!sfuClientRef.current.currentRoomId) {
      console.error('Cannot start media: Not in a room. Please join a room first.');
      console.log('Debug - isInRoom state:', isInRoom, 'Client roomId:', sfuClientRef.current.currentRoomId);
      console.log('Debug - Full client state:', {
        hasClient: !!sfuClientRef.current,
        isConnected: sfuClientRef.current?.isConnected,
        roomId: sfuClientRef.current?.roomId,
        currentRoomId: sfuClientRef.current?.currentRoomId,
        participantId: sfuClientRef.current?.participantId,
        hasTransport: !!sfuClientRef.current?.transport,
        hasRecvTransport: !!sfuClientRef.current?.recvTransport
      });
      
      // Wait a moment and retry once in case of race condition
      console.log('Waiting 500ms and retrying...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!sfuClientRef.current.currentRoomId) {
        console.error('Still not in a room after retry. Aborting startMedia.');
        throw new Error('Not in a room. Please join a room first.');
      }
      
      console.log('Room ID found after retry, continuing with startMedia');
    }

    try {
      console.log('Starting media...', {
        roomId: sfuClientRef.current.currentRoomId,
        isConnected: sfuClientRef.current.isConnected
      });
      
      // Stop existing stream if any
      if (localStreamRef.current) {
        console.log('Stopping existing stream...');
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        }
      });

      console.log('Got user media:', {
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      // Set initial media states based on tracks
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];
      
      setIsAudioEnabled(audioTrack ? audioTrack.enabled : false);
      setIsVideoEnabled(videoTrack ? videoTrack.enabled : false);

      // Only create transports and producers if we have a proper SFU connection
      if (sfuClientRef.current.isConnected && sfuClientRef.current.device) {
        console.log('Creating transports and producers...');
        
        // Create send transport if not exists
        if (!sfuClientRef.current.transport) {
          console.log('Creating send transport...');
          await sfuClientRef.current.createTransport('send');
        }

        // Create recv transport for consuming remote streams (if not already created)
        if (!sfuClientRef.current.recvTransport) {
          console.log('Creating recv transport...');
          await sfuClientRef.current.createTransport('recv');
        } else {
          console.log('Recv transport already exists, skipping creation');
        }

        // Publish audio and video if tracks exist
        if (audioTrack && !audioProducerRef.current) {
          console.log('Publishing audio...');
          const audioProducer = await sfuClientRef.current.publishAudio(stream);
          audioProducerRef.current = audioProducer;
        }

        if (videoTrack && !videoProducerRef.current) {
          console.log('Publishing video...');
          const videoProducer = await sfuClientRef.current.publishVideo(stream);
          videoProducerRef.current = videoProducer;
        }

        console.log('Media started successfully');
      } else {
        console.warn('SFU not fully initialized, media tracks obtained but not published');
      }

    } catch (error) {
      console.error('Failed to start media:', error);
      options.onError?.(error);
    }
  }, [isInRoom, options]);

  const toggleAudio = useCallback(async () => {
    if (!localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
      
      // Pause/resume the audio producer to notify remote participants
      if (audioProducerRef.current && sfuClientRef.current) {
        try {
          if (audioTrack.enabled) {
            console.log('Resuming audio producer');
            await audioProducerRef.current.resume();
            // Notify the server to broadcast state change to other participants
            await sfuClientRef.current.resumeProducer(audioProducerRef.current.id);
          } else {
            console.log('Pausing audio producer');
            await audioProducerRef.current.pause();
            // Notify the server to broadcast state change to other participants
            await sfuClientRef.current.pauseProducer(audioProducerRef.current.id);
          }
        } catch (error) {
          console.error('Failed to toggle audio producer state:', error);
        }
      }
    }
  }, []);

  const toggleVideo = useCallback(async () => {
    if (!localStreamRef.current) return;

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
      
      // Pause/resume the video producer to notify remote participants
      if (videoProducerRef.current && sfuClientRef.current) {
        try {
          if (videoTrack.enabled) {
            console.log('Resuming video producer');
            await videoProducerRef.current.resume();
            // Notify the server to broadcast state change to other participants
            await sfuClientRef.current.resumeProducer(videoProducerRef.current.id);
          } else {
            console.log('Pausing video producer');
            await videoProducerRef.current.pause();
            // Notify the server to broadcast state change to other participants
            await sfuClientRef.current.pauseProducer(videoProducerRef.current.id);
          }
        } catch (error) {
          console.error('Failed to toggle video producer state:', error);
        }
      }
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (!sfuClientRef.current || !isInRoom) return;

    try {
      if (isScreenSharing) {
        // Stop screen sharing
        console.log('Stopping screen share...');
        
        // Stop the screen stream tracks
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => {
            console.log(`Stopping screen share track: ${track.kind}`);
            track.stop();
          });
          screenStreamRef.current = null;
        }
        
        // Unpublish the screen producer
        if (screenProducerRef.current) {
          await sfuClientRef.current.unpublish(screenProducerRef.current.id);
          screenProducerRef.current = null;
        }
        
        // Restore camera stream to local display
        if (localStreamRef.current) {
          console.log('Restoring camera stream to local display');
          setLocalStream(localStreamRef.current);
        }
        
        // Remove local user from screen sharing participants
        const localParticipantId = `local_${userData?.id}`;
        setScreenSharingParticipants(prev => {
          const newSet = new Set(prev);
          newSet.delete(localParticipantId);
          return newSet;
        });
        
        setIsScreenSharing(false);
        console.log('Screen share stopped');
      } else {
        // Start screen sharing
        console.log('Starting screen share...');
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        // Store screen stream reference for cleanup
        screenStreamRef.current = screenStream;

        const screenProducer = await sfuClientRef.current.publishVideo(screenStream, true); // Pass true to mark as screen share
        screenProducerRef.current = screenProducer;
        
        // Update local stream to show screen share to the local user
        console.log('Updating local display to show screen share');
        setLocalStream(screenStream);
        
        // Add local user to screen sharing participants
        const localParticipantId = `local_${userData?.id}`;
        setScreenSharingParticipants(prev => {
          const newSet = new Set(prev);
          newSet.add(localParticipantId);
          return newSet;
        });
        
        setIsScreenSharing(true);

        console.log('Screen share started');

        // Handle screen share end (user clicks browser's stop sharing button)
        screenStream.getVideoTracks()[0].onended = () => {
          console.log('Screen share ended by user');
          
          // Stop all screen stream tracks
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
          }
          
          // Unpublish producer
          if (screenProducerRef.current) {
            sfuClientRef.current?.unpublish(screenProducerRef.current.id);
            screenProducerRef.current = null;
          }
          
          // Restore camera stream to local display
          if (localStreamRef.current) {
            console.log('Restoring camera stream to local display after browser stop');
            setLocalStream(localStreamRef.current);
          }
          
          // Remove local user from screen sharing participants
          const localParticipantId = `local_${userData?.id}`;
          setScreenSharingParticipants(prev => {
            const newSet = new Set(prev);
            newSet.delete(localParticipantId);
            return newSet;
          });
          
          setIsScreenSharing(false);
        };
      }
    } catch (error) {
      // Check if the error is due to user cancelling the screen share permission
      // NotAllowedError is thrown when the user denies permission or cancels the dialog
      if (error.name === 'NotAllowedError' || error.message?.includes('Permission denied')) {
        console.log('Screen share cancelled by user');
        // Don't show error to user - cancelling is a normal action
        return;
      }
      
      // For other errors, log and notify
      console.error('Failed to toggle screen share:', error);
      options.onError?.(error);
    }
  }, [isInRoom, isScreenSharing, options]);

  const getParticipantById = useCallback((participantId) => {
    return participants.find(p => p.id === participantId);
  }, [participants]);

  const getParticipantByUserId = useCallback((userId) => {
    return participants.find(p => p.userId === userId);
  }, [participants]);

  // Cleanup effect: Stop all media when component unmounts
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting - cleaning up media streams...');
      
      // Stop all local camera/mic tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          if (track.readyState === 'live') {
            console.log(`  🛑 Stopping ${track.kind} track on unmount`);
            track.stop();
          }
        });
        localStreamRef.current = null;
      }
      
      // Stop all screen share tracks
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => {
          if (track.readyState === 'live') {
            console.log(`  🛑 Stopping screen ${track.kind} track on unmount`);
            track.stop();
          }
        });
        screenStreamRef.current = null;
      }
      
      console.log('✅ Media cleanup on unmount complete');
    };
  }, []); // Empty deps - only run on mount/unmount

  return {
    // Connection state
    isConnected,
    isConnecting,
    isInRoom,
    
    // Room state
    currentRoom,
    participants,
    
    // Media state
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    localStream,
    remoteStreams,
    remoteParticipants,
    screenSharingParticipants, // Track who is screen sharing
    streamUpdateCounter, // Include counter to trigger re-renders
    
    // SFU client
    sfuClient: sfuClientRef.current,
    
    // Connection methods
    connect,
    disconnect,
    
    // Room methods
    createRoom,
    joinRoom,
    leaveRoom,
    
    // Media methods
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    startMedia,
    stopMedia,
    
    // Utility methods
    getParticipantById,
    getParticipantByUserId,
    
    // Connection quality methods
    getConnectionStats: useCallback(async () => {
      if (!sfuClientRef.current) {
        return null;
      }
      return await sfuClientRef.current.getConnectionStats();
    }, []),
  };
}
