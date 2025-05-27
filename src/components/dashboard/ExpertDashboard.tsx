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
import { Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';

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
    "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"
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

  return (
    <>
      <Navbar />
      <h1 className="text-2xl text-center font-bold mt-20 mb-0">
        Welcome, {profile.first_name} <span className="text-primary">{profile.last_name}</span>
      </h1>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Section */}
          <Card className="md:col-span-2">
            <div className="card-header">
              <h2 className="card-title">Expert Profile & Management</h2>
            </div>
            <div className="card-content">
              <ProfileSection
                profile={profile}
                editedProfile={editedProfile}
                isEditing={isEditing}
                onEdit={handleEdit}
                onUpdateField={handleUpdateField}
                expertId={expertId}
                onProfileUpdated={refreshProfile}
              />
            </div>
          </Card>

          {/* Availability Section */}
          <AvailabilitySection
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            startTime={startTime}
            endTime={endTime}
            onTimeChange={handleTimeChange}
            onUpdateAvailability={() => {
              // This is called after a successful update
              // You could refresh other data if needed
              toast({
                title: "Success",
                description: "Your availability has been updated",
              });
            }}
            WEEKDAYS={WEEKDAYS}
            TIME_OPTIONS={TIME_OPTIONS}
          />

          {/* Pricing Card Section */}
          <PricingCard 
            videoPricing={profile.video_pricing} 
            audioPricing={profile.audio_pricing} 
            chatPricing={profile.chat_pricing}
            expertId={expertId} 
            onPricingUpdated={refreshPricingData}
          />

          {/* Activity & Meetings Section */}
          <ActivityMeetingsSection
            recentActivity={recentActivity}
            meetings={meetings}
          />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ExpertDashboard;

