'use client';

import React, { useState, useEffect } from 'react';
import { useSFU } from '@/hooks/use-sfu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  MonitorOff, 
  Phone, 
  PhoneOff,
  Users,
  Settings,
  Share2
} from 'lucide-react';

export function VideoConference({ roomId, onRoomCreated, onRoomJoined }) {
  const {
    isConnected,
    isConnecting,
    isInRoom,
    currentRoom,
    participants,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    localStream,
    connect,
    disconnect,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    startMedia,
    stopMedia,
  } = useSFU({
    autoConnect: true,
    onError: (error) => {
    }
  });

  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [joinRoomId, setJoinRoomId] = useState(roomId || '');
  const [displayName, setDisplayName] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

  useEffect(() => {
    if (roomId && !isInRoom) {
      setJoinRoomId(roomId);
      setShowJoinRoom(true);
    }
  }, [roomId, isInRoom]);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;

    try {
      setIsCreatingRoom(true);
      const room = await createRoom(roomName, roomDescription);
      onRoomCreated?.(room.id);
      setShowCreateRoom(false);
      setRoomName('');
      setRoomDescription('');
    } catch (error) {
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinRoomId.trim() || !displayName.trim()) return;

    try {
      setIsJoiningRoom(true);
      const room = await joinRoom(joinRoomId, displayName);
      onRoomJoined?.(room.id);
      setShowJoinRoom(false);
      setJoinRoomId('');
      setDisplayName('');
    } catch (error) {
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom();
    } catch (error) {
    }
  };

  const handleStartMedia = async () => {
    try {
      await startMedia();
    } catch (error) {
    }
  };

  const handleStopMedia = async () => {
    try {
      await stopMedia();
    } catch (error) {
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="">
            <CardTitle>Connecting to SFU...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isInRoom) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Video Conference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => setShowCreateRoom(true)}
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <Share2 className="h-6 w-6" />
                  <span>Create Room</span>
                </Button>
                
                <Button
                  onClick={() => setShowJoinRoom(true)}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <Users className="h-6 w-6" />
                  <span>Join Room</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Create Room Modal */}
          {showCreateRoom && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Room</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="roomName">Room Name</Label>
                  <Input
                    id="roomName"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Enter room name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="roomDescription">Description (Optional)</Label>
                  <Textarea
                    id="roomDescription"
                    value={roomDescription}
                    onChange={(e) => setRoomDescription(e.target.value)}
                    placeholder="Enter room description"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={handleCreateRoom}
                    disabled={!roomName.trim() || isCreatingRoom}
                    className="flex-1"
                  >
                    {isCreatingRoom ? 'Creating...' : 'Create Room'}
                  </Button>
                  <Button
                    onClick={() => setShowCreateRoom(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Join Room Modal */}
          {showJoinRoom && (
            <Card>
              <CardHeader>
                <CardTitle>Join Room</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="joinRoomId">Room ID</Label>
                  <Input
                    id="joinRoomId"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    placeholder="Enter room ID"
                  />
                </div>
                
                <div>
                  <Label htmlFor="displayName">Your Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={handleJoinRoom}
                    disabled={!joinRoomId.trim() || !displayName.trim() || isJoiningRoom}
                    className="flex-1"
                  >
                    {isJoiningRoom ? 'Joining...' : 'Join Room'}
                  </Button>
                  <Button
                    onClick={() => setShowJoinRoom(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{currentRoom?.name}</h1>
            <p className="text-sm text-gray-600">
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {isAudioEnabled ? 'Audio On' : 'Audio Off'}
            </Badge>
            <Badge variant="outline">
              {isVideoEnabled ? 'Video On' : 'Video Off'}
            </Badge>
            {isScreenSharing && (
              <Badge variant="outline">
                Screen Sharing
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Local Video */}
          <Card className="relative">
            <CardContent className="p-0">
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                {localStream ? (
                  <video
                    ref={(video) => {
                      if (video && localStream) {
                        video.srcObject = localStream;
                      }
                    }}
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white">
                    <div className="text-center">
                      <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No video</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-black bg-opacity-50 rounded px-2 py-1">
                  <p className="text-white text-sm font-medium">
                    You {isAudioEnabled ? '' : '(Muted)'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Remote Videos */}
          {participants.map((participant) => (
            <Card key={participant.id} className="relative">
              <CardContent className="p-0">
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-center h-full text-white">
                    <div className="text-center">
                      <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{participant.displayName}</p>
                    </div>
                  </div>
                </div>
                
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="bg-black bg-opacity-50 rounded px-2 py-1">
                    <p className="text-white text-sm font-medium">
                      {participant.displayName}
                      {!participant.isAudioEnabled && ' (Muted)'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-t p-4">
        <div className="flex items-center justify-center space-x-4">
          <Button
            onClick={toggleAudio}
            variant={isAudioEnabled ? "default" : "destructive"}
            size="lg"
            className="rounded-full"
          >
            {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>
          
          <Button
            onClick={toggleVideo}
            variant={isVideoEnabled ? "default" : "destructive"}
            size="lg"
            className="rounded-full"
          >
            {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
          
          <Button
            onClick={toggleScreenShare}
            variant={isScreenSharing ? "default" : "outline"}
            size="lg"
            className="rounded-full"
          >
            {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
          </Button>
          
          {!localStream ? (
            <Button
              onClick={handleStartMedia}
              size="lg"
              className="rounded-full"
            >
              Start Media
            </Button>
          ) : (
            <Button
              onClick={handleStopMedia}
              variant="outline"
              size="lg"
              className="rounded-full"
            >
              Stop Media
            </Button>
          )}
          
          <Button
            onClick={handleLeaveRoom}
            variant="destructive"
            size="lg"
            className="rounded-full"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
