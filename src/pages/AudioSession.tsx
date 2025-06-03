import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import AgoraVideoCall from '@/components/session/AgoraVideoCall';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';

const AudioSession = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agoraToken, setAgoraToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Get user data from localStorage
  const userData = localStorage.getItem('user') || localStorage.getItem('userData') || '{}';
  let userId = null;
  let token = null;
  try {
    const parsedUserData = JSON.parse(userData);
    userId = parsedUserData.user_id || parsedUserData.id;
    token = parsedUserData.token || parsedUserData.accessToken;
    
    // If we have a token but no userId, try to extract it from the token
    if (!userId && token) {
      try {
        const payloadBase64 = token.split('.')[1];
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);
        userId = payload.user_id || payload.id || null;
      } catch (e) {
        console.error('Failed to extract userId from token:', e);
      }
    }
  } catch (e) {
    console.error('Failed to parse user data:', e);
  }

  // Validate user data before proceeding
  useEffect(() => {
    if (!userId || !token) {
      setError('Authentication required. Please log in again.');
      toast.error('Authentication required. Please log in again.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  }, [userId, token, navigate]);

  const requestMediaPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setPermissionGranted(true);
      fetchAgoraToken();
    } catch (err) {
      setError('Microphone access is required to start the session.');
      toast.error('Microphone access is required to start the session.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgoraToken = async () => {
    try {
      if (!userId || !token || !id) {
        throw new Error('Authentication required. Please log in again.');
      }

      setLoading(true);
      console.log("Fetching Agora token for channel:", id, "userId:", userId);
      
      const response = await fetch(`${API_BASE_URL}/api/agora/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          channelName: id,
          uid: userId
        })
      });
      
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log("Received token response:", data);
      
      if (!data.token) {
        throw new Error('No token received from server');
      }
      
      setAgoraToken(data.token);
    } catch (err) {
      console.error('Error fetching Agora token:', err);
      setError(err.message || 'Failed to fetch Agora token');
    } finally {
      setLoading(false);
    }
  };

  const handleEndCall = () => {
    navigate('/appointment-log');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-3">Connecting to your meeting...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
              <p className="mb-4">{error}</p>
              <button 
                className="px-4 py-2 bg-primary text-white rounded-md"
                onClick={() => navigate('/appointment-log')}
              >
                Back to Appointments
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen w-full p-0 m-0 overflow-hidden">
      {!permissionGranted ? (
        <div className="flex items-center justify-center h-full">
          <button
            className="px-6 py-3 bg-primary text-white rounded-md text-lg"
            onClick={requestMediaPermissions}
            disabled={loading}
          >
            {loading ? 'Requesting Permissions...' : 'Start Audio Session'}
          </button>
        </div>
      ) : (
        agoraToken ? (
          <AgoraVideoCall
            channelName={id || ''}
            token={agoraToken}
            uid={userId}
            sessionType="audio"
            onEndCall={handleEndCall}
            sessionStart={new Date()}
            sessionEnd={new Date(Date.now() + 60 * 60 * 1000)} // 1 hour from now
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="ml-3">Connecting to your meeting...</p>
          </div>
        )
      )}
    </div>
  );
};

export default AudioSession; 