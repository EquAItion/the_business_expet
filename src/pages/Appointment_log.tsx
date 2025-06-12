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
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  amount: number | string;
  created_at: string;
  notes?: string;
  is_read?: boolean;
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

interface NotificationData {
  type: 'booking_request' | 'booking_accepted' | 'booking_cancelled' | 'session_reminder' | 'session_completed' | 'session_rescheduled' | 'new_message';
  session_type: string;
  session_time?: string;
  date?: string;
  expert_name?: string;
  seeker_name?: string;
  booking_id?: string;
  sender_name?: string;
  message_preview?: string;
}

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
  const [expertAvailability, setExpertAvailability] = useState<any[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
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
        return 'bg-green-500 text-white';
      case 'pending':
        return 'bg-yellow-500 text-white opacity-50';
      case 'completed':
        return 'bg-orange-500 text-white';
      case 'rejected':
        return 'bg-red-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
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
    return bookings.filter(isUpcomingBooking).length;
  };

  // Get past count for badge
  const getPastCount = () => {
    const bookings = userType === 'seeker' ? seekerBookings : expertBookings;
    const now = new Date();
    return bookings.filter(booking => {
      const dateOnly = booking.date.split('T')[0];
      const bookingEnd = parseDateTime(dateOnly, booking.end_time);
      return bookingEnd < now || booking.status === 'completed' || booking.status === 'cancelled';
    }).length;
  };

  // Fetch bookings for seeker
  const fetchSeekerBookings = async (id: string) => {
    setLoadingSeeker(true);
    setErrorSeeker(null);
    
    try {
      const userData = localStorage.getItem('user');
      console.log('User data from localStorage:', userData); // Debug log

      let token = '';
      if (userData) {
        const user = JSON.parse(userData);
        token = user.token || user.accessToken || '';
      }
      
      console.log('Using token:', token ? 'Present' : 'Missing'); // Debug log
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/seeker/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status); // Debug log
      
      const data = await response.json();
      console.log('Bookings data:', data); // Debug log

      if (data && data.success && Array.isArray(data.data)) {
        setSeekerBookings(data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setErrorSeeker('Failed to load bookings');
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
      
      console.log('Fetching expert bookings for ID:', id);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/expert/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch expert bookings:', response.statusText);
        setExpertBookings([]);
        setErrorExpert(`Failed to fetch expert bookings: ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      console.log('Expert bookings response:', data);
      
      if (data && data.success && Array.isArray(data.data)) {
        const processedBookings = data.data.map((booking: any) => {
          const processed = {
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
            notes: booking.notes || '',
            is_read: booking.is_read || false
          };
          console.log('Processed booking:', processed);
          return processed;
        });
        
        console.log('Setting expert bookings:', processedBookings);
        setExpertBookings(processedBookings);
        setErrorExpert(null);
      } else {
        console.error('Invalid expert bookings data:', data);
        setExpertBookings([]);
        if (data && !data.success) {
          setErrorExpert(data.message || "Failed to load bookings");
        }
      }
    } catch (error) {
      console.error('Error fetching expert bookings:', error);
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
  const handleRescheduleDialog = async (bookingId: string, expertId: string) => {
    setRescheduleBookingId(bookingId);
    setRescheduleDate(undefined);
    setRescheduleTime('');
    setIsRescheduleOpen(true);
    
    // Fetch expert availability when opening dialog
    await fetchExpertAvailability(expertId);
  };

  // Handle reschedule submission
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!rescheduleDate || !rescheduleTime) {
        toast({
          title: "Error",
          description: "Please select both date and time",
          variant: "destructive",
        });
        return;
      }

      const userData = localStorage.getItem('user');
      if (!userData) throw new Error('Please login to continue');

      const user = JSON.parse(userData);
      const token = user.token || user.accessToken;

      // Format date and time for API
      const formattedDate = format(rescheduleDate, 'yyyy-MM-dd');
      const formattedTime = rescheduleTime;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/${rescheduleBookingId}/reschedule`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: formattedDate,
          start_time: formattedTime,
          end_time: addHours(parseTime(formattedTime), 1)
        })
      });

      if (!response.ok) throw new Error('Failed to reschedule appointment');

      // Update local state
      const result = await response.json();
      
      if (userId) {
        await Promise.all([
          fetchSeekerBookings(userId),
          fetchExpertBookings(userId)
        ]);
      }

      setIsRescheduleOpen(false);
      toast({
        title: "Success",
        description: "Appointment rescheduled successfully"
      });

    } catch (error) {
      console.error('Reschedule error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reschedule appointment",
        variant: "destructive"
      });
    }
  };

  // Add function to fetch expert availability
  const fetchExpertAvailability = async (expertId: string) => {
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    
    try {
      const userData = localStorage.getItem('user');
      if (!userData) throw new Error('User data not found');
      
      const user = JSON.parse(userData);
      const token = user.token || user.accessToken;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/experts/availability/${expertId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch availability');

      const result = await response.json();
      setExpertAvailability(result.data);
    } catch (error) {
      setAvailabilityError('Failed to load expert availability');
      console.error('Error fetching availability:', error);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // Add function to generate time slots
  const generateTimeSlots = (start: string, end: string): string[] => {
    const slots: string[] = [];
    const [startHour] = start.split(':').map(Number);
    const [endHour] = end.split(':').map(Number);
    
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    
    return slots;
  };

  // Update the Reschedule Dialog component
  const RescheduleDialog = () => (
    <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogDescription>
            Select a new date and time for your appointment
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
          {availabilityLoading ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : availabilityError ? (
            <div className="text-center text-red-500 p-4">
              {availabilityError}
            </div>
          ) : expertAvailability.length === 0 ? (
            <div className="text-center text-muted-foreground p-4">
              No availability found for this expert
            </div>
          ) : (
            <div className="space-y-4">
              {expertAvailability.map((day, index) => (
                <Card key={index} className="p-4">
                  <h3 className="font-semibold mb-2">{day.day_of_week}</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {generateTimeSlots(day.start_time, day.end_time).map((time) => (
                      <Button
                        key={time}
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          rescheduleTime === time && "border-primary"
                        )}
                        onClick={() => {
                          const date = getDateFromDayOfWeek(day.day_of_week);
                          setRescheduleDate(date);
                          setRescheduleTime(time);
                        }}
                      >
                        {format(parseTime(time), "h:mm a")}
                      </Button>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsRescheduleOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!rescheduleDate || !rescheduleTime}
            onClick={handleRescheduleSubmit}
          >
            Confirm Reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Add helper function to get date from day of week
  const getDateFromDayOfWeek = (dayName: string): Date => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const currentDay = today.getDay();
    const targetDay = days.indexOf(dayName);
    const daysUntilTarget = targetDay - currentDay;
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + (daysUntilTarget >= 0 ? daysUntilTarget : 7 + daysUntilTarget));
    
    return targetDate;
  };

  // Update the openRescheduleDialog function
  const openRescheduleDialog = async (bookingId: string, expertId: string) => {
    setRescheduleBookingId(bookingId);
    setRescheduleDate(undefined);
    setRescheduleTime('');
    setIsRescheduleOpen(true);
    
    // Fetch expert availability when opening dialog
    await fetchExpertAvailability(expertId);
  };

  // Update the handleRescheduleSubmit function
  // Function is already defined above - removing duplicate

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

  // Add function to check if session is in past
  const isSessionInPast = (date: string, endTime: string): boolean => {
    const now = new Date();
    const bookingDate = new Date(date);
    const [hours, minutes] = endTime.split(':').map(Number);
    const bookingEnd = new Date(bookingDate);
    bookingEnd.setHours(hours, minutes, 0, 0);
    return bookingEnd < now;
  };

  // Update the renderBookingCard function
  const renderBookingCard = (booking: Booking) => {
    const isPast = isSessionInPast(booking.date, booking.end_time);
    const displayStatus = isPast ? 'completed' : booking.status;

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
            <Badge className={getStatusBadge(displayStatus)}>
              {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
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
              {displayStatus === 'confirmed' && !isPast && (
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
              {booking.status === 'cancelled' && !booking.is_read && booking.session_type === 'chat' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => markBookingAsRead(booking.id)}
                >
                  Mark as Read
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
                    onClick={() => handleRescheduleDialog(booking.id, booking.date)}
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
                    Cancel
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
              {booking.status === 'cancelled' && !booking.is_read && booking.session_type === 'chat' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => markBookingAsRead(booking.id)}
                >
                  Mark as Read
                </Button>
              )}
            </div>
          )}
        </CardFooter>
      </Card>
    );
  };

  // Add this notification utility function after the imports
  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const showNotification = (title: string, options: NotificationOptions & { data?: any }) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/logo.png',
        badge: '/logo.png',
        ...options
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        if (options.data?.url) {
          window.location.href = options.data.url;
        }
        notification.close();
      };
    }
  };

  // Add this service worker registration function after the imports
  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        // Check if service worker is already registered
        const existingRegistration = await navigator.serviceWorker.getRegistration();
        if (existingRegistration) {
          console.log('Service Worker already registered:', existingRegistration.scope);
          return existingRegistration;
        }

        // Register new service worker
        const registration = await navigator.serviceWorker.register('/notification-worker.js', {
          scope: '/'
        });
        
        console.log('Service Worker registered successfully:', registration.scope);
        
        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('Service Worker is ready');
        
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    }
    console.log('Service Workers not supported');
    return null;
  };

  // Update the WebSocket connection setup
  useEffect(() => {
    let ws: WebSocket | null = null;
    let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

    const setupNotifications = async () => {
      try {
        // Register service worker first
        serviceWorkerRegistration = await registerServiceWorker();
        if (!serviceWorkerRegistration) {
          console.log('Service Worker registration failed, falling back to basic notifications');
        }

        // Request notification permission
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
          console.log('Notification permission denied');
          return;
        }

        // Fix the WebSocket URL construction
const baseUrl = import.meta.env.VITE_API_URL;
const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
const wsUrl = `${wsProtocol}://${new URL(baseUrl).host}/ws/notifications`;

console.log('Connecting to WebSocket:', wsUrl);

const socket = new WebSocket(wsUrl);

        
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('WebSocket connection established');
          const token = localStorage.getItem('token');
          if (token) {
            ws?.send(JSON.stringify({ type: 'auth', token }));
          }
        };        ws.onmessage = (event) => {
          try {
            const data: NotificationData = JSON.parse(event.data);
            console.log('Received notification:', data);
            
            // Only refresh bookings for booking-related notifications
            if (userId && data.type && (
              data.type.startsWith('booking_') || 
              data.type === 'session_reminder' || 
              data.type === 'session_completed' || 
              data.type === 'session_rescheduled'
            )) {
              // Fetch only the relevant booking type based on user type
              if (userType === 'seeker') {
                fetchSeekerBookings(userId);
              } else if (userType === 'expert') {
                fetchExpertBookings(userId);
              }
            }

            // Show notification if service worker is available
            if (serviceWorkerRegistration?.active) {
              let notificationTitle = '';
              let notificationBody = '';
              let notificationTag = '';
              let notificationColor = '';

              // Format the date and time for the notification
              const formatNotificationDateTime = (dateStr: string, timeStr: string) => {
                const date = new Date(dateStr);
                const options: Intl.DateTimeFormatOptions = { 
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                };
                return `${date.toLocaleDateString('en-US', options)} at ${timeStr}`;
              };

              switch (data.type) {
                case 'booking_accepted':
                  notificationTitle = 'Booking Accepted';
                  notificationBody = `Your ${data.session_type} session for ${formatNotificationDateTime(data.date || '', data.session_time || '')} has been accepted`;
                  notificationTag = 'booking_accepted';
                  notificationColor = 'green';
                  break;
                case 'booking_cancelled':
                  notificationTitle = 'Booking Cancelled';
                  notificationBody = `Your ${data.session_type} session for ${formatNotificationDateTime(data.date || '', data.session_time || '')} has been cancelled`;
                  notificationTag = 'booking_cancelled';
                  notificationColor = 'red';
                  break;
                case 'session_completed':
                  notificationTitle = 'Session Completed';
                  notificationBody = `Your ${data.session_type} session has been completed`;
                  notificationTag = 'session_completed';
                  notificationColor = 'blue';
                  break;
                default:
                  notificationTitle = 'New Update';
                  notificationBody = 'Your bookings have been updated';
                  notificationTag = 'booking_update';
                  notificationColor = 'blue';
              }

              serviceWorkerRegistration.active.postMessage({
                type: 'SHOW_NOTIFICATION',
                notification: {
                  title: notificationTitle,
                  body: notificationBody,
                  icon: '/logo.png',
                  badge: '/logo.png',
                  tag: notificationTag,
                  requireInteraction: true,
                  data: {
                    url: window.location.origin,
                    color: notificationColor,
                    bookingId: data.booking_id
                  }
                }
              });
            }
          } catch (error) {
            console.error('Error processing notification:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...');
            setupNotifications();
          }, 5000);
        };

        ws.onclose = () => {
          console.log('WebSocket connection closed');
          setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...');
            setupNotifications();
          }, 5000);
        };
      } catch (error) {
        console.error('Error setting up WebSocket:', error);
      }
    };

    setupNotifications();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [userId, userType, fetchSeekerBookings, fetchExpertBookings]);

  // Update the booking filters
  const isUpcomingBooking = (booking: Booking): boolean => {
    try {
      const now = new Date();
      const bookingDate = new Date(booking.date);
      const [hours, minutes] = booking.end_time.split(':').map(Number);
      const bookingEnd = new Date(bookingDate);
      bookingEnd.setHours(hours, minutes, 0, 0);

      // Show pending bookings regardless of time
      return booking.status === 'pending';
    } catch (error) {
      console.error('Error in isUpcomingBooking:', error, booking);
      return false;
    }
  };

  // Update the isConfirmedBooking function
  const isConfirmedBooking = (booking: Booking): boolean => {
    try {
        const now = new Date();
        const bookingDate = new Date(booking.date);
        const [endHours, endMinutes] = booking.end_time.split(':').map(Number);
        const bookingEnd = new Date(bookingDate);
        bookingEnd.setHours(endHours, endMinutes, 0, 0);

        // Show confirmed bookings that:
        // 1. Have status 'confirmed'
        // 2. Haven't ended yet
        // 3. For both experts and seekers
        return (
            booking.status === 'confirmed' && 
            bookingEnd > now
        );
    } catch (error) {
        console.error('Error in isConfirmedBooking:', error, booking);
        return false;
    }
  };

  // Update the isPastBooking filter:
  const isPastBooking = (booking: Booking): boolean => {
    try {
      const now = new Date();
      const bookingDate = new Date(booking.date);
      const [hours, minutes] = booking.end_time.split(':').map(Number);
      const bookingEnd = new Date(bookingDate);
      bookingEnd.setHours(hours, minutes, 0, 0);

      // Only show completed and cancelled bookings in past tab
      return (booking.status === 'completed' || booking.status === 'cancelled') && bookingEnd < now;
    } catch (error) {
      console.error('Error in isPastBooking:', error, booking);
      return false;
    }
  };
  // No need for periodic refresh since we update via WebSocket notifications

  // Add a function to mark booking as read
  const markBookingAsRead = async (bookingId: string) => {
    try {
      const userData = localStorage.getItem('user');
      let token = '';
      if (userData) {
        const user = JSON.parse(userData);
        token = user.token || user.accessToken || '';
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/${bookingId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark booking as read');
      }

      // Update local state
      setSeekerBookings(prev => prev.map(booking => 
        booking.id === bookingId ? { ...booking, is_read: true } : booking
      ));
      setExpertBookings(prev => prev.map(booking => 
        booking.id === bookingId ? { ...booking, is_read: true } : booking
      ));

    } catch (error) {
      console.error('Error marking booking as read:', error);
    }
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
        
        {!userId ? (
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
        ) : loadingSeeker || loadingExpert ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading appointments...</p>
          </div>
        ) : errorSeeker || errorExpert ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="space-y-4">
                <div className="text-red-500 text-lg">{errorSeeker || errorExpert}</div>
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
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                Pending
                {bookings.filter(b => b.status === 'pending').length > 0 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {bookings.filter(b => b.status === 'pending').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="flex items-center gap-2">
                Confirmed
                {bookings.filter(b => b.status === 'confirmed').length > 0 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {bookings.filter(b => b.status === 'confirmed').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2">
                Rejected
                {bookings.filter(b => b.status === 'rejected').length > 0 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {bookings.filter(b => b.status === 'rejected').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                Completed
                {bookings.filter(b => b.status === 'completed').length > 0 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {bookings.filter(b => b.status === 'completed').length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            {/* Pending Appointments Tab */}
            <TabsContent value="pending" className="space-y-4">
              {bookings.filter(b => b.status === 'pending').length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="text-muted-foreground text-lg">
                      No pending appointments
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                  {bookings
                    .filter(b => b.status === 'pending')
                .sort((a, b) => {
                  const dateA = new Date(`${a.date}T${a.start_time}`);
                  const dateB = new Date(`${b.date}T${b.start_time}`);
                  return dateA.getTime() - dateB.getTime(); // Earliest first
                })
                    .map(renderBookingCard)}
                </div>
              )}
            </TabsContent>
            
         {/* {   Confirmed Appointments Tab } */}
            <TabsContent value="confirmed" className="space-y-4">
              {bookings.filter(b => b.status === 'confirmed').length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="text-muted-foreground text-lg">
                      No confirmed appointments
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                  {bookings
                    .filter(b => b.status === 'confirmed')
                    .sort((a, b) => {
                      const dateA = new Date(`${a.date}T${a.start_time}`);
                      const dateB = new Date(`${b.date}T${b.start_time}`);
                      return dateA.getTime() - dateB.getTime();
                    })
                    .map(renderBookingCard)}
                </div>
              )}
            </TabsContent>
            
            {/* Rejected Appointments Tab */}
            <TabsContent value="rejected" className="space-y-4">
              {bookings.filter(b => b.status === 'rejected').length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="text-muted-foreground text-lg">
                      No rejected appointments
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                  {bookings
                    .filter(b => b.status === 'rejected')
                    .sort((a, b) => {
                      const dateA = new Date(`${a.date}T${a.start_time}`);
                      const dateB = new Date(`${b.date}T${b.start_time}`);
                      return dateA.getTime() - dateB.getTime(); // Oldest first (FIFO)
                    })
                    .map(renderBookingCard)}
                </div>
              )}
            </TabsContent>
            
            {/* Completed Appointments Tab */}
            <TabsContent value="completed" className="space-y-4">
              {bookings.filter(b => {
                const now = new Date();
                const bookingDate = new Date(b.date);
                const [hours, minutes] = b.end_time.split(':').map(Number);
                const bookingEnd = new Date(bookingDate);
                bookingEnd.setHours(hours, minutes, 0, 0);
                
                return (b.status === 'completed' || 
                        (b.status === 'cancelled' && bookingEnd < now) ||
                        (b.status === 'confirmed' && bookingEnd < now));
              }).length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="text-muted-foreground text-lg">
                      No completed appointments
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                  {bookings
                    .filter(b => {
                      const now = new Date();
                      const bookingDate = new Date(b.date);
                      const [hours, minutes] = b.end_time.split(':').map(Number);
                      const bookingEnd = new Date(bookingDate);
                      bookingEnd.setHours(hours, minutes, 0, 0);
                      
                      return (b.status === 'completed' || 
                              (b.status === 'cancelled' && bookingEnd < now) ||
                              (b.status === 'confirmed' && bookingEnd < now));
                    })
                    .sort((a, b) => {
                      const dateA = new Date(`${a.date}T${a.start_time}`);
                      const dateB = new Date(`${b.date}T${b.start_time}`);
                      return dateB.getTime() - dateA.getTime(); // Most recent first
                    })
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

// Add these helper functions
const parseTime = (timeString: string): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const addHours = (date: Date, hours: number): string => {
  const newDate = new Date(date);
  newDate.setHours(date.getHours() + hours);
  return format(newDate, 'HH:mm');
};

export default AppointmentLog;
