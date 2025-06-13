import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { cn } from "@/lib/utils";
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
import { format, addDays, isAfter, isBefore, isSameDay, parseISO } from 'date-fns';
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

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
  expert_response?: string;
  rejection_reason?: string;
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
  type: 'booking_request' | 'booking_accepted' | 'booking_cancelled' | 'booking_rejected' | 'session_reminder' | 'session_completed' | 'session_rescheduled' | 'new_message';
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

const formatTimeRange = (startTime: string) => {
  if (!startTime) return '';
  const [hours, minutes] = startTime.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  const nextHour = ((hour + 1) % 24);
  const nextHour12 = nextHour % 12 || 12;
  const nextAmpm = nextHour >= 12 ? 'PM' : 'AM';
  return `${hour12}:${minutes} ${ampm} - ${nextHour12}:${minutes} ${nextAmpm}`;
};

const dialogStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    position: 'relative',
    width: '90%',
    maxWidth: '500px',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    outline: 'none'
  }
};

interface RescheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onReschedule: (bookingId: string, newDate: string, newStartTime: string, newEndTime: string) => Promise<void>;
  checkBookingAvailability: (
    expertId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ) => Promise<boolean>;
}

const RescheduleDialog: React.FC<RescheduleDialogProps> = ({
  isOpen,
  onClose,
  booking,
  onReschedule,
  checkBookingAvailability
}): JSX.Element | null => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedStartTime, setSelectedStartTime] = useState<string>('');
  const [selectedEndTime, setSelectedEndTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens/closes or booking changes
  useEffect(() => {
    if (isOpen && booking) {
      // Normalize time format to HH:mm for start and end time
      const normalizeTime = (time: string) => {
        if (!time) return '';
        const parts = time.split(':');
        if (parts.length < 2) return time;
        const hours = parts[0].padStart(2, '0');
        const minutes = parts[1].slice(0,2).padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      setSelectedDate(booking.date || '');
      setSelectedStartTime(normalizeTime(booking.start_time) || '');
      setSelectedEndTime(normalizeTime(booking.end_time) || '');
      setError(null);
    } else {
      // Reset state when dialog closes or booking is null
      setSelectedDate('');
      setSelectedStartTime('');
      setSelectedEndTime('');
      setError(null);
    }
  }, [isOpen, booking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!selectedDate || !selectedStartTime || !selectedEndTime) {
        throw new Error('Please fill in all fields');
      }

      // Check if the selected time slot is available
      const isAvailable = await checkBookingAvailability(
        booking.expert_id,
        selectedDate,
        selectedStartTime,
        selectedEndTime,
        booking.id // Exclude current booking from availability check
      );

      if (!isAvailable) {
        throw new Error('This time slot is not available. Please choose another time.');
      }

      await onReschedule(
        booking.id,
        selectedDate,
        selectedStartTime,
        selectedEndTime
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reschedule booking');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if dialog is closed or no booking
  if (!isOpen || !booking) {
    return null;
  }

  // Generate time slots from 9 AM to 9 PM (21:00)
  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    const hour = i + 9;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  // Filter end time slots based on selected start time
  const availableEndTimes = timeSlots.filter(time => {
    if (!selectedStartTime) return true;
    return time > selectedStartTime;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reschedule Booking</DialogTitle>
          <DialogDescription>
            Select a new date and time for your appointment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Select
              value={selectedStartTime}
              onValueChange={(value) => {
                setSelectedStartTime(value);
                // Set end time to 1 hour after start time
                const startHour = parseInt(value.split(':')[0]);
                const endHour = (startHour + 1).toString().padStart(2, '0');
                setSelectedEndTime(`${endHour}:00`);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select start time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endTime">End Time</Label>
            <Select
              value={selectedEndTime}
              onValueChange={setSelectedEndTime}
              disabled={!selectedStartTime}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select end time" />
              </SelectTrigger>
              <SelectContent>
                {availableEndTimes.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="text-sm text-red-500 mt-2">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Rescheduling...' : 'Reschedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
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
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Add new state for query dialog
  const [isQueryDialogOpen, setIsQueryDialogOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);

  // Add new state for available time slots
  const [availableTimeSlots, setAvailableTimeSlots] = useState<{ [key: string]: string[] }>({});

  // Add new state for reject dialog
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedBookingForReject, setSelectedBookingForReject] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Add new state for rejection reason dialog
  const [isRejectionReasonDialogOpen, setIsRejectionReasonDialogOpen] = useState(false);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState<string | null>(null);

  // Add this near the top of the component with other state variables
  const [activeTab, setActiveTab] = useState('pending');

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

  // Add this function before getUpcomingCount
  const isUpcomingBooking = (booking: Booking): boolean => {
    const now = new Date();
    const bookingDate = new Date(booking.date);
    const [hours, minutes] = booking.start_time.split(':').map(Number);
    bookingDate.setHours(hours, minutes, 0, 0);
    return bookingDate > now && booking.status !== 'completed' && booking.status !== 'cancelled' && booking.status !== 'rejected';
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

  // Loading and error state
  const loading = loadingSeeker || loadingExpert;
  const error = errorSeeker || errorExpert;

  // Bookings to display based on userType
  const bookings = userType === 'seeker' ? seekerBookings : expertBookings;

  // Add this useEffect for debugging after bookings declaration
  useEffect(() => {
    if (userId) {
      console.log('Current user ID:', userId);
      console.log('User type:', userType);
      console.log('All bookings:', bookings);
      console.log('Confirmed bookings:', bookings.filter(b => b.status === 'confirmed'));
      console.log('Rejected bookings:', bookings.filter(b => b.status === 'rejected'));
    }
  }, [userId, userType, bookings]);

  // Update the fetchSeekerBookings function
  const fetchSeekerBookings = async (seekerId: string) => {
    try {
      console.log('Fetching seeker bookings for ID:', seekerId);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/seeker/${seekerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch seeker bookings: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Raw seeker bookings response:', responseData);
      
      // Process the bookings data
      const bookingsData = Array.isArray(responseData) ? responseData : 
                          (responseData.data && Array.isArray(responseData.data)) ? responseData.data : 
                          [];
      
      // Ensure each booking has the required fields
      const processedBookings = bookingsData.map((booking: any) => ({
        id: booking.id || `temp-${Math.random()}`,
        expert_id: booking.expert_id || '',
        seeker_id: booking.seeker_id || seekerId,
        expert_name: booking.expert_name || 'Unknown Expert',
        seeker_name: booking.seeker_name || 'You',
        date: booking.date || booking.appointment_date || '',
        start_time: booking.start_time || '',
        end_time: booking.end_time || '',
        session_type: booking.session_type || 'video',
        status: (booking.status || 'pending').toLowerCase(),
        amount: booking.amount || 0,
        created_at: booking.created_at || new Date().toISOString(),
        notes: booking.notes || '',
        rejection_reason: booking.rejection_reason || '',
        is_read: booking.is_read || false
      }));

      console.log('Processed seeker bookings:', processedBookings);
      setSeekerBookings(processedBookings);
    } catch (error) {
      console.error('Error fetching seeker bookings:', error);
      setErrorSeeker('Failed to fetch bookings. Please try again.');
      setSeekerBookings([]);
    }
  };

  // Update the fetchExpertBookings function similarly
  const fetchExpertBookings = async (expertId: string) => {
    try {
      console.log('Fetching expert bookings for ID:', expertId);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/expert/${expertId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch expert bookings: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Raw expert bookings response:', responseData);
      
      // Process the bookings data
      const bookingsData = Array.isArray(responseData) ? responseData : 
                          (responseData.data && Array.isArray(responseData.data)) ? responseData.data : 
                          [];
      
      // Ensure each booking has the required fields
      const processedBookings = bookingsData.map((booking: any) => ({
        id: booking.id || `temp-${Math.random()}`,
        expert_id: booking.expert_id || expertId,
        seeker_id: booking.seeker_id || '',
        expert_name: booking.expert_name || 'You',
        seeker_name: booking.seeker_name || 'Unknown Seeker',
        date: booking.date || booking.appointment_date || '',
        start_time: booking.start_time || '',
        end_time: booking.end_time || '',
        session_type: booking.session_type || 'video',
        status: (booking.status || 'pending').toLowerCase(),
        amount: booking.amount || 0,
        created_at: booking.created_at || new Date().toISOString(),
        notes: booking.notes || '',
        rejection_reason: booking.rejection_reason || '',
        is_read: booking.is_read || false
      }));

      console.log('Processed expert bookings:', processedBookings);
      setExpertBookings(processedBookings);
    } catch (error) {
      console.error('Error fetching expert bookings:', error);
      setErrorExpert('Failed to fetch bookings. Please try again.');
      setExpertBookings([]);
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

  // Add a simple RejectionBox component
  const RejectionBox = ({ reason }: { reason: string | null }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!reason) return null;

    return (
      <>
        <div 
          className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setIsOpen(true)}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">View Response</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {reason}
          </p>
        </div>

        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Response Details</h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {reason}
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // Update the handleReject function to ensure rejection reason is sent
  const handleReject = async () => {
    if (!selectedBookingForReject || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/${selectedBookingForReject}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: 'rejected',
          rejection_reason: rejectionReason.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject booking');
      }

      toast({
        title: "Success",
        description: "Booking rejected successfully",
      });

      setIsRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedBookingForReject(null);
      
      // Refresh bookings based on user type
      if (userType === 'seeker') {
        await fetchSeekerBookings(userId);
      } else {
        await fetchExpertBookings(userId);
      }
    } catch (error) {
      console.error('Rejection error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject booking",
        variant: "destructive"
      });
    }
  };

  // Update the handleReschedule function to match the RescheduleDialog props type
  const handleReschedule = async (
    bookingId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string
  ): Promise<void> => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) throw new Error('User data not found');
      
      const user = JSON.parse(userData);
      const token = user.token || user.accessToken;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/${bookingId}/reschedule`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: newDate,
          start_time: newStartTime,
          end_time: newEndTime
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reschedule booking');
      }

      // Refresh bookings
      if (userId) {
        if (userType === 'seeker') {
          await fetchSeekerBookings(userId);
        } else {
          await fetchExpertBookings(userId);
        }
      }

      toast({
        title: "Success",
        description: "Booking rescheduled successfully"
      });
    } catch (error) {
      console.error('Reschedule error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reschedule booking",
        variant: "destructive"
      });
      throw error; // Re-throw to let the dialog handle the error
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

  // Add the checkBookingAvailability function
  const checkBookingAvailability = async (
    expertId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ): Promise<boolean> => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) throw new Error('User data not found');
      
      const user = JSON.parse(userData);
      const token = user.token || user.accessToken;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/check-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          expert_id: expertId,
          date,
          start_time: startTime,
          end_time: endTime,
          exclude_booking_id: excludeBookingId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to check availability');
      }

      const data = await response.json();
      return data.available;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  };

  // Add function to check if a session is in the past
  const isSessionInPast = (dateStr: string, endTimeStr: string): boolean => {
    try {
      const now = new Date();
      const bookingDate = new Date(dateStr);
      const [hours, minutes] = endTimeStr.split(':').map(Number);
      bookingDate.setHours(hours, minutes, 0, 0);
      return bookingDate < now;
    } catch (error) {
      console.error('Error in isSessionInPast:', error);
      return false;
    }
  };

  // Update the booking card to fix the See Response click handling
  const renderBookingCard = (booking: Booking) => {
    const isPast = isSessionInPast(booking.date, booking.end_time);
    const displayStatus = isPast ? 'completed' : booking.status;
    const isViewingAsSeeker = userType === 'seeker';
    const otherUserName = isViewingAsSeeker ? booking.expert_name : booking.seeker_name;
    const sessionCompleted = isSessionCompleted(booking.date, booking.end_time);
    const canJoinSession = !sessionCompleted && (isWithinFiveMinutesBeforeStart(booking.date, booking.start_time) || new Date() >= new Date(`${booking.date}T${booking.start_time}`));

    // Add handleJoinSession function inside renderBookingCard
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

    const getTimeDisplay = (time: string) => {
      if (!time) return '';
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      const nextHour = ((hour + 1) % 24);
      const nextHour12 = nextHour % 12 || 12;
      const nextAmpm = nextHour >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes} ${ampm} - ${nextHour12}:${minutes} ${nextAmpm}`;
    };

    return (
      <Card key={booking.id} id={`booking-${booking.id}`} className="mb-4">
        {/* Header Section */}
        <CardHeader className="pb-2">
          <div className="space-y-2">
            {/* Name and Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${otherUserName}`} />
                  <AvatarFallback>{getInitials(otherUserName)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-base">{otherUserName}</CardTitle>
              </div>
              <Badge className={getStatusBadge(displayStatus)}>
                {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
              </Badge>
            </div>

            {/* Date, Time and Session Type */}
            <div className="flex flex-col space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {formatDate(booking.date)}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-2" />
                {formatTimeRange(booking.start_time)}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                {booking.session_type === 'video' && <Video className="h-4 w-4 mr-2" />}
                {booking.session_type === 'audio' && <Mic className="h-4 w-4 mr-2" />}
                {booking.session_type === 'chat' && <MessageSquare className="h-4 w-4 mr-2" />}
                {booking.session_type.charAt(0).toUpperCase() + booking.session_type.slice(1)} Session
              </div>
            </div>

            {/* Expert's Response for Seeker */}
            {isViewingAsSeeker && booking.expert_response && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Expert's Response</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedQuery(booking.expert_response);
                      setIsQueryDialogOpen(true);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    See Response
                  </Button>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {booking.expert_response}
                </p>
              </div>
            )}
          </div>
        </CardHeader>

        {/* Two Boxes Section */}
        {!isViewingAsSeeker && booking.status !== 'rejected' && (
          <CardContent className="pb-2">
            <div className="grid grid-cols-2 gap-3">
              {/* Left Box - Reschedule */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-[80px] flex flex-col items-center justify-center gap-2"
                  onClick={() => {
                    setSelectedBooking(booking);
                    setIsRescheduleOpen(true);
                  }}
                >
                  <CalendarClock className="h-5 w-5" />
                  <span className="text-sm">Reschedule Session</span>
                </Button>
              </div>

              {/* Right Box - Seeker's Query */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex flex-col h-[80px]">
                  <h4 className="font-medium text-sm mb-1">Seeker's Query</h4>
                  <div className="flex-grow">
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {booking.notes || 'No query available'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => {
                      setSelectedQuery(booking.notes || null);
                      setIsQueryDialogOpen(true);
                    }}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        )}

        {/* For rejected bookings - Only show Seeker's Query */}
        {!isViewingAsSeeker && booking.status === 'rejected' && (
          <CardContent className="pb-2">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex flex-col">
                <h4 className="font-medium text-sm mb-2">Seeker's Query</h4>
                <div className="flex-grow">
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {booking.notes || 'No query available'}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => {
                    setSelectedQuery(booking.notes || null);
                    setIsQueryDialogOpen(true);
                  }}
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        )}

        {/* Footer Section */}
        <CardFooter className="pt-2">
          {!isViewingAsSeeker && booking.status === 'pending' && (
            <div className="flex gap-2 w-full">
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleAcceptBooking(booking.id)}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  setSelectedBookingForReject(booking.id);
                  setIsRejectDialogOpen(true);
                }}
              >
                Reject
              </Button>
            </div>
          )}
          {booking.status === 'confirmed' && (
            <Button
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => handleJoinSession()}
            >
              Join Session
            </Button>
          )}
          {booking.status === 'rejected' && (
            <div className="w-full space-y-3">
              {userType === 'seeker' ? (
                <button
                  onClick={() => {
                    console.log('Opening rejection reason:', booking.rejection_reason); // Debug log
                    if (booking.rejection_reason) {
                      setSelectedRejectionReason(booking.rejection_reason);
                      setIsRejectionReasonDialogOpen(true);
                    }
                  }}
                  className="w-full bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-left"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-50 rounded-full">
                          <svg
                            className="w-5 h-5 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Booking Rejected</h4>
                          <p className="text-sm text-gray-500">Click to view expert's response</p>
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center space-x-2">
                        <span>See Response</span>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="text-sm text-red-500 font-medium">This booking has been rejected</div>
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
            const data = JSON.parse(event.data) as NotificationData;
            console.log('Received notification:', data);
            
            // Only refresh bookings for booking-related notifications
            if (userId && data.type && (
              data.type === 'booking_request' ||
              data.type === 'booking_accepted' ||
              data.type === 'booking_cancelled' ||
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

              // Handle the notification click
              handleNotificationClick(data);
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
  const isPendingBooking = (booking: Booking): boolean => {
    return booking.status === 'pending';
  };

  const isConfirmedBooking = (booking: Booking): boolean => {
    return booking.status === 'confirmed';
  };

  const isRejectedBooking = (booking: Booking): boolean => {
    return booking.status === 'rejected';
  };

  const isCompletedBooking = (booking: Booking): boolean => {
    return booking.status === 'completed' || booking.status === 'cancelled';
  };

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

  // Add QueryDialog component
  const QueryDialog = () => (
    <Dialog open={isQueryDialogOpen} onOpenChange={setIsQueryDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Seeker's Query</DialogTitle>
          <DialogDescription>
            The question or topic the seeker wants to discuss
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {selectedQuery || 'No query available'}
          </p>
        </div>
        <DialogFooter>
          <Button onClick={() => setIsQueryDialogOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Add function to fetch expert's bookings for a specific date
  const fetchExpertBookingsForDate = async (expertId: string, date: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/expert/${expertId}/date/${date}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const data = await response.json();
      return data.bookings || [];
    } catch (error) {
      console.error('Error fetching expert bookings:', error);
      return [];
    }
  };

  // Add function to check if a time slot is available
  const isTimeSlotAvailable = (bookings: any[], date: string, time: string) => {
    return !bookings.some(booking => 
      booking.date === date && 
      booking.start_time === time && 
      booking.status !== 'cancelled'
    );
  };

  // Modify getAvailableTimeSlots to return proper time format
  const getAvailableTimeSlots = async (expertId: string, date: string) => {
    const bookings = await fetchExpertBookingsForDate(expertId, date);
    const allTimeSlots = [
      '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
    ];
    
    const availableSlots = allTimeSlots.filter(time => isTimeSlotAvailable(bookings, date, time));
    return availableSlots;
  };

  // Add the RejectDialog component
  const RejectDialog = () => {
    const [localReason, setLocalReason] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (localReason.trim()) {
        setRejectionReason(localReason);
        handleReject();
      }
    };

    if (!isRejectDialogOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Reject Booking</h2>
            <p className="text-sm text-gray-500 mt-1">
              Please provide a reason for rejecting this booking (maximum 500 words).
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label 
                htmlFor="rejection-reason" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Rejection Reason
              </label>
              <div className="relative">
                <textarea
                  id="rejection-reason"
                  value={localReason}
                  onChange={(e) => setLocalReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="w-full min-h-[150px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  style={{
                    direction: 'ltr',
                    textAlign: 'left',
                    writingMode: 'horizontal-tb',
                    unicodeBidi: 'plaintext'
                  }}
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-1">
                  {localReason.trim().split(/\s+/).length} / 500 words
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsRejectDialogOpen(false);
                  setLocalReason('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!localReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Reject Booking
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Add the RejectionReasonDialog component
  const RejectionReasonDialog = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      if (isRejectionReasonDialogOpen && selectedRejectionReason) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }, [isRejectionReasonDialogOpen, selectedRejectionReason]);

    if (!isVisible || !selectedRejectionReason) return null;

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsRejectionReasonDialogOpen(false);
          }
        }}
      >
        <div 
          className="bg-white rounded-lg p-6 max-w-lg w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Expert's Response</h3>
              <p className="text-sm text-gray-500 mt-1">Reason for rejecting the booking</p>
            </div>
            <button 
              onClick={() => setIsRejectionReasonDialogOpen(false)}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p 
              className="text-gray-700 whitespace-pre-wrap"
              style={{
                direction: 'ltr',
                textAlign: 'left',
                unicodeBidi: 'plaintext'
              }}
            >
              {selectedRejectionReason}
            </p>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setIsRejectionReasonDialogOpen(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add function to check if a session is completed
  const isSessionCompleted = (dateStr: string, endTimeStr: string): boolean => {
    try {
      const now = new Date();
      const [hours, minutes] = endTimeStr.split(':').map(Number);
      const sessionEnd = new Date(dateStr);
      sessionEnd.setHours(hours, minutes, 0, 0);
      return sessionEnd < now;
    } catch (error) {
      console.error('Error in isSessionCompleted:', error);
      return false;
    }
  };

  // Add function to check if current time is within 5 minutes before session start
  const isWithinFiveMinutesBeforeStart = (dateStr: string, startTimeStr: string): boolean => {
    try {
      const now = new Date();
      const [hours, minutes] = startTimeStr.split(':').map(Number);
      const sessionStart = new Date(dateStr);
      sessionStart.setHours(hours, minutes, 0, 0);
      const fiveMinutesBefore = new Date(sessionStart.getTime() - 5 * 60 * 1000);
      return now >= fiveMinutesBefore && now <= sessionStart;
    } catch (error) {
      console.error('Error in isWithinFiveMinutesBeforeStart:', error);
      return false;
    }
  };

  // Add this function after the markBookingAsRead function
  const handleNotificationClick = async (notification: NotificationData) => {
    try {
      // Mark the notification as read
      if (notification.booking_id) {
        await markBookingAsRead(notification.booking_id);
      }

      // Navigate to the appropriate tab based on notification type
      let targetTab = 'pending';
      if (notification.type === 'booking_accepted') {
        targetTab = 'confirmed';
      } else if (notification.type === 'booking_cancelled' || notification.type === 'session_completed') {
        targetTab = 'completed';
      } else if (notification.type === 'booking_request') {
        targetTab = 'pending';
      }

      // Set the active tab
      setActiveTab(targetTab);

      // If there's a specific booking ID, scroll to it
      if (notification.booking_id) {
        const bookingElement = document.getElementById(`booking-${notification.booking_id}`);
        if (bookingElement) {
          bookingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add a highlight effect
          bookingElement.classList.add('highlight-booking');
          setTimeout(() => {
            bookingElement.classList.remove('highlight-booking');
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
      toast({
        title: "Error",
        description: "Failed to process notification",
        variant: "destructive",
      });
    }
  };

  // Add this CSS class to your styles
  const styles = `
    @keyframes highlight-booking {
      0% { background-color: rgba(var(--primary-rgb), 0.1); }
      50% { background-color: rgba(var(--primary-rgb), 0.2); }
      100% { background-color: transparent; }
    }

    .highlight-booking {
      animation: highlight-booking 2s ease-in-out;
    }
  `;

  // Add the styles to the document
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);

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
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading appointments...</p>
          </div>
        ) : error ? (
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
                {bookings.filter(isPendingBooking).length > 0 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {bookings.filter(isPendingBooking).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="flex items-center gap-2">
                Confirmed
                {bookings.filter(isConfirmedBooking).length > 0 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {bookings.filter(isConfirmedBooking).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2">
                Rejected
                {bookings.filter(isRejectedBooking).length > 0 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {bookings.filter(isRejectedBooking).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                Completed
                {bookings.filter(isCompletedBooking).length > 0 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {bookings.filter(isCompletedBooking).length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            {/* Pending Appointments Tab */}
            <TabsContent value="pending" className="space-y-4">
              {bookings.filter(isPendingBooking).length === 0 ? (
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
                    .filter(isPendingBooking)
                    .sort((a, b) => {
                      const dateA = new Date(`${a.date}T${a.start_time}`);
                      const dateB = new Date(`${b.date}T${b.start_time}`);
                      return dateA.getTime() - dateB.getTime();
                    })
                    .map(renderBookingCard)}
                </div>
              )}
            </TabsContent>
            
         {/* {   Confirmed Appointments Tab } */}
            <TabsContent value="confirmed" className="space-y-4">
              {bookings.filter(isConfirmedBooking).length === 0 ? (
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
                    .filter(isConfirmedBooking)
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
              {bookings.filter(isRejectedBooking).length === 0 ? (
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
                    .filter(isRejectedBooking)
                    .sort((a, b) => {
                      const dateA = new Date(`${a.date}T${a.start_time}`);
                      const dateB = new Date(`${b.date}T${b.start_time}`);
                      return dateB.getTime() - dateA.getTime();
                    })
                    .map(renderBookingCard)}
                </div>
              )}
            </TabsContent>
            
            {/* Completed Appointments Tab */}
            <TabsContent value="completed" className="space-y-4">
              {bookings.filter(isCompletedBooking).length === 0 ? (
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
                    .filter(isCompletedBooking)
                    .sort((a, b) => {
                      const dateA = new Date(`${a.date}T${a.start_time}`);
                      const dateB = new Date(`${b.date}T${b.start_time}`);
                      return dateB.getTime() - dateA.getTime();
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
      <RescheduleDialog
        isOpen={isRescheduleOpen}
        onClose={() => {
          setIsRescheduleOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        onReschedule={handleReschedule}
        checkBookingAvailability={checkBookingAvailability} // <-- add this line
      />

      {/* Add QueryDialog to the component */}
      <QueryDialog />

      {/* Add RejectDialog to the component */}
      <RejectDialog />

      {/* Add RejectionReasonDialog to the component */}
      {isRejectionReasonDialogOpen && <RejectionReasonDialog />}
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
