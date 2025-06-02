import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from "react-router-dom";
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
import { toast } from "../components/ui/use-toast";

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

interface BookingFormData {
  expertId: string;
  date: string;
  startTime: string;
  endTime: string;
  sessionType: 'video' | 'audio' | 'chat';
}

interface BookingSlot {
  id?: string;
  expert_id: string;
  seeker_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed';
  session_type: 'video' | 'audio' | 'chat';
  created_at?: string;
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
    expertId: '',
    date: '',
    startTime: '',
    endTime: '',
    sessionType: 'video'
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

  const fetchAvailability = async (userId: string) => {
    try {
      setAvailabilityLoading(true);
      setAvailabilityError(null);

      const API_BASE_URL = import.meta.env.VITE_API_URL;
      
      // Get user data from localStorage if available
      let authToken = null;
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const parsedUserData = JSON.parse(userData);
          authToken = parsedUserData.token || parsedUserData.accessToken;
        } catch (e) {
          console.error("Error parsing user data from localStorage:", e);
        }
      }
      
      // Prepare headers
      const headers: HeadersInit = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken.trim()}`;
      }
      
      // Make the request
      const response = await fetch(`${API_BASE_URL}/api/experts/availability/${userId}`, {
        headers
      });
      
      console.log("Availability response status:", response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required to view availability");
        } else {
          throw new Error("Failed to fetch availability (Status: " + response.status + ")");
        }
      }
      
      const data = await response.json();
      console.log("Availability data:", data);
      
      if (data.success && Array.isArray(data.data)) {
        // Sort availability by day of week
        const sortedAvailability = [...data.data].sort((a, b) => {
          const dayOrder = {
            'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4,
            'Friday': 5, 'Saturday': 6, 'Sunday': 7
          };
          return dayOrder[a.day_of_week] - dayOrder[b.day_of_week];
        });
        
        setAvailability(sortedAvailability);
      } else {
        throw new Error(data.message || "No availability data found");
      }
    } catch (err) {
      console.error("Error fetching availability:", err);
      setAvailabilityError(err instanceof Error ? err.message : "Failed to load availability");
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const openDrawer = () => {
    if (expert?.user_id) {
      console.log("Opening drawer for user_id:", expert.user_id);
      fetchAvailability(expert.user_id);
      setIsDrawerOpen(true);
    } else {
      console.error("No user_id available for this expert");
    }
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
    return `${hour}:${minute} ${ampm}`;
  };

  const groupedAvailability = useMemo(() => {
    return daysOfWeek.map(day => ({
      day,
      slots: availability.filter(a => a.day_of_week.toLowerCase() === day.toLowerCase()),
    }));
  }, [availability]);

  const fetchExistingBookings = async (expertId: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const userData = localStorage.getItem('user');
      
      if (!userData) {
        console.error("User data not found in localStorage");
        return;
      }
      
      const parsedUserData = JSON.parse(userData);
      const token = parsedUserData.token || parsedUserData.accessToken;
      
      if (!token) {
        console.error("Auth token not found");
        return;
      }
      
      console.log(`Fetching bookings from: ${API_BASE_URL}/api/bookings/expert/${expertId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/bookings/expert/${expertId}`, {
        headers: {
          'Authorization': `Bearer ${token.trim()}`
        }
      });
      
      console.log("Bookings response status:", response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          // No bookings found is not an error
          console.log("No bookings found for this expert");
          setExistingBookings([]);
          return;
        }
        throw new Error(`Failed to fetch bookings: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Bookings data:", data);
      
      if (data.success && Array.isArray(data.data)) {
        setExistingBookings(data.data);
      } else {
        setExistingBookings([]);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      // Don't show an error toast for this, just log it
    }
  };

  const isSlotBooked = (day: string, startTime: string, endTime: string): boolean => {
    // Convert day name to date for the current week
    const today = new Date();
    const dayIndex = daysOfWeek.indexOf(day);
    const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1; // Convert Sunday=0 to Monday=0 format
    
    const daysToAdd = dayIndex >= currentDayIndex 
      ? dayIndex - currentDayIndex 
      : 7 - (currentDayIndex - dayIndex);
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
    
    const dateString = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    return existingBookings.some(booking => 
      booking.date === dateString &&
      ((booking.start_time <= startTime && booking.end_time > startTime) ||
       (booking.start_time < endTime && booking.end_time >= endTime) ||
       (startTime <= booking.start_time && endTime >= booking.end_time))
    );
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
    
    const dateString = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    setBookingForm({
      expertId: expert?.user_id || '',
      date: dateString,
      startTime: convertTo24Hour(slot.start_time),
      endTime: convertTo24Hour(slot.end_time),
      sessionType: 'video'
    });
    
    // Calculate initial price
    calculatePrice(convertTo24Hour(slot.start_time), convertTo24Hour(slot.end_time), 'video');
    
    setBookingDialogOpen(true);
  };

  const calculatePrice = (startTime: string, endTime: string, sessionType: 'video' | 'audio' | 'chat') => {
    if (!expert) return;
    
    // Parse times to calculate duration in hours
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let durationHours = endHour - startHour;
    const durationMinutes = endMinute - startMinute;
    
    durationHours += durationMinutes / 60;
    
    // Get hourly rate based on session type
    let hourlyRate = 0;
    switch (sessionType) {
      case 'video':
        hourlyRate = expert.video_pricing || 0;
        break;
      case 'audio':
        hourlyRate = expert.audio_pricing || 0;
        break;
      case 'chat':
        hourlyRate = expert.chat_pricing || 0;
        break;
    }
    
    const totalPrice = hourlyRate * durationHours;
    setCalculatedPrice(totalPrice);
  };

  const handleBookingFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    const updatedForm = {
      ...bookingForm,
      [name]: value
    };
    
    setBookingForm(updatedForm);
    
    // Recalculate price when time or session type changes
    if (name === 'startTime' || name === 'endTime' || name === 'sessionType') {
      calculatePrice(
        name === 'startTime' ? value : bookingForm.startTime,
        name === 'endTime' ? value : bookingForm.endTime,
        name === 'sessionType' ? value as 'video' | 'audio' | 'chat' : bookingForm.sessionType
      );
    }
  };

  const handleSubmitBooking = async () => {
    try {
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
      
      // Get token
      const token = parsedUserData.token;
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Authentication token not found",
          variant: "destructive"
        });
        return;
      }
      
      // Prepare request payload
      const payload = {
        expert_id: expert?.user_id,
        seeker_id: parsedUserData.user_id || parsedUserData.id || '',
        date: bookingForm.date,
        start_time: bookingForm.startTime,
        end_time: bookingForm.endTime,
        session_type: bookingForm.sessionType,
        amount: calculatedPrice
      };
      
      // Make the request
      const response = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to book session";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          if (errorText) errorMessage = errorText;
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      toast({
        title: "Success",
        description: "Session booked successfully! The expert will be notified.",
      });
      
      setBookingDialogOpen(false);
      
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Failed to book session",
        variant: "destructive"
      });
    } finally {
      setIsBooking(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchExpert(id);
    } else {
      setError("Expert ID is missing");
      setLoading(false);
    }
  }, [id]);

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
                              // Check if the time already includes AM/PM
                              const startTimeFormatted = slot.start_time.includes('AM') || slot.start_time.includes('PM') 
                                ? slot.start_time 
                                : formatTime(slot.start_time);
                              
                              const endTimeFormatted = slot.end_time.includes('AM') || slot.end_time.includes('PM')
                                ? slot.end_time
                                : formatTime(slot.end_time);
                              
                              const isBooked = isSlotBooked(day, slot.start_time, slot.end_time);
                              
                              return (
                                <Button 
                                  key={index}
                                  variant={isBooked ? "secondary" : "outline"}
                                  size="sm"
                                  className={`justify-start text-left h-auto py-2 ${isBooked ? 'opacity-50' : ''}`}
                                  disabled={isBooked}
                                  onClick={() => !isBooked && handleSelectSlot(day, slot)}
                                >
                                  <span className={`${isBooked ? 'text-muted-foreground' : 'text-primary'} font-medium`}>
                                    {startTimeFormatted} - {endTimeFormatted}
                                    {isBooked && <span className="ml-2 text-xs">(Booked)</span>}
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
        <DialogContent className="sm:max-w-[425px]">
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
                onChange={handleBookingFormChange}
                className="col-span-3"
                readOnly
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">
                Start Time
              </Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                value={bookingForm.startTime}
                onChange={handleBookingFormChange}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">
                End Time
              </Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                value={bookingForm.endTime}
                onChange={handleBookingFormChange}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sessionType" className="text-right">
                Session Type
              </Label>
              <select
                id="sessionType"
                name="sessionType"
                value={bookingForm.sessionType}
                onChange={handleBookingFormChange}
                aria-label="Session Type"
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="video">Video Call (${expert?.video_pricing}/hr)</option>
                <option value="audio">Audio Call (${expert?.audio_pricing}/hr)</option>
                <option value="chat">Chat (${expert?.chat_pricing}/hr)</option>
              </select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right font-medium">Total Price</span>
              <div className="col-span-3 text-lg font-bold text-primary">
                ${calculatedPrice.toFixed(2)}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitBooking} disabled={isBooking}>
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
