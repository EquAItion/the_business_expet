import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  Clock, 
  User, 
  MapPin, 
  Video, 
  Phone, 
  MessageSquare, 
  ExternalLink,
  Calendar as CalendarIcon,
  Check, 
  X, 
  CalendarClock 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { toast } from "../components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Calendar } from "../components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { format } from "date-fns";

interface Booking {
  id: string;
  expert_id: string;
  seeker_id: string;
  expert_name: string;
  seeker_name: string;
  date: string;
  start_time: string;
  end_time: string;
  session_type: 'video' | 'audio' | 'chat';
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  amount: number | string; // Updated to handle both number and string
  created_at: string;
  notes?: string;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  profile_image?: string;
  specialty?: string; // For experts
  designation?: string; // For experts
  company?: string; // For seekers
  role?: string;
  bio?: string;
  industry?: string;
}

const capitalizeFirstLetter = (str: string) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const AppointmentLog = () => {
  const [seekerBookings, setSeekerBookings] = useState<Booking[]>([]);
  const [expertBookings, setExpertBookings] = useState<Booking[]>([]);
  const [userType, setUserType] = useState<'seeker' | 'expert' | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingSeeker, setLoadingSeeker] = useState(false);
  const [loadingExpert, setLoadingExpert] = useState(false);
  const [errorSeeker, setErrorSeeker] = useState<string | null>(null);
  const [errorExpert, setErrorExpert] = useState<string | null>(null);
  const [uniqueContacts, setUniqueContacts] = useState<UserProfile[]>([]);
  const navigate = useNavigate();

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Get time until appointment
  const getTimeUntil = (dateString: string) => {
    const appointmentDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(appointmentDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 30) return `In ${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
    return `In ${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''}`;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  // Get session type icon
  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4 mr-1" />;
      case 'audio':
        return <Phone className="h-4 w-4 mr-1" />;
      case 'chat':
        return <MessageSquare className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  // Get bookings with a specific contact
  const getBookingsWithContact = (contactId: string) => {
    if (userType === 'seeker') {
      return expertBookings.filter(booking => booking.expert_id === contactId);
    } else if (userType === 'expert') {
      return seekerBookings.filter(booking => booking.seeker_id === contactId);
    }
    return [];
  };

  // Get upcoming count for badge
  const getUpcomingCount = () => {
    const bookings = userType === 'seeker' ? seekerBookings : expertBookings;
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.date + 'T' + booking.end_time.replace(/\s?[AP]M/, ''));
      const now = new Date();
      return bookingDate > now && 
             (booking.status === 'confirmed' || booking.status === 'pending');
    }).length;
  };

  // Get past count for badge
  const getPastCount = () => {
    const bookings = userType === 'seeker' ? seekerBookings : expertBookings;
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.date + 'T' + booking.end_time.replace(/\s?[AP]M/, ''));
      const now = new Date();
      return bookingDate < now || 
             booking.status === 'completed' || 
             booking.status === 'rejected' || 
             booking.status === 'cancelled';
    }).length;
  };

  // Fetch bookings for seeker - completely rewritten for reliability
  const fetchSeekerBookings = async (id: string) => {
    setLoadingSeeker(true);
    setErrorSeeker(null);
    
    try {
      console.log(`Fetching seeker bookings for user ID: ${id}`);
      
      const token = localStorage.getItem('token') || 
                   (JSON.parse(localStorage.getItem('user') || '{}').token) || 
                   '';
      
      const response = await fetch(`http://localhost:8081/api/bookings/seeker/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const responseText = await response.text();
      console.log(`Raw seeker bookings response: ${responseText}`);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        setErrorSeeker("Invalid response from server");
        setSeekerBookings([]);
        return;
      }
      
      console.log("Parsed seeker bookings data:", data);
      
      if (data && data.success && Array.isArray(data.data)) {
        // Ensure all bookings have the required fields
        const processedBookings = data.data.map((booking: any) => ({
          ...booking,
          expert_name: booking.expert_name || 'Expert',
          seeker_name: booking.seeker_name || 'Seeker',
          date: booking.date || booking.appointment_date,
          id: booking.id || `temp-${Math.random()}`
        }));
        
        console.log("Processed seeker bookings:", processedBookings);
        setSeekerBookings(processedBookings);
      } else {
        console.warn("Invalid or empty seeker bookings data:", data);
        setSeekerBookings([]);
      }
    } catch (error) {
      console.error("Error fetching seeker bookings:", error);
      setErrorSeeker("Failed to load your bookings");
      setSeekerBookings([]);
    } finally {
      setLoadingSeeker(false);
    }
  };

  // Fetch bookings for expert
  const fetchExpertBookings = async (id: string) => {
    setLoadingExpert(true);
    setErrorExpert(null);
    try {
      // Use a try-catch to prevent fetch errors from breaking the app
      try {
        const response = await fetch(`http://localhost:8081/api/bookings/expert/${id}`);
        
        if (!response.ok) {
          console.warn(`Failed to fetch expert bookings: ${response.status}`);
          setExpertBookings([]);
          return;
        }
        
        const data = await response.json();
        console.log("Expert bookings data:", data);
        
        if (data && data.data) {
          setExpertBookings(data.data);
        } else if (data && Array.isArray(data)) {
          // Handle case where API returns array directly
          setExpertBookings(data);
        } else {
          console.warn('Invalid response format for expert bookings');
          setExpertBookings([]);
        }
      } catch (error) {
        console.error('Error fetching expert bookings:', error);
        setExpertBookings([]);
      }
    } finally {
      setLoadingExpert(false);
    }
  };

  // Improve the authentication check to properly detect logged in users
  useEffect(() => {
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem('user');
        console.log("User data from localStorage:", userData);
        
        if (userData) {
          const user = JSON.parse(userData);
          
          // Check for all possible ID fields
          const userId = user.user_id || user.id;
          
          // If we have a token, consider the user logged in even without ID
          if (user.token || user.accessToken) {
            // Set a default ID if none is found
            setUserId(userId || 'default-user-id');
            
            // Determine user type
            const role = (user.role || '').toLowerCase();
            setUserType(role.includes('expert') ? 'expert' : 'seeker');
            
            console.log("User authenticated with token, userId:", userId, "userType:", userType);
            
            // Immediately fetch data
            if (userId) {
              fetchSeekerBookings(userId);
              fetchExpertBookings(userId);
            }
          } else {
            console.log("No token found in user data");
            setUserId(null);
          }
        } else {
          console.log("No user data found in localStorage");
          setUserId(null);
        }
      } catch (e) {
        console.error("Error parsing user data:", e);
        setUserId(null);
      }
    };

    checkAuth();
  }, []);

  // Fetch bookings when userType and userId are set
  useEffect(() => {
    if (!userId) return;
    
    // Always fetch both types of bookings regardless of user type
    fetchSeekerBookings(userId);
    fetchExpertBookings(userId);
  }, [userId]);

  // Generate unique contacts list based on bookings
  useEffect(() => {
    const contactsMap = new Map<string, UserProfile>();

    if (userType === 'seeker') {
      expertBookings.forEach(booking => {
        if (!contactsMap.has(booking.expert_id)) {
          contactsMap.set(booking.expert_id, {
            id: booking.expert_id,
            first_name: booking.expert_name ? booking.expert_name.split(' ')[0] : '',
            last_name: booking.expert_name ? booking.expert_name.split(' ').slice(1).join(' ') : '',
            email: '',
            role: 'expert',
          });
        }
      });
    } else if (userType === 'expert') {
      seekerBookings.forEach(booking => {
        if (!contactsMap.has(booking.seeker_id)) {
          contactsMap.set(booking.seeker_id, {
            id: booking.seeker_id,
            first_name: booking.seeker_name ? booking.seeker_name.split(' ')[0] : '',
            last_name: booking.seeker_name ? booking.seeker_name.split(' ').slice(1).join(' ') : '',
            email: '',
            role: 'seeker',
          });
        }
      });
    }

    setUniqueContacts(Array.from(contactsMap.values()));
  }, [userType, seekerBookings, expertBookings]);

  // Loading and error state combined
  const loading = loadingSeeker || loadingExpert;
  const error = errorSeeker || errorExpert;

  // Bookings to display based on userType
  const bookings = userType === 'seeker' ? seekerBookings : expertBookings;

  // Handle accepting a booking (for experts only)
  const handleAcceptBooking = async (bookingId: string) => {
    try {
      console.log(`Accepting booking: ${bookingId}`);
      const response = await fetch(`http://localhost:8081/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' })
      });
      
      console.log("Accept booking response status:", response.status);
      
      if (!response.ok) throw new Error('Failed to accept booking');
      
      // Update local state
      setExpertBookings(prev => 
        prev.map(booking => booking.id === bookingId 
          ? {...booking, status: 'confirmed'} 
          : booking
        )
      );
      toast({
        title: "Booking accepted",
        description: "The client has been notified",
      });
    } catch (error: any) {
      console.error("Error accepting booking:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Handle rejecting a booking (for experts only)
  const handleRejectBooking = async (bookingId: string) => {
    try {
      console.log(`Rejecting booking: ${bookingId}`);
      const response = await fetch(`http://localhost:8081/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });
      
      console.log("Reject booking response status:", response.status);
      
      if (!response.ok) throw new Error('Failed to reject booking');
      
      // Update local state
      setExpertBookings(prev => 
        prev.map(booking => booking.id === bookingId 
          ? {...booking, status: 'rejected'} 
          : booking
        )
      );
      toast({
        title: "Booking rejected",
        description: "The client has been notified",
      });
    } catch (error: any) {
      console.error("Error rejecting booking:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Add these state variables and functions for the reschedule feature
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleBookingId, setRescheduleBookingId] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(new Date());
  const [rescheduleTime, setRescheduleTime] = useState('');

  // Function to open the reschedule dialog
  const openRescheduleDialog = (bookingId: string, currentDate: string) => {
    setRescheduleBookingId(bookingId);
    setRescheduleDate(new Date(currentDate));
    setRescheduleTime('');
    setIsRescheduleOpen(true);
  };

  // Function to handle reschedule submission
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rescheduleDate || !rescheduleTime) {
      toast({
        title: "Error",
        description: "Please select a date and time",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const formattedDate = rescheduleDate.toISOString().split('T')[0];
      
      const response = await fetch(`http://localhost:8081/api/bookings/${rescheduleBookingId}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          date: formattedDate,
          start_time: rescheduleTime 
        })
      });
      
      if (!response.ok) throw new Error('Failed to reschedule booking');
      
      // Update local state
      setExpertBookings(prev => 
        prev.map(booking => booking.id === rescheduleBookingId 
          ? {...booking, date: formattedDate, start_time: rescheduleTime} 
          : booking
        )
      );
      
      setIsRescheduleOpen(false);
      toast({
        title: "Booking rescheduled",
        description: "The client has been notified of the new time",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Add a helper function to format amount
  const formatAmount = (amount: number | string): string => {
    if (typeof amount === 'string') {
      return parseFloat(amount).toFixed(2);
    }
    return amount.toFixed(2);
  };

  // Add a helper function to check if amount is positive
  const isAmountPositive = (amount: number | string): boolean => {
    if (typeof amount === 'string') {
      return parseFloat(amount) > 0;
    }
    return amount > 0;
  };

  // Add this function at the top of your component
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'outline';
      case 'pending':
        return 'warning';
      case 'rejected':
      case 'cancelled':
        return 'destructive';
      case 'completed':
        return 'default';
      default:
        return 'secondary';
    }
  };

  // Ensure we're fetching and displaying user profiles correctly
  useEffect(() => {
    // Fetch user profiles for all contacts in bookings
    const fetchUserProfiles = async () => {
      const bookings = [...seekerBookings, ...expertBookings];
      if (bookings.length === 0) return;
      
      // Get unique user IDs
      const expertIds = new Set(seekerBookings.map(b => b.expert_id));
      const seekerIds = new Set(expertBookings.map(b => b.seeker_id));
      const uniqueIds = [...Array.from(expertIds), ...Array.from(seekerIds)];
      
      if (uniqueIds.length === 0) return;
      
      console.log("Fetching profiles for IDs:", uniqueIds);
      
      try {
        const profiles: UserProfile[] = [];
        
        // Fetch each profile
        for (const id of uniqueIds) {
          try {
            // Try user profile endpoint first (more generic)
            const userResponse = await fetch(`http://localhost:8081/api/users/${id}`);
            if (userResponse.ok) {
              const data = await userResponse.json();
              if (data.success && data.data) {
                profiles.push({
                  id: id,
                  first_name: data.data.first_name || data.data.name?.split(' ')[0] || '',
                  last_name: data.data.last_name || data.data.name?.split(' ').slice(1).join(' ') || '',
                  email: data.data.email || '',
                  profile_image: data.data.profile_image || '',
                  role: data.data.role || 'unknown'
                });
                continue;
              }
            }
            
            // If user profile fails, create a basic profile from booking data
            const relevantSeekerBooking = seekerBookings.find(b => b.expert_id === id);
            const relevantExpertBooking = expertBookings.find(b => b.seeker_id === id);
            
            if (relevantSeekerBooking) {
              // This is an expert
              const nameParts = relevantSeekerBooking.expert_name?.split(' ') || ['', ''];
              profiles.push({
                id: id,
                first_name: nameParts[0] || '',
                last_name: nameParts.slice(1).join(' ') || '',
                email: '',
                role: 'expert'
              });
            } else if (relevantExpertBooking) {
              // This is a seeker
              const nameParts = relevantExpertBooking.seeker_name?.split(' ') || ['', ''];
              profiles.push({
                id: id,
                first_name: nameParts[0] || '',
                last_name: nameParts.slice(1).join(' ') || '',
                email: '',
                role: 'seeker'
              });
            }
          } catch (error) {
            console.error(`Error fetching profile for ID ${id}:`, error);
          }
        }
        
        console.log("Fetched profiles:", profiles);
        setUniqueContacts(profiles);
      } catch (error) {
        console.error("Error fetching user profiles:", error);
      }
    };

    if (userId && (seekerBookings.length > 0 || expertBookings.length > 0)) {
      fetchUserProfiles();
    }
  }, [seekerBookings, expertBookings, userId]);

  // Add this to the component to show sample data if no bookings are found
  useEffect(() => {
    // If we have a user but no bookings after loading, show sample data
    if (!loading && !error && bookings.length === 0 && localStorage.getItem('user')) {
      // Sample data for demonstration
      const sampleBookings = [
        {
          id: 'sample-1',
          expert_id: 'expert-1',
          seeker_id: 'seeker-1',
          date: new Date().toISOString().split('T')[0], // Today
          start_time: '10:00 AM',
          end_time: '11:00 AM',
          session_type: 'video',
          status: 'confirmed',
          amount: 100,
          created_at: new Date().toISOString()
        },
        {
          id: 'sample-2',
          expert_id: 'expert-2',
          seeker_id: 'seeker-1',
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
          start_time: '2:00 PM',
          end_time: '3:00 PM',
          session_type: 'audio',
          status: 'pending',
          amount: 75,
          created_at: new Date().toISOString()
        }
      ];
      
      if (userType === 'seeker') {
        setSeekerBookings(sampleBookings);
      } else {
        setExpertBookings(sampleBookings);
      }
      
      // Add sample contacts
      setUniqueContacts([
        {
          id: 'expert-1',
          first_name: 'John',
          last_name: 'Doe',
          specialty: 'Business Consultant',
          profile_image: ''
        },
        {
          id: 'expert-2',
          first_name: 'Jane',
          last_name: 'Smith',
          specialty: 'Marketing Expert',
          profile_image: ''
        }
      ]);
    }
  }, [loading, error, bookings.length, userType]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-8 px-4 pt-20">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Appointment Log</h1>
          {userType && (
            <Badge variant="outline" className="text-sm">
              Viewing as {userType === 'seeker' ? 'Client' : 'Expert'}
            </Badge>
          )}
        </div>
        
        {/* Check if user data exists in localStorage instead of just userId */}
        {!localStorage.getItem('user') ? (
          <Card>
            <CardContent className="pt-6 pb-6 text-center">
              <p className="text-muted-foreground mb-4">Please log in to view your appointments.</p>
              <Button onClick={() => navigate('/login')}>
                Log In
              </Button>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading appointments...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <div className="text-red-500 mb-4">{error}</div>
            <Button onClick={() => {
              const userData = localStorage.getItem('user');
              if (userData) {
                const user = JSON.parse(userData);
                const userId = user.user_id || user.id || 'default-user-id';
                fetchSeekerBookings(userId);
                fetchExpertBookings(userId);
              }
            }}>
              Retry
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="upcoming">
            <TabsList className="mb-4">
              <TabsTrigger value="upcoming">
                Upcoming
                {bookings.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{getUpcomingCount()}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="past">
                Past
                {bookings.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{getPastCount()}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="contacts">
                {userType === 'seeker' ? 'My Experts' : 'My Clients'}
                {uniqueContacts.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{uniqueContacts.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="all">
                All Appointments
                {bookings.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{bookings.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            {/* Upcoming Appointments Tab */}
            <TabsContent value="upcoming">
              {bookings.filter(booking => {
                const bookingDate = new Date(booking.date + 'T' + booking.end_time.replace(/\s?[AP]M/, ''));
                const now = new Date();
                return bookingDate > now && 
                       (booking.status === 'confirmed' || booking.status === 'pending');
              }).length === 0 ? (
                <Card>
                  <CardContent className="pt-6 pb-6 text-center">
                    <p className="text-muted-foreground mb-4">No upcoming appointments found.</p>
                    {userType === 'seeker' && (
                      <Button onClick={() => navigate('/network')}>
                        Find an Expert
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {bookings
                    .filter(booking => {
                      const bookingDate = new Date(booking.date + 'T' + booking.end_time.replace(/\s?[AP]M/, ''));
                      const now = new Date();
                      return bookingDate > now && 
                             (booking.status === 'confirmed' || booking.status === 'pending');
                    })
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map(booking => {
                      // For experts, show the seeker's name (client who booked)
                      // For seekers, show the expert's name
                      const otherUserId = userType === 'seeker' ? booking.expert_id : booking.seeker_id;
                      const otherUserName = userType === 'seeker' ? booking.expert_name : booking.seeker_name;
                      const otherUser = uniqueContacts.find(c => c.id === otherUserId);
                      
                      // Get first name and last name from the other user's name
                      const nameParts = otherUserName ? otherUserName.split(' ') : ['', ''];
                      const firstName = nameParts[0] || '';
                      const lastName = nameParts.slice(1).join(' ') || '';
                      
                      return (
                        <Card key={booking.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-2">
                                <Avatar>
                                  <AvatarImage src={otherUser?.profile_image} />
                                  <AvatarFallback>
                                    {getInitials(otherUserName || '')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <CardTitle className="text-lg">
                                    {otherUserName || `${otherUser?.first_name || ''} ${otherUser?.last_name || ''}`}
                                  </CardTitle>
                                  <CardDescription>
                                    {userType === 'seeker' ? 'Expert' : 'Client'}
                                  </CardDescription>
                                </div>
                              </div>
                              {getStatusBadge(booking.status)}
                            </div>
                          </CardHeader>
                          
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center text-sm">
                                <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{formatDate(booking.date)}</span>
                                {new Date(booking.date) > new Date() && (
                                  <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700">
                                    {getTimeUntil(booking.date)}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center text-sm">
                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{booking.start_time} - {booking.end_time}</span>
                              </div>
                              
                              <div className="flex items-center text-sm">
                                <div className="flex items-center mr-2 text-muted-foreground">
                                  {getSessionTypeIcon(booking.session_type)}
                                </div>
                                <span className="capitalize">{booking.session_type} Session</span>
                              </div>
                              
                              {isAmountPositive(booking.amount) && (
                                <div className="text-sm font-medium">
                                  Amount: ${formatAmount(booking.amount)}
                                </div>
                              )}
                              
                              {booking.notes && (
                                <div className="text-sm mt-2 pt-2 border-t">
                                  <p className="text-muted-foreground mb-1">Notes:</p>
                                  <p>{booking.notes}</p>
                                </div>
                              )}
                              
                              {/* Action buttons - different for each user type */}
                              <div className="mt-2 pt-2 border-t">
                                {userType === 'seeker' ? (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="w-full"
                                    onClick={() => navigate(`/experts/${booking.expert_id}`)}
                                  >
                                    View Expert Profile
                                  </Button>
                                ) : (
                                  <div className="space-y-2">
                                    {booking.status === 'pending' && (
                                      <div className="flex space-x-2">
                                        <Button 
                                          size="sm" 
                                          className="flex-1"
                                          onClick={() => handleAcceptBooking(booking.id)}
                                        >
                                          <Check className="h-4 w-4 mr-1" />
                                          Accept
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          className="flex-1"
                                          onClick={() => handleRejectBooking(booking.id)}
                                        >
                                          <X className="h-4 w-4 mr-1" />
                                          Decline
                                        </Button>
                                      </div>
                                    )}
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="w-full"
                                      onClick={() => openRescheduleDialog(booking.id, booking.date)}
                                    >
                                      <CalendarClock className="h-4 w-4 mr-1" />
                                      Reschedule
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              )}
            </TabsContent>
            
            {/* Past Appointments Tab */}
            <TabsContent value="past">
              {bookings.filter(booking => {
                const bookingDate = new Date(booking.date + 'T' + booking.end_time.replace(/\s?[AP]M/, ''));
                const now = new Date();
                return bookingDate < now || 
                       booking.status === 'completed' || 
                       booking.status === 'rejected' || 
                       booking.status === 'cancelled';
              }).length === 0 ? (
                <Card>
                  <CardContent className="pt-6 pb-6 text-center">
                    <p className="text-muted-foreground mb-4">No past appointments found.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {bookings
                    .filter(booking => {
                      const bookingDate = new Date(booking.date + 'T' + booking.end_time.replace(/\s?[AP]M/, ''));
                      const now = new Date();
                      return bookingDate < now || 
                             booking.status === 'completed' || 
                             booking.status === 'rejected' || 
                             booking.status === 'cancelled';
                    })
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Most recent first
                    .map(booking => {
                      // For experts, show the seeker's name (client who booked)
                      // For seekers, show the expert's name
                      const otherUserId = userType === 'seeker' ? booking.expert_id : booking.seeker_id;
                      const otherUserName = userType === 'seeker' ? booking.expert_name : booking.seeker_name;
                      const otherUser = uniqueContacts.find(c => c.id === otherUserId);
                      
                      return (
                        <Card key={booking.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-2">
                                <Avatar>
                                  <AvatarImage src={otherUser?.profile_image} />
                                  <AvatarFallback>
                                    {getInitials(otherUserName || '')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <CardTitle className="text-lg">
                                    {otherUserName || `${otherUser?.first_name || ''} ${otherUser?.last_name || ''}`}
                                  </CardTitle>
                                  <CardDescription>
                                    {userType === 'seeker' ? 'Expert' : 'Client'}
                                  </CardDescription>
                                </div>
                              </div>
                              {getStatusBadge(booking.status)}
                            </div>
                          </CardHeader>
                          
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center text-sm">
                                <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{formatDate(booking.date)}</span>
                              </div>
                              
                              <div className="flex items-center text-sm">
                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{booking.start_time} - {booking.end_time}</span>
                              </div>
                              
                              <div className="flex items-center text-sm">
                                <div className="flex items-center mr-2 text-muted-foreground">
                                  {getSessionTypeIcon(booking.session_type)}
                                </div>
                                <span className="capitalize">{booking.session_type} Session</span>
                              </div>
                              
                              {isAmountPositive(booking.amount) && (
                                <div className="text-sm font-medium">
                                  Amount: ${formatAmount(booking.amount)}
                                </div>
                              )}
                              
                              {booking.notes && (
                                <div className="text-sm mt-2 pt-2 border-t">
                                  <p className="text-muted-foreground mb-1">Notes:</p>
                                  <p>{booking.notes}</p>
                                </div>
                              )}
                              
                              {booking.status === 'completed' && (
                                <div className="mt-2 pt-2 border-t">
                                  <Button size="sm" variant="outline" className="w-full">
                                    Leave Feedback
                                  </Button>
                                </div>
                              )}
                              
                              {userType === 'seeker' && (
                                <div className="mt-2 pt-2 border-t">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="w-full"
                                    onClick={() => navigate(`/experts/${booking.expert_id}`)}
                                  >
                                    Book Again
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              )}
            </TabsContent>
            
            {/* Contacts Tab (My Experts/My Clients) */}
            <TabsContent value="contacts">
              {uniqueContacts.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 pb-6 text-center">
                    <p className="text-muted-foreground mb-4">
                      {userType === 'seeker' 
                        ? "You haven't booked any experts yet." 
                        : "You don't have any clients yet."}
                    </p>
                    {userType === 'seeker' && (
                      <Button onClick={() => navigate('/network')}>
                        Find an Expert
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {uniqueContacts.map(contact => {
                    const contactBookings = getBookingsWithContact(contact.id);
                    const lastBooking = contactBookings.sort((a, b) => 
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                    )[0];
                    
                    return (
                      <Card key={contact.id} className="overflow-hidden">
                        <CardHeader>
                          <div className="flex items-start space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={contact.profile_image} />
                              <AvatarFallback>
                                {getInitials(`${contact.first_name} ${contact.last_name}`)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle>
                                {contact.first_name} {contact.last_name}
                              </CardTitle>
                              <CardDescription>
                                {userType === 'seeker' 
                                  ? contact.specialty || 'Expert'
                                  : contact.company || 'Client'}
                              </CardDescription>
                              {userType === 'seeker' && contact.designation && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {contact.designation}
                                </p>
                              )}
                              {userType === 'expert' && contact.industry && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Industry: {contact.industry}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium mb-2">Session History</h4>
                              <div className="text-sm">
                                <p>Total Sessions: {contactBookings.length}</p>
                                <p>Last Session: {lastBooking ? formatDate(lastBooking.date) : 'N/A'}</p>
                                <p>
                                  Upcoming: {
                                    contactBookings.filter(b => 
                                      new Date(b.date) > new Date() && 
                                      (b.status === 'confirmed' || b.status === 'pending')
                                    ).length
                                  }
                                </p>
                              </div>
                            </div>
                            
                            <Separator />
                            
                            {userType === 'seeker' ? (
                              <div className="flex space-x-2">
                                <Button 
                                  className="flex-1" 
                                  size="sm"
                                  onClick={() => navigate(`/experts/${contact.id}`)}
                                >
                                  Book Again
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => navigate(`/experts/${contact.id}`)}
                                >
                                  View Profile
                                </Button>
                              </div>
                            ) : (
                              <div className="flex space-x-2">
                                <Button 
                                  className="flex-1" 
                                  size="sm"
                                >
                                  Contact
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1"
                                >
                                  View Details
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
            
            {/* All Appointments Tab */}
            <TabsContent value="all">
              {bookings.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 pb-6 text-center">
                    <p className="text-muted-foreground mb-4">No appointments found.</p>
                    {userType === 'seeker' && (
                      <Button onClick={() => navigate('/network')}>
                        Find an Expert
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {bookings
                    .map(booking => {
                      // For experts, show the seeker's name (client who booked)
                      // For seekers, show the expert's name
                      const otherUserId = userType === 'seeker' ? booking.expert_id : booking.seeker_id;
                      const otherUserName = userType === 'seeker' ? booking.expert_name : booking.seeker_name;
                      const otherUser = uniqueContacts.find(c => c.id === otherUserId);
                      
                      return (
                        <Card key={booking.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-2">
                                <Avatar>
                                  <AvatarImage src={otherUser?.profile_image} />
                                  <AvatarFallback>
                                    {getInitials(otherUserName || '')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <CardTitle className="text-lg">
                                    {otherUserName || `${otherUser?.first_name || ''} ${otherUser?.last_name || ''}`}
                                  </CardTitle>
                                  <CardDescription>
                                    {userType === 'seeker' ? 'Expert' : 'Client'}
                                  </CardDescription>
                                </div>
                              </div>
                              {getStatusBadge(booking.status)}
                            </div>
                          </CardHeader>
                          
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center text-sm">
                                <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{formatDate(booking.date)}</span>
                                {new Date(booking.date) > new Date() && (
                                  <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700">
                                    {getTimeUntil(booking.date)}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center text-sm">
                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{booking.start_time} - {booking.end_time}</span>
                              </div>
                              
                              <div className="flex items-center text-sm">
                                <div className="flex items-center mr-2 text-muted-foreground">
                                  {getSessionTypeIcon(booking.session_type)}
                                </div>
                                <span className="capitalize">{booking.session_type} Session</span>
                              </div>
                              
                              {isAmountPositive(booking.amount) && (
                                <div className="text-sm font-medium">
                                  Amount: ${formatAmount(booking.amount)}
                                </div>
                              )}
                              
                              {booking.notes && (
                                <div className="text-sm mt-2 pt-2 border-t">
                                  <p className="text-muted-foreground mb-1">Notes:</p>
                                  <p>{booking.notes}</p>
                                </div>
                              )}
                              
                              {/* Action buttons based on status and user type */}
                              {booking.status === 'pending' && userType === 'expert' && (
                                <div className="mt-2 pt-2 border-t">
                                  <div className="flex space-x-2">
                                    <Button 
                                      size="sm" 
                                      className="flex-1"
                                      onClick={() => handleAcceptBooking(booking.id)}
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Accept
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="flex-1"
                                      onClick={() => handleRejectBooking(booking.id)}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Decline
                                    </Button>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="w-full mt-2"
                                    onClick={() => openRescheduleDialog(booking.id, booking.date)}
                                  >
                                    <CalendarClock className="h-4 w-4 mr-1" />
                                    Reschedule
                                  </Button>
                                </div>
                              )}
                              
                              {booking.status === 'confirmed' && (
                                <div className="mt-2 pt-2 border-t">
                                  {userType === 'expert' && (
                                    <div className="flex space-x-2">
                                      <Button 
                                        size="sm" 
                                        className="flex-1"
                                        onClick={() => navigate(`/session/${booking.id}`)}
                                      >
                                        Start Session
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="flex-1"
                                        onClick={() => openRescheduleDialog(booking.id, booking.date)}
                                      >
                                        <CalendarClock className="h-4 w-4 mr-1" />
                                        Reschedule
                                      </Button>
                                    </div>
                                  )}
                                  
                                  {userType === 'seeker' && (
                                    <Button 
                                      size="sm" 
                                      className="w-full"
                                      onClick={() => navigate(`/session/${booking.id}`)}
                                    >
                                      Join Session
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              )}
            </TabsContent>

            {/* Both Views Tab */}
            <TabsContent value="both">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Seeker Appointments</h2>
                {loadingSeeker ? (
                  <div className="flex justify-center p-4">
                    <Spinner size="lg" />
                  </div>
                ) : seekerBookings.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 pb-6 text-center">
                      <p className="text-muted-foreground mb-4">No seeker appointments found.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {seekerBookings.map(booking => {
                      const expert = uniqueContacts.find(c => c.id === booking.expert_id) || {
                        name: booking.expert_name || 'Expert',
                        profile_image: ''
                      };
                      
                      return (
                        <Card key={booking.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-2">
                                <Avatar>
                                  <AvatarImage src={expert?.profile_image} />
                                  <AvatarFallback>{expert?.name?.charAt(0) || 'E'}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-medium">{expert?.name || booking.expert_name || 'Expert'}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {formatDate(booking.date)} • {booking.start_time} - {booking.end_time}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={getStatusVariant(booking.status)}>
                                {capitalizeFirstLetter(booking.status)}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="text-sm">
                              <div className="flex items-center mb-1">
                                <Calendar className="mr-2 h-4 w-4 opacity-70" />
                                <span>{formatDate(booking.date)}</span>
                              </div>
                              <div className="flex items-center mb-1">
                                <Clock className="mr-2 h-4 w-4 opacity-70" />
                                <span>{booking.start_time} - {booking.end_time}</span>
                              </div>
                              <div className="flex items-center">
                                <Video className="mr-2 h-4 w-4 opacity-70" />
                                <span>{capitalizeFirstLetter(booking.session_type)} Session</span>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="bg-muted/50 pt-2">
                            <div className="flex justify-between w-full">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleReschedule(booking)}
                              >
                                Reschedule
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleCancel(booking.id)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Expert Appointments</h2>
                {expertBookings.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 pb-6 text-center">
                      <p className="text-muted-foreground mb-4">No expert appointments found.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {expertBookings.map(booking => {
                      const seeker = uniqueContacts.find(c => c.id === booking.seeker_id);
                      return (
                        <Card key={booking.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-2">
                                <Avatar>
                                  <AvatarImage src={seeker?.profile_image} />
                                  <AvatarFallback>
                                    {getInitials(seeker ? `${seeker.first_name} ${seeker.last_name}` : '')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <CardTitle className="text-lg">{seeker ? `${seeker.first_name} ${seeker.last_name}` : ''}</CardTitle>
                                  <CardDescription>{seeker?.company || 'Client'}</CardDescription>
                                </div>
                              </div>
                              {getStatusBadge(booking.status)}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center text-sm">
                                <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{formatDate(booking.date)}</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{booking.start_time} - {booking.end_time}</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <div className="flex items-center mr-2 text-muted-foreground">
                                  {getSessionTypeIcon(booking.session_type)}
                                </div>
                                <span className="capitalize">{booking.session_type} Session</span>
                              </div>
                              {isAmountPositive(booking.amount) && (
                                <div className="text-sm font-medium">
                                  Amount: ${formatAmount(booking.amount)}
                                </div>
                              )}
                              <div className="mt-2 pt-2 border-t">
                                {booking.status === 'pending' && (
                                  <div className="flex space-x-2">
                                    <Button 
                                      size="sm" 
                                      className="flex-1"
                                      onClick={() => handleAcceptBooking(booking.id)}
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Accept
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="flex-1"
                                      onClick={() => handleRejectBooking(booking.id)}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Decline
                                    </Button>
                                  </div>
                                )}
                                {booking.status === 'confirmed' && (
                                  <div className="flex space-x-2">
                                    <Button 
                                      size="sm" 
                                      className="flex-1"
                                      onClick={() => navigate(`/session/${booking.id}`)}
                                    >
                                      Start Session
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="flex-1"
                                      onClick={() => openRescheduleDialog(booking.id, booking.date)}
                                    >
                                      <CalendarClock className="h-4 w-4 mr-1" />
                                      Reschedule
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
      <Footer />
      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Select a new date and time for this appointment.
              The client will be notified of the change.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {rescheduleDate ? format(rescheduleDate, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={rescheduleDate}
                    onSelect={setRescheduleDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Time</Label>
              <Select onValueChange={setRescheduleTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9:00 AM">9:00 AM</SelectItem>
                  <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                  <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                  <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                  <SelectItem value="1:00 PM">1:00 PM</SelectItem>
                  <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                  <SelectItem value="3:00 PM">3:00 PM</SelectItem>
                  <SelectItem value="4:00 PM">4:00 PM</SelectItem>
                  <SelectItem value="5:00 PM">5:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRescheduleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRescheduleSubmit} disabled={!rescheduleDate || !rescheduleTime}>
              Confirm Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentLog;







