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
  const hasAttemptedConnectionRef = useRef(false); // Track connection attempts

  const sfuUrl = options.sfuUrl || config.SFU_URL;

  // Initialize SFU client
  useEffect(() => {
    // Prevent creating multiple clients
    if (sfuClientRef.current) {
      return;
    }

    // Wait for auth tokens and user data to be available
    if (!authTokens?.access || !userData?.id) {
      if (process.env.NODE_ENV === 'development') {
      }
      return;
    }

    // Create client with available data
    if (process.env.NODE_ENV === 'development') {
    }

    const sfuConfig = {
      sfuUrl,
      token: authTokens?.access || '',
      userId: userData?.id || '',
      iceServers: config.ICE_SERVERS,
      onConnected: () => {
        if (process.env.NODE_ENV === 'development') {
        }
        setIsConnected(true);
        setIsConnecting(false);
      },
      onDisconnected: () => {
        if (process.env.NODE_ENV === 'development') {
        }
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
        options.onError?.(error);
        setIsConnecting(false);
        // Reset connection attempt flag to allow reconnection
        hasAttemptedConnectionRef.current = false;
      },
      onParticipantJoined: (participant) => {
        // IMPORTANT: Convert userData.id to string for comparison (Django returns number, SFU returns string)
        const currentUserIdString = String(userData?.id);
        
        
        // Don't add ourselves to the participants list
        if (participant.userId === currentUserIdString) {
          return;
        }
        
        setParticipants(prev => {
          // Check if participant already exists to avoid duplicates
          const exists = prev.some(p => p.id === participant.id);
          if (exists) {
            return prev;
          }
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
      },
      onProducerMediaStateChanged: (data) => {
        // Handle when a producer is created (media enabled) or removed (media disabled)
        
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
          } else {
          }
          return newMap;
        });
        
        // Force re-render to update UI
        setStreamUpdateCounter(prev => prev + 1);
      },
      onScreenShareStateChanged: (data) => {
        // Handle screen share state changes from remote participants
        
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
          setRemoteStreams(prev => {
            const newMap = new Map(prev);
            const streams = newMap.get(data.participantId);
            if (streams) {
              streams.screenShare = null;
              newMap.set(data.participantId, streams);
            }
            return newMap;
          });
        }
        
        // Force re-render
        setStreamUpdateCounter(prev => prev + 1);
      },
      onProducerClosed: (producerId) => {
        // Handle producer closed from other participants
      },
      onConsumerCreated: (consumer) => {
        // Handle new consumer for remote streams
      },
      onConsumerClosed: (consumerId) => {
        // Handle consumer closed
      },
      onRemoteStream: (streamData) => {
        // Handle new remote stream
        const { participantId, stream, kind, producerId, consumer } = streamData;
        const isScreenShare = consumer?.appData?.isScreenShare || false;
        
        
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          const participantStreams = newMap.get(participantId) || { audio: null, video: null, screenShare: null };
          
          // Store screen share separately from camera video
          if (kind === 'video' && isScreenShare) {
            participantStreams.screenShare = stream;
          } else {
            participantStreams[kind] = stream;
          }
          
          newMap.set(participantId, participantStreams);
          
          
          return newMap;
        });
        
        // Force re-render by incrementing counter
        setStreamUpdateCounter(prev => prev + 1);
        
        // Also log current participants to compare IDs
      },
      onRemoteStreamClosed: (producerId) => {
        // Handle remote stream closed
        
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
            
          }
          
          return newMap;
        });
        
        // Force re-render
        setStreamUpdateCounter(prev => prev + 1);
      },
      onProducerPaused: (data) => {
        // Handle remote producer paused (participant turned off their camera/mic)
        
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

    sfuClientRef.current = new SFUClient(sfuConfig);

    if (options.autoConnect) {
      connect();
    }

    // Cleanup function - DON'T disconnect to prevent React Strict Mode issues
    // The client will be reused across re-mounts
    return () => {
      // Don't disconnect here - it causes React Strict Mode issues
      // The client persists via sfuClientRef
    };
  }, [authTokens?.access, userData?.id, sfuUrl]); // Run when auth tokens or user data become available

  const connect = useCallback(async () => {
    if (!sfuClientRef.current) {
      return;
    }
    
    // Prevent multiple connection attempts
    if (isConnected || isConnecting) {
      return;
    }

    // Prevent rapid reconnection attempts (but allow after longer delay)
    const now = Date.now();
    if (sfuClientRef.current.lastConnectionAttempt && (now - sfuClientRef.current.lastConnectionAttempt) < 1000) {
      return;
    }

    try {
      if (process.env.NODE_ENV === 'development') {
      }
      setIsConnecting(true);
      sfuClientRef.current.lastConnectionAttempt = now;
      
      // Add timeout for connection (10 seconds)
      const connectionPromise = sfuClientRef.current.connect();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`SFU connection timeout after 10 seconds. Please ensure the SFU server is running on ${sfuUrl}`));
        }, 10000);
      });
      
      await Promise.race([connectionPromise, timeoutPromise]);
      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      setIsConnecting(false);
      options.onError?.(error);
      
      // Reset connection attempt flag to allow retry
      if (sfuClientRef.current) {
        sfuClientRef.current.lastConnectionAttempt = null;
      }
    }
  }, [isConnected, isConnecting, options, sfuUrl, authTokens?.access, userData?.id]);

  // Handle connection when auth tokens become available
  useEffect(() => {
    // Check localStorage as fallback if context tokens aren't loaded yet
    let token = authTokens?.access;
    let userId = userData?.id;
    
    if (!token || !userId) {
      try {
        const storedTokens = typeof window !== 'undefined' ? localStorage.getItem('authTokens') : null;
        if (storedTokens) {
          const parsed = JSON.parse(storedTokens);
          token = parsed?.access;
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }
    
    // Only attempt connection if:
    // 1. SFU client exists
    // 2. Auth tokens are available (from context or localStorage)
    // 3. User data is available
    // 4. Not already connected or connecting
    // 5. Haven't attempted connection yet
      if (sfuClientRef.current && token && userId && !isConnected && !isConnecting && !hasAttemptedConnectionRef.current) {
        hasAttemptedConnectionRef.current = true;
        if (process.env.NODE_ENV === 'development') {
        }
        connect().catch((error) => {
          // Reset flag to allow retry after a delay
          setTimeout(() => {
            hasAttemptedConnectionRef.current = false;
          }, 5000); // Retry after 5 seconds
        });
      }
  }, [authTokens?.access, userData?.id, isConnected, isConnecting, connect]);

  const disconnect = useCallback(async () => {
    if (!sfuClientRef.current) return;

    try {
      await stopMedia();
      await sfuClientRef.current.disconnect();
    } catch (error) {
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
      throw error;
    }
  }, []);

  const joinRoom = useCallback(async (roomId, displayName, metadata = {}) => {
    if (!sfuClientRef.current) {
      throw new Error('SFU client not initialized');
    }

    // Prevent duplicate join attempts
    if (isInRoom && currentRoom?.id === roomId) {
      return currentRoom;
    }

    try {
      // Wait for connection if not connected
      if (!sfuClientRef.current.isConnected) {
        
        // Wait up to 10 seconds for connection
        const maxWait = 10000;
        const startTime = Date.now();
        
        while (!sfuClientRef.current.isConnected && (Date.now() - startTime) < maxWait) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (!sfuClientRef.current.isConnected) {
          throw new Error('Failed to connect to SFU server. Please check that the SFU backend is running.');
        }
        
      }

      const room = await sfuClientRef.current.joinRoom(roomId, displayName, metadata);
      
      // Create recv transport early to receive remote streams
      if (!sfuClientRef.current.recvTransport) {
        await sfuClientRef.current.createTransport('recv');
      }
      
      // Filter out the current user from participants to avoid duplicates
      // The current user is shown separately as "You"
      // IMPORTANT: Convert userData.id to string for comparison (Django returns number, SFU returns string)
      const currentUserIdString = String(userData?.id);
      
      
      const otherParticipants = (room.participants || []).filter(
        p => {
          const matches = p.userId !== currentUserIdString;
          return matches;
        }
      );
      
      
      // SET PARTICIPANTS STATE FIRST before subscribing to avoid race conditions
      setCurrentRoom(room);
      setParticipants(otherParticipants);
      setIsInRoom(true);
      
      // Initialize remoteParticipants map with existing participants and their media states
      setRemoteParticipants(prev => {
        const newMap = new Map(prev);
        otherParticipants.forEach(participant => {
          // Add participant with their current media state from the backend
          newMap.set(participant.id, {
            ...participant,
            isAudioEnabled: participant.isAudioEnabled || false,
            isVideoEnabled: participant.isVideoEnabled || false,
          });
        });
        return newMap;
      });
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Subscribe to existing producers from other participants
      for (const participant of otherParticipants) {
        if (participant.producers && participant.producers.length > 0) {
          for (const producer of participant.producers) {
            // Subscribe to existing producers now that we have recv transport
            if (sfuClientRef.current.handleRemoteProducer) {
              await sfuClientRef.current.handleRemoteProducer(producer.id, participant.id);
            }
          }
        } else {
        }
      }
      
      
      return room;
    } catch (error) {
      throw error;
    }
  }, [isInRoom, currentRoom, userData?.id]);

  const stopMedia = useCallback(async () => {
    try {
      
      // First, unpublish all producers from the server
      if (sfuClientRef.current) {
        if (audioProducerRef.current) {
          try {
            await sfuClientRef.current.unpublish(audioProducerRef.current.id);
          } catch (err) {
          }
          audioProducerRef.current = null;
        }

        if (videoProducerRef.current) {
          try {
            await sfuClientRef.current.unpublish(videoProducerRef.current.id);
          } catch (err) {
          }
          videoProducerRef.current = null;
        }

        if (screenProducerRef.current) {
          try {
            await sfuClientRef.current.unpublish(screenProducerRef.current.id);
          } catch (err) {
          }
          screenProducerRef.current = null;
        }
      }
      
      // Stop all local camera/mic tracks and release access
      if (localStreamRef.current) {
        const tracks = localStreamRef.current.getTracks();
        tracks.forEach(track => {
          if (track.readyState === 'live') {
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
      }

      // Stop all screen share tracks
      if (screenStreamRef.current) {
        const screenTracks = screenStreamRef.current.getTracks();
        screenTracks.forEach(track => {
          if (track.readyState === 'live') {
            track.stop();
            track.enabled = false;
          }
        });
        
        // Remove all tracks from the stream
        screenTracks.forEach(track => {
          screenStreamRef.current.removeTrack(track);
        });
        
        screenStreamRef.current = null;
      }

      // Reset all media states
      setIsAudioEnabled(false);
      setIsVideoEnabled(false);
      setIsScreenSharing(false);


    } catch (error) {
      
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
      }
    }
  }, []);

  const leaveRoom = useCallback(async () => {
    if (!sfuClientRef.current) {
      return;
    }

    try {
      
      // Stop all media (camera, mic, screen share) FIRST
      await stopMedia();
      
      // Leave the room on the server (sends leaveRoom message)
      if (sfuClientRef.current.currentRoomId) {
        try {
          await sfuClientRef.current.leaveRoom();
        } catch (error) {
          // If server communication fails, still continue with local cleanup
        }
      }
      
      // Close all consumers
      for (const [consumerId, consumer] of sfuClientRef.current.consumers.entries()) {
        try {
          consumer.close();
        } catch (err) {
        }
      }
      sfuClientRef.current.consumers.clear();
      
      // Close all producers
      for (const [producerId, producer] of sfuClientRef.current.producers.entries()) {
        try {
          producer.close();
        } catch (err) {
        }
      }
      sfuClientRef.current.producers.clear();
      
      // Close transports
      if (sfuClientRef.current.transport) {
        try {
          sfuClientRef.current.transport.close();
          sfuClientRef.current.transport = null;
        } catch (err) {
        }
      }
      
      if (sfuClientRef.current.recvTransport) {
        try {
          sfuClientRef.current.recvTransport.close();
          sfuClientRef.current.recvTransport = null;
        } catch (err) {
        }
      }
      
      // Clear all state
      setCurrentRoom(null);
      setParticipants([]);
      setRemoteStreams(new Map());
      setRemoteParticipants(new Map());
      setScreenSharingParticipants(new Set());
      setIsInRoom(false);
      
    } catch (error) {
      
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
      return;
    }

    // Check if actually in a room by checking the client's roomId (not React state)
    if (!sfuClientRef.current.currentRoomId) {
      
      // Wait a moment and retry once in case of race condition
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!sfuClientRef.current.currentRoomId) {
        throw new Error('Not in a room. Please join a room first.');
      }
      
    }

    try {
      
      // Check if getUserMedia is available
      if (typeof window === 'undefined') {
        throw new Error('Media access is only available in the browser environment.');
      }
      
      if (typeof navigator === 'undefined') {
        throw new Error('Navigator API is not available. Please use a modern browser.');
      }
      
      // Check if we're in a secure context (required for getUserMedia)
      const isSecureContext = window.isSecureContext || 
        window.location.protocol === 'https:' || 
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1';
      
      if (!navigator.mediaDevices) {
        // Try to polyfill for older browsers
        if (navigator.getUserMedia) {
          // Legacy API - convert to Promise-based
          navigator.mediaDevices = {
            getUserMedia: (constraints) => {
              return new Promise((resolve, reject) => {
                navigator.getUserMedia(constraints, resolve, reject);
              });
            }
          };
        } else {
          // If not in secure context, allow joining without media
          if (!isSecureContext) {
            throw new Error('MEDIA_NOT_AVAILABLE_NON_SECURE');
          }
          
          const errorMsg = 'Camera and microphone access is not available. ' +
            'Please ensure you are using a secure connection (HTTPS or localhost) and a modern browser that supports WebRTC.';
          throw new Error(errorMsg);
        }
      }
      
      if (!navigator.mediaDevices.getUserMedia) {
        // If not in secure context, allow joining without media
        if (!isSecureContext) {
          throw new Error('MEDIA_NOT_AVAILABLE_NON_SECURE');
        }
        
        const errorMsg = 'getUserMedia is not available. ' +
          'Please ensure you are using a secure connection (HTTPS or localhost) and a modern browser.';
        throw new Error(errorMsg);
      }
      
      // Stop existing stream if any
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }

      // Final check before calling getUserMedia
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        const errorMsg = 'getUserMedia is not available. ' +
          'Please ensure you are using a secure connection (HTTPS or localhost) and a modern browser that supports WebRTC.';
        throw new Error(errorMsg);
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


      localStreamRef.current = stream;
      setLocalStream(stream);

      // Set initial media states based on tracks
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];
      
      setIsAudioEnabled(audioTrack ? audioTrack.enabled : false);
      setIsVideoEnabled(videoTrack ? videoTrack.enabled : false);

      // Only create transports and producers if we have a proper SFU connection
      if (sfuClientRef.current.isConnected && sfuClientRef.current.device) {
        
        // Create send transport if not exists
        if (!sfuClientRef.current.transport) {
          await sfuClientRef.current.createTransport('send');
        }

        // Create recv transport for consuming remote streams (if not already created)
        if (!sfuClientRef.current.recvTransport) {
          await sfuClientRef.current.createTransport('recv');
        } else {
        }

        // Publish audio and video if tracks exist
        if (audioTrack && !audioProducerRef.current) {
          const audioProducer = await sfuClientRef.current.publishAudio(stream);
          audioProducerRef.current = audioProducer;
        }

        if (videoTrack && !videoProducerRef.current) {
          const videoProducer = await sfuClientRef.current.publishVideo(stream);
          videoProducerRef.current = videoProducer;
        }

      } else {
      }

    } catch (error) {
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
            await audioProducerRef.current.resume();
            // Notify the server to broadcast state change to other participants
            await sfuClientRef.current.resumeProducer(audioProducerRef.current.id);
          } else {
            await audioProducerRef.current.pause();
            // Notify the server to broadcast state change to other participants
            await sfuClientRef.current.pauseProducer(audioProducerRef.current.id);
          }
        } catch (error) {
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
            await videoProducerRef.current.resume();
            // Notify the server to broadcast state change to other participants
            await sfuClientRef.current.resumeProducer(videoProducerRef.current.id);
          } else {
            await videoProducerRef.current.pause();
            // Notify the server to broadcast state change to other participants
            await sfuClientRef.current.pauseProducer(videoProducerRef.current.id);
          }
        } catch (error) {
        }
      }
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (!sfuClientRef.current || !isInRoom) return;

    try {
      if (isScreenSharing) {
        // Stop screen sharing
        
        // Stop the screen stream tracks
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => {
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
      } else {
        // Start screen sharing
        
        // Check if getDisplayMedia is available
        if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          const errorMsg = 'Screen sharing is not available. ' +
            'Please ensure you are using a secure connection (HTTPS or localhost) and a modern browser.';
          throw new Error(errorMsg);
        }
        
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        // Store screen stream reference for cleanup
        screenStreamRef.current = screenStream;

        const screenProducer = await sfuClientRef.current.publishVideo(screenStream, true); // Pass true to mark as screen share
        screenProducerRef.current = screenProducer;
        
        // Update local stream to show screen share to the local user
        setLocalStream(screenStream);
        
        // Add local user to screen sharing participants
        const localParticipantId = `local_${userData?.id}`;
        setScreenSharingParticipants(prev => {
          const newSet = new Set(prev);
          newSet.add(localParticipantId);
          return newSet;
        });
        
        setIsScreenSharing(true);


        // Handle screen share end (user clicks browser's stop sharing button)
        screenStream.getVideoTracks()[0].onended = () => {
          
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
        // Don't show error to user - cancelling is a normal action
        return;
      }
      
      // For other errors, log and notify
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
      
      // Stop all local camera/mic tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          if (track.readyState === 'live') {
            track.stop();
          }
        });
        localStreamRef.current = null;
      }
      
      // Stop all screen share tracks
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => {
          if (track.readyState === 'live') {
            track.stop();
          }
        });
        screenStreamRef.current = null;
      }
      
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
