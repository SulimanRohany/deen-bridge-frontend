"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { notificationAPI } from '@/lib/api'
import { config } from '@/lib/config'

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      // Check if user is authenticated
      const authTokens = localStorage.getItem('authTokens')
      if (!authTokens) {
        console.log('No auth tokens found, skipping notification fetch')
        setNotifications([])
        setUnreadCount(0)
        setLoading(false)
        return
      }
      
      const [notifResponse, countResponse] = await Promise.all([
        notificationAPI.getNotifications({ limit: 50 }),
        notificationAPI.getUnreadCount()
      ])
      
      // Handle paginated response format
      const notificationData = notifResponse.data?.results || notifResponse.data || []
      setNotifications(notificationData)
      setUnreadCount(countResponse.data?.unread_count || 0)
    } catch (err) {
      console.warn('⚠️ Could not fetch notifications:', err.response?.status || err.message)
      
      // Handle specific error cases
      if (err.response?.status === 404) {
        console.log('ℹ️ Notifications endpoint not found. This is normal if notifications app is not configured.')
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('ℹ️ Not authenticated. Please log in to see notifications.')
      } else {
        console.log('ℹ️ Notifications API unavailable. Continuing without notifications.')
      }
      
      // Set empty state instead of showing error
      setNotifications([])
      setUnreadCount(0)
      // Don't set error to avoid showing error to users
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Connect to WebSocket for real-time updates
  const connectWebSocket = useCallback(() => {
    if (!userId) return
    
    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close()
    }

    try {
      // Get auth token
      const authTokens = localStorage.getItem('authTokens')
      if (!authTokens) {
        console.log('No auth tokens found, skipping WebSocket connection')
        return
      }

      const tokens = JSON.parse(authTokens)
      if (!tokens.access) {
        console.log('No access token found, skipping WebSocket connection')
        return
      }

      const wsUrl = config.WS_BASE_URL
      
      console.log(`Attempting to connect to WebSocket: ${wsUrl}/ws/notifications/`)
      
      // Create WebSocket connection with JWT token
      const ws = new WebSocket(`${wsUrl}/ws/notifications/?token=${tokens.access}`)
      
      ws.onopen = () => {
        console.log('✅ Notification WebSocket connected successfully')
        setIsConnected(true)
        setError(null)
        
        // Clear any pending reconnection attempts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'new_notification') {
            console.log('📬 New notification received:', data.notification)
            // Add new notification to the list
            setNotifications(prev => [data.notification, ...prev])
            setUnreadCount(prev => prev + 1)
            
            // Optional: Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(data.notification.title, {
                body: data.notification.body,
                icon: '/favicon.ico',
                badge: '/favicon.ico'
              })
            }
          } else if (data.type === 'notification_updated') {
            console.log('🔄 Notification updated:', data.notification_id)
            // Update existing notification
            setNotifications(prev => 
              prev.map(n => 
                n.id === data.notification_id 
                  ? { ...n, ...data.updates } 
                  : n
              )
            )
          } else if (data.type === 'connection_established') {
            console.log('✅ WebSocket connection established')
          }
        } catch (err) {
          console.error('❌ Error parsing WebSocket message:', err)
        }
      }

      ws.onerror = (error) => {
        console.warn('⚠️ WebSocket connection error (this is normal if backend is not running with WebSocket support)')
        console.warn('To enable real-time notifications, start backend with: .\\start-with-daphne.ps1')
        // Don't set error state to avoid showing errors to users
        // WebSocket is optional - notifications will still work via polling
      }

      ws.onclose = (event) => {
        console.log('🔌 Notification WebSocket disconnected')
        setIsConnected(false)
        
        // Only attempt to reconnect if it was an unexpected close
        // Don't reconnect if server is not available (code 1006) to avoid spam
        if (event.code !== 1000 && event.code !== 1006) {
          console.log('Will attempt to reconnect in 5 seconds...')
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...')
            connectWebSocket()
          }, 5000)
        } else if (event.code === 1006) {
          console.log('ℹ️ WebSocket server not available. Real-time updates disabled.')
          console.log('Notifications will still work, but will require page refresh.')
        }
      }

      wsRef.current = ws
    } catch (err) {
      console.warn('⚠️ Could not establish WebSocket connection:', err.message)
      console.log('ℹ️ This is normal if backend is not running with Daphne')
      console.log('Notifications will still work via REST API')
      // Don't set error to avoid alarming users
    }
  }, [userId])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId)
      
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, is_read: true }
            : n
        )
      )
      
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }, [])

  // Mark notification as unread
  const markAsUnread = useCallback(async (notificationId) => {
    try {
      await notificationAPI.markAsUnread(notificationId)
      
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, is_read: false }
            : n
        )
      )
      
      setUnreadCount(prev => prev + 1)
    } catch (err) {
      console.error('Error marking notification as unread:', err)
    }
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationAPI.markAllAsRead()
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      )
      
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }, [])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationAPI.delete(notificationId)
      
      setNotifications(prev => {
        const notification = prev.find(n => n.id === notificationId)
        if (notification && !notification.is_read) {
          setUnreadCount(count => Math.max(0, count - 1))
        }
        return prev.filter(n => n.id !== notificationId)
      })
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }, [])

  // Delete all notifications
  const deleteAll = useCallback(async () => {
    try {
      await notificationAPI.deleteAll()
      setNotifications([])
      setUnreadCount(0)
    } catch (err) {
      console.error('Error deleting all notifications:', err)
    }
  }, [])

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return Notification.permission === 'granted'
  }, [])

  // Initialize
  useEffect(() => {
    if (userId) {
      fetchNotifications()
      connectWebSocket()
    } else {
      // Reset state when no user
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      setError(null)
      setIsConnected(false)
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [userId, fetchNotifications, connectWebSocket])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    isConnected,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    deleteAll,
    refetch: fetchNotifications,
    requestNotificationPermission
  }
}

