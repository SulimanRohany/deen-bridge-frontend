// SFU Client Library - JavaScript version
// This file provides the core SFU client functionality for WebRTC video conferencing

export class SFUClient {
  constructor(config) {
    this.config = config;
    this.ws = null;
    this.device = null;
    this.roomId = null;
    this.participantId = null;
    this.transport = null;
    this.recvTransport = null;
    this.producers = new Map();
    this.consumers = new Map();
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.reconnectDelay = 3000;
    this.connectionPromise = null;
    this.lastConnectionAttempt = null;
  }

  async connect() {
    // Return existing connection promise if already connecting
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Return immediately if already connected
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // Prevent multiple simultaneous connection attempts
        if (this.isConnecting) {
          return;
        }

        this.isConnecting = true;

        // Close any existing connection
        if (this.ws) {
          this.ws.close();
        }

        // Add authentication token to WebSocket URL as query parameter
        const url = new URL(this.config.sfuUrl);
        if (this.config.token) {
          url.searchParams.set('token', this.config.token);
        }
        
        const wsUrl = url.toString();
        console.log('Connecting to SFU:', wsUrl);
        console.log('SFU Config:', {
          sfuUrl: this.config.sfuUrl,
          hasToken: !!this.config.token,
          userId: this.config.userId,
          tokenLength: this.config.token?.length
        });
        
        // Validate WebSocket URL
        if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
          throw new Error(`Invalid WebSocket URL: ${wsUrl}. Must start with ws:// or wss://`);
        }
        
        try {
          this.ws = new WebSocket(wsUrl);
          console.log('WebSocket object created:', {
            readyState: this.ws.readyState,
            url: this.ws.url
          });
        } catch (error) {
          console.error('Failed to create WebSocket:', error);
          throw error;
        }
        
        this.ws.onopen = () => {
          console.log('SFU Connected');
          console.log('WebSocket readyState:', this.ws.readyState);
          console.log('WebSocket url:', this.ws.url);
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.connectionPromise = null;
          this.config.onConnected?.();
          resolve();
          
          // Send a ping to keep the connection alive
          setTimeout(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              console.log('Sending ping to keep connection alive');
              this.ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 1000);
        };

        this.ws.onclose = (event) => {
          console.log('SFU WebSocket closed:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            readyState: this.ws?.readyState
          });
          this.isConnected = false;
          this.isConnecting = false;
          this.connectionPromise = null;
          this.config.onDisconnected?.();
          // Don't auto-reconnect to prevent loops
          // this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket connection error:', error);
          console.error('WebSocket state:', {
            readyState: this.ws?.readyState,
            url: this.ws?.url,
            protocol: this.ws?.protocol,
            exists: !!this.ws
          });
          console.error('Config URL:', this.config.sfuUrl);
          console.error('Error type:', error.type);
          console.error('Error target:', error.target);
          
          this.isConnecting = false;
          this.connectionPromise = null;
          
          const errorMsg = `WebSocket connection failed to ${this.config.sfuUrl}. ` +
            `Ensure SFU backend is running on port 3001 and accessible. ` +
            `Current state: ${this.ws?.readyState ?? 'undefined'}`;
          
