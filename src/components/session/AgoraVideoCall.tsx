import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC, { IAgoraRTCClient, IAgoraRTCRemoteUser, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AgoraVideoCallProps {
  channelName: string;
  token: string;
  uid: string | number;
  sessionType: 'video' | 'audio';
  onEndCall: () => void;
  sessionStart: Date;
  sessionEnd: Date;
}

const AgoraVideoCall: React.FC<AgoraVideoCallProps> = ({
  channelName,
  token,
  uid,
  sessionType,
  onEndCall,
  sessionStart,
  sessionEnd
}) => {
  const [localTracks, setLocalTracks] = useState<[IMicrophoneAudioTrack, ICameraVideoTrack] | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  const rtcClient = useRef<IAgoraRTCClient | null>(null);
  const localVideoRef = useRef<HTMLDivElement | null>(null);
  
  // Use this callback ref to play video when div is mounted
  const setLocalVideoRef = (node: HTMLDivElement | null) => {
    localVideoRef.current = node;
    
    // Only play video if node exists and localTracks are available
    if (node && localTracks && localTracks[1]) {
      try {
        console.log('Playing local video track on callback ref');
        localTracks[1].play(node);
      } catch (err) {
        console.error('Error playing local video:', err);
      }
    }
  };
  
  // Handle user published event
  const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    console.log(`User published: uid=${user.uid}, mediaType=${mediaType}`);
    await rtcClient.current?.subscribe(user, mediaType);
    
    if (mediaType === 'video') {
      setRemoteUsers(prev => {
        if (prev.find(u => u.uid === user.uid)) {
          return prev;
        }
        return [...prev, user];
      });
    }
    
    if (mediaType === 'audio') {
      user.audioTrack?.play();
    }
  };
  
  // Handle user unpublished event
  const handleUserUnpublished = (user: IAgoraRTCRemoteUser) => {
    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
  };
  
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        
        // Create an Agora client
        rtcClient.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        
        // Set up event listeners
        rtcClient.current.on('user-published', handleUserPublished);
        rtcClient.current.on('user-unpublished', handleUserUnpublished);
        
        // Convert string UID to number (Agora requires numeric UIDs)
        const numericUid = typeof uid === 'string' 
          ? parseInt(uid.replace(/[^0-9]/g, '').substring(0, 8), 10) % 1000000
          : uid;
        
        console.log(`Joining channel ${channelName} with UID ${numericUid}`);

        // Get the App ID from environment or use default
        const appId = import.meta.env.VITE_AGORA_APP_ID || "1586fac71f52450497da9c0b5e998a15";
        
        // Join the channel
        await rtcClient.current.join(
          appId,
          channelName,
          token,
          numericUid
        );
        
        setIsJoined(true);
        
        // Create local tracks based on session type
        let tracks;
        if (sessionType === 'audio') {
          // For audio-only sessions, only create microphone track
          const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
          tracks = [audioTrack, null] as [IMicrophoneAudioTrack, ICameraVideoTrack];
        } else {
          // For video sessions, create both audio and video tracks
          tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        }
        
        console.log('Local tracks created:', tracks);
        
        // Publish only the audio track for audio sessions
        if (sessionType === 'audio') {
          await rtcClient.current.publish([tracks[0]]);
        } else {
          await rtcClient.current.publish(tracks);
        }
        
        // Set local tracks state
        setLocalTracks(tracks);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing Agora:', err);
        setError(err.message || 'Failed to join call');
        setIsLoading(false);
      }
    };
    
    init();
    
    return () => {
      // Clean up when component unmounts
      if (localTracks) {
        localTracks[0].close();
        if (localTracks[1]) {
          localTracks[1].close();
        }
      }
      
      rtcClient.current?.leave();
    };
  }, [channelName, token, uid, sessionType]);
  
  // This effect will try to play the video if localTracks are set but video isn't playing yet
  useEffect(() => {
    if (localTracks && localVideoRef.current) {
      try {
        console.log('Playing local video track from useEffect');
        localTracks[1].play(localVideoRef.current);
      } catch (err) {
        console.error('Error playing local video from useEffect:', err);
      }
    }
  }, [localTracks]);
  
  const toggleAudio = async () => {
    if (localTracks) {
      if (isAudioMuted) {
        await localTracks[0].setEnabled(true);
      } else {
        await localTracks[0].setEnabled(false);
      }
      setIsAudioMuted(!isAudioMuted);
    }
  };
  
  const toggleVideo = async () => {
    if (localTracks) {
      if (isVideoMuted) {
        await localTracks[1].setEnabled(true);
      } else {
        await localTracks[1].setEnabled(false);
      }
      setIsVideoMuted(!isVideoMuted);
    }
  };
  
  const leaveCall = async () => {
    if (localTracks) {
      localTracks[0].close();
      if (localTracks[1]) {
        localTracks[1].close();
      }
    }
    
    await rtcClient.current?.leave();
    onEndCall();
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-3">Connecting to your meeting...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={onEndCall}>Back to Appointments</Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative">
        {sessionType === 'video' ? (
          // Video session layout
          <>
            {/* Remote videos */}
            <div className="h-full w-full">
              {remoteUsers.length > 0 ? (
                remoteUsers.map(user => (
                  <div 
                    key={user.uid} 
                    className="w-full h-full bg-black"
                    ref={el => {
                      if (el && user.videoTrack) {
                        user.videoTrack.play(el);
                      }
                    }}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center h-full w-full">
                  <p className="text-gray-500">Waiting for others to join...</p>
                </div>
              )}
            </div>
            
            {/* Local video (small overlay) */}
            <div 
              ref={setLocalVideoRef}
              className={`absolute ${isMobile ? 'bottom-20' : 'bottom-4'} right-4 w-48 h-36 bg-black rounded-lg overflow-hidden border-2 border-white shadow-lg z-10`}
            />
          </>
        ) : (
          // Audio session layout
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Mic className="w-16 h-16 text-primary" />
              </div>
              <p className="text-lg font-medium">Audio Session</p>
              <p className="text-sm text-muted-foreground">
                {remoteUsers.length > 0 ? 'Connected' : 'Waiting for others to join...'}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="bg-gray-900 p-4 flex justify-center space-x-4">
        <Button 
          variant={isAudioMuted ? "destructive" : "default"}
          size="icon"
          onClick={toggleAudio}
        >
          {isAudioMuted ? <MicOff /> : <Mic />}
        </Button>
        
        {sessionType === 'video' && (
          <Button 
            variant={isVideoMuted ? "destructive" : "default"}
            size="icon"
            onClick={toggleVideo}
          >
            {isVideoMuted ? <VideoOff /> : <Video />}
          </Button>
        )}
        
        <Button 
          variant="destructive"
          size="icon"
          onClick={leaveCall}
        >
          <PhoneOff />
        </Button>
      </div>
    </div>
  );
};

export default AgoraVideoCall;
