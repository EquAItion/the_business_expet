import React, { useEffect, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Phone, Video, MessageSquare } from 'lucide-react';
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
  video_price?: number;
  audio_price?: number;
  chat_price?: number;
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

const ExpertDashboard: React.FC = () => {
  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpertData = async () => {
      try {
        const expertData = localStorage.getItem('expertSignupData');
        if (!expertData) {
          throw new Error('No expert data found');
        }

        const { token } = JSON.parse(expertData);
        const response = await fetch('http://localhost:5000/api/experts/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch expert profile');
        }

        const { success, data, message } = await response.json();
        if (!success) {
          throw new Error(message || 'Failed to fetch expert profile');
        }

        setProfile(data);
        setMeetings([]); // Initialize with empty meetings array
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchExpertData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">{error}</div>;
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 mt-20">
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
                  <div className="text-center">
                    <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-semibold text-primary mx-auto">
                      {profile?.first_name[0]}{profile?.last_name[0]}
                    </div>
                    <div className="mt-4 space-y-2">
                      <h2 className="text-2xl font-semibold">{profile?.first_name} {profile?.last_name}</h2>
                      <p className="text-muted-foreground">{profile?.designation}</p>
                      <p className="text-sm text-muted-foreground">{profile?.expertise}</p>
                    </div>
                  </div>
                </div>

                {/* Right Column - Contact Details */}
                <div className="md:w-2/3 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <FaBriefcase className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Organization</p>
                          <p className="font-medium">{profile?.current_organization}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaMapMarkerAlt className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Location</p>
                          <p className="font-medium">{profile?.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaBriefcase className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Experience</p>
                          <p className="font-medium">{profile?.work_experience} years</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <FaEnvelope className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{profile?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaPhone className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{profile?.phone_number}</p>
                        </div>
                      </div>
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
                <div className="col-span-1 space-y-3 bg-card p-4 rounded-lg border">
                  <h3 className="font-medium text-sm">Pricing</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-primary" />
                        <span className="text-sm">Video</span>
                      </div>
                      <span className="text-sm font-medium">USD {profile?.video_pricing}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <span className="text-sm">Audio</span>
                      </div>
                      <span className="text-sm font-medium">USD {profile?.audio_pricing}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <span className="text-sm">Chat</span>
                      </div>
                      <span className="text-sm font-medium">USD {profile?.chat_pricing}</span>
                    </div>
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