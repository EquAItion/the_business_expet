import React, { useEffect, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { CalendarIcon, Clock, MapPin, Briefcase, Mail, Phone } from 'lucide-react';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';

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
          {/* Profile Section */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Profile Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {profile && (
                <div className="space-y-4">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-semibold text-primary mx-auto">
                    {profile.first_name[0]}{profile.last_name[0]}
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-semibold">{profile.first_name} {profile.last_name}</h2>
                    <p className="text-muted-foreground">{profile.designation}</p>
                  </div>
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.current_organization}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.phone_number}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calendar Section */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Availability Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
              <div className="mt-4">
                <Button className="w-full">Update Availability</Button>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Meetings */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Upcoming Meetings</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ExpertDashboard;