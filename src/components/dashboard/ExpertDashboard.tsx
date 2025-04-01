import React, { useEffect, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Phone, Video, MessageSquare, Pencil } from 'lucide-react';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  FaMapMarkerAlt, 
  FaEnvelope, 
  FaPhone, 
  FaVideo, 
  FaComments,
  FaLinkedin, 
  FaTwitter, 
  FaInstagram,
  FaBriefcase
} from 'react-icons/fa';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";

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

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'audio' | 'video' | 'chat';
  clientName: string;
}

// Add these interfaces at the top of the file
interface EditingState {
  personal: boolean;
  contact: boolean;
  pricing: boolean;
}

// Add this interface with existing interfaces
interface ToastProps {
  title?: string;
  description: string;
  variant?: 'default' | 'destructive';
}

const ExpertDashboard: React.FC = () => {
    const [profile, setProfile] = useState<ExpertProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Add these state declarations
    const [editedProfile, setEditedProfile] = useState<ExpertProfile | null>(null);
    const [isEditing, setIsEditing] = useState<EditingState>({
      personal: false,
      contact: false,
      pricing: false
    });
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [meetings, setMeetings] = useState<Meeting[]>([]);

    // Add the edit handler function
    const handleEdit = async (section: keyof EditingState) => {
      if (isEditing[section]) {
        try {
          const userData = localStorage.getItem('user');
          if (!userData) throw new Error('No user data found');
  
          const { token, user_id } = JSON.parse(userData);
  
          // Prepare update data based on section
          const updateData = {
            section,
            user_id,
            ...editedProfile,
            // Convert string values to numbers for pricing
            ...(section === 'pricing' && {
              video_pricing: Number(editedProfile?.video_pricing) || null,
              audio_pricing: Number(editedProfile?.audio_pricing) || null,
              chat_pricing: Number(editedProfile?.chat_pricing) || null
            })
          };
  
          // Debug log
          console.log('Sending update with data:', updateData);
  
          const response = await fetch(`http://localhost:5000/api/experts/profile/${user_id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
          });
  
          // Debug log
          console.log('Response status:', response.status);
  
          if (!response.ok) {
            const text = await response.text();
            console.error('Error response:', text);
            throw new Error(`Failed to update profile: ${text}`);
          }
  
          const result = await response.json();
  
          if (!result.success) {
            throw new Error(result.message || 'Failed to update profile');
          }
  
          setProfile(result.data);
          setEditedProfile(result.data);
  
          toast({
            title: "Success",
            description: `${section.charAt(0).toUpperCase() + section.slice(1)} updated successfully`,
          });
  
        } catch (error) {
          console.error('Update error:', error);
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : 'Failed to update profile',
            variant: "destructive",
          });
          return;
        }
      }
  
      setIsEditing(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    };

    // Update useEffect to include meetings fetch
    useEffect(() => {
      const fetchData = async () => {
        try {
          const userData = localStorage.getItem('user');
          if (!userData) throw new Error('Please login to access dashboard');
  
          const { token, user_id } = JSON.parse(userData);
          if (!token || !user_id) throw new Error('Invalid session data');
  
          // Debug log
          console.log('Fetching profile for user_id:', user_id);
  
          // Fetch profile
          const profileResponse = await fetch(`http://localhost:5000/api/experts/profile/${user_id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
  
          if (!profileResponse.ok) {
            if (profileResponse.status === 401) {
              localStorage.removeItem('user');
              navigate('/auth/expert');
              throw new Error('Session expired, please login again');
            }
            throw new Error('Failed to fetch expert profile');
          }
  
          const profileResult = await profileResponse.json();
          if (!profileResult.success) {
            throw new Error(profileResult.message || 'Failed to load profile data');
          }
  
          setProfile(profileResult.data);
          setEditedProfile(profileResult.data);
  
          // Debug log
          console.log('Profile fetched successfully:', profileResult.data);
  
        } catch (error) {
          console.error('Dashboard error:', error);
          setError(error instanceof Error ? error.message : 'Failed to load dashboard');
          if (error instanceof Error && 
              (error.message.includes('login') || error.message.includes('session'))) {
            navigate('/auth/expert');
          }
        } finally {
          setLoading(false);
        }
      };
  
      fetchData();
    }, [navigate]);

    // Add this after the existing useEffect
    useEffect(() => {
      const fetchSignupData = async () => {
        try {
          const signupData = localStorage.getItem('expertSignupData');
          if (!signupData) return; // Skip if no signup data
    
          const { token, user_id } = JSON.parse(signupData);
          if (!token || !user_id) return;
    
          // Debug log
          console.log('Fetching signup profile data:', { user_id });
    
          const profileResponse = await fetch(`http://localhost:5000/api/experts/profile/${user_id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
    
          if (!profileResponse.ok) {
            throw new Error('Failed to fetch expert profile');
          }
    
          const profileResult = await profileResponse.json();
          if (!profileResult.success) {
            throw new Error(profileResult.message);
          }
    
          // Update profile state
          setProfile(profileResult.data);
          setEditedProfile(profileResult.data);
    
          // Store complete user data and clean up signup data
          const completeUserData = {
            user_id,
            token,
            role: 'expert',
            profile: profileResult.data
          };
          localStorage.setItem('user', JSON.stringify(completeUserData));
          localStorage.removeItem('expertSignupData');
    
        } catch (error) {
          console.error('Signup data fetch error:', error);
        }
      };
    
      fetchSignupData();
    }, []); // Run once on mount

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
                    <Button onClick={() => window.location.reload()}>
                        Try Again
                    </Button>
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
            <h1 className="text-2xl text-center font-bold mb-0 mt-20">
             Welcome, {profile.first_name} <span className='text-primary'>{profile.last_name} </span>
            </h1>
            <div className="container mx-auto px-4 py-8 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* Profile & Calendar Section */}
           <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Expert Profile & Management</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Profile Info & Contact Details */}
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left Column - Profile Info */}
                <div className="md:w-1/3">
                  <div className="text-center relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => handleEdit('personal')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-semibold text-primary mx-auto">
                      {profile?.first_name[0]}{profile?.last_name[0]}
                    </div>
                    <div className="mt-4 space-y-2">
                      {isEditing.personal ? (
                        <>
                          <Input
                            value={editedProfile?.first_name || ''}
                            onChange={(e) => setEditedProfile(prev => ({ ...prev!, first_name: e.target.value }))}
                            className="mb-2"
                          />
                          <Input
                            value={editedProfile?.last_name || ''}
                            onChange={(e) => setEditedProfile(prev => ({ ...prev!, last_name: e.target.value }))}
                            className="mb-2"
                          />
                          <Input
                            value={editedProfile?.designation || ''}
                            onChange={(e) => setEditedProfile(prev => ({ ...prev!, designation: e.target.value }))}
                          />
                          <Button 
                            className="w-full mt-4"
                            onClick={() => handleEdit('personal')}
                          >
                            Save Profile
                          </Button>
                        </>
                      ) : (
                        <>
                          <h2 className="text-2xl font-semibold">{profile?.first_name} {profile?.last_name}</h2>
                          <p className="text-muted-foreground">{profile?.designation}</p>
                          <p className="text-sm text-muted-foreground">{profile?.expertise}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Contact Details */}
                <div className="md:w-2/3 space-y-4 relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => handleEdit('contact')}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <FaBriefcase className="w-5 h-5 text-primary" />
                        <div className="w-full">
                          {isEditing.contact ? (
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Organization</p>
                              <Input
                                value={editedProfile?.current_organization || ''}
                                onChange={(e) => setEditedProfile(prev => ({
                                  ...prev!,
                                  current_organization: e.target.value
                                }))}
                              />
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-muted-foreground">Organization</p>
                              <p className="font-medium">{profile?.current_organization}</p>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaMapMarkerAlt className="w-5 h-5 text-primary" />
                        <div className="w-full">
                          {isEditing.contact ? (
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Location</p>
                              <Input
                                value={editedProfile?.location || ''}
                                onChange={(e) => setEditedProfile(prev => ({
                                  ...prev!,
                                  location: e.target.value
                                }))}
                              />
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-muted-foreground">Location</p>
                              <p className="font-medium">{profile?.location}</p>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaBriefcase className="w-5 h-5 text-primary" />
                        <div className="w-full">
                          {isEditing.contact ? (
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Experience</p>
                              <Input
                                type="number"
                                value={editedProfile?.work_experience || ''}
                                onChange={(e) => setEditedProfile(prev => ({
                                  ...prev!,
                                  work_experience: e.target.value
                                }))}
                              />
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-muted-foreground">Experience</p>
                              <p className="font-medium">{profile?.work_experience} years</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <FaEnvelope className="w-5 h-5 text-primary" />
                        <div className="w-full">
                          {isEditing.contact ? (
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Email</p>
                              <Input
                                type="email"
                                value={editedProfile?.email || ''}
                                onChange={(e) => setEditedProfile(prev => ({
                                  ...prev!,
                                  email: e.target.value
                                }))}
                              />
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-muted-foreground">Email</p>
                              <p className="font-medium">{profile?.email}</p>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaPhone className="w-5 h-5 text-primary" />
                        <div className="w-full">
                          {isEditing.contact ? (
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Phone</p>
                              <Input
                                value={editedProfile?.phone_number || ''}
                                onChange={(e) => setEditedProfile(prev => ({
                                  ...prev!,
                                  phone_number: e.target.value
                                }))}
                              />
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-muted-foreground">Phone</p>
                              <p className="font-medium">{profile?.phone_number}</p>
                            </>
                          )}
                        </div>
                      </div>
                      {isEditing.contact && (
                        <Button 
                          className="w-full mt-4"
                          onClick={() => handleEdit('contact')}
                        >
                          Save Changes
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Small Cards Section remains unchanged */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t mt-6">
                {/* Calendar Card */}
                <div className="col-span-1 space-y-3 bg-card p-4 rounded-lg border">
                  <h3 className="font-medium text-sm">Availability</h3>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal text-sm">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'PP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Button size="sm" className="w-full text-sm">Update</Button>
                </div>

                {/* Pricing Card */}
                <div className="col-span-1 space-y-3 bg-card p-4 rounded-lg border relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2"
                    onClick={() => handleEdit('pricing')}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <h3 className="font-medium text-sm">Pricing</h3>
                  <div className="space-y-2">
                    {isEditing.pricing ? (
                      <>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4 text-primary" />
                              <span className="text-sm">Video</span>
                            </div>
                            <Input
                              type="number"
                              value={editedProfile?.video_pricing || ''}
                              onChange={(e) => setEditedProfile(prev => ({ 
                                ...prev!, 
                                video_pricing: Number(e.target.value) 
                              }))}
                              className="w-24"
                              placeholder="USD"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-primary" />
                              <span className="text-sm">Audio</span>
                            </div>
                            <Input
                              type="number"
                              value={editedProfile?.audio_pricing || ''}
                              onChange={(e) => setEditedProfile(prev => ({ 
                                ...prev!, 
                                audio_pricing: Number(e.target.value) 
                              }))}
                              className="w-24"
                              placeholder="USD"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-primary" />
                              <span className="text-sm">Chat</span>
                            </div>
                            <Input
                              type="number"
                              value={editedProfile?.chat_pricing || ''}
                              onChange={(e) => setEditedProfile(prev => ({ 
                                ...prev!, 
                                chat_pricing: Number(e.target.value) 
                              }))}
                              className="w-24"
                              placeholder="USD"
                            />
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full mt-4"
                          onClick={() => handleEdit('pricing')}
                        >
                          Save Pricing
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Video className="h-4 w-4 text-primary" />
                            <span className="text-sm">Video</span>
                          </div>
                          <span className="text-sm font-medium"> {profile?.video_pricing} USD</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-primary" />
                            <span className="text-sm">Audio</span>
                          </div>
                          <span className="text-sm font-medium"> {profile?.audio_pricing} USD</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-primary" />
                            <span className="text-sm">Chat</span>
                          </div>
                          <span className="text-sm font-medium"> {profile?.chat_pricing} USD</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Social Links Card */}
                <div className="col-span-1 space-y-3 bg-card p-4 rounded-lg border">
                  <h3 className="font-medium text-sm">Social Media</h3>
                  <div className="space-y-2">
                    {profile?.linkedin && (
                      <a 
                        href={profile.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <FaLinkedin className="h-4 w-4" />
                        <span className="text-sm">LinkedIn</span>
                      </a>
                    )}
                    {profile?.twitter && (
                      <a 
                        href={profile.twitter} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <FaTwitter className="h-4 w-4" />
                        <span className="text-sm">Twitter</span>
                      </a>
                    )}
                    {profile?.instagram && (
                      <a 
                        href={profile.instagram} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <FaInstagram className="h-4 w-4" />
                        <span className="text-sm">Instagram</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity & Meetings Card */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Activity & Meetings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Recent Activity Section */}
                <div>
                  <h3 className="font-medium mb-3">Recent Activity</h3>
                  <div className="space-y-4">
                    {[
                      { type: 'Session Completed', client: 'John Doe', time: '2 hours ago' },
                      { type: 'New Booking', client: 'Jane Smith', time: '5 hours ago' },
                      { type: 'Review Received', client: 'Mike Johnson', time: '1 day ago' },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">{activity.type}</p>
                          <p className="text-muted-foreground">{activity.client}</p>
                        </div>
                        <span className="text-muted-foreground">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-border" />

                {/* Upcoming Meetings Section */}
                <div>
                  <h3 className="font-medium mb-3">Upcoming Meetings</h3>
                  <div className="space-y-4">
                    {meetings.length === 0 ? (
                      <p className="text-muted-foreground text-center">No upcoming meetings</p>
                    ) : (
                      meetings.map((meeting) => (
                        <div key={meeting.id} className="flex items-start space-x-4 p-3 rounded-lg border">
                          <div className="flex-shrink-0">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="font-medium">{meeting.title}</p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="mr-1 h-4 w-4" />
                              <span>{format(new Date(meeting.date), 'PPP')} at {meeting.time}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">with {meeting.clientName}</p>
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                              {meeting.type}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>    
    <Footer />
  </>
    );
};

export default ExpertDashboard;