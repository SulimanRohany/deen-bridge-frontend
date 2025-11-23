'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './use-auth';
import { config } from '@/lib/config';

/**
 * Custom hook for real-time chat in live sessions using WebSocket
 * 
 * @param {string} sessionId - The session ID to connect to
 * @param {object} options - Configuration options
 * @returns {object} Chat state and methods
 */
export function useChat(sessionId, options = {}) {
  const { authTokens } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const typingTimeoutRef = useRef(null);
  const maxReconnectAttempts = options.maxReconnectAttempts || 5;
  
  // WebSocket URL - connect to Django Channels backend
  const getWebSocketUrl = useCallback(() => {
    if (!sessionId) {
      console.warn('⚠️ No session ID provided for chat WebSocket');
      return null;
    }
    
    // Extract host from WS_BASE_URL (e.g., ws://127.0.0.1:8000 -> 127.0.0.1:8000)
    // Or use the protocol from current location if in production
    const wsBaseUrl = config.WS_BASE_URL;
    let wsUrl;
    
    // If WS_BASE_URL is a full URL (starts with ws:// or wss://), extract host
    if (wsBaseUrl.startsWith('ws://') || wsBaseUrl.startsWith('wss://')) {
      const url = new URL(wsBaseUrl);
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${url.host}/ws/sessions/${sessionId}/chat/`;
    } else {
      // If it's just a host, use it directly
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${wsBaseUrl}/ws/sessions/${sessionId}/chat/`;
    }
    
    const token = authTokens?.access || '';
    
    if (!token) {
      console.warn('⚠️ No auth token available for chat WebSocket');
    }
    
    // Include token in URL for authentication
    const finalWsUrl = `${wsUrl}?token=${token}`;
    console.log('🔗 Chat WebSocket URL:', finalWsUrl.replace(token, 'TOKEN_HIDDEN'));
    
    return finalWsUrl;
  }, [sessionId, authTokens]);
  
  /**
   * Connect to the WebSocket
   */
  const connect = useCallback(() => {
    if (!sessionId || !authTokens?.access) {
      console.log('⏳ Waiting for session ID and auth tokens...');
      return;
    }
    
    if (wsRef.current?.readyState === WebSocket.OPEN || isConnecting) {
      console.log('Already connected or connecting to chat');
      return;
    }
    
    try {
      setIsConnecting(true);
      setError(null);
      
      const wsUrl = getWebSocketUrl();
      console.log('🔌 Connecting to chat WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('✅ Chat WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
        
        // Request chat history
        ws.send(JSON.stringify({
          type: 'get_history',
          limit: options.historyLimit || 50,
        }));
        
        options.onConnected?.();
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📩 Chat message received:', data.type);
          
          switch (data.type) {
            case 'connection_established':
              console.log('Chat connection established:', data);
              break;
            
            case 'chat_message':
              // New chat message
              console.log('📨 Full message data:', {
                hasMessage: !!data.message,
                messageId: data.message?.id,
                messageSender: data.message?.sender_name,
                hasUnreadCount: data.unread_count !== undefined,
                unreadCount: data.unread_count
              });
              
              setMessages((prev) => {
                // Check if message already exists to avoid duplicates
                const exists = prev.some(msg => msg.id === data.message.id);
                if (exists) return prev;
                return [...prev, data.message];
              });
              
              // Update unread count if provided (for messages from other users)
              if (data.unread_count !== undefined) {
                setUnreadCount(data.unread_count);
                console.log('🔔 Unread count updated:', data.unread_count);
              } else {
                console.warn('⚠️ No unread_count in message data!');
              }
              
              options.onMessage?.(data.message);
              break;
            
            case 'chat_history':
              // Chat history received
              console.log('📜 Chat history received:', data.messages.length, 'messages');
              setMessages(data.messages);
              if (data.unread_count !== undefined) {
                setUnreadCount(data.unread_count);
              }
              break;
            
            case 'user_joined':
              console.log('👋 User joined:', data.user_name);
              options.onUserJoined?.(data);
              break;
            
            case 'user_left':
              console.log('👋 User left:', data.user_name);
              options.onUserLeft?.(data);
              break;
            
            case 'user_typing':
              // Handle typing indicator
              if (data.is_typing) {
                setTypingUsers((prev) => new Set(prev).add(data.user_name));
              } else {
                setTypingUsers((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(data.user_name);
                  return newSet;
                });
              }
              break;
            
            case 'messages_marked_read':
              // Messages were marked as read
              console.log('✅ Marked messages as read:', data.marked_count);
              // Use the actual unread count from backend (in case new messages arrived)
              if (data.unread_count !== undefined) {
                setUnreadCount(data.unread_count);
              } else {
                setUnreadCount(0); // Fallback for backwards compatibility
              }
              break;
            
            case 'error':
              console.error('❌ Chat error:', data.message);
              setError(data.message);
              options.onError?.(data.message);
              break;
            
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (err) {
          console.error('Error parsing chat message:', err);
        }
      };
      
      ws.onerror = (event) => {
        // WebSocket error events don't always have detailed information
        const errorInfo = {
          type: event?.type || 'unknown',
          readyState: event?.target?.readyState ?? 'unknown',
          url: event?.target?.url ? event.target.url.replace(/token=[^&]*/, 'token=HIDDEN') : 'unknown',
        };
        
        if (process.env.NODE_ENV === 'development') {
          console.error('Chat WebSocket error event:', errorInfo);
        }
        
        // Only set error if we're not already connected (to avoid overwriting successful connections)
        if (!isConnected) {
          const errorMsg = 'Chat connection failed. Please ensure the Django server is running with an ASGI server (daphne or uvicorn) for WebSocket support. Regular runserver does not support WebSockets.';
          setError(errorMsg);
          options.onError?.(errorMsg);
        }
      };
      
      ws.onclose = (event) => {
        console.log('🔌 Chat WebSocket closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        
        // Log specific close codes for debugging (always log errors)
        if (event.code === 1006) {
          const errorMsg = 'WebSocket connection failed. The Django server must be running with an ASGI server (daphne or uvicorn) to support WebSockets. Regular runserver does not support WebSockets.';
          console.error('WebSocket closed abnormally (1006):', errorMsg);
          if (process.env.NODE_ENV === 'development') {
            console.error('  - Backend server not running with ASGI server');
            console.error('  - Network connection issues');
            console.error('  - CORS or authentication problems');
            console.error('  - Run: daphne -b 0.0.0.0 -p 8000 backend.asgi:application');
          }
          if (!isConnected) {
            setError(errorMsg);
            options.onError?.(errorMsg);
          }
        } else if (event.code === 4001) {
          const errorMsg = 'WebSocket authentication failed. Please log in again.';
          console.error('WebSocket closed: Unauthorized (4001)');
          setError(errorMsg);
          options.onError?.(errorMsg);
        } else if (event.code === 4002) {
          const errorMsg = 'WebSocket connection error occurred.';
          console.error('WebSocket closed: Connection error (4002)');
          if (!isConnected) {
            setError(errorMsg);
            options.onError?.(errorMsg);
          }
        }
        
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Failed to connect after multiple attempts');
          options.onError?.('Failed to connect after multiple attempts');
        }
        
        options.onDisconnected?.();
      };
      
    } catch (err) {
      console.error('Error creating chat WebSocket:', err);
      setError('Failed to create connection');
      setIsConnecting(false);
      options.onError?.('Failed to create connection');
    }
  }, [sessionId, authTokens, isConnecting, getWebSocketUrl, options, maxReconnectAttempts]);
  
  /**
   * Disconnect from the WebSocket
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      console.log('Disconnecting from chat WebSocket');
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
  }, []);
  
  /**
   * Send a chat message
   */
  const sendMessage = useCallback((message) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      setError('Not connected to chat');
      return false;
    }
    
    if (!message.trim()) {
      console.error('Cannot send empty message');
      return false;
    }
    
    try {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        message: message.trim(),
      }));
      
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      return false;
    }
  }, []);
  
  /**
   * Send typing indicator
   */
  const sendTypingIndicator = useCallback((isTyping) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }
    
    try {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        is_typing: isTyping,
      }));
    } catch (err) {
      console.error('Error sending typing indicator:', err);
    }
  }, []);
  
  /**
   * Start typing (with auto-stop after 3 seconds)
   */
  const startTyping = useCallback(() => {
    sendTypingIndicator(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Auto-stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
    }, 3000);
  }, [sendTypingIndicator]);
  
  /**
   * Stop typing
   */
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    sendTypingIndicator(false);
  }, [sendTypingIndicator]);
  
  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);
  
  /**
   * Mark all messages as read via WebSocket
   */
  const markMessagesRead = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }
    
    try {
      wsRef.current.send(JSON.stringify({
        type: 'mark_read',
      }));
      
      // Don't reset local unread count here - wait for backend confirmation
      // The 'messages_marked_read' response will update it with the actual count
      
      return true;
    } catch (err) {
      console.error('Error marking messages as read:', err);
      return false;
    }
  }, []);
  
  /**
   * Fetch unread count from backend (via API)
   */
  const fetchUnreadCount = useCallback(async () => {
    if (!sessionId || !authTokens?.access) {
      return 0;
    }
    
    try {
      const { config } = await import('@/lib/config');
      const response = await fetch(
        config.API_BASE_URL + `chat/messages/session/${sessionId}/unread-count/`,
        {
          headers: {
            'Authorization': `Bearer ${authTokens.access}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count);
        return data.unread_count;
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
    
    return 0;
  }, [sessionId, authTokens]);
  
  // Auto-connect when sessionId and auth tokens are available
  useEffect(() => {
    if (sessionId && authTokens?.access && options.autoConnect !== false) {
      connect();
    }
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [sessionId, authTokens?.access, options.autoConnect]); // Only depend on external values
  
  // Fetch initial unread count when connected
  useEffect(() => {
    if (isConnected && sessionId && authTokens?.access) {
      fetchUnreadCount();
    }
  }, [isConnected, sessionId, authTokens?.access, fetchUnreadCount]);
  
  // Also fetch unread count when component first mounts (even before WebSocket connects)
  useEffect(() => {
    if (sessionId && authTokens?.access) {
      fetchUnreadCount();
    }
  }, []); // Empty dependency - run once on mount
  
  return {
    // State
    messages,
    isConnected,
    isConnecting,
    error,
    typingUsers: Array.from(typingUsers),
    unreadCount,
    
    // Methods
    connect,
    disconnect,
    sendMessage,
    startTyping,
    stopTyping,
    clearMessages,
    markMessagesRead,
    fetchUnreadCount,
  };
}

