import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import AgoraVideoCall from '@/components/session/AgoraVideoCall';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import ReactStars from 'react-rating-stars-component';

const AudioSession = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agoraToken, setAgoraToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bothParticipantsJoined, setBothParticipantsJoined] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [sessionFeedback, setSessionFeedback] = useState<any>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Get user data from localStorage
  const userData = localStorage.getItem('user') || localStorage.getItem('userData') || '{}';
  let userId = null;
  let token = null;
  let userRole = null;
  try {
    const parsedUserData = JSON.parse(userData);
    userId = parsedUserData.user_id || parsedUserData.id;
    token = parsedUserData.token || parsedUserData.accessToken;
    userRole = parsedUserData.role || parsedUserData.userRole || parsedUserData.type || null;

    // Add console logs to debug user role
    console.log('User Data:', {
      parsedUserData,
      role: parsedUserData.role,
      userRole: parsedUserData.userRole,
      type: parsedUserData.type,
      finalUserRole: userRole
    });

    // If we have a token but no userId, try to extract it from the token
    if (!userId && token) {
      try {
        const payloadBase64 = token.split('.')[1];
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);
        userId = payload.user_id || payload.id || null;
        // Also check role in token
        if (!userRole) {
          userRole = payload.role || payload.userRole || payload.type || null;
          console.log('User Role from token:', userRole);
        }
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
      setSessionStarted(true);
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
    setCallEnded(true);
  };

  // Function to fetch feedback
  const fetchSessionFeedback = async (bookingId: string) => {
    try {
      setLoadingFeedback(true);
      const response = await fetch(`${API_BASE_URL}/api/session-feedback/booking/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }

      const data = await response.json();
      setSessionFeedback(data);
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      if (!id || !token || !userRole || !userId) {
        throw new Error('Required information is missing');
      }

      if ((userRole === 'seeker' || userRole === 'solution_seeker') && rating === 0) {
        toast.error('Please provide a rating before submitting');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/session-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          booking_id: id,
          user_id: userId,
          user_role: userRole === 'solution_seeker' ? 'seeker' : userRole,
          rating: (userRole === 'seeker' || userRole === 'solution_seeker') ? rating : null,
          review: (userRole === 'seeker' || userRole === 'solution_seeker') ? review : null,
          message: userRole === 'expert' ? message : null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit feedback');
      }

      toast.success(userRole === 'seeker' ? 'Thank you for your feedback!' : 'Message sent successfully!');
      setFeedbackSubmitted(true);
      
      // Fetch the feedback to show
      if (id) {
        await fetchSessionFeedback(id);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      toast.error(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">F
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
    <div className="h-screen w-full p-0 m-0 overflow-hidden relative bg-gradient-to-br from-gray-50 to-gray-100">
      {!permissionGranted ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center h-full space-y-6"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {userRole === 'seeker' ? 'Join Your Session' : 'Start Your Session'}
          </h1>
          <p className="text-gray-600 text-lg mb-8">
            {userRole === 'solution_seeker' 
              ? 'Click below to join your session with the expert'
              : 'Click below to start your session with the seeker'}
          </p>
          <Button
            size="lg"
            className="px-8 py-6 text-lg bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={requestMediaPermissions}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Connecting...</span>
              </div>
            ) : (
              userRole === 'seeker' ? 'Join Session' : 'Start Session'
            )}
          </Button>
        </motion.div>
      ) : (
        agoraToken && !callEnded ? (
          <div className="relative h-full">
             {/* {participantCount === 1 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 flex items-center justify-center bg-black/50 z-50"
              >
                <div className="bg-white p-6 rounded-lg shadow-xl text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-lg font-medium text-gray-800">Waiting for other participant...</p>
                </div>
              </motion.div>
            )} */}
            <AgoraVideoCall
              channelName={id || ''}
              token={agoraToken}
              uid={userId}
              sessionType="audio"
              onEndCall={handleEndCall}
              onParticipantsUpdate={setParticipantCount}
              sessionStart={new Date()}
              sessionEnd={new Date(Date.now() + 60 * 60 * 1000)}
            />
          </div>
        ) : null
      )}

      {callEnded && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-xl p-8 w-[480px] max-w-full mx-4 shadow-2xl">
              {!feedbackSubmitted ? (
                <div className="flex flex-col items-center space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800">Session Feedback</h2>
                  
                  {/* Rating Section - Only for seeker */}
                  {(userRole === 'seeker' || userRole === 'solution_seeker') && (
                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                          Rate your session <span className="text-red-500">*</span>
                        </label>
                        {rating === 0 && (
                          <span className="text-xs text-red-500">Rating is required</span>
                        )}
                      </div>
                      <ReactStars
                        count={5}
                        value={rating}
                        onChange={setRating}
                        size={32}
                        activeColor="#fbbf24"
                        color="#e5e7eb"
                      />
                    </div>
                  )}

                  {/* Review/Message Section - Different for seeker and expert */}
                  <div className="w-full space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {userRole === 'expert' ? 'Add a note about the session' : 'Share your experience'}
                      {userRole === 'seeker' && <span className="text-red-500">*</span>}
                    </label>
                    <Textarea
                      className="w-full border border-gray-300 rounded-lg p-4 resize-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[120px]"
                      placeholder={userRole === 'expert' ? 
                        "Add any notes or observations about the session..." : 
                        "Tell us about your session experience..."}
                      value={userRole === 'expert' ? message : review}
                      onChange={(e) => userRole === 'expert' ? setMessage(e.target.value) : setReview(e.target.value)}
                    />
                  </div>

                  <Button
                    className="w-full py-3 bg-primary text-white rounded-lg text-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSubmit}
                    disabled={(userRole === 'seeker' && rating === 0) || submitting}
                  >
                    {submitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      'Submit'
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800">Session Feedback</h2>
                  
                  {loadingFeedback ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : sessionFeedback?.feedbacks?.length > 0 ? (
                    <div className="space-y-4">
                      {sessionFeedback.feedbacks.map((feedback: any) => (
                        <Card key={feedback.id} className="p-4">
                          <CardContent className="p-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {feedback.user_role === 'seeker' ? 'Seeker Feedback' : 'Expert Note'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {feedback.user_name}
                                </p>
                              </div>
                              {feedback.rating && (
                                <div className="flex items-center">
                                  <span className="text-yellow-500 text-lg font-bold mr-1">
                                    {feedback.rating}
                                  </span>
                                  <span className="text-gray-400">/5</span>
                                </div>
                              )}
                            </div>
                            
                            {feedback.review && (
                              <p className="mt-2 text-gray-700">{feedback.review}</p>
                            )}
                            
                            {feedback.message && (
                              <p className="mt-2 text-gray-700">{feedback.message}</p>
                            )}
                            
                            <p className="mt-2 text-xs text-gray-400">
                              {new Date(feedback.created_at).toLocaleString()}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">
                      No feedback available yet
                    </p>
                  )}

                  <Button
                    className="w-full py-3 bg-primary text-white rounded-lg text-lg font-medium hover:bg-primary/90 transition-colors"
                    onClick={() => navigate('/dashboard')}
                  >
                    Return to Dashboard
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default AudioSession;
