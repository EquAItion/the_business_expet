import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Clock } from 'lucide-react';

interface AvailabilityData {
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface AvailabilitySectionProps {
  selectedDay: string | undefined;
  setSelectedDay: (day: string) => void;
  startTime: string;
  endTime: string;
  onTimeChange: (type: 'start' | 'end', value: string) => void;
  onUpdateAvailability: () => void;
  WEEKDAYS: string[];
  TIME_OPTIONS: string[];
}

const AvailabilitySection: React.FC<AvailabilitySectionProps> = ({
  selectedDay,
  setSelectedDay,
  startTime,
  endTime,
  onTimeChange,
  onUpdateAvailability,
  WEEKDAYS,
  TIME_OPTIONS,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Function to fetch availability data
  const fetchAvailabilityData = async () => {
    setIsLoading(true);
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        return;
      }

      const parsedUserData = JSON.parse(userData);
      const token = parsedUserData.token || parsedUserData.accessToken;
      const id = parsedUserData.id || parsedUserData.user_id;

      if (!token || !id) {
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_BASE_URL}/api/experts/availability/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token.trim()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch availability data');
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setAvailabilityData(data.data);
      }
    } catch (error) {
      console.error('Error fetching availability data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch availability data on component mount
  useEffect(() => {
    fetchAvailabilityData();
  }, []);

  const handleUpdateAvailability = async () => {
    if (!selectedDay) {
      toast({
        title: "Error",
        description: "Please select a day of the week",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
      // Get auth data from localStorage
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('Authentication information missing');
      }

      const parsedUserData = JSON.parse(userData);
      const token = parsedUserData.token || parsedUserData.accessToken;
      const id = parsedUserData.id || parsedUserData.user_id;
      const name = parsedUserData.name || 
                  (parsedUserData.first_name && parsedUserData.last_name ? 
                    `${parsedUserData.first_name} ${parsedUserData.last_name}` : 
                    'Expert User');

      if (!token || !id) {
        throw new Error('Authentication information incomplete');
      }

      // Make API call to update availability
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_BASE_URL}/api/experts/availability/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.trim()}`
        },
        body: JSON.stringify({
          day_of_week: selectedDay,
          start_time: startTime,
          end_time: endTime,
          name: name
        })
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        throw new Error(`Failed to update availability: ${responseText}`);
      }

      const result = responseText ? JSON.parse(responseText) : {};

      toast({
        title: "Success",
        description: `Availability for ${selectedDay} updated successfully`,
      });

      // Refresh availability data
      fetchAvailabilityData();

      // Call parent component's function
      onUpdateAvailability();
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update availability",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      {/* Availability Update Card */}
      <div className="col-span-1 space-y-3 bg-card p-4 rounded-lg border">
        <h3 className="font-medium text-sm flex justify-between items-center">
          Set Weekly Availability
        </h3>
        {/* Day Selection */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Select day of week:</p>
          <div className="flex justify-between gap-1">
            {WEEKDAYS.map((day) => (
              <Button
                key={day}
                variant={selectedDay === day ? 'default' : 'outline'}
                size="sm"
                className="h-9 w-9 p-0 rounded-full"
                onClick={() => setSelectedDay(day)}
              >
                {day[0]}
              </Button>
            ))}
          </div>
        </div>
        {/* Time Range Selection */}
        {selectedDay && (
          <div className="space-y-2 mt-4">
            <p className="text-xs text-muted-foreground">Set available hours for {selectedDay}:</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Start Time</p>
                <Select value={startTime} onValueChange={(value) => onTimeChange('start', value)}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder="Start Time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={`start-${time}`} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">End Time</p>
                <Select value={endTime} onValueChange={(value) => onTimeChange('end', value)}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder="End Time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.slice(TIME_OPTIONS.indexOf(startTime) + 1).map((time) => (
                      <SelectItem key={`end-${time}`} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
        <Button 
          size="sm" 
          className="w-full text-sm mt-4" 
          onClick={handleUpdateAvailability} 
          disabled={!selectedDay || isUpdating}
        >
          {isUpdating ? "Updating..." : "Update Availability"}
        </Button>
      </div>

      {/* Current Schedule Card */}
      <div className="col-span-1 space-y-3 bg-card p-4 rounded-lg border mt-4">
        <h3 className="font-medium text-sm flex justify-between items-center">
          Your Current Schedule
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-xs"
            onClick={fetchAvailabilityData}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
        </h3>
        
        {isLoading ? (
          <div className="py-4 text-center">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-xs text-muted-foreground mt-2">Loading schedule...</p>
          </div>
        ) : availabilityData.length > 0 ? (
          <div className="space-y-2">
            {availabilityData.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-muted last:border-0">
                <div>
                  <p className="font-medium text-sm">{item.day_of_week}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={12} />
                    {item.start_time} - {item.end_time}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2"
                  onClick={() => {
                    setSelectedDay(item.day_of_week);
                    const startIdx = TIME_OPTIONS.indexOf(item.start_time);
                    onTimeChange('start', item.start_time);
                    onTimeChange('end', item.end_time);
                  }}
                >
                  Edit
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground">No availability schedule found.</p>
            <p className="text-xs text-muted-foreground mt-1">Add your first schedule above.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default AvailabilitySection;