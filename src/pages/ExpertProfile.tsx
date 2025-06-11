import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { Button } from "../components/ui/button";
import { ErrorBoundary } from "react-error-boundary";
import { FaLinkedin, FaVideo, FaPhone, FaComments } from 'react-icons/fa';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "../components/ui/drawer";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast, useToast } from "../components/ui/use-toast";

interface Expert {
  id: string;
  first_name: string;
  last_name: string;
  designation: string;
  expertise: string;
  work_experience: string;
  current_organization: string;
  location: string;
  areas_of_help: string;
  linkedin_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  twitter_url?: string;
  user_id?: string;
  video_pricing?: number;
  audio_pricing?: number;
  chat_pricing?: number;
}

interface Availability {
  day_of_week: string;
  start_time: string;
  end_time: string;
  name?: string;
}

interface SelectedSlot {
  startTime: string;
  endTime: string;
  price: number;
}

interface BookingFormData {
  expertId: string;
  date: string;
  selectedSlot: SelectedSlot | null;
  sessionType: 'audio';
}

interface BookingSlot {
  id?: string;
  expert_id: string;
  seeker_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed';
  session_type: 'audio';
  created_at?: string;
  seeker_name?: string;
}

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const ExpertProfileContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<Availability | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingFormData>({
    expertId: expert?.id || '',
    date: '',
    selectedSlot: null,
    sessionType: 'audio' as const
  });
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [isBooking, setIsBooking] = useState(false);
  const [existingBookings, setExistingBookings] = useState<BookingSlot[]>([]);

  const fetchExpert = async (id: string) => {
    try {
      setLoading(true);
      console.log("Fetching expert profile...");

      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_BASE_URL}/api/experts/profiles/${id}`);
      console.log("Response status:", response.status);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Expert with ID " + id + " not found");
        } else {
          throw new Error("Failed to fetch expert (Status: " + response.status + ")");
        }
      }

      const data = await response.json();
      console.log("Fetched expert data:", data);

      if (data.success && data.data) {
        setExpert(data.data);
      } else {
        throw new Error(data.message ? data.message : "No expert found");
      }
    } catch (err) {
      console.error("Error fetching expert:", err);
      setError(err instanceof Error ? err.message : "Failed to load expert profile");
    } finally {
      setLoading(false);
    }
  };

  // Update the fetchAvailability function
  const fetchAvailability = async (userId: string) => {
    try {
      setAvailabilityLoading(true);
      setAvailabilityError(null);

      // Get user data from localStorage
      const userData = localStorage.getItem('user');
      if (!userData) {
        // Redirect to /auth/seeker instead of /seeker
        navigate('/auth/seeker', { 
          state: { 
            from: `/expert/${id}`,
            message: 'Please login to view expert availability' 
          } 
        });
        throw new Error("Please login to view availability");
      }

      let parsedUserData;
      try {
        parsedUserData = JSON.parse(userData);
      } catch (err) {
        localStorage.removeItem('user');
        // Update navigation to /auth/seeker
        navigate('/auth/seeker');
        throw new Error("Invalid user data");
      }

      const token = parsedUserData.token || parsedUserData.accessToken;
      if (!token) {
        localStorage.removeItem('user');
        navigate('/login');
        throw new Error("Authentication token not found");
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_BASE_URL}/api/experts/availability/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token.trim()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Clear invalid token and redirect to login
          localStorage.removeItem('user');
          navigate('/login', { 
            state: { 
              from: `/expert/${id}`,
              message: 'Your session has expired. Please login again.' 
            } 
          });
          throw new Error("Your session has expired. Please login again.");
        }
        throw new Error(`Failed to fetch availability (Status: ${response.status})`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch availability");
      }

      setAvailability(data.data || []);
    } catch (err) {
      console.error("Error fetching availability:", err);
      setAvailabilityError(err instanceof Error ? err.message : "Failed to load availability");
      
      // Show toast notification
      toast({
        title: "Authentication Required",
        description: err instanceof Error ? err.message : "Please login to view expert availability",
        variant: "destructive"
      });
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const openDrawer = () => {
    if (!expert?.user_id) {
      console.error("No user_id available for this expert");
      return;
    }

    // Check if user is logged in before opening drawer
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/auth/seeker', { 
        state: { 
          from: `/expert/${id}`,
          message: 'Please login to schedule a meeting' 
        } 
      });
      return;
    }

    console.log("Opening drawer for user_id:", expert.user_id);
    fetchAvailability(expert.user_id);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const formatTime = (time24: string) => {
    if (!time24 || !time24.includes(':')) return time24;
    
    const [hourStr, minute] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour} ${ampm}`;
  };

  const groupedAvailability = useMemo(() => {
    return daysOfWeek.map(day => ({
      day,
      slots: availability.filter(a => a.day_of_week.toLowerCase() === day.toLowerCase()),
    }));
  }, [availability]);

  const fetchExistingBookings = async (expertId: string) => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        console.log("User not authenticated");
        return;
      }

      const parsedUserData = JSON.parse(userData);
      const token = parsedUserData.token || parsedUserData.accessToken;
      
      if (!token) {
        console.log("No auth token found");
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_BASE_URL}/api/bookings/expert/${expertId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Clear invalid token and redirect to login
          localStorage.removeItem('user');
          navigate('/login', {
            state: { 
              returnUrl: `/expert/${id}`,
              message: 'Your session has expired. Please login again.'
            }
          });
          return;
        }
        throw new Error(`Failed to fetch bookings: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setExistingBookings(data.data);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const getSlotBookingStatus = (day: string, startTime: string, endTime: string): { 
    isBooked: boolean; 
    status?: string; 
    message?: string;
    bookingDetails?: {
      sessionType: string;
      seekerName: string;
      status: string;
    };
  } => {
    const today = new Date();
    const dayIndex = daysOfWeek.indexOf(day);
    const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
    
    const daysToAdd = dayIndex >= currentDayIndex 
      ? dayIndex - currentDayIndex 
      : 7 - (currentDayIndex - dayIndex);
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
    
    const dateString = targetDate.toISOString().split('T')[0];
    
    const slotStartTime = convertTo24Hour(startTime);
    const slotEndTime = convertTo24Hour(endTime);
    
    // Find any overlapping booking regardless of session type
    const overlappingBooking = existingBookings.find(booking => {
      const bookingStart = convertTo24Hour(booking.start_time);
      const bookingEnd = convertTo24Hour(booking.end_time);
      
      // Check if the booking is for the same date and has any overlap
      return booking.date === dateString && (
        (bookingStart <= slotStartTime && bookingEnd > slotStartTime) ||
        (bookingStart < slotEndTime && bookingEnd >= slotEndTime) ||
        (slotStartTime <= bookingStart && slotEndTime >= bookingEnd)
      );
    });
    
    if (overlappingBooking) {
      // If the booking is completed, allow new bookings
      if (overlappingBooking.status === 'completed') {
        return { isBooked: false };
      }
      
      // For any other status, the slot is booked
      let message = "This time slot is ";
      if (overlappingBooking.status === 'pending') {
        message += `pending approval for a ${overlappingBooking.session_type} session by ${overlappingBooking.seeker_name || 'another seeker'}. Please choose a different time.`;
      } else if (overlappingBooking.status === 'confirmed') {
        message += `already booked for a ${overlappingBooking.session_type} session by ${overlappingBooking.seeker_name || 'another seeker'}. Please choose a different time.`;
      } else if (overlappingBooking.status === 'rejected' || overlappingBooking.status === 'cancelled') {
        return { isBooked: false }; // Allow booking if previous booking was rejected/cancelled
      }
      
      return {
        isBooked: true,
        status: overlappingBooking.status,
        message,
        bookingDetails: {
          sessionType: overlappingBooking.session_type,
          seekerName: overlappingBooking.seeker_name || 'Another seeker',
          status: overlappingBooking.status
        }
      };
    }
    
    return { isBooked: false };
  };

  // Helper to convert 12-hour time with AM/PM to 24-hour "HH:mm"
  const convertTo24Hour = (time12h: string): string => {
    if (!time12h) return '';
    const match = time12h.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
    if (!match) return time12h; // Return as is if format doesn't match
    let [_, hourStr, minuteStr, meridian] = match;
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr;
    if (meridian.toUpperCase() === 'PM' && hour < 12) hour += 12;
    if (meridian.toUpperCase() === 'AM' && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  };

  const handleSelectSlot = (day: string, slot: Availability) => {
    const bookingStatus = getSlotBookingStatus(day, slot.start_time, slot.end_time);
    
    if (bookingStatus.isBooked) {
      toast({
        title: "Time Slot Unavailable",
        description: bookingStatus.message,
        variant: "destructive"
      });
      return;
    }
    
    setSelectedDay(day);
    setSelectedSlot(slot);
    
    // Convert day name to date for the current week
    const today = new Date();
    const dayIndex = daysOfWeek.indexOf(day);
    const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
    
    const daysToAdd = dayIndex >= currentDayIndex 
      ? dayIndex - currentDayIndex 
      : 7 - (currentDayIndex - dayIndex);
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
    
    const dateString = targetDate.toISOString().split('T')[0];
    
    // Initialize booking form with empty selected slots
    setBookingForm({
      expertId: expert?.user_id || '',
      date: dateString,
      selectedSlot: null,
      sessionType: 'audio' as const
    });
    
    setBookingDialogOpen(true);
  };

  const calculateSlotPrice = (startTime: string, endTime: string, sessionType: 'audio'): number => {
    if (!expert) return 0;
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let durationHours = endHour - startHour;
    const durationMinutes = endMinute - startMinute;
    durationHours += durationMinutes / 60;
    
    // Only use audio pricing since that's the only available session type
    const hourlyRate = expert.audio_pricing || 0;
    
    return hourlyRate * durationHours;
  };

  const handleBookingFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'sessionType') {
      setBookingForm(prev => ({
        ...prev,
        sessionType: 'audio' as const,
        selectedSlot: prev.selectedSlot ? {
          ...prev.selectedSlot,
          price: calculateSlotPrice(prev.selectedSlot.startTime, prev.selectedSlot.endTime, 'audio' as const)
        } : null
      }));
    } else if (name === 'date') {
      setBookingForm(prev => ({
        ...prev,
        date: value,
        selectedSlot: null
      }));
    }
  };

  // Update the generateTimeSlots function to support 24-hour slots
  const generateTimeSlots = (startTime: string, endTime: string): string[] => {
    const slots: string[] = [];
    const start = convertTo24Hour(startTime);
    const end = convertTo24Hour(endTime);
    
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    // Handle case where end time is on the next day
    const isNextDay = endHour < startHour || (endHour === startHour && endMinute < startMinute);
    const maxHour = isNextDay ? endHour + 24 : endHour;
    
    while (currentHour < maxHour || (currentHour === maxHour && currentMinute < endMinute)) {
      const slotStart = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // Add one hour
      currentHour += 1;
      if (currentHour >= 24) currentHour = 0;
      
      const slotEnd = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // Only add slot if it's within the availability window
      if (slotEnd <= end || (isNextDay && currentHour <= endHour)) {
        slots.push(slotStart);
      }
    }
    
    return slots;
  };

  const handleSlotClick = (startTime: string) => {
    const endTime = startTime.split(':').map(Number);
    endTime[0] = (endTime[0] + 1) % 24;
    const endTimeStr = `${endTime[0].toString().padStart(2, '0')}:${endTime[1].toString().padStart(2, '0')}`;
    
    const slotPrice = calculateSlotPrice(startTime, endTimeStr, bookingForm.sessionType);
    const newSlot = { startTime, endTime: endTimeStr, price: slotPrice };
    
    setBookingForm(prev => {
      // If clicking the same slot, deselect it
      if (prev.selectedSlot?.startTime === startTime && prev.selectedSlot?.endTime === endTimeStr) {
        return {
          ...prev,
          selectedSlot: null
        };
      }
      
      // Otherwise, select the new slot
      return {
        ...prev,
        selectedSlot: newSlot
      };
    });
  };

  // Update the BookingTimeSelect component to show better UI for booked slots
  const BookingTimeSelect = ({ 
    date,
    label,
    name,
    className 
  }: { 
    date: string;
    label: string;
    name: string;
    className?: string;
  }) => {
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const daySlots = availability.filter(a => a.day_of_week.toLowerCase() === dayOfWeek.toLowerCase());
    
    // Generate all possible time slots for the day
    const allTimeSlots = daySlots.flatMap(slot => 
      generateTimeSlots(slot.start_time, slot.end_time)
    );
    
    if (allTimeSlots.length === 0) {
      return (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor={name} className="text-right">
            {label}
          </Label>
          <div className="col-span-3 text-sm text-muted-foreground">
            No available time slots for this date
          </div>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={name} className="text-right pt-2">
          {label}
        </Label>
        <div className="col-span-3">
          <div className="border rounded-lg p-4 bg-card">
            <div className="grid grid-cols-4 gap-3">
              {allTimeSlots.map((startTime) => {
                const endTime = startTime.split(':').map(Number);
                endTime[0] = (endTime[0] + 1) % 24;
                const endTimeStr = `${endTime[0].toString().padStart(2, '0')}:${endTime[1].toString().padStart(2, '0')}`;
                
                const bookingStatus = getSlotBookingStatus(dayOfWeek, formatTime(startTime), formatTime(endTimeStr));
                const isSelected = bookingForm.selectedSlot?.startTime === startTime && 
                                 bookingForm.selectedSlot?.endTime === endTimeStr;
                
                // If slot is booked, render a disabled div with detailed booking info
                if (bookingStatus.isBooked) {
                  return (
                    <div 
                      key={startTime} 
                      className="relative group cursor-not-allowed"
                      title={bookingStatus.message}
                    >
                      <div className="w-full min-h-[3.5rem] px-3 py-2 text-sm rounded-lg border bg-muted/50 text-muted-foreground border-muted flex items-center justify-center">
                        <span className="font-medium text-center leading-tight">
                          {formatTime(startTime)} - {formatTime(endTimeStr)}
                        </span>
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity p-2">
                        <span className="text-xs text-center font-medium mb-1">
                          {bookingStatus.status === 'pending' ? 'Pending Approval' : 'Booked'}
                        </span>
                        {bookingStatus.bookingDetails && (
                          <>
                            <span className="text-xs text-center">
                              {bookingStatus.bookingDetails.sessionType} Session
                            </span>
                            <span className="text-xs text-center text-muted-foreground">
                              by {bookingStatus.bookingDetails.seekerName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                }
                
                // If slot is available, render a clickable button
                return (
                  <div key={startTime} className="relative group">
                    <button
                      type="button"
                      onClick={() => handleSlotClick(startTime)}
                      className={`w-full min-h-[3.5rem] px-3 py-2 text-sm rounded-lg border transition-all flex items-center justify-center
                        ${isSelected
                          ? 'bg-primary/10 text-primary border-primary hover:bg-primary/20'
                          : 'bg-background hover:bg-accent/50 hover:text-accent-foreground border-input'
                        }
                        ${className || ''}
                      `}
                    >
                      <span className="font-medium text-center leading-tight">
                        {formatTime(startTime)} - {formatTime(endTimeStr)}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Update handleSubmitBooking to include seeker name
  const handleSubmitBooking = async () => {
    try {
      if (!bookingForm.selectedSlot) return;
      
      setIsBooking(true);
      
      // Get API URL
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      
      // Get user data from localStorage
      const userData = localStorage.getItem('user');
      if (!userData) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to book a session",
          variant: "destructive"
        });
        return;
      }
      
      // Parse user data
      let parsedUserData;
      try {
        parsedUserData = JSON.parse(userData);
      } catch (e) {
        console.error("Error parsing user data:", e);
        toast({
          title: "Error",
          description: "Invalid user data format",
          variant: "destructive"
        });
        return;
      }
      
      // Get token and user info
      const token = parsedUserData.token;
      const seekerName = `${parsedUserData.first_name || ''} ${parsedUserData.last_name || ''}`.trim();
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Authentication token not found",
          variant: "destructive"
        });
        return;
      }

      // Double check if the slot is still available before booking
      const dayOfWeek = new Date(bookingForm.date).toLocaleDateString('en-US', { weekday: 'long' });
      const bookingStatus = getSlotBookingStatus(
        dayOfWeek,
        bookingForm.selectedSlot.startTime,
        bookingForm.selectedSlot.endTime
      );

      if (bookingStatus.isBooked) {
        toast({
          title: "Time Slot Unavailable",
          description: bookingStatus.message || "This time slot has just been booked by someone else. Please choose a different time.",
          variant: "destructive"
        });
        setBookingDialogOpen(false);
        // Refresh bookings to update UI
        if (expert?.user_id) {
          await fetchExistingBookings(expert.user_id);
        }
        return;
      }
      
      // Create booking payload with seeker name
      const payload = {
        expert_id: expert?.user_id,
        seeker_id: parsedUserData.user_id || parsedUserData.id || '',
        seeker_name: seekerName,
        date: bookingForm.date,
        start_time: bookingForm.selectedSlot.startTime,
        end_time: bookingForm.selectedSlot.endTime,
        session_type: bookingForm.sessionType,
        amount: bookingForm.selectedSlot.price
      };
      
      // Make the booking request
      const response = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // Slot was booked by someone else while we were trying to book
          toast({
            title: "Time Slot Unavailable",
            description: data.message || "This time slot has just been booked by someone else. Please choose a different time.",
            variant: "destructive"
          });
          // Refresh bookings to update UI
          if (expert?.user_id) {
            await fetchExistingBookings(expert.user_id);
          }
        } else {
          toast({
            title: "Booking Failed",
            description: data.message || "Failed to create booking. Please try again.",
            variant: "destructive"
          });
        }
        setBookingDialogOpen(false);
        return;
      }

      // Success case
      toast({
        title: "Booking Request Sent",
        description: "Your booking request has been sent to the expert for approval.",
      });

      // Refresh existing bookings to update the UI
      if (expert?.user_id) {
        await fetchExistingBookings(expert.user_id);
      }

      // Reset form and close dialog
      setBookingForm({
        expertId: expert?.user_id || '',
        date: '',
        selectedSlot: null,
        sessionType: 'audio' as const
      });
      setBookingDialogOpen(false);

    } catch (error) {
      console.error("Error creating booking:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsBooking(false);
    }
  };

  // Check authentication status before fetching data
  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem('user');
      if (!userData && id) {
        navigate('/auth/seeker', {
          state: { 
            returnUrl: `/expert/${id}`,
            message: 'Please login to view expert details'
          }
        });
        return false;
      }
      return true;
    };

    if (id && checkAuth()) {
      fetchExpert(id);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (expert?.user_id) {
      fetchExistingBookings(expert.user_id);
    }
  }, [expert]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 text-center">
          <p className="text-xl">Loading expert profile...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !expert) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 text-center">
          <h2 className="text-2xl font-bold">Expert not found</h2>
          <p className="text-foreground">{error}</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="relative pt-24 pb-16 overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Main Profile Card */}
            <div className="bg-card rounded-xl p-8 shadow-lg border border-border/50">
              {/* Info Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* About & Expertise */}
                <div className="md:col-span-2 space-y-6">
                  {/* About Section */}
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-4xl font-semibold text-primary border-2 border-primary/20 flex-shrink-0 mb-2">
                      {expert?.first_name[0]}{expert?.last_name[0]}
                    </div>
                    <h1 className="text-3xl font-display font-bold mb-2 text-primary">
                      {expert?.first_name} {expert?.last_name}
                    </h1>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">About</h3>
                    <p className="mb-2">{expert?.last_name} With {expert?.work_experience} years of experience in {expert?.expertise}, 
                      I specialize in providing expert guidance in {expert?.areas_of_help}.</p>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">Organization and Location</h3>
                    <p> {expert?.current_organization} , {expert?.location}.</p>
                  </div>

                  {/* Expertise Tags */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Areas of Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                      {expert?.expertise.split(',').map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full"
                        >
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side Cards */}
                <div className="space-y-6">
                  {/* Pricing Card */}
                  <div className="bg-secondary/20 rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Consultation Pricing</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FaVideo className="w-4 h-4 text-primary" />
                          <span className="text-sm">Video Call</span>
                        </div>
                        <span className="font-medium">${expert?.video_pricing}/hr</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FaPhone className="w-4 h-4 text-primary" />
                          <span className="text-sm">Audio Call</span>
                        </div>
                        <span className="font-medium">${expert?.audio_pricing}/hr</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FaComments className="w-4 h-4 text-primary" />
                          <span className="text-sm">Chat</span>
                        </div>
                        <span className="font-medium">${expert?.chat_pricing}/hr</span>
                      </div>
                    </div>
                  </div>

                  {/* Availability Card */}
                  <div className="bg-secondary/20 rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Availability</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Next Available</span>
                        <span className="text-primary font-medium">
                          {availability.length > 0 ? 
                            `${availability[0].day_of_week}, ${formatTime(availability[0].start_time)}` : 
                            "Check schedule"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Typical Response</span>
                        <span className="text-primary font-medium">Within 24 hours</span>
                      </div>
                      <Button 
                        className="w-full mt-4" 
                        size="sm" 
                        onClick={openDrawer}
                        disabled={!expert?.user_id}
                      >
                        Schedule Meeting
                      </Button>
                    </div>
                  </div> 
                </div>
              </div>
            </div>

            {/* Availability Drawer */}
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerContent className="max-w-md mx-auto">
                <DrawerHeader className="border-b pb-4">
                  <DrawerTitle className="text-xl font-semibold flex items-center justify-between">
                    {expert?.first_name}'s Availability
                    <DrawerClose className="rounded-full p-1 hover:bg-muted">
                      <span className="sr-only">Close</span>
                      <span aria-hidden="true" className="text-xl">&times;</span>
                    </DrawerClose>
                  </DrawerTitle>
                  <DrawerDescription className="text-sm text-muted-foreground mt-1">
                    Select a time slot to schedule a meeting
                  </DrawerDescription>
                </DrawerHeader>
                
              <div className="p-4 relative max-h-[60vh] overflow-y-auto">
                {availabilityLoading && (
                  <div className="py-8 text-center">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading availability...</p>
                  </div>
                )}
                
                {availabilityError && (
                  <div className="py-8 text-center">
                    <p className="text-red-500 text-sm">{availabilityError}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => expert?.user_id && fetchAvailability(expert.user_id)}
                    >
                      Try Again
                    </Button>
                  </div>
                )}
                
                {!availabilityLoading && !availabilityError && (
                  <div className="space-y-6">
                    {groupedAvailability.map(({ day, slots }) => (
                      <div key={day} className="border-b pb-4 last:border-0">
                        <h4 className="font-semibold mb-2">{day}</h4>
                        {slots.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No availability</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {slots.map((slot, index) => {
                              const startTimeFormatted = slot.start_time.includes('AM') || slot.start_time.includes('PM') 
                                ? slot.start_time 
                                : formatTime(slot.start_time);
                              
                              const endTimeFormatted = slot.end_time.includes('AM') || slot.end_time.includes('PM')
                                ? slot.end_time
                                : formatTime(slot.end_time);
                              
                              const bookingStatus = getSlotBookingStatus(day, slot.start_time, slot.end_time);
                              
                              // Don't show the slot if it's booked
                              if (bookingStatus.isBooked) {
                                return null;
                              }
                              
                              return (
                                <Button 
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  className="justify-start text-left h-auto py-2"
                                  onClick={() => handleSelectSlot(day, slot)}
                                >
                                  <span className="text-primary font-medium">
                                    {startTimeFormatted} - {endTimeFormatted}
                                  </span>
                                </Button> 
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {availability.length === 0 && !availabilityLoading && (
                      <div className="py-8 text-center">
                        <p className="text-muted-foreground">No availability slots found for this expert.</p>
                      </div>
                    )}
                  </div>
                )}
                <div className="pt-4 border-t flex justify-end bg-background">
                  <Button
                    variant="outline"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>
      <Footer />
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Book a Session</DialogTitle>
            <DialogDescription>
              Schedule a session with {expert?.first_name} {expert?.last_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={bookingForm.date}
                onChange={(e) => setBookingForm(prev => ({ 
                  ...prev, 
                  date: e.target.value,
                  selectedSlot: null // Clear selected slot when date changes
                }))}
                className="col-span-3"
                readOnly
              />
            </div>
            
            <BookingTimeSelect
              date={bookingForm.date}
              label="Available Time Slots"
              name="timeSlots"
            />
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sessionType" className="text-right">
                Session Type
              </Label>
              <div className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                Audio Call (${expert?.audio_pricing}/hr)
              </div>
            </div>

            {bookingForm.selectedSlot && (
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right font-medium">Total Price</span>
                <div className="col-span-3 text-lg font-bold text-primary">
                  ${bookingForm.selectedSlot.price.toFixed(2)}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitBooking} 
              disabled={isBooking || !bookingForm.selectedSlot}
            >
              {isBooking ? "Booking..." : "Book Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ExpertProfile = () => {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div role="alert" className="p-4 bg-red-100 text-red-700 rounded">
          <p>Something went wrong:</p>
          <pre className="whitespace-pre-wrap">{error.message}</pre>
          <button
            onClick={resetErrorBoundary}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded"
          >
            Try again
          </button>
        </div>
      )}
    >
      <ExpertProfileContent />
    </ErrorBoundary>
  );
};

export default ExpertProfile;
