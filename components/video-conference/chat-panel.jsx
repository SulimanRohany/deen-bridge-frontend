"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, Send, Loader2, User, Smile, ArrowUp, Users, X } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { useChat } from "@/hooks/use-chat"
import { useAuth } from "@/hooks/use-auth"

export function ChatPanel({ roomId, isOpen, onToggle, onUnreadCountChange, isObserverMode = false }) {
  const { userData, authTokens } = useAuth()
  const [newMessage, setNewMessage] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const emojiButtonRef = useRef(null)
  const MAX_CHARS = 1000
  
  // Use the real-time chat hook
  const {
    messages,
    isConnected,
    isConnecting,
    error,
    typingUsers,
    unreadCount,
    sendMessage,
    startTyping,
    stopTyping,
    markMessagesRead,
    fetchUnreadCount,
  } = useChat(roomId, {
    autoConnect: true,
    historyLimit: 100,
    onMessage: (message) => {
      console.log('New message received:', message)
    },
    onError: (error) => {
      console.error('Chat error:', error)
    },
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Update parent with unread count from backend
  useEffect(() => {
    if (onUnreadCountChange && unreadCount !== undefined) {
      console.log('📊 ChatPanel: Updating parent with unread count:', unreadCount)
      onUnreadCountChange(unreadCount)
    }
  }, [unreadCount, onUnreadCountChange])
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Scroll to bottom and mark messages as read when chat panel is opened
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the sheet animation has started
      setTimeout(() => {
        scrollToBottom()
      }, 100)
      
      // Mark all messages as read when chat is opened
      if (isConnected && markMessagesRead) {
        markMessagesRead()
      }
    }
  }, [isOpen, isConnected, markMessagesRead])

  // Auto-mark messages as read when new messages arrive while chat is open
  useEffect(() => {
    if (isOpen && isConnected && messages.length > 0 && markMessagesRead) {
      // Get the latest message
      const latestMessage = messages[messages.length - 1]
      
      // Only mark as read if it's not from the current user
      if (latestMessage.sender_id !== userData?.id) {
        console.log('📖 Auto-marking new message as read (chat is open)')
        // Small delay to ensure message is rendered and visible
        setTimeout(() => {
          markMessagesRead()
        }, 500)
      }
    }
  }, [messages.length, isOpen, isConnected, markMessagesRead, messages, userData?.id])

  // Scroll to bottom when typing indicator appears/disappears
  useEffect(() => {
    if (typingUsers.length > 0) {
      scrollToBottom()
    }
  }, [typingUsers])

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto'
    
    // Calculate the height based on scrollHeight
    const lineHeight = 24 // Approximate line height in pixels
    const maxRows = 4
    const maxHeight = lineHeight * maxRows
    
    // Set the new height (min 1 row, max 4 rows)
    const newHeight = Math.min(textarea.scrollHeight, maxHeight)
    textarea.style.height = `${newHeight}px`
  }

  // Adjust height when message changes
  useEffect(() => {
    adjustTextareaHeight()
    setCharCount(newMessage.length)
  }, [newMessage])

  // Close emoji picker when clicking outside (but not the emoji button itself)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking the emoji button or the emoji picker itself
      if (
        emojiPickerRef.current && 
        !emojiPickerRef.current.contains(event.target) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  // Carefully curated emoji collection for quick access
  const popularEmojis = [
    { emoji: '😊', label: 'Smiling Face' },
    { emoji: '😂', label: 'Laughing' },
    { emoji: '❤️', label: 'Red Heart' },
    { emoji: '👍', label: 'Thumbs Up' },
    { emoji: '🎉', label: 'Party Popper' },
    { emoji: '🔥', label: 'Fire' },
    { emoji: '✨', label: 'Sparkles' },
    { emoji: '💯', label: 'Hundred Points' },
    { emoji: '🙏', label: 'Folded Hands' },
    { emoji: '👏', label: 'Clapping Hands' },
    { emoji: '😍', label: 'Heart Eyes' },
    { emoji: '🤔', label: 'Thinking' },
    { emoji: '😎', label: 'Cool' },
    { emoji: '🚀', label: 'Rocket' },
    { emoji: '💡', label: 'Light Bulb' }
  ]

  const handleEmojiClick = (emoji) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    const textBefore = newMessage.substring(0, cursorPos)
    const textAfter = newMessage.substring(cursorPos)
    const newText = textBefore + emoji + textAfter

    if (newText.length <= MAX_CHARS) {
      setNewMessage(newText)
      
      // Set cursor position after emoji and refocus
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length)
      }, 0)
    }
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !isConnected) return
    
    const success = sendMessage(newMessage)
    
    if (success) {
      setNewMessage("")
      setCharCount(0)
      stopTyping()
      setShowEmojiPicker(false)
      
      // Reset textarea height and focus
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
          textareaRef.current.focus()
        }
      }, 0)
    }
  }
  
  const handleInputChange = (e) => {
    const value = e.target.value
    
    // Enforce character limit
    if (value.length <= MAX_CHARS) {
      setNewMessage(value)
      
      // Send typing indicator when user starts typing
      if (value.trim()) {
        startTyping()
      } else {
        stopTyping()
      }
    }
  }
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  
  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch (err) {
      return ''
    }
  }
  
  const isOwnMessage = (message) => {
    return message.sender_id === userData?.id
  }

  // Get unique participants count from messages
  const participantCount = React.useMemo(() => {
    const uniqueSenders = new Set(messages.map(m => m.sender_id))
    return uniqueSenders.size
  }, [messages])

  return (
    <Sheet open={isOpen} onOpenChange={onToggle}>
      <SheetContent side="right" className="bg-gradient-to-b from-gray-800 to-gray-850 border-gray-700/50 text-white w-full sm:max-w-md flex flex-col h-full p-0 shadow-2xl [&>button]:hidden">
        {/* Enhanced Header */}
        <SheetHeader className="relative p-0 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/95 via-gray-800/98 to-gray-800/95 backdrop-blur-md">
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 pointer-events-none"></div>
          
          <div className="relative p-5 pb-4">
            {/* Top Row: Title and Close Button */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {/* Animated Icon Container */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl blur-md"></div>
                  <div className="relative bg-gradient-to-br from-primary to-secondary p-2.5 rounded-xl shadow-lg">
                    <MessageCircle className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                
                {/* Title */}
                <div className="flex flex-col">
                  <SheetTitle className="text-white text-xl font-bold tracking-tight flex items-center gap-2">
                    Session Chat
                    {messages.length > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold text-primary bg-primary/20 rounded-full border border-primary/30">
                        {messages.length}
                      </span>
                    )}
                  </SheetTitle>
                  <SheetDescription className="text-gray-400 text-xs mt-0.5 font-medium">
                    Real-time collaboration
                  </SheetDescription>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onToggle}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200 active:scale-95"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Row */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Connection Status Badge */}
              <div className="flex items-center gap-2">
            {isConnected && (
                  <div className="group flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg transition-all duration-300 hover:bg-green-500/15">
                    <div className="relative">
                      <span className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></span>
                      <span className="relative w-2 h-2 bg-green-400 rounded-full block"></span>
                    </div>
                    <span className="text-xs font-semibold text-green-400">
                Connected
              </span>
                  </div>
            )}
                
            {isConnecting && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <Loader2 className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
                    <span className="text-xs font-semibold text-yellow-400">
                Connecting...
              </span>
                  </div>
            )}
                
            {!isConnected && !isConnecting && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-xs font-semibold text-red-400">
                Disconnected
              </span>
                  </div>
                )}
              </div>

              {/* Participants Counter */}
              {participantCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/40 border border-gray-600/40 rounded-lg backdrop-blur-sm">
                  <Users className="w-3.5 h-3.5 text-gray-300" />
                  <span className="text-xs font-semibold text-gray-300">
                    {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Connection Error */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 text-sm mt-8">
                <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p>No messages yet</p>
                <p className="text-xs mt-1">Start the conversation!</p>
              </div>
            ) : (
              <>
                {messages.map((message) => {
                  const isOwn = isOwnMessage(message)
                  
                  return (
                    <div 
                      key={message.id} 
                      className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {/* Profile Picture */}
                      <div className="flex-shrink-0">
                        {message.sender_profile_picture ? (
                          <img
                            src={message.sender_profile_picture}
                            alt={message.sender_name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Message Content */}
                      <div className={`flex flex-col max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
                        {/* Sender name and role (only for other users' messages) */}
                        {!isOwn && (
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <span className="font-medium text-xs text-gray-300">
                              {message.sender_name}
                            </span>
                            {message.sender_role === 'teacher' && (
                              <span className="px-1.5 py-0.5 bg-secondary/20 text-secondary rounded text-[10px] font-medium">
                                Teacher
                              </span>
                            )}
                          </div>
                        )}

                        {/* Message bubble */}
                        <div
                          className={`rounded-2xl text-sm overflow-hidden ${
                            isOwn 
                              ? "bg-primary text-white rounded-tr-sm" 
                              : "bg-gray-700 text-gray-100 rounded-tl-sm"
                          }`}
                        >
                          {/* Text message */}
                          <div className="px-3 py-2 whitespace-pre-wrap leading-relaxed" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            {message.message}
                          </div>
                        </div>

                        {/* Timestamp */}
                        <div className="text-[10px] text-gray-500 mt-0.5 px-1">
                          {formatTime(message.created_at)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </>
            )}

            {/* Typing Indicator - Shows at bottom like a message */}
            {typingUsers.length > 0 && (
              <div 
                className="flex gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
              >
                {/* Empty space for profile picture alignment */}
                <div className="flex-shrink-0 w-8 h-8"></div>

                {/* Typing Indicator Content */}
                <div className="flex flex-col items-start">
                  {/* Typing bubble */}
                  <div className="px-4 py-3 bg-gradient-to-br from-gray-700/90 to-gray-700/70 rounded-2xl rounded-tl-sm backdrop-blur-sm border border-gray-600/30 shadow-lg">
                    <div className="flex items-center gap-2.5">
                      {/* Animated typing dots */}
                      <div className="flex gap-1">
                        <span 
                          className="w-2 h-2 bg-primary rounded-full animate-bounce shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
                          style={{ animationDelay: '0ms', animationDuration: '1s' }}
                        ></span>
                        <span 
                          className="w-2 h-2 bg-primary rounded-full animate-bounce shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
                          style={{ animationDelay: '200ms', animationDuration: '1s' }}
                        ></span>
                        <span 
                          className="w-2 h-2 bg-primary rounded-full animate-bounce shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
                          style={{ animationDelay: '400ms', animationDuration: '1s' }}
                        ></span>
                      </div>
                      
                      {/* Typing text */}
                      <span className="text-xs text-gray-300 font-medium ml-0.5">
                        {typingUsers.length === 1 
                          ? `${typingUsers[0]} is typing` 
                          : `${typingUsers.length} people are typing`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-700 bg-gray-800/95 backdrop-blur-sm">
            {/* Super Simple Emoji Picker */}
            {showEmojiPicker && (
              <div 
                ref={emojiPickerRef}
                className="px-4 py-2.5 border-b border-gray-700/50 animate-in fade-in-0 duration-200"
              >
                <div className="flex items-center gap-1.5 justify-center flex-wrap">
                  {popularEmojis.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleEmojiClick(item.emoji)}
                      className="group relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-700 transition-all duration-150 active:scale-90 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      type="button"
                      title={item.label}
                      aria-label={item.label}
                    >
                      <span className="text-xl group-hover:scale-125 transition-transform duration-150">
                        {item.emoji}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4">
              {/* Observer Mode Banner */}
              {isObserverMode && (
                <div className="mb-3 p-2 rounded-lg bg-purple-900/30 border border-purple-700/50 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-xs text-purple-200">Observer Mode - Read Only</span>
                </div>
              )}
              
              {/* Input Container */}
              <div 
                className={`relative rounded-xl transition-all duration-200 ${
                  isFocused 
                    ? 'bg-gray-700/80 ring-2 ring-primary/50 shadow-lg shadow-primary/10' 
                    : 'bg-gray-700/50 hover:bg-gray-700/70'
                } ${!isConnected ? 'opacity-60' : ''}`}
              >
                {/* Textarea Wrapper */}
                <div className="flex gap-2 items-end p-2">
                  {/* Emoji Button */}
                  <button
                    ref={emojiButtonRef}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    disabled={!isConnected || isObserverMode}
                    className={`flex-shrink-0 p-2 rounded-lg transition-all duration-150 ${
                      showEmojiPicker 
                        ? 'bg-primary text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-600/50'
                    } disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
                    type="button"
                    title={isObserverMode ? "Observer mode - Read only" : "Insert emoji"}
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  {/* Text Input */}
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                      setIsFocused(false)
                      stopTyping()
                    }}
                    placeholder={
                      isObserverMode 
                        ? "Observer mode - Read only" 
                        : isConnected 
                          ? "Type your message..." 
                          : "Connecting to chat..."
                    }
                    disabled={!isConnected || isObserverMode}
                    rows={1}
                    className="flex-1 px-2 py-2 bg-transparent border-none text-white placeholder-gray-400 focus:outline-none disabled:cursor-not-allowed resize-none min-h-[40px] max-h-[120px] overflow-y-auto leading-6 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
                    style={{ height: 'auto' }}
                    aria-label="Message input"
                  />

                  {/* Send Button */}
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || !isConnected || isObserverMode}
                    className={`flex-shrink-0 p-2 rounded-lg transition-all duration-150 ${
                      newMessage.trim() && isConnected && !isObserverMode
                        ? 'bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg hover:shadow-primary/20 hover:scale-105 active:scale-95'
                        : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                    }`}
                    type="button"
                    title={isObserverMode ? "Observer mode - Read only" : "Send message (Enter)"}
                  >
                    <ArrowUp className="w-5 h-5" />
                  </button>
                </div>

                {/* Character Counter */}
                {charCount > 0 && (
                  <div className="px-4 pb-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-gray-500">
                      <span className="text-[10px]">
                        Press <kbd className="px-1.5 py-0.5 bg-gray-600/50 rounded text-[9px] font-mono">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-gray-600/50 rounded text-[9px] font-mono">Shift + Enter</kbd> for new line
                      </span>
                    </div>
                    <span className={`font-mono transition-colors ${
                      charCount > MAX_CHARS * 0.9 
                        ? 'text-yellow-400 font-semibold' 
                        : charCount === MAX_CHARS
                        ? 'text-red-400 font-bold'
                        : 'text-gray-500'
                    }`}>
                      {charCount}/{MAX_CHARS}
                    </span>
                  </div>
                )}
              </div>

              {/* Connection Status Messages */}
              {!isConnected && !isConnecting && (
                <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-red-900/20 border border-red-500/30 rounded-lg animate-in fade-in-50 duration-300">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <p className="text-xs text-red-300 font-medium">
                    Not connected to chat. Messages cannot be sent.
                  </p>
                </div>
              )}
              
              {isConnecting && (
                <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-yellow-900/20 border border-yellow-500/30 rounded-lg animate-in fade-in-50 duration-300">
                  <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" />
                  <p className="text-xs text-yellow-300 font-medium">
                    Connecting to chat...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
