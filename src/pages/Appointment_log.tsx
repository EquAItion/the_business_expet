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
  CalendarClock,
  Mic
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
  amount: number | string;
  created_at: string;
  notes?: string;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  profile_image?: string;
  specialty?: string;
  designation?: string;
  company?: string;
  role?: string;
  bio?: string;
  industry?: string;
}

type UserType = 'expert' | 'seeker';

const capitalizeFirstLetter = (str: string) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const AppointmentLog = () => {
  const [seekerBookings, setSeekerBookings] = useState<Booking[]>([]);
  const [expertBookings, setExpertBookings] = useState<Booking[]>([]);
  const [userType, setUserType] = useState<UserType>('seeker');
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingSeeker, setLoadingSeeker] = useState(false);
  const [loadingExpert, setLoadingExpert] = useState(false);
  const [errorSeeker, setErrorSeeker] = useState<string | null>(null);
  const [errorExpert, setErrorExpert] = useState<string | null>(null);
  const [uniqueContacts, setUniqueContacts] = useState<UserProfile[]>([]);
  const navigate = useNavigate();

  // Reschedule dialog states
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleBookingId, setRescheduleBookingId] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(new Date());
  const [rescheduleTime, setRescheduleTime] = useState('');

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

  // Helper to check if session started within last 20 minutes
  const isWithinTwentyMinutesAfterStart = (dateStr: string, startTimeStr: string): boolean => {
    const now = new Date();
    const sessionStart = parseDateTime(dateStr, startTimeStr);
    const twentyMinutesAfter = new Date(sessionStart.getTime() + 20 * 60 * 1000);
    return now >= sessionStart && now <= twentyMinutesAfter;
  };

  // Get upcoming count for badge
  const getUpcomingCount = () => {
    const bookings = userType === 'seeker' ? seekerBookings : expertBookings;
    const now = new Date();
    const nowUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
    return bookings.filter(booking => {
      const dateOnly = booking.date.split('T')[0];
      const bookingEnd = parseDateTime(dateOnly, booking.end_time);
      const bookingStart = parseDateTime(dateOnly, booking.start_time);
      const bookingEndUtc = new Date(Date.UTC(bookingEnd.getUTCFullYear(), bookingEnd.getUTCMonth(), bookingEnd.getUTCDate(), bookingEnd.getUTCHours(), bookingEnd.getUTCMinutes(), bookingEnd.getUTCSeconds()));
      const bookingStartUtc = new Date(Date.UTC(bookingStart.getUTCFullYear(), bookingStart.getUTCMonth(), bookingStart.getUTCDate(), bookingStart.getUTCHours(), bookingStart.getUTCMinutes(), bookingStart.getUTCSeconds()));
      console.log("getUpcomingCount - status:", booking.status, "bookingEndUtc:", bookingEndUtc, "bookingStartUtc:", bookingStartUtc, "nowUtc:", nowUtc);
      return (booking.status === 'confirmed' || booking.status === 'pending') &&
             (bookingEndUtc >= nowUtc || isWithinTwentyMinutesAfterStart(dateOnly, booking.start_time));
    }).length;
  };

  // Get past count for badge
  const getPastCount = () => {
    const bookings = userType === 'seeker' ? seekerBookings : expertBookings;
    const now = new Date();
    return bookings.filter(booking => {
      const dateOnly = booking.date.split('T')[0];
      const bookingEnd = parseDateTime(dateOnly, booking.end_time);
      return bookingEnd < now || booking.status === 'completed' || booking.status === 'rejected' || booking.status === 'cancelled';
    }).length;
  };

  // Fetch bookings for seeker
  const fetchSeekerBookings = async (id: string) => {
    setLoadingSeeker(true);
    setErrorSeeker(null);
    
    try {
      const userData = localStorage.getItem('user');
      let token = '';
      
      if (userData) {
        const user = JSON.parse(userData);
        token = user.token || user.accessToken || '';
      }
      
      if (!token) {
        token = localStorage.getItem('token') || '';
      }
      
      console.log(`Fetching seeker bookings for user ID: ${id} with token: ${token ? 'present' : 'missing'}`);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/seeker/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        setSeekerBookings([]);
        setErrorSeeker(`Failed to fetch seeker bookings: ${response.statusText}`);
        console.error(`Failed to fetch seeker bookings: ${response.statusText}`);
        return;
      }
      
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        setErrorSeeker("Invalid response from server");
        setSeekerBookings([]);
        console.error("Invalid JSON response from server:", responseText);
        return;
      }
      
      if (data && data.success && Array.isArray(data.data)) {
        const processedBookings = data.data.map((booking: any) => ({
          id: booking.id || `temp-${Math.random()}`,
          expert_id: booking.expert_id || '',
          seeker_id: booking.seeker_id || id,
          expert_name: booking.expert_name || 'Unknown Expert',
          seeker_name: booking.seeker_name || 'You',
          date: booking.date || booking.appointment_date || '',
          start_time: booking.start_time || '',
          end_time: booking.end_time || '',
          session_type: booking.session_type || 'video',
          status: booking.status || 'pending',
          amount: booking.amount || 0,
          created_at: booking.created_at || new Date().toISOString(),
          notes: booking.notes || ''
        }));
        
        console.log("Processed seeker bookings:", processedBookings);
        setSeekerBookings(processedBookings);
        setErrorSeeker(null);
      } else {
        setSeekerBookings([]);
        if (!data.success) {
          setErrorSeeker(data.message || "Failed to load bookings");
          console.error("Backend returned unsuccessful response:", data);
        }
      }
    } catch (error) {
      setErrorSeeker("Failed to load your bookings. Please try again.");
      setSeekerBookings([]);
      console.error("Error fetching seeker bookings:", error);
    } finally {
      setLoadingSeeker(false);
    }
  };

  // Fetch bookings for expert
  const fetchExpertBookings = async (id: string) => {
    setLoadingExpert(true);
    setErrorExpert(null);
    
    try {
      const userData = localStorage.getItem('user');
      let token = '';
      
      if (userData) {
        const user = JSON.parse(userData);
        token = user.token || user.accessToken || '';
      }
      
      if (!token) {
        token = localStorage.getItem('token') || '';
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/expert/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        setExpertBookings([]);
        setErrorExpert(`Failed to fetch expert bookings: ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      
      if (data && data.success && Array.isArray(data.data)) {
        const processedBookings = data.data.map((booking: any) => ({
          id: booking.id || `temp-${Math.random()}`,
          expert_id: booking.expert_id || id,
          seeker_id: booking.seeker_id || '',
          expert_name: booking.expert_name || 'You',
          seeker_name: booking.seeker_name || 'Unknown Seeker',
          date: booking.date || booking.appointment_date || '',
          start_time: booking.start_time || '',
          end_time: booking.end_time || '',
          session_type: booking.session_type || 'video',
          status: booking.status || 'pending',
          amount: booking.amount || 0,
          created_at: booking.created_at || new Date().toISOString(),
          notes: booking.notes || ''
        }));
        
        setExpertBookings(processedBookings);
        setErrorExpert(null);
      } else {
        setExpertBookings([]);
        if (data && !data.success) {
          setErrorExpert(data.message || "Failed to load bookings");
        }
      }
    } catch (error) {
      setErrorExpert("Failed to load your bookings. Please try again.");
      setExpertBookings([]);
    } finally {
      setLoadingExpert(false);
    }
  };

  // Helper function to decode JWT token payload
  const decodeJwtPayload = (token: string): any | null => {
    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = atob(payloadBase64);
      return JSON.parse(payloadJson);
    } catch (error) {
      console.error('Failed to decode JWT token payload:', error);
      return null;
    }
  };

  // Check authentication and set user info
  useEffect(() => {
    const checkAuth = () => {
      try {
        const userDataRaw = localStorage.getItem('user') || '{}';
        console.log("User data from localStorage:", userDataRaw);
        let userId = null;
        let userRole = null;
        try {
          const user = JSON.parse(userDataRaw);
          console.log("Parsed user object:", user);
          const hasToken = user.token || user.accessToken;
          userId = user.user_id || user.id;
          if (!userId && hasToken) {
            const token = user.token || user.accessToken;
            const payloadBase64 = token.split('.')[1];
            const payloadJson = atob(payloadBase64);
            const payload = JSON.parse(payloadJson);
            userId = payload.user_id || payload.id || null;
          }
          userRole = (user.role || '').toLowerCase();
          console.log(`UserId: ${userId}, UserRole: ${userRole}, HasToken: ${!!hasToken}`);
        } catch (e) {
          console.error("Error parsing user data or token:", e);
        }
        
        if (userId) {
          setUserId(userId);
          if (userRole && userRole.includes('expert')) {
            setUserType('expert');
          } else if (userRole && (userRole.includes('seeker') || userRole.includes('client'))) {
            setUserType('seeker');
          } else {
            setUserType('seeker');
          }
        } else {
          setUserId(null);
          setUserType('seeker');
        }
      } catch (e) {
        console.error("Error parsing user data:", e);
        setUserId(null);
        setUserType('seeker');
      }
    };


    checkAuth();
  }, []);

  // Fetch bookings when userId changes
  useEffect(() => {
    if (!userId) return;
    fetchSeekerBookings(userId);
    fetchExpertBookings(userId);
  }, [userId]);

  // Generate unique contacts list
  useEffect(() => {
    const contactsMap = new Map<string, UserProfile>();

    seekerBookings.forEach(booking => {
      if (booking.expert_id && !contactsMap.has(booking.expert_id)) {
        const nameParts = booking.expert_name ? booking.expert_name.split(' ') : ['Expert'];
        contactsMap.set(booking.expert_id, {
          id: booking.expert_id,
          first_name: nameParts[0] || 'Expert',
          last_name: nameParts.slice(1).join(' ') || '',
          email: '',
          role: 'expert',
          specialty: 'Expert'
        });
      }
    });

    expertBookings.forEach(booking => {
      if (booking.seeker_id && !contactsMap.has(booking.seeker_id)) {
        const nameParts = booking.seeker_name ? booking.seeker_name.split(' ') : ['Client'];
        contactsMap.set(booking.seeker_id, {
          id: booking.seeker_id,
          first_name: nameParts[0] || 'Client',
          last_name: nameParts.slice(1).join(' ') || '',
          email: '',
          role: 'seeker',
          company: 'Client'
        });
      }
    });

    setUniqueContacts(Array.from(contactsMap.values()));
  }, [seekerBookings, expertBookings]);

  // Loading and error state
  const loading = loadingSeeker || loadingExpert;
  const error = errorSeeker || errorExpert;

  // Bookings to display based on userType
  const bookings = userType === 'seeker' ? seekerBookings : expertBookings;

  // Handle accepting a booking (experts only)
  const handleAcceptBooking = async (bookingId: string) => {
    try {
      const userData = localStorage.getItem('user');
      let token = '';
      if (userData) {
        const user = JSON.parse(userData);
        token = user.token || user.accessToken || '';
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'confirmed' })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to accept booking');
      }
      setExpertBookings(prev => prev.map(booking => booking.id === bookingId ? {...booking, status: 'confirmed'} : booking));
      setSeekerBookings(prev => prev.map(booking => booking.id === bookingId ? {...booking, status: 'confirmed'} : booking));
      toast({
        title: "Booking accepted",
        description: "The client has been notified",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept booking",
        variant: "destructive",
      });
    }
  };

  // Handle rejecting a booking (experts only)
  const handleRejectBooking = async (bookingId: string) => {
    try {
      const userData = localStorage.getItem('user');
      let token = '';
      if (userData) {
        const user = JSON.parse(userData);
        token = user.token || user.accessToken || '';
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'rejected' })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject booking');
      }
      setExpertBookings(prev => prev.map(booking => booking.id === bookingId ? {...booking, status: 'rejected'} : booking));
      setSeekerBookings(prev => prev.map(booking => booking.id === bookingId ? {...booking, status: 'rejected'} : booking));
      toast({
        title: "Booking rejected",
        description: "The client has been notified",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject booking",
        variant: "destructive",
      });
    }
  };

  // Open reschedule dialog
  const openRescheduleDialog = (bookingId: string, currentDate: string) => {
    setRescheduleBookingId(bookingId);
    setRescheduleDate(new Date(currentDate));
    setRescheduleTime('');
    setIsRescheduleOpen(true);
  };

  // Handle reschedule submission
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
      const userData = localStorage.getItem('user');
      let token = '';
      if (userData) {
        const user = JSON.parse(userData);
        token = user.token || user.accessToken || '';
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/${rescheduleBookingId}/reschedule`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          date: formattedDate,
          start_time: rescheduleTime 
        })
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to reschedule booking');
      }
      const updateBooking = (booking: Booking): Booking => 
        booking.id === rescheduleBookingId 
          ? {...booking, date: formattedDate, start_time: rescheduleTime, status: 'confirmed'} 
          : booking;
      setExpertBookings(prev => prev.map(updateBooking));
      setSeekerBookings(prev => prev.map(updateBooking));
      setIsRescheduleOpen(false);
      toast({
        title: "Booking rescheduled",
        description: "The appointment has been rescheduled successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reschedule booking",
        variant: "destructive",
      });
    }
  };

  // Format amount helper
  const formatAmount = (amount: number | string): string => {
    if (typeof amount === 'string') {
      return parseFloat(amount).toFixed(2);
    }
    return amount.toFixed(2);
  };

  // Check if amount is positive
  const isAmountPositive = (amount: number | string): boolean => {
    if (typeof amount === 'string') {
      return parseFloat(amount) > 0;
    }
    return amount > 0;
  };

  // Helper to check if current time is within 5 minutes before session start
  const isWithinFiveMinutesBeforeStart = (dateStr: string, startTimeStr: string): boolean => {
    const now = new Date();
    const sessionStart = new Date(`${dateStr}T${startTimeStr}`);
    const fiveMinutesBefore = new Date(sessionStart.getTime() - 5 * 60 * 1000);
    return now >= fiveMinutesBefore && now <= sessionStart;
  };

  // Helper to check if session is completed (current time after session end)
  const isSessionCompleted = (dateStr: string, endTimeStr: string): boolean => {
    const now = new Date();
    const sessionEnd = new Date(`${dateStr}T${endTimeStr}`);
    return now > sessionEnd;
  };

  // Render booking card helper
  const renderBookingCard = (booking: Booking) => {
    // Determine if the user is viewing as a seeker or expert
    const isViewingAsSeeker = userType === 'seeker';

    // Get the other user's name based on the user type
    const otherUserName = isViewingAsSeeker ? booking.expert_name : booking.seeker_name;

    // Find the other user's profile from uniqueContacts
    const otherUser = uniqueContacts.find(contact =>
      isViewingAsSeeker ? contact.id === booking.expert_id : contact.id === booking.seeker_id
    );

    const sessionCompleted = isSessionCompleted(booking.date, booking.end_time);
    const canJoinSession = !sessionCompleted && (isWithinFiveMinutesBeforeStart(booking.date, booking.start_time) || new Date() >= new Date(`${booking.date}T${booking.start_time}`));

    const handleJoinSession = async () => {
      try {
        // For video and audio sessions, request media permissions
        if (booking.session_type === 'video' || booking.session_type === 'audio') {
          await navigator.mediaDevices.getUserMedia({ 
            video: booking.session_type === 'video',
            audio: true 
          });
        }

        // Navigate to the appropriate session page based on session type
        switch (booking.session_type) {
          case 'video':
            navigate(`/video-call/${booking.id}`);
            break;
          case 'audio':
            navigate(`/audio-session/${booking.id}`);
            break;
          case 'chat':
            navigate(`/chat-session/${booking.id}`);
            break;
          default:
            toast({
              title: "Error",
              description: "Invalid session type",
              variant: "destructive",
            });
        }
      } catch (err) {
        toast({
          title: "Permission Denied",
          description: booking.session_type === 'chat' 
            ? "Failed to join chat session"
            : "Please allow camera and microphone access to join the session.",
          variant: "destructive",
        });
      }
    };

    return (
      <Card key={booking.id} className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${otherUserName}`} />
                <AvatarFallback>{getInitials(otherUserName)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">{otherUserName}</CardTitle>
                <CardDescription>
                  {formatDate(booking.date)} at {booking.start_time}
                </CardDescription>
              </div>
            </div>
            <Badge variant={
              booking.status === 'confirmed' ? 'default' :
              booking.status === 'pending' ? 'secondary' :
              booking.status === 'rejected' ? 'destructive' :
              booking.status === 'completed' ? 'outline' :
              'secondary'
            }>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pb-2">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              {booking.session_type === 'video' && <Video className="h-4 w-4 mr-2" />}
              {booking.session_type === 'audio' && <Mic className="h-4 w-4 mr-2" />}
              {booking.session_type === 'chat' && <MessageSquare className="h-4 w-4 mr-2" />}
              {booking.session_type.charAt(0).toUpperCase() + booking.session_type.slice(1)} Session
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2" />
              {booking.start_time} - {booking.end_time}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2" />
              {booking.session_type === 'video' ? 'Video Call' : 
               booking.session_type === 'audio' ? 'Audio Call' : 
               'Chat Session'}
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-2 border-t bg-gray-50/50">
          {userType === 'seeker' ? (
            <div className="w-full space-y-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/experts/${booking.expert_id}`)}
              >
                <User className="h-4 w-4 mr-2" />
                View Expert Profile
              </Button>
              {booking.status === 'confirmed' && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleJoinSession}
                >
                  {booking.session_type === 'video' && <Video className="h-4 w-4 mr-2" />}
                  {booking.session_type === 'audio' && <Mic className="h-4 w-4 mr-2" />}
                  {booking.session_type === 'chat' && <MessageSquare className="h-4 w-4 mr-2" />}
                  Join {booking.session_type.charAt(0).toUpperCase() + booking.session_type.slice(1)} Session
                </Button>
              )}
            </div>
          ) : (
            <div className="w-full space-y-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/seekers/${booking.seeker_id}`)}
              >
                <User className="h-4 w-4 mr-2" />
                View Seeker Profile
              </Button>
              {booking.status === 'pending' && (
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => openRescheduleDialog(booking.id, booking.date)}
                  >
                    <CalendarClock className="h-4 w-4 mr-2" />
                    Reschedule
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleRejectBooking(booking.id)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleAcceptBooking(booking.id)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Accept
                  </Button>
                </div>
              )}
              {booking.status === 'confirmed' && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleJoinSession}
                >
                  {booking.session_type === 'video' && <Video className="h-4 w-4 mr-2" />}
                  {booking.session_type === 'audio' && <Mic className="h-4 w-4 mr-2" />}
                  {booking.session_type === 'chat' && <MessageSquare className="h-4 w-4 mr-2" />}
                  Start {booking.session_type.charAt(0).toUpperCase() + booking.session_type.slice(1)} Session
                </Button>
              )}
            </div>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-8 px-4 pt-20 sm:px-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Appointment Log</h1>
            <p className="text-muted-foreground mt-1 max-w-xs sm:max-w-full">
              Manage your {userType === 'seeker' ? 'bookings with experts' : 'client appointments'}
            </p>
          </div>
          {userType && (
            <Badge variant="outline" className="text-sm px-3 py-1 whitespace-nowrap">
              {userType === 'seeker' ? 'Client View' : 'Expert View'}
            </Badge>
          )}
        </div>
        
        {!localStorage.getItem('user') ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="space-y-4">
                <div className="text-muted-foreground text-lg">
                  Please log in to view your appointments
                </div>
                <Button onClick={() => navigate('/login')} size="lg">
                  Log In
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading appointments...</p>
          </div>
        ) : error ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="space-y-4">
                <div className="text-red-500 text-lg">{error}</div>
                <Button onClick={() => {
                  if (userId) {
                    fetchSeekerBookings(userId);
                    fetchExpertBookings(userId);
                  }
                }} variant="outline">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList
              className={
                userType === 'seeker'
                  ? "grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3"
                  : "grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4"
              }
            >
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                Upcoming
                {getUpcomingCount() > 0 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {getUpcomingCount()}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center gap-2">
                Past
                {getPastCount() > 0 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {getPastCount()}
                  </Badge>
                )}
              </TabsTrigger>
              {/* Only show contacts tab for expert */}
              {userType === 'expert' && (
                <TabsTrigger value="contacts" className="flex items-center gap-2">
                  My Clients
                  {uniqueContacts.length > 0 && (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      {uniqueContacts.length}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
              <TabsTrigger value="all" className="flex items-center gap-2">
                All
                {bookings.length > 0 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {bookings.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            {/* Upcoming Appointments Tab */}
            <TabsContent value="upcoming" className="space-y-4">
              {bookings.filter(booking => {
                const dateOnly = booking.date.split('T')[0];
                const bookingEnd = parseDateTime(dateOnly, booking.end_time);
                const bookingStart = parseDateTime(dateOnly, booking.start_time);
                const now = new Date();
                const nowUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
                const bookingEndUtc = new Date(Date.UTC(bookingEnd.getUTCFullYear(), bookingEnd.getUTCMonth(), bookingEnd.getUTCDate(), bookingEnd.getUTCHours(), bookingEnd.getUTCMinutes(), bookingEnd.getUTCSeconds()));
                const bookingStartUtc = new Date(Date.UTC(bookingStart.getUTCFullYear(), bookingStart.getUTCMonth(), bookingStart.getUTCDate(), bookingStart.getUTCHours(), bookingStart.getUTCMinutes(), bookingStart.getUTCSeconds()));
                console.log("Upcoming filter - booking.date:", booking.date, "end_time:", booking.end_time, "bookingEndUtc:", bookingEndUtc, "nowUtc:", nowUtc);
                console.log("Upcoming filter - status:", booking.status, "bookingStartUtc:", bookingStartUtc, "nowUtc:", nowUtc);
                return (booking.status === 'pending' || booking.status === 'confirmed') &&
                       (bookingEndUtc >= nowUtc || isWithinTwentyMinutesAfterStart(dateOnly, booking.start_time));
              }).length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-muted-foreground text-lg">
                        No upcoming appointments found
                      </div>
                      {userType === 'seeker' && (
                        <Button onClick={() => navigate('/network')} size="lg">
                          Find an Expert
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                  {bookings
                    .filter(booking => {
                      const dateOnly = booking.date.split('T')[0];
                      const bookingEnd = parseDateTime(dateOnly, booking.end_time);
                      const bookingStart = parseDateTime(dateOnly, booking.start_time);
                      const now = new Date();
                      const nowUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
                      const bookingEndUtc = new Date(Date.UTC(bookingEnd.getUTCFullYear(), bookingEnd.getUTCMonth(), bookingEnd.getUTCDate(), bookingEnd.getUTCHours(), bookingEnd.getUTCMinutes(), bookingEnd.getUTCSeconds()));
                      const bookingStartUtc = new Date(Date.UTC(bookingStart.getUTCFullYear(), bookingStart.getUTCMonth(), bookingStart.getUTCDate(), bookingStart.getUTCHours(), bookingStart.getUTCMinutes(), bookingStart.getUTCSeconds()));
                      console.log("Upcoming filter inside map - booking.date:", booking.date, "end_time:", booking.end_time, "bookingEndUtc:", bookingEndUtc, "nowUtc:", nowUtc);
                      console.log("Upcoming filter inside map - status:", booking.status, "bookingStartUtc:", bookingStartUtc, "nowUtc:", nowUtc);
                      return (booking.status === 'pending' || booking.status === 'confirmed') &&
                             (bookingEndUtc >= nowUtc || isWithinTwentyMinutesAfterStart(dateOnly, booking.start_time));
                    })
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map(renderBookingCard)}
                </div>
              )}
            </TabsContent>
            
            {/* Past Appointments Tab */}
            <TabsContent value="past" className="space-y-4">
              {bookings.filter(booking => {
                const bookingEnd = parseDateTime(booking.date, booking.end_time);
                const now = new Date();
                return bookingEnd < now || booking.status === 'completed' || booking.status === 'rejected' || booking.status === 'cancelled';
              }).length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="text-muted-foreground text-lg">
                      No past appointments found
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                  {bookings
                    .filter(booking => {
                      const bookingEnd = parseDateTime(booking.date, booking.end_time);
                      const now = new Date();
                      return bookingEnd < now || booking.status === 'completed' || booking.status === 'rejected' || booking.status === 'cancelled';
                    })
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(renderBookingCard)}
                </div>
              )}
            </TabsContent>
            
            {/* Contacts Tab */}
            {userType === 'expert' && (
              <TabsContent value="contacts" className="space-y-4">
              {uniqueContacts.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-muted-foreground text-lg">
                        You don't have any clients yet
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                  {uniqueContacts.map(contact => {
                    const contactBookings = getBookingsWithContact(contact.id);
                    const lastBooking = contactBookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                    const upcomingCount = contactBookings.filter(b => {
                      const bookingEnd = parseDateTime(b.date, b.end_time);
                      const now = new Date();
                      return bookingEnd > now && (b.status === 'confirmed' || b.status === 'pending');
                    }).length;
                    const completedCount = contactBookings.filter(b => b.status === 'completed').length;
                    const totalCount = contactBookings.length;
                    
                    return (
                      <Card key={contact.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={contact.profile_image} />
                              <AvatarFallback className="bg-primary/10">
                                {getInitials(`${contact.first_name} ${contact.last_name}`)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <CardTitle className="text-lg">
                                {contact.first_name} {contact.last_name}
                              </CardTitle>
                              <CardDescription>
                                {userType === 'seeker' 
                                  ? (contact.specialty || 'Expert')
                                  : (contact.company || 'Client')}
                              </CardDescription>
                              {userType === 'seeker' && contact.designation && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {contact.designation}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                              <div className="text-2xl font-bold text-blue-600">
                                {completedCount}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Completed
                              </div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-green-600">
                                {upcomingCount}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Upcoming
                              </div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-gray-600">
                                {totalCount}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Total
                              </div>
                            </div>
                            <div>
                              <Button 
                                size="sm" 
                                className="w-full"
                                onClick={() => {
                                  toast({
                                    title: "Feature Coming Soon",
                                    description: "Client messaging will be available soon",
                                  });
                                }}
                              >
                                Contact
                              </Button>
                            </div>
                          </div>
                          
                          {lastBooking && (
                            <div className="pt-3 border-t">
                              <p className="text-sm text-muted-foreground">
                                Last session: {formatDate(lastBooking.date)}
                              </p>
                            </div>
                          )}
                        </CardContent>
                        
                        <CardFooter className="pt-4 border-t bg-gray-50/50">
                          {userType === 'seeker' ? (
                            <div className="flex space-x-2 w-full">
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
                            <div className="flex space-x-2 w-full">
                              <Button 
                                className="flex-1" 
                                size="sm"
                                onClick={() => navigate(`/clients/${contact.id}`)}
                              >
                                View Profile
                              </Button>
                            </div>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
              </TabsContent>
            )}
            
            {/* All Appointments Tab */}
            <TabsContent value="all" className="space-y-4">
              {bookings.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="text-muted-foreground text-lg">
                      No appointments found
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                  {bookings
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(renderBookingCard)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
      <Footer />

      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Select a new date and time for your appointment.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRescheduleSubmit}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="reschedule-date">Date</Label>
                <Calendar 
                  mode="single" 
                  selected={rescheduleDate} 
                  onSelect={setRescheduleDate} 
                  disabled={(date) => date < new Date()} 
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="reschedule-time">Time</Label>
                <Select onValueChange={setRescheduleTime} value={rescheduleTime}>
                  <SelectTrigger id="reschedule-time" className="w-full">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
                      "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
                      "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"
                    ].map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Reschedule</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function parseDateTime(date: string, time: string) {
  // Handles ISO date string with time and timezone, and "HH:mm AM/PM" or "HH:mm" 24-hour format time string
  if (!date || !time) return new Date(date);
  const baseDate = new Date(date); // parse full ISO date string with timezone
  if (isNaN(baseDate.getTime())) return new Date(date); // fallback if invalid date
  let hours = 0;
  let minutes = 0;
  const timeParts = time.trim().split(' ');
  if (timeParts.length === 2) {
    // 12-hour format with AM/PM
    const [rawTime, modifier] = timeParts;
    [hours, minutes] = rawTime.split(':').map(Number);
    if (modifier.toLowerCase() === 'pm' && hours < 12) hours += 12;
    if (modifier.toLowerCase() === 'am' && hours === 12) hours = 0;
  } else {
    // 24-hour format without AM/PM
    [hours, minutes] = time.split(':').map(Number);
  }
  baseDate.setHours(hours, minutes, 0, 0);
  return baseDate;
}

export default AppointmentLog;







