import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AgoraVideoCall from '@/components/session/AgoraVideoCall';
import { Clock, Calendar, User, AlertCircle } from 'lucide-react';

interface SessionDetails {
  id: string;
  expert_id: string;
  seeker_id: string;
  expert_name: string;
  seeker_name: string;
  date: string;
  start_time: string;
  end_time: string;
  session_type: 'video' | 'audio' | 'chat';
  status: string;
}

const Session = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agoraToken, setAgoraToken] = useState<string | null>(null);
  const [canJoin, setCanJoin] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'expert' | 'seeker' | null>(null);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        setLoading(true);
        
        // Get user data from localStorage
        const userData = localStorage.getItem('user');
        if (!userData) {
          throw new Error('User not authenticated');
        }
        
        const parsedUserData = JSON.parse(userData);
        const token = parsedUserData.token || parsedUserData.accessToken;
        const userId = parsedUserData.user_id || parsedUserData.id;
        
        if (!token || !userId) {
          throw new Error('Invalid user data');
        }
        
        // Fetch session details
        const API_BASE_URL = import.meta.env.VITE_API_URL;
        const response = await fetch(`${API_BASE_URL}/api/bookings/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch session details');
        }
        
        const sessionData = await response.json();
        setSession(sessionData);
        
        // Determine user role
        if (sessionData.expert_id === userId) {
          setUserRole('expert');
        } else if (sessionData.seeker_id === userId) {
          setUserRole('seeker');
        } else {
          throw new Error('You are not authorized to join this session');
        }
        
        // Check if it's time to join
        checkSessionTime(sessionData);
        
        // If we can join, get Agora token
        if (canJoin) {
          fetchAgoraToken(sessionData.id);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSessionDetails();
    
    // Set up interval to check time
    const interval = setInterval(() => {
      if (session) {
        checkSessionTime(session);
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [id, canJoin]);
  
  const checkSessionTime = (sessionData: SessionDetails) => {
    const now = new Date();
    const sessionDate = parseISO(`${sessionData.date}T${sessionData.start_time}`);
    const minutesUntilSession = differenceInMinutes(sessionDate, now);
    
    // Allow joining 5 minutes before the session starts
    if (minutesUntilSession <= 5 && minutesUntilSession >= -120) { // Can join up to 2 hours after start time
      setCanJoin(true);
      setTimeRemaining(null);
      
      // If we can join but don't have a token yet, fetch it
      if (!agoraToken) {
        fetchAgoraToken(sessionData.id);
      }
    } else if (minutesUntilSession > 5) {
      // Session is in the future
      setCanJoin(false);
      setTimeRemaining(`Session will be available in ${formatTimeRemaining(minutesUntilSession)}`);
    } else {
      // Session is in the past (more than 2 hours)
      setCanJoin(false);
      setTimeRemaining('This session has ended');
    }
  };
  
  const formatTimeRemaining = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes > 0 ? `and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}` : ''}`;
    }
  };
  
  const fetchAgoraToken = async (sessionId: string) => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;
      
      const parsedUserData = JSON.parse(userData);
      const token = parsedUserData.token || parsedUserData.accessToken;
      
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/token`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get Agora token');
      }
      
      const data = await response.json();
      setAgoraToken(data.token);
    } catch (error) {
      console.error('Error fetching Agora token:', error);
      toast({
        title: "Error",
        description: "Failed to get video call token. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleEndCall = () => {
    navigate('/appointments');
    toast({
      title: "Call Ended",
      description: "Your session has ended successfully."
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-24 px-4">
          <p className="text-center">Loading session details...</p>
        </div>
        <Footer />
      </div>
    );
  }
  
  if (error || !session) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-24 px-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-2xl font-bold mb-2">Session Error</h2>
                <p className="text-muted-foreground mb-6">{error || 'Session not found'}</p>
                <Button onClick={() => navigate('/appointments')}>
                  Back to Appointments
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">
            {session.session_type.charAt(0).toUpperCase() + session.session_type.slice(1)} Session
          </h1>
          
          {canJoin && agoraToken ? (
            <div className="bg-card rounded-lg shadow-lg overflow-hidden h-[600px]">
              <AgoraVideoCall 
                channelName={session.id}
                token={agoraToken}
                uid={userRole === 'expert' ? session.expert_id : session.seeker_id}
                sessionType={session.session_type as 'video' | 'audio'}
                onEndCall={handleEndCall}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Clock className="h-12 w-12 text-primary mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Session Not Available Yet</h2>
                  <p className="text-muted-foreground mb-6">{timeRemaining}</p>
                  
                  <div className="w-full max-w-md bg-secondary/20 rounded-lg p-4 mb-6">
                    <div className="flex items-center mb-3">
                      <Calendar className="h-5 w-5 mr-2 text-primary" />
                      <span className="font-medium">
                        {format(parseISO(session.date), 'MMMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center mb-3">
                      <Clock className="h-5 w-5 mr-2 text-primary" />
                      <span className="font-medium">
                        {session.start_time} - {session.end_time}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-2 text-primary" />
                      <span className="font-medium">
                        {userRole === 'expert' ? `With: ${session.seeker_name}` : `With: ${session.expert_name}`}
                      </span>
                    </div>
                  </div>
                  
                  <Button onClick={() => navigate('/appointments')}>
                    Back to Appointments
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Session;