          this.config.onError?.(new Error(errorMsg));
          reject(new Error(errorMsg));
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('SFU Message received:', message);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing SFU message:', error, 'Raw data:', event.data);
          }
        };

      } catch (error) {
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  async disconnect() {
    console.log('Disconnecting SFU client...', {
      hasWs: !!this.ws,
      isConnected: this.isConnected,
      isConnecting: this.isConnecting
    });
    
    if (this.ws) {
      // Remove event listeners before closing to prevent errors
      this.ws.onopen = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.ws.onmessage = null;
      
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.connectionPromise = null;
    this.roomId = null;
    this.participantId = null;
    this.transport = null;
    this.recvTransport = null;
    this.producers.clear();
    this.consumers.clear();
    
    console.log('SFU client disconnected');
  }

  async createRoom(name, description, maxParticipants = 100) {
    const response = await this.sendMessage({
      type: 'createRoom',
      data: { name, description, maxParticipants }
    });

    if (response.type === 'createRoomResponse') {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to create room');
    }
  }

  async joinRoom(roomId, displayName, metadata = {}) {
    // Check if already joined to prevent duplicate requests
    if (this.roomId === roomId && this.participantId) {
      console.log('Already joined room:', roomId);
      return { 
        participants: [{ id: this.participantId }], 
        routerRtpCapabilities: this.device?.rtpCapabilities 
      };
    }

    try {
      const response = await this.sendMessage({
        type: 'joinRoom',
        data: { roomId, displayName, metadata }
      });

      if (response.type === 'joinRoomResponse') {
        this.roomId = roomId;
        
        // Find our participant ID from the response
        const currentParticipant = response.data.participants?.find(p => p.userId === this.config.userId) || 
                                  response.data.participants?.[0];
        
        if (currentParticipant) {
          this.participantId = currentParticipant.id;
        } else {
          // Fallback: generate a participant ID if not provided
          this.participantId = `participant_${Date.now()}`;
        }
        
        // Initialize mediasoup device
        await this.initializeDevice(response.data.routerRtpCapabilities);
        
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to join room');
      }
    } catch (error) {
      // Handle "Participant already joined" error gracefully
      if (error.message?.includes('Participant already joined')) {
        console.log('Participant already joined, using existing connection');
        // Set room ID if not already set
        if (!this.roomId) {
          this.roomId = roomId;
        }
        return { 
          participants: [{ id: this.participantId || `participant_${Date.now()}` }], 
          routerRtpCapabilities: this.device?.rtpCapabilities 
        };
      }
      throw error;
    }
  }

  async leaveRoom() {
    if (!this.roomId) {
      throw new Error('Not in a room');
    }

    const response = await this.sendMessage({
      type: 'leaveRoom',
      data: { roomId: this.roomId }
    });

    if (response.type === 'leaveRoomResponse') {
      this.roomId = null;
      this.participantId = null;
      this.transport = null;
      this.producers.clear();
      this.consumers.clear();
    } else {
      throw new Error(response.error || 'Failed to leave room');
    }
  }

  async getRouterRtpCapabilities() {
    if (!this.roomId) {
      throw new Error('Not in a room');
    }

    const response = await this.sendMessage({
      type: 'getRouterRtpCapabilities',
      data: { roomId: this.roomId }
    });

    if (response.type === 'getRouterRtpCapabilitiesResponse') {
      return response.data.rtpCapabilities;
    } else {
      throw new Error(response.error || 'Failed to get router capabilities');
    }
  }

  async createTransport(direction) {
    if (!this.roomId) {
      throw new Error('Not in a room');
    }

    if (!this.device) {
      throw new Error('Device not initialized');
    }

    console.log(`Creating ${direction} transport...`);

    const response = await this.sendMessage({
      type: 'createWebRtcTransport',
      data: { roomId: this.roomId, direction }
    });

    if (response.type === 'createWebRtcTransportResponse') {
      const transportOptions = {
        id: response.data.transportId,
        iceParameters: response.data.iceParameters,
        iceCandidates: response.data.iceCandidates,
        dtlsParameters: response.data.dtlsParameters,
      };

      // Add SCTP parameters if available (for data channels)
      if (response.data.sctpParameters) {
        transportOptions.sctpParameters = response.data.sctpParameters;
      }

      let transport;
      if (direction === 'send') {
        transport = this.device.createSendTransport(transportOptions);
      } else {
        transport = this.device.createRecvTransport(transportOptions);
      }

      // Set up transport event handlers
      transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          console.log('Transport connect event, sending to server...');
          const response = await this.sendMessage({
            type: 'connectWebRtcTransport',
            data: {
              roomId: this.roomId,
              transportId: transport.id,
              dtlsParameters
            }
          });

          if (response.type === 'connectWebRtcTransportResponse') {
            console.log('Transport connected successfully');
            callback();
          } else {
            errback(new Error(response.error || 'Failed to connect transport'));
          }
        } catch (error) {
          console.error('Transport connect error:', error);
          errback(error);
        }
      });

      if (direction === 'send') {
        // Handle produce event for send transport
        transport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
          try {
            console.log(`Producing ${kind}...`);
            const response = await this.sendMessage({
              type: 'publish',
              data: {
                roomId: this.roomId,
                kind,
                rtpParameters,
                appData
              }
            });

            console.log(`${kind} publish response:`, response);

            if (response.type === 'publishResponse') {
              console.log(`${kind} producer created:`, response.data.producerId);
              callback({ id: response.data.producerId });
            } else {
              const errorMsg = response.error || 'Failed to publish';
              console.error(`${kind} publish failed:`, errorMsg);
              console.error('Full response:', response);
              errback(new Error(errorMsg));
            }
          } catch (error) {
            console.error('Transport produce error:', error);
            console.error('Error details:', {
              message: error.message,
              name: error.name,
              stack: error.stack
            });
            errback(error);
          }
        });

        this.transport = transport;
      } else {
        this.recvTransport = transport;
      }

      transport.on('connectionstatechange', (state) => {
        console.log(`Transport ${direction} connection state:`, state);
        if (state === 'failed') {
          console.error(`Transport ${direction} connection failed (unexpected)`);
        } else if (state === 'closed') {
          console.log(`Transport ${direction} closed (this is normal during cleanup)`);
        }
      });

      console.log(`${direction} transport created:`, transport.id);
      return transport;
    } else {
      throw new Error(response.error || 'Failed to create transport');
    }
  }

  async connectTransport(dtlsParameters) {
    // This method is no longer needed as connection happens via event handlers
    // Kept for backward compatibility
    console.warn('connectTransport is deprecated, connection happens automatically via event handlers');
  }

  async publishAudio(stream) {
    if (!this.transport) {
      throw new Error('No send transport available');
    }

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) {
      throw new Error('No audio track in stream');
    }

    console.log('Publishing audio track...');
    
    // The produce method will trigger the 'produce' event handler
    // which sends the publish message to the server
    const producer = await this.transport.produce({
      track: audioTrack,
      appData: { kind: 'audio' }
    });

    console.log('Audio producer created:', producer.id);
    this.producers.set(producer.id, producer);
    
    // Set up producer event handlers
    producer.on('trackended', () => {
      console.log('Audio track ended');
    });

    producer.on('transportclose', () => {
      console.log('Transport closed, audio producer closed');
      this.producers.delete(producer.id);
    });

    return producer;
  }

  async publishVideo(stream, isScreenShare = false) {
    if (!this.transport) {
      throw new Error('No send transport available');
    }

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) {
      throw new Error('No video track in stream');
    }

    console.log(`Publishing ${isScreenShare ? 'screen share' : 'video'} track...`);
    
    // The produce method will trigger the 'produce' event handler
    // which sends the publish message to the server
    // Let mediasoup-client generate proper encodings automatically
    const producer = await this.transport.produce({
      track: videoTrack,
      appData: { 
        kind: 'video',
        isScreenShare: isScreenShare  // Mark if this is a screen share
      },
      // Don't specify custom encodings - let mediasoup generate them with proper ssrc/rid
      codecOptions: {
        videoGoogleStartBitrate: 1000
      }
    });

    console.log(`${isScreenShare ? 'Screen share' : 'Video'} producer created:`, producer.id);
    this.producers.set(producer.id, producer);
    
    // Set up producer event handlers
    producer.on('trackended', () => {
      console.log(`${isScreenShare ? 'Screen share' : 'Video'} track ended`);
    });

    producer.on('transportclose', () => {
      console.log(`Transport closed, ${isScreenShare ? 'screen share' : 'video'} producer closed`);
      this.producers.delete(producer.id);
    });

    return producer;
  }


  async unpublish(producerId) {
    const producer = this.producers.get(producerId);
    if (producer) {
      producer.close();
      this.producers.delete(producerId);
    }

    const response = await this.sendMessage({
      type: 'unpublish',
      data: {
        roomId: this.roomId,
        producerId
      }
    });

    if (response.type !== 'unpublishResponse') {
      throw new Error(response.error || 'Failed to unpublish');
    }
  }

  async pauseProducer(producerId) {
    console.log('🔇 Pausing producer on server:', producerId);
    
    const response = await this.sendMessage({
      type: 'pauseProducer',
      data: {
        roomId: this.roomId,
        producerId
      }
    });

    if (response.type !== 'pauseProducerResponse') {
      throw new Error(response.error || 'Failed to pause producer');
    }
    
    console.log('✅ Producer paused on server:', producerId);
  }

  async resumeProducer(producerId) {
    console.log('🔊 Resuming producer on server:', producerId);
    
    const response = await this.sendMessage({
      type: 'resumeProducer',
      data: {
        roomId: this.roomId,
        producerId
      }
    });

    if (response.type !== 'resumeProducerResponse') {
      throw new Error(response.error || 'Failed to resume producer');
    }
    
    console.log('✅ Producer resumed on server:', producerId);
  }

  async subscribe(producerId, participantId) {
    if (!this.recvTransport || !this.device) {
      throw new Error('No recv transport or device available');
    }

    console.log('Subscribing to producer:', producerId, 'from participant:', participantId);

    const response = await this.sendMessage({
      type: 'subscribe',
      data: {
        roomId: this.roomId,
        producerId,
        rtpCapabilities: this.device.rtpCapabilities
      }
    });

    if (response.type === 'subscribeResponse') {
      console.log('✅ Subscribe response received:', {
        consumerId: response.data.consumerId,
        producerId: response.data.producerId,
        kind: response.data.kind,
        paused: response.data.paused
      });
      
      const consumer = await this.recvTransport.consume({
        id: response.data.consumerId,
        producerId: response.data.producerId,
        kind: response.data.kind,
        rtpParameters: response.data.rtpParameters,
        appData: { 
          producerId, 
          participantId, // Store participantId for later use
          isScreenShare: response.data.appData?.isScreenShare || false // Store screen share flag
        }
      });

      console.log('✅ Consumer created on client:', {
        consumerId: consumer.id,
        producerId: producerId,
        kind: consumer.kind,
        paused: consumer.paused,
        rtpParameters: consumer.rtpParameters
      });
      
      this.consumers.set(consumer.id, consumer);
      
      // Set up consumer event handlers
      consumer.on('transportclose', () => {
        console.log('Transport closed, consumer closed');
        this.consumers.delete(consumer.id);
      });

      // Listen for track state changes (when remote user pauses/resumes)
      consumer.track.addEventListener('mute', () => {
        console.log('🔇 Consumer track muted (remote user paused):', consumer.id, 'kind:', consumer.kind);
        // Trigger re-render by updating the stream
        this.config.onRemoteStream?.({
          participantId: consumer.appData.participantId, // Use stored participantId
          stream: new MediaStream([consumer.track]),
          kind: consumer.kind,
          producerId: consumer.appData.producerId
        });
      });

      consumer.track.addEventListener('unmute', () => {
        console.log('🔊 Consumer track unmuted (remote user resumed):', consumer.id, 'kind:', consumer.kind);
        // Trigger re-render by updating the stream
        this.config.onRemoteStream?.({
          participantId: consumer.appData.participantId,
          stream: new MediaStream([consumer.track]),
          kind: consumer.kind,
          producerId: consumer.appData.producerId
        });
      });

      // Resume the consumer to start receiving media
      // Server should have already resumed it, but double-check client side
      if (consumer.paused) {
        console.log('🔄 Consumer is paused on client, resuming...', consumer.id);
        try {
          await this.resumeConsumer(consumer.id);
          console.log('✅ Consumer resumed successfully', consumer.id);
        } catch (error) {
          console.error('❌ Failed to resume consumer:', error);
          // Don't throw - consumer might still work
        }
      } else {
        console.log('✅ Consumer already active (not paused)', consumer.id);
      }

      return consumer;
    } else {
      throw new Error(response.error || 'Failed to subscribe');
    }
  }

  async unsubscribe(consumerId) {
    const consumer = this.consumers.get(consumerId);
    if (consumer) {
      consumer.close();
      this.consumers.delete(consumerId);
    }

    const response = await this.sendMessage({
      type: 'unsubscribe',
      data: {
        roomId: this.roomId,
        consumerId
      }
    });

    if (response.type !== 'unsubscribeResponse') {
      throw new Error(response.error || 'Failed to unsubscribe');
    }
  }

  async pauseConsumer(consumerId) {
    const consumer = this.consumers.get(consumerId);
    if (consumer) {
      await consumer.pause();
    }

    const response = await this.sendMessage({
      type: 'pause',
      data: {
        roomId: this.roomId,
        consumerId
      }
    });

    if (response.type !== 'pauseResponse') {
      throw new Error(response.error || 'Failed to pause consumer');
    }
  }

  async resumeConsumer(consumerId) {
    const consumer = this.consumers.get(consumerId);
    if (consumer) {
      await consumer.resume();
    }

    const response = await this.sendMessage({
      type: 'resume',
      data: {
        roomId: this.roomId,
        consumerId
      }
    });

    if (response.type !== 'resumeResponse') {
      throw new Error(response.error || 'Failed to resume consumer');
    }
  }

  async initializeDevice(routerRtpCapabilities) {
    // Import mediasoup-client dynamically
    const { Device } = await import('mediasoup-client');
    this.device = new Device();
    await this.device.load({ routerRtpCapabilities });
  }

  async sendMessage(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      const readyStateNames = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
      const currentState = this.ws ? readyStateNames[this.ws.readyState] : 'NO WEBSOCKET';
      throw new Error(`WebSocket not connected (current state: ${currentState}). Please ensure SFU backend is running on port 3001.`);
    }

    const requestId = Math.random().toString(36).substr(2, 9);
    message.requestId = requestId;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Request timeout for ${message.type}`));
      }, 10000);

      const handleMessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          if (response.requestId === requestId) {
            clearTimeout(timeout);
            this.ws.removeEventListener('message', handleMessage);
            resolve(response);
          }
        } catch (error) {
          clearTimeout(timeout);
          this.ws.removeEventListener('message', handleMessage);
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      };

      this.ws.addEventListener('message', handleMessage);
      this.ws.send(JSON.stringify(message));
    });
  }

  async handleRemoteProducer(producerId, participantId) {
    console.log('🎬 handleRemoteProducer called:', { 
      producerId, 
      participantId,
      participantIdType: typeof participantId,
      hasRecvTransport: !!this.recvTransport,
      hasDevice: !!this.device,
      recvTransportState: this.recvTransport?.connectionState
    });
    
    // Need recv transport (not send transport) to consume remote media
    if (!this.recvTransport || !this.device) {
      console.error('❌ No recv transport or device available for remote producer!');
      console.error('  - hasRecvTransport:', !!this.recvTransport);
      console.error('  - hasDevice:', !!this.device);
      console.error('  - hasTransport (send):', !!this.transport);
      console.error('This is a critical error - recv transport should have been created during joinRoom()');
      return;
    }

    try {
      console.log('📥 Subscribing to remote producer:', {
        producerId,
        participantId,
        transportState: this.recvTransport.connectionState
      });
      
      // Subscribe to the remote producer (pass participantId for tracking)
      const consumer = await this.subscribe(producerId, participantId);
      
      console.log('✅ Consumer created and ready:', { 
        consumerId: consumer.id, 
        kind: consumer.kind,
        participantId,
        paused: consumer.paused,
        track: {
          id: consumer.track.id,
          kind: consumer.track.kind,
          enabled: consumer.track.enabled,
          readyState: consumer.track.readyState,
          muted: consumer.track.muted
        }
      });
      
      // Create a media stream from the consumer
      const stream = new MediaStream([consumer.track]);
      
      console.log('🎥 Created MediaStream from consumer:', {
        streamId: stream.id,
        trackCount: stream.getTracks().length,
        tracks: stream.getTracks().map(t => ({
          id: t.id,
          kind: t.kind,
          enabled: t.enabled,
          readyState: t.readyState
        }))
      });
      
      // Notify about the new remote stream
      this.config.onRemoteStream?.({
        participantId,
        producerId,
        stream,
        consumer,
        kind: consumer.kind
      });
      
      console.log('✅ Remote stream notification sent for participant:', {
        participantId,
        participantIdType: typeof participantId,
        kind: consumer.kind,
        streamId: stream.id
      });
      
      return consumer;
    } catch (error) {
      console.error('❌ Failed to handle remote producer:', {
        producerId,
        participantId,
        error: error.message,
        stack: error.stack
      });
    }
  }

  async handleRemoteProducerClosed(producerId) {
    // Find and close the consumer for this producer
    for (const [consumerId, consumer] of this.consumers.entries()) {
      if (consumer.appData?.producerId === producerId) {
        consumer.close();
        this.consumers.delete(consumerId);
        
        // Notify about stream removal
        this.config.onRemoteStreamClosed?.(producerId);
        break;
      }
    }
  }

  handleMessage(message) {
    console.log('📨 SFU handleMessage:', { type: message.type, data: message.data });
    
    switch (message.type) {
      case 'participantJoined':
        console.log('👤 participantJoined event');
        this.config.onParticipantJoined?.(message.data.participant);
        break;
      case 'participantLeft':
        console.log('👋 participantLeft event');
        this.config.onParticipantLeft?.(message.data.participantId);
        break;
      case 'producerCreated':
        console.log('🎥 producerCreated event:', {
          producerId: message.data.producer.id,
          participantId: message.data.participantId,
          kind: message.data.producer.kind,
          appData: message.data.producer.appData
        });
        this.config.onProducerCreated?.(message.data.producer, message.data.participantId);
        
        // Check if this is a screen share producer
        const isScreenShare = message.data.producer.appData?.isScreenShare === true;
        
        // Notify about screen sharing state change
        if (isScreenShare) {
          console.log('🖥️ Screen share started by participant:', message.data.participantId);
          this.config.onScreenShareStateChanged?.({
            participantId: message.data.participantId,
            isScreenSharing: true
          });
        }
        
        // Notify about media state change (producer created = media enabled)
        this.config.onProducerMediaStateChanged?.({
          participantId: message.data.participantId,
          kind: message.data.producer.kind,
          enabled: true,
          isScreenShare: isScreenShare
        });
        // Handle remote producer
        this.handleRemoteProducer(message.data.producer.id, message.data.participantId);
        break;
      case 'producerClosed':
        console.log('🚫 producerClosed event:', {
          producerId: message.data.producerId,
          participantId: message.data.participantId
        });
        this.config.onProducerClosed?.(message.data.producerId, message.data.participantId);
        
        // Try to determine the kind from consumer mapping to update state
        // Find the consumer that was consuming this producer to get the kind
        let wasScreenShare = false;
        for (const [consumerId, consumer] of this.consumers.entries()) {
          if (consumer.appData?.producerId === message.data.producerId) {
            wasScreenShare = consumer.appData?.isScreenShare === true;
            this.config.onProducerMediaStateChanged?.({
              participantId: message.data.participantId,
              kind: consumer.kind,
              enabled: false,
              isScreenShare: wasScreenShare
            });
            break;
          }
        }
        
        // Notify about screen sharing stopped if it was a screen share
        if (wasScreenShare) {
          console.log('🖥️ Screen share stopped by participant:', message.data.participantId);
          this.config.onScreenShareStateChanged?.({
            participantId: message.data.participantId,
            isScreenSharing: false
          });
        }
        
        // Handle remote producer closed
        this.handleRemoteProducerClosed(message.data.producerId);
        break;
      case 'consumerCreated':
        console.log('🔊 consumerCreated event');
        this.config.onConsumerCreated?.(message.data.consumer);
        break;
      case 'consumerClosed':
        console.log('🔇 consumerClosed event');
        this.config.onConsumerClosed?.(message.data.consumerId);
        break;
      case 'producerPaused':
        console.log('⏸️ producerPaused event:', {
          producerId: message.data.producerId,
          participantId: message.data.participantId,
          kind: message.data.kind
        });
        this.config.onProducerPaused?.(message.data);
        break;
      case 'producerResumed':
        console.log('▶️ producerResumed event:', {
          producerId: message.data.producerId,
          participantId: message.data.participantId,
          kind: message.data.kind
        });
        this.config.onProducerResumed?.(message.data);
        break;
      case 'pong':
        console.log('🏓 Received pong from SFU server');
        break;
      case 'connected':
        console.log('🔌 Connected message');
        break;
      default:
        console.log('❓ Unknown message type:', message.type);
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.config.onError?.(new Error('Max reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      this.connect().catch((error) => {
        this.config.onError?.(error);
      });
    }, delay);
  }

  // Getters
  get isConnectedToRoom() {
    return this.roomId !== null;
  }

  get currentRoomId() {
    return this.roomId;
  }

  get currentParticipantId() {
    return this.participantId;
  }

  get currentTransport() {
    return this.transport;
  }

  get currentProducers() {
    return this.producers;
  }

  get currentConsumers() {
    return this.consumers;
  }

  // Get WebRTC statistics for call quality monitoring
  async getConnectionStats() {
    try {
      const stats = {
        bandwidth: { upload: 0, download: 0 },
        latency: 0,
        packetLoss: 0,
        quality: 'good',
        timestamp: Date.now()
      };

      // Get stats from send transport (upload)
      if (this.transport) {
        try {
          const sendStats = await this.transport.getStats();
          sendStats.forEach((report) => {
            if (report.type === 'outbound-rtp') {
              // Calculate upload bandwidth (bits per second)
              if (report.bytesSent && report.timestamp) {
                stats.bandwidth.upload = Math.floor((report.bytesSent * 8) / 1000); // kbps
              }
            }
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              // Get RTT (Round Trip Time) as latency
              if (report.currentRoundTripTime) {
                stats.latency = Math.floor(report.currentRoundTripTime * 1000); // Convert to ms
              }
            }
          });
        } catch (err) {
          console.warn('Error getting send transport stats:', err);
        }
      }

      // Get stats from receive transport (download)
      if (this.recvTransport) {
        try {
          const recvStats = await this.recvTransport.getStats();
          recvStats.forEach((report) => {
            if (report.type === 'inbound-rtp') {
              // Calculate download bandwidth
              if (report.bytesReceived && report.timestamp) {
                stats.bandwidth.download = Math.floor((report.bytesReceived * 8) / 1000); // kbps
              }
              // Calculate packet loss percentage
              if (report.packetsLost !== undefined && report.packetsReceived !== undefined) {
                const totalPackets = report.packetsReceived + report.packetsLost;
                if (totalPackets > 0) {
                  stats.packetLoss = (report.packetsLost / totalPackets) * 100;
                }
              }
            }
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              // Get RTT if not already set
              if (!stats.latency && report.currentRoundTripTime) {
                stats.latency = Math.floor(report.currentRoundTripTime * 1000);
              }
            }
          });
        } catch (err) {
          console.warn('Error getting receive transport stats:', err);
        }
      }

      // Calculate overall quality based on metrics
      const totalBandwidth = stats.bandwidth.upload + stats.bandwidth.download;
      
      if (totalBandwidth > 1500 && stats.latency < 100 && stats.packetLoss < 1) {
        stats.quality = 'excellent';
      } else if (totalBandwidth > 800 && stats.latency < 150 && stats.packetLoss < 3) {
        stats.quality = 'good';
      } else if (totalBandwidth > 400 && stats.latency < 250 && stats.packetLoss < 5) {
        stats.quality = 'fair';
      } else {
        stats.quality = 'poor';
      }

      return stats;
    } catch (error) {
      console.error('Error getting connection stats:', error);
      return {
        bandwidth: { upload: 0, download: 0 },
        latency: 0,
        packetLoss: 0,
        quality: 'unknown',
        timestamp: Date.now()
      };
    }
  }
}