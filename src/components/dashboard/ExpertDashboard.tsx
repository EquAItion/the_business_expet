import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Save, X, Pencil, BookOpen, TrendingUp, Star, Users, Calendar, Activity, Clock } from 'lucide-react';
import AvailabilitySection from './AvailabilitySection';
import { API_BASE_URL } from '@/config/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ReactStars from 'react-rating-stars-component';

// Stored user data interface
interface StoredUserData {
  id: string;
  token: string;
  email: string;
  role: 'expert';
  profile_completed?: boolean;
}

// Expert profile interface
interface ExpertProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  designation: string;
  expertise: string;
  areas_of_help: string;
  email: string;
  phone_number: string;
  current_organization: string;
  location: string;
  work_experience: number;
  audio_pricing: number;
  profile_completed?: boolean;
}

interface ProfileUpdatePayload {
  section: string;
  data: Partial<ExpertProfile>;
}

interface EditingState {
  personal: boolean;
  contact: boolean;
  pricing: boolean;
}

interface AvailabilityData {
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface BookingStats {
  totalSessions: number;
  pendingBookings: number;
}

// Add this interface if not already present
interface Booking {
  id: string;
  expert_id: string;
  seeker_id: string;
  expert_name: string;
  seeker_name: string;
  date: string;
  start_time: string;
  end_time: string;
  session_type: 'audio';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  amount: number;
  created_at: string;
}

// Add these interfaces at the top of the file
interface Feedback {
  id: string;
  booking_id: string;
  seeker_name: string;
  rating: number;
  review: string;
  message: string;
  created_at: string;
}

const ExpertDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState<ExpertProfile | null>(null);
  const [isEditing, setIsEditing] = useState<EditingState>({
    personal: false,
    contact: false,
    pricing: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expertId, setExpertId] = useState<string | null>(null);
  const [bookingStats, setBookingStats] = useState<BookingStats>({
    totalSessions: 0,
    pendingBookings: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Availability states
  const [availability, setAvailability] = useState<AvailabilityData[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | undefined>(undefined);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('17:00');

  // Constants for availability
  const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const TIME_OPTIONS = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
    '22:00', '22:30', '23:00'
  ];

  // Add these state variables inside the ExpertDashboard component
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Get user data from localStorage on component mount
  useEffect(() => {
    const userData = localStorage.getItem('user') || localStorage.getItem('userData') || '{}';
    try {
      const parsedData = JSON.parse(userData);
      setUserId(parsedData.user_id || parsedData.id);
      setToken(parsedData.token || parsedData.accessToken);
      console.log('User data loaded:', { userId: parsedData.user_id, token: parsedData.token });
    } catch (err) {
      console.error('Error parsing user data:', err);
    }
  }, []);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const userData = localStorage.getItem('user');
        if (!userData) {
          throw new Error('No user data found');
        }

        const user = JSON.parse(userData);
        if (!user.token || !user.role || user.role !== 'expert') {
          throw new Error('Invalid user data');
        }

        // Use user_id if id is not available
        const userId = user.id || user.user_id;
        if (!userId) {
          throw new Error('User ID not found');
        }

        setExpertId(userId);

        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        console.log('🔍 Fetching profile for user_id:', userId);
        
        // Use the correct backend endpoint: /api/experts/profile/:user_id
        const response = await fetch(`${API_BASE_URL}/api/experts/profile/${userId}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('🔍 Response status:', response.status);

        if (!response.ok) {
          if (response.status === 404) {
            console.log('🔧 Profile not found, creating comprehensive profile from user data');
            // Create a more complete profile from user data when 404
            const comprehensiveProfile: ExpertProfile = {
              id: userId,
              user_id: userId,
              first_name: user.name?.split(' ')[0] || user.first_name || 'Expert',
              last_name: user.name?.split(' ')[1] || user.last_name || 'User',
              designation: user.functionality || user.designation || 'Domain Expert',
              expertise: user.functionality || user.expertise || 'Business Consulting',
              areas_of_help: user.areas_of_help || 'Business Strategy, Operations, Consulting',
              email: user.email || '',
              phone_number: user.mobile_number || user.phone_number || '',
              current_organization: user.current_organization || 'Professional Consultant',
              location: user.location || 'Available Online',
              work_experience: user.work_experience || 5,
              audio_pricing: user.audio_pricing || 1500,
              profile_completed: true
            };
            
            console.log(' Created comprehensive profile:', comprehensiveProfile);
            setProfile(comprehensiveProfile);
            setEditedProfile(comprehensiveProfile);
            setLoading(false);
            return;
          }
          if (response.status === 401) {
            localStorage.removeItem('user');
            throw new Error('Session expired');
          }
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || 'Failed to fetch profile');
        }

        console.log(' Profile fetched successfully:', result.data);
        setProfile(result.data);
        setEditedProfile(result.data);
        setLoading(false);

      } catch (error) {
        console.error(' Profile fetch error:', error);
        setError(error instanceof Error ? error.message : 'Failed to load profile');
        setLoading(false);
        
        // Clear storage and redirect on auth errors
        if (error instanceof Error && 
            (error.message.includes('No user data') || 
             error.message.includes('Invalid user') ||
             error.message.includes('Session expired'))) {
          localStorage.removeItem('user');
          navigate('/auth/expert');
        }
      }
    };

    fetchProfile();
  }, [navigate]);

  // Fetch booking stats
  const fetchBookingStats = async (expertId: string) => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) throw new Error('User data not found');

      const { token } = JSON.parse(userData);
      const API_BASE_URL = import.meta.env.VITE_API_URL;

      // First fetch all bookings
      const response = await fetch(`${API_BASE_URL}/api/bookings/expert/${expertId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch bookings');

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        const bookings: Booking[] = data.data;
        
        // Calculate stats
        setBookingStats({
          totalSessions: bookings.filter(b => b.status === 'completed').length,
          pendingBookings: bookings.filter(b => b.status === 'pending').length
        });
      }
    } catch (error) {
      console.error('Error fetching booking stats:', error);
      toast.error('Failed to fetch booking statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  // Add this effect to update stats periodically
  useEffect(() => {
    if (expertId) {
      fetchBookingStats(expertId);
      
      // Update stats every 5 minutes
      const interval = setInterval(() => {
        fetchBookingStats(expertId);
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [expertId]);

  // Handle field updates
  const handleUpdateField = (field: keyof ExpertProfile, value: string | number) => {
    setEditedProfile(prev => prev ? { ...prev, [field]: value } : null);
  };

  // Handle profile section updates
  const handleProfileUpdate = async (section: keyof EditingState) => {
    try {
      if (!editedProfile || !expertId) {
        throw new Error('Profile data or expert ID is missing');
      }

      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('User data not found');
      }

      const user = JSON.parse(userData);
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      // Create section-specific payload matching backend expectations
      let sectionData: Partial<ExpertProfile> = {};
      
      switch(section) {
        case 'personal':
          sectionData = {
            first_name: editedProfile.first_name,
            last_name: editedProfile.last_name,
            designation: editedProfile.designation,
            expertise: editedProfile.expertise,
            areas_of_help: editedProfile.areas_of_help
          };
          break;
          
        case 'contact':
          sectionData = {
            current_organization: editedProfile.current_organization,
            location: editedProfile.location,
            work_experience: editedProfile.work_experience,
            phone_number: editedProfile.phone_number
          };
          break;
          
        case 'pricing':
          sectionData = {
            audio_pricing: editedProfile.audio_pricing
          };
          break;
          
        default:
          throw new Error('Invalid section');
      }

      console.log('🔍 Updating profile section:', section, 'with data:', sectionData);

      // Use the correct backend endpoint: PUT /api/experts/profile/:user_id
      const response = await fetch(`${API_BASE_URL}/api/experts/profile/${expertId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          section,
          data: sectionData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update ${section} section`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Update failed');
      }

      console.log(' Profile section updated:', result.data);

      // Update local state with the returned data
      setProfile(result.data);
      setEditedProfile(result.data);

      // Exit editing mode for this section
      setIsEditing(prev => ({
        ...prev,
        [section]: false
      }));

      // Show success message
      toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} section updated successfully`);

    } catch (error) {
      console.error(' Profile update error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  // Handle edit mode toggle
  const handleEdit = (section: keyof EditingState) => {
    setIsEditing(prev => ({ ...prev, [section]: true }));
  };

  // Handle cancel edit
  const handleCancelEdit = (section: keyof EditingState) => {
    setEditedProfile(profile); // Reset to original profile data
    setIsEditing(prev => ({ ...prev, [section]: false }));
  };

  // Handle availability time change
  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setStartTime(value);
    } else {
      setEndTime(value);
    }
  };

  // Handle availability update
  const handleUpdateAvailability = async () => {
    try {
      if (!selectedDay || !expertId) {
        toast.error('Please select a day and ensure you\'re logged in');
        return;
      }

      const userData = localStorage.getItem('user');
      if (!userData) {
        toast.error('Please login again');
        return;
      }

      const { token } = JSON.parse(userData);
      const API_BASE_URL = import.meta.env.VITE_API_URL;

      const response = await fetch(`${API_BASE_URL}/api/experts/availability/${expertId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          day_of_week: selectedDay,
          start_time: startTime,
          end_time: endTime
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update availability');
      }

      const result = await response.json();

      // Update local availability state
      setAvailability(prev => {
        const filtered = prev.filter(item => item.day_of_week !== selectedDay);
        return [...filtered, { day_of_week: selectedDay, start_time: startTime, end_time: endTime }];
      });

      // Reset form
      setSelectedDay(undefined);
      setStartTime('09:00');
      setEndTime('17:00');

      toast.success('Availability updated successfully');

    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update availability');
    }
  };

  // Fetch feedbacks when userId and token are available
  useEffect(() => {
    if (userId && token) {
      fetchFeedbacks();
    }
  }, [userId, token]);

  const fetchFeedbacks = async () => {
    if (!userId || !token) {
      console.error('Missing userId or token');
      return;
    }

    try {
      setLoadingFeedbacks(true);
      console.log('Fetching feedbacks for expert:', userId);
      
      const response = await fetch(`${API_BASE_URL}/api/session-feedback/expert/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feedbacks');
      }

      const data = await response.json();
      console.log('Received feedbacks:', data);
      setFeedbacks(data.feedbacks || []);
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      toast.error('Failed to load feedbacks');
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg">Loading profile...</div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500">{error}</div>
        </div>
        <Footer />
      </div>
    );
  }

  // No profile state
  if (!profile || !editedProfile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg">Profile not found</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Navbar */}
      <Navbar />
      
      {/* Hero Section - Light Blue Theme */}
      <div className="bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-500 text-white pt-20 pb-12 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-white drop-shadow-md">Expert Dashboard</h1>
            <p className="text-xl opacity-95 text-blue-50">Manage your profile, availability, and track your activities</p>
          </div>
        </div>
      </div>

      {/* Stats Cards - Light Blue Theme */}
      <div className="container mx-auto px-4 -mt-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white shadow-lg border-0 rounded-lg hover:shadow-xl transition-shadow duration-300 p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Sessions</p>
                <p className="text-2xl font-bold text-slate-900">
                  {statsLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    bookingStats.totalSessions
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg border-0 rounded-lg hover:shadow-xl transition-shadow duration-300 p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-emerald-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Pending Bookings</p>
                <p className="text-2xl font-bold text-orange-600">
                  {statsLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    bookingStats.pendingBookings
                  )}
                </p>
              </div>
            </div>
            {bookingStats.pendingBookings > 0 && (
              <div className="mt-4 space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  onClick={() => navigate('/appointment-log')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View Pending Bookings
                </Button>
              </div>
            )}
          </div>

          <div className="bg-white shadow-lg border-0 rounded-lg hover:shadow-xl transition-shadow duration-300 p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-amber-50 rounded-lg">
                <Star className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Average Rating</p>
                <p className="text-2xl font-bold text-slate-900">4.8</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg border-0 rounded-lg hover:shadow-xl transition-shadow duration-300 p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-violet-50 rounded-lg">
                <Users className="w-6 h-6 text-violet-500" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Active Clients</p>
                <p className="text-2xl font-bold text-slate-900">0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 pt-4 container mx-auto">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Header - Enhanced */}
              <div className="bg-white rounded-lg shadow-xl border-0 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                <div className="bg-gradient-to-r from-blue-400 to-cyan-400 h-20"></div>
                <div className="relative -mt-10 p-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center text-blue-500 text-2xl font-bold shadow-lg border-4 border-white">
                      {profile.first_name?.[0]}{profile.last_name?.[0]}
                    </div>
                    <div className="flex-1 pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h1 className="text-2xl font-bold text-slate-900">{profile.first_name} {profile.last_name}</h1>
                          <p className="text-lg text-blue-600 font-medium">{profile.designation}</p>
                        </div>
                        {!isEditing.personal && (
                          <Button onClick={() => handleEdit('personal')} variant="outline" size="sm" className="hover:bg-blue-50 border-blue-300 text-blue-600 hover:border-blue-400">
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        )}
                      </div>
                      
                      {isEditing.personal ? (
                        <div className="mt-4 space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              value={editedProfile.first_name}
                              onChange={(e) => handleUpdateField('first_name', e.target.value)}
                              placeholder="First Name"
                            />
                            <Input
                              value={editedProfile.last_name}
                              onChange={(e) => handleUpdateField('last_name', e.target.value)}
                              placeholder="Last Name"
                            />
                          </div>
                          <Input
                            value={editedProfile.designation}
                            onChange={(e) => handleUpdateField('designation', e.target.value)}
                            placeholder="Designation"
                          />
                          <Input
                            value={editedProfile.expertise}
                            onChange={(e) => handleUpdateField('expertise', e.target.value)}
                            placeholder="Expertise"
                          />
                          <Input
                            value={editedProfile.areas_of_help}
                            onChange={(e) => handleUpdateField('areas_of_help', e.target.value)}
                            placeholder="Areas of Help"
                          />
                          <div className="flex space-x-2">
                            <Button onClick={() => handleProfileUpdate('personal')} size="sm">
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                            <Button onClick={() => handleCancelEdit('personal')} variant="outline" size="sm">
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 space-y-3">
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <p className="text-slate-700"><strong>Expertise:</strong> {profile.expertise}</p>
                            <p className="text-slate-700"><strong>Experience:</strong> {profile.work_experience} years</p>
                            <p className="text-slate-700"><strong>Areas of Help:</strong> {profile.areas_of_help}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information - Enhanced */}
              <div className="bg-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-900">Contact Information</h2>
                  {!isEditing.contact && (
                    <Button onClick={() => handleEdit('contact')} variant="outline" size="sm" className="hover:bg-blue-50 border-blue-300 text-blue-600 hover:border-blue-400">
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>

                {isEditing.contact ? (
                  <div className="space-y-3">
                    <Input
                      value={editedProfile.email || ''}
                      onChange={(e) => handleUpdateField('email', e.target.value)}
                      placeholder="Email"
                      type="email"
                    />
                    <Input
                      value={editedProfile.phone_number || ''}
                      onChange={(e) => handleUpdateField('phone_number', e.target.value)}
                      placeholder="Phone Number"
                    />
                    <Input
                      value={editedProfile.current_organization || ''}
                      onChange={(e) => handleUpdateField('current_organization', e.target.value)}
                      placeholder="Organization"
                    />
                    <Input
                      value={editedProfile.location || ''}
                      onChange={(e) => handleUpdateField('location', e.target.value)}
                      placeholder="Location"
                    />
                    <Input
                      value={editedProfile.work_experience?.toString() || ''}
                      onChange={(e) => handleUpdateField('work_experience', parseInt(e.target.value) || 0)}
                      placeholder="Work Experience (years)"
                      type="number"
                    />
                    <div className="flex space-x-2">
                      <Button onClick={() => handleProfileUpdate('contact')} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button onClick={() => handleCancelEdit('contact')} variant="outline" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <p className="text-sm font-medium text-blue-800">Email</p>
                        <p className="font-semibold text-slate-900">                          {/* Email display */}
                          {profile.email || editedProfile.email || 'Not provided'}
                        </p>
                      </div>
                      <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                        <p className="text-sm font-medium text-emerald-800">Phone</p>
                        <p className="font-semibold text-slate-900">{profile.phone_number || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-violet-50 p-3 rounded-lg border border-violet-100">
                        <p className="text-sm font-medium text-violet-800">Organization</p>
                        <p className="font-semibold text-slate-900">{profile.current_organization || 'Not provided'}</p>
                      </div>
                      <div className="bg-cyan-50 p-3 rounded-lg border border-cyan-100">
                        <p className="text-sm font-medium text-cyan-800">Location</p>
                        <p className="font-semibold text-slate-900">{profile.location || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing Information - Enhanced */}
              <div className="bg-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-900">Pricing</h2>
                  {!isEditing.pricing && (
                    <Button onClick={() => handleEdit('pricing')} variant="outline" size="sm" className="hover:bg-blue-50 border-blue-300 text-blue-600 hover:border-blue-400">
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Pricing
                    </Button>
                  )}
                </div>

                {isEditing.pricing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      {/* <div>
                        <label className="block text-sm font-medium mb-1">Video Call (₹/hour)</label>
                        <Input
                          value={editedProfile.video_pricing?.toString() || ''}
                          onChange={(e) => handleUpdateField('video_pricing', parseFloat(e.target.value) || 0)}
                          placeholder="Video Call Price"
                          type="number"
                        />
                      </div>
                       */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Audio Call (₹/hour)</label>
                        <Input
                          value={editedProfile.audio_pricing?.toString() || ''}
                          onChange={(e) => handleUpdateField('audio_pricing', parseFloat(e.target.value) || 0)}
                          placeholder="Audio Call Price"
                          type="number"
                        />
                      </div>
                      {/* <div>
                        <label className="block text-sm font-medium mb-1">Chat (₹/hour)</label>
                        <Input
                          value={editedProfile.chat_pricing?.toString() || ''}
                          onChange={(e) => handleUpdateField('chat_pricing', parseFloat(e.target.value) || 0)}
                          placeholder="Chat Price"
                          type="number"
                        />
                      </div> */}
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={() => handleProfileUpdate('pricing')} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button onClick={() => handleCancelEdit('pricing')} variant="outline" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {/* <div className="text-center p-6 border border-emerald-200 rounded-lg bg-gradient-to-b from-emerald-50 to-white hover:shadow-md transition-shadow">
                      <h3 className="font-medium text-slate-900">Video Call</h3>
                      <p className="text-3xl font-bold text-emerald-600 my-2">₹{profile.video_pricing || 0}</p>
                      <p className="text-sm text-slate-500">per hour</p>
                    </div> */}
                    <div className="text-center p-6 border border-blue-200 rounded-lg bg-gradient-to-b from-blue-50 to-white hover:shadow-md transition-shadow">
                      <h3 className="font-medium text-slate-900">Audio Call</h3>
                      <p className="text-3xl font-bold text-blue-600 my-2">₹{profile.audio_pricing || 0}</p>
                      <p className="text-sm text-slate-500">per hour</p>
                    </div>
                    {/* <div className="text-center p-6 border border-violet-200 rounded-lg bg-gradient-to-b from-violet-50 to-white hover:shadow-md transition-shadow">
                      <h3 className="font-medium text-slate-900">Chat</h3>
                      <p className="text-3xl font-bold text-violet-600 my-2">₹{profile.chat_pricing || 0}</p>
                      <p className="text-sm text-slate-500">per hour</p>
                    </div> */}
                  </div>
                )}
              </div>

              {/* Availability Section - Enhanced */}
              <div className="bg-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">Availability</h2>
                </div>
                
                <AvailabilitySection
                  selectedDay={selectedDay}
                  setSelectedDay={setSelectedDay}
                  startTime={startTime}
                  endTime={endTime}
                  onTimeChange={handleTimeChange}
                  onUpdateAvailability={handleUpdateAvailability}
                  WEEKDAYS={WEEKDAYS}
                  TIME_OPTIONS={TIME_OPTIONS}
                />

                {/* Current Availability Display - Enhanced */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3 text-slate-900">Current Schedule</h3>
                  {availability.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {availability.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100 hover:shadow-md transition-shadow">
                          <span className="font-medium text-slate-900">{item.day_of_week}</span>
                          <span className="text-blue-700 font-medium">{item.start_time} - {item.end_time}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
                      <Clock className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                      <p className="text-slate-500 italic">No availability set</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Activity & Meetings - Enhanced */}
            <div className="space-y-6">
              {/* Activity & Meetings */}
              <div className="bg-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                    <Activity className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">Activity & Meetings</h2>
                </div>

                {/* Recent Activity */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3 text-slate-700">Recent Activity</h3>
                  <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
                    <Activity className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                    <p className="text-slate-500">No recent activity</p>
                  </div>
                </div>

                {/* Upcoming Meetings */}
                <div>
                  <h3 className="text-lg font-medium mb-3 text-slate-700">Upcoming Meetings</h3>
                  <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
                    <Calendar className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                    <p className="text-slate-500">No upcoming meetings</p>
                  </div>
                </div>
              </div>

              {/* Statistics - Enhanced */}
              <div className="bg-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-violet-100 rounded-lg mr-3">
                    <Users className="h-5 w-5 text-violet-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">Statistics</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="text-blue-800 font-medium">Total Sessions</span>
                    <span className="font-bold text-lg text-slate-900">0</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <span className="text-emerald-800 font-medium">Total Earnings</span>
                    <span className="font-bold text-lg text-emerald-600">₹0</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <span className="text-amber-800 font-medium">Average Rating</span>
                    <span className="font-bold text-lg text-amber-600">-</span>
                  </div>
                  <div 
                    className="flex justify-between items-center p-3 bg-violet-50 rounded-lg border border-violet-100 cursor-pointer hover:bg-violet-100 transition-colors"
                    onClick={() => {
                      fetchFeedbacks();
                      setIsFeedbackModalOpen(true);
                    }}
                  >
                    <span className="text-violet-800 font-medium">Response Rate</span>
                    <span className="font-bold text-lg text-slate-900">
                      {loadingFeedbacks ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-800"></div>
                      ) : (
                        feedbacks.length > 0 ? 
                          (feedbacks.reduce((acc, curr) => acc + (curr.rating || 0), 0) / feedbacks.length).toFixed(1) : 
                          '-'
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions - Enhanced */}
              <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-md hover:shadow-lg transition-all duration-300" variant="secondary">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Availability
                  </Button>
                  <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-md hover:shadow-lg transition-all duration-300" variant="secondary">
                    <Users className="h-4 w-4 mr-2" />
                    View Client Requests
                  </Button>
                  <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-md hover:shadow-lg transition-all duration-300" variant="secondary">
                    <Activity className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Add Feedback Modal */}
      <Dialog open={isFeedbackModalOpen} onOpenChange={setIsFeedbackModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">Session Feedback</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {loadingFeedbacks ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : feedbacks.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {feedbacks.map((feedback) => (
                  <Card key={feedback.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            Session with {feedback.seeker_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(feedback.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {feedback.rating && (
                          <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
                            <span className="text-yellow-600 text-lg font-bold mr-1">
                              {feedback.rating}
                            </span>
                            <span className="text-yellow-600">/5</span>
                          </div>
                        )}
                      </div>

                      {feedback.review && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-1">Review</p>
                          <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {feedback.review}
                          </p>
                        </div>
                      )}

                      {feedback.message && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-1">Your Note</p>
                          <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {feedback.message}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                        <span>Session ID: {feedback.booking_id.slice(0, 8)}...</span>
                        <span>{new Date(feedback.created_at).toLocaleTimeString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No feedback received yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpertDashboard;