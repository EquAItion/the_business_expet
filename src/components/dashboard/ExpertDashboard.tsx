import React, { useEffect, useState } from 'react';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from "@/components/ui/use-toast";
import ProfileSection from './ProfileSection';
import AvailabilitySection from './AvailabilitySection';
import ActivityMeetingsSection from './ActivityMeetingsSection';
import PricingCard from './PricingCard';
import { Pencil, User, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ExpertProfile {
  first_name: string;
  last_name: string;
  designation: string;
  expertise: string;
  work_experience: string;
  current_organization: string;
  location: string;
  areas_of_help: string;
  phone_number: string;
  email: string;
  video_pricing?: number;
  audio_pricing?: number;
  chat_pricing?: number;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
}

interface EditingState {
  personal: boolean;
  contact: boolean;
  pricing: boolean;
}

interface ProfileSectionProps {
  profile: ExpertProfile;
  editedProfile: ExpertProfile | null;
  isEditing: EditingState;
  onEdit: (section: keyof EditingState) => void;
  onUpdateField: (field: keyof ExpertProfile, value: string) => void;
  expertId: string | null;
  onProfileUpdated: () => Promise<void>;
}

const ExpertDashboard: React.FC = () => {
  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState<ExpertProfile | null>(null);
  const [isEditing, setIsEditing] = useState<EditingState>({
    personal: false,
    contact: false,
    pricing: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | undefined>(undefined);
  const [startTime, setStartTime] = useState<string>("9:00 AM");
  const [endTime, setEndTime] = useState<string>("5:00 PM");
  const [meetings, setMeetings] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [expertId, setExpertId] = useState<string | null>(null);

  const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const TIME_OPTIONS = [
    "12:00 AM", "1:00 AM", "2:00 AM", "3:00 AM", "4:00 AM", "5:00 AM", "6:00 AM", "7:00 AM",
    "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM",
    "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM"
  ];

  // Fetch expert profile from database
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Attempt to get auth data from 'user' or 'expertSignupData'
        const storedData =
          localStorage.getItem('user') || localStorage.getItem('expertSignupData');
        if (!storedData) {
          throw new Error('User not found, please log in.');
        }

        const parsedData = JSON.parse(storedData);

        // Extract token and id — sometimes the id is stored as "user_id"
        const token = parsedData.token || parsedData.accessToken;
        const id = parsedData.id || parsedData.user_id;

        // Store the expert ID in state so we can pass it to components
        if (id) {
          setExpertId(id);
          // Also store in localStorage for potential future use
          localStorage.setItem('expertId', id);
        }

        // If token or id are missing but profile exists, use stored profile (signup flow)
        if ((!token || !id) && parsedData.profile) {
          console.warn(
            "Incomplete auth data but profile exists. Using stored profile."
          );
          setProfile(parsedData.profile);
          setEditedProfile(parsedData.profile);
          setLoading(false);
          return;
        }

        // If neither token nor id are found and no stored profile, prompt login.
        if (!token || !id) {
          throw new Error('Missing token or id, please log in.');
        }

        // In signin flow, token and id are complete so fetch the profile from the API.
        const API_BASE_URL = import.meta.env.VITE_API_URL;
        const res = await fetch(`${API_BASE_URL}/api/experts/profile/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Session expired, please log in again.');
          }
          throw new Error('Failed to fetch expert profile.');
        }

        // Assuming API response is: { success: true, data: { ...profile } }
        const result = await res.json();
        if (!result.success) {
          throw new Error(result.message || 'Failed to fetch profile data.');
        }

        console.log("Final profile data being used:", result.data);
        setProfile(result.data);
        setEditedProfile(result.data);
        setLoading(false);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Add a function to refresh the profile data
  const refreshProfile = async () => {
    try {
      // Get user data from localStorage
      const storedData = localStorage.getItem('user') || localStorage.getItem('expertSignupData');
      if (!storedData) return;
      
      const parsedData = JSON.parse(storedData);
      const token = parsedData.token || parsedData.accessToken;
      const id = parsedData.id || parsedData.user_id;
      
      if (!token || !id) return;
      
      // Fetch the latest profile data
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const res = await fetch(`${API_BASE_URL}/api/experts/profile/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          // Update the profile state with new data
          setProfile(result.data);
          setEditedProfile(result.data);
        }
      }
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
  };

  const refreshPricingData = async () => {
    try {
      // Re-fetch the expert profile data which includes pricing
      const storedData = localStorage.getItem('user') || localStorage.getItem('expertSignupData');
      if (!storedData) return;
      
      const parsedData = JSON.parse(storedData);
      const token = parsedData.token || parsedData.accessToken;
      const id = parsedData.id || parsedData.user_id;
      
      if (!token || !id) return;
      
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const res = await fetch(`${API_BASE_URL}/api/experts/profile/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setProfile(result.data);
          setEditedProfile(result.data);
        }
      }
    } catch (error) {
      console.error("Error refreshing pricing data:", error);
    }
  };

  const handleEdit = (section: keyof EditingState) => {
    setIsEditing(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleUpdateField = (field: keyof ExpertProfile, value: string) => {
    setEditedProfile(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setStartTime(value);
      const startIndex = TIME_OPTIONS.indexOf(value);
      const endIndex = TIME_OPTIONS.indexOf(endTime);
      if (endIndex <= startIndex) {
        const newEndIndex = Math.min(startIndex + 1, TIME_OPTIONS.length - 1);
        setEndTime(TIME_OPTIONS[newEndIndex]);
      }
    } else {
      setEndTime(value);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="text-red-500">{error}</div>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
        <Footer />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          No profile data available
        </div>
        <Footer />
      </>
    );
  }

  // Update the profile section render code
  return (
    <>
      <Navbar />
      <div className="bg-gray-50 min-h-screen pt-20">
        {/* Main Content Grid */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Profile */}
            <div>
              <Card className="min-h-[400px]"> {/* Set minimum height */}
                <div className="p-4 h-full flex flex-col">
                  {/* Header with Avatar */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {profile.first_name ? (
                        <span className="text-lg font-semibold text-primary">
                          {`${profile.first_name[0]}${profile.last_name?.[0] || ''}`}
                        </span>
                      ) : (
                        <User className="h-6 w-6 text-primary/60" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-base font-medium text-gray-900">
                        {profile.first_name} {profile.last_name}
                      </h1>
                      <p className="text-sm text-gray-600">{profile.designation}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit('personal')}
                      className="h-8 px-2 text-xs"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      <span>Edit</span>
                    </Button>
                  </div>

                  {/* Profile Details with flex-grow to push content apart */}
                  <div className="flex-grow space-y-3 text-sm divide-y divide-gray-100">
                    {[
                      { label: 'Expertise', value: profile.expertise },
                      { label: 'Experience', value: `${profile.work_experience} yrs` },
                      { label: 'Email', value: profile.email },
                      { label: 'Phone', value: profile.phone_number },
                      { label: 'Areas of Help', value: profile.areas_of_help }
                    ].map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2">
                        <span className="text-gray-500">{item.label}</span>
                        <span className="text-gray-900 truncate ml-2 max-w-[60%]" title={item.value}>
                          {item.value || '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Middle Column - Pricing */}
            <div>
              <Card className="min-h-[400px]">
                <div className="p-4 h-full">
                  <PricingCard 
                    videoPricing={profile.video_pricing} 
                    audioPricing={profile.audio_pricing} 
                    chatPricing={profile.chat_pricing}
                    expertId={expertId} 
                    onPricingUpdated={refreshPricingData}
                  />
                </div>
              </Card>
            </div>

            {/* Right Column - Activity & Meetings */}
            <div>
              <Card className="min-h-[400px]">
                <div className="p-4 h-full">
                  <ActivityMeetingsSection
                    recentActivity={recentActivity}
                    meetings={meetings}
                  />
                </div>
              </Card>
            </div>
          </div>

          {/* Availability Section Below */}
          <div className="mt-6">
            <Card>
              <div className="p-4">
                <AvailabilitySection
                  selectedDay={selectedDay}
                  setSelectedDay={setSelectedDay}
                  startTime={startTime}
                  endTime={endTime}
                  onTimeChange={handleTimeChange}
                  onUpdateAvailability={() => {
                    toast({
                      title: "Success",
                      description: "Your availability has been updated",
                    });
                  }}
                  WEEKDAYS={WEEKDAYS}
                  TIME_OPTIONS={TIME_OPTIONS}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ExpertDashboard;

