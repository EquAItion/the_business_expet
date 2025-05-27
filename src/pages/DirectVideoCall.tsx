import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import AgoraVideoCall from '@/components/session/AgoraVideoCall';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';

const DirectVideoCall = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agoraToken, setAgoraToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Get user data from localStorage
  const userData = localStorage.getItem('user');
  const parsedUserData = userData ? JSON.parse(userData) : {};
  const userId = parsedUserData.user_id || parsedUserData.id;
  const token = parsedUserData.token;

  const requestMediaPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setPermissionGranted(true);
      fetchAgoraToken();
    } catch (err) {
      setError('Camera and microphone access is required to start the session.');
      toast.error('Camera and microphone access is required to start the session.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgoraToken = async () => {
    try {
      setLoading(true);
      console.log("Fetching Agora token for channel:", id);
      
      // Now try the Agora token endpoint directly
      const response = await fetch(`${API_BASE_URL}/api/agora/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
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
          // If response is not JSON, use the status text
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
            {loading ? 'Requesting Permissions...' : 'Start Session'}
          </button>
        </div>
      ) : (
        agoraToken ? (
          <AgoraVideoCall
            channelName={id || ''}
            token={agoraToken}
            uid={userId}
            sessionType="video"
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

export default DirectVideoCall;
