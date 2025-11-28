"use client"

import { useState, useEffect, useRef } from "react"

export function useSessionTracking(roomId) {
  const [sessionData, setSessionData] = useState({
    joinTime: null,
    duration: 0,
    participantHistory: [],
  })
  const [isTracking, setIsTracking] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (isTracking && sessionData.joinTime) {
      intervalRef.current = setInterval(() => {
        setSessionData((prev) => ({
          ...prev,
          duration: Math.floor((Date.now() - prev.joinTime) / 1000),
        }))
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isTracking, sessionData.joinTime])

  const startSession = () => {
    const joinTime = Date.now()
    const newSession = {
      joinTime,
      duration: 0,
      participantHistory: [],
      roomId,
      sessionId: `session_${joinTime}`,
    }

    setSessionData(newSession)
    setIsTracking(true)

    // Store session start in localStorage
    const sessions = JSON.parse(localStorage.getItem("video-call-sessions") || "[]")
    sessions.push({
      ...newSession,
      status: "active",
    })
    localStorage.setItem("video-call-sessions", JSON.stringify(sessions))

  }

  const endSession = () => {
    if (!sessionData.joinTime) return

    const endTime = Date.now()
    const finalDuration = Math.floor((endTime - sessionData.joinTime) / 1000)

    setIsTracking(false)

    // Update session in localStorage
    const sessions = JSON.parse(localStorage.getItem("video-call-sessions") || "[]")
    const updatedSessions = sessions.map((session) => {
      if (session.sessionId === sessionData.sessionId) {
        return {
          ...session,
          endTime,
          duration: finalDuration,
          status: "completed",
          participantHistory: sessionData.participantHistory,
        }
      }
      return session
    })
    localStorage.setItem("video-call-sessions", JSON.stringify(updatedSessions))

  }

  const trackParticipantJoin = (participantId, participantName) => {
    const joinTime = Date.now()
    const participant = {
      id: participantId,
      name: participantName,
      joinTime,
      leaveTime: null,
      duration: 0,
    }

    setSessionData((prev) => ({
      ...prev,
      participantHistory: [...prev.participantHistory, participant],
    }))

  }

  const trackParticipantLeave = (participantId) => {
    const leaveTime = Date.now()

    setSessionData((prev) => ({
      ...prev,
      participantHistory: prev.participantHistory.map((p) => {
        if (p.id === participantId && !p.leaveTime) {
          const duration = Math.floor((leaveTime - p.joinTime) / 1000)
          return {
            ...p,
            leaveTime,
            duration,
          }
        }
        return p
      }),
    }))
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  const getSessionHistory = () => {
    return JSON.parse(localStorage.getItem("video-call-sessions") || "[]")
  }

  return {
    sessionData,
    isTracking,
    startSession,
    endSession,
    trackParticipantJoin,
    trackParticipantLeave,
    formatDuration,
    getSessionHistory,
  }
}
