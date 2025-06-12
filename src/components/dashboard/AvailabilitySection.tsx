import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Clock } from 'lucide-react';

interface ExpertAvailability {
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface AvailabilitySectionProps {
  selectedDay: string;
  setSelectedDay: (day: string) => void;
  startTime: string;
  endTime: string;
  onTimeChange: (type: 'start' | 'end', value: string) => void;
  onUpdateAvailability: () => void;
  WEEKDAYS: string[];
  TIME_OPTIONS: string[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const AvailabilitySection: React.FC<AvailabilitySectionProps> = ({
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
  const [availabilityData, setAvailabilityData] = useState<ExpertAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Update the fetchAvailability function
  const fetchAvailability = async () => {
    try {
      setIsLoading(true);
      const userData = localStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);
      const token = user.token || user.accessToken;
      const id = user.id;

      if (!token || !id) return;

      console.log('🔍 Fetching availability for expert:', id);

      const response = await fetch(`${API_BASE_URL}/api/experts/availability/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch availability');
      }

      if (Array.isArray(result.data)) {
        console.log('✅ Found availability slots:', result.data.length);
        setAvailabilityData(result.data);
      }

    } catch (error) {
      console.error('❌ Error fetching availability:', error);
      toast({
        title: "Error",
        description: "Failed to load availability schedule",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update the handleUpdateAvailability function
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
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('Please log in again');
      }

      const user = JSON.parse(userData);
      const token = user.token || user.accessToken;
      const id = user.id;
      const name = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();

      if (!token || !id) {
        throw new Error('Invalid authentication data');
      }

      console.log('📝 Updating availability for expert:', id);

      const response = await fetch(`${API_BASE_URL}/api/experts/availability/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: id,
          day_of_week: selectedDay,
          start_time: startTime,
          end_time: endTime,
          name
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update availability');
      }

      console.log('✅ Availability updated successfully');
      
      toast({
        title: "Success",
        description: `Availability for ${selectedDay} updated successfully`
      });

      await fetchAvailability();
      onUpdateAvailability();

    } catch (error) {
      console.error('❌ Error updating availability:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update availability",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Select value={selectedDay} onValueChange={setSelectedDay}>
          <SelectTrigger>
            <SelectValue placeholder="Select day" />
          </SelectTrigger>
          <SelectContent>
            {WEEKDAYS.map((day) => (
              <SelectItem key={day} value={day}>
                {day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={startTime} onValueChange={(value) => onTimeChange('start', value)}>
          <SelectTrigger>
            <Clock className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Start time" />
          </SelectTrigger>
          <SelectContent>
            {TIME_OPTIONS.map((time) => (
              <SelectItem key={time} value={time}>
                {time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={endTime} onValueChange={(value) => onTimeChange('end', value)}>
          <SelectTrigger>
            <Clock className="mr-2 h-4 w-4" />
            <SelectValue placeholder="End time" />
          </SelectTrigger>
          <SelectContent>
            {TIME_OPTIONS.map((time) => (
              <SelectItem key={time} value={time}>
                {time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button 
        onClick={handleUpdateAvailability} 
        disabled={!selectedDay || isUpdating}
        className="w-full"
      >
        {isUpdating ? (
          <>
            <span className="animate-spin mr-2">⌛</span>
            Updating...
          </>
        ) : (
          'Update Availability'
        )}
      </Button>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Current Availability</h3>
        {isLoading ? (
          <div className="text-center py-4">Loading schedule...</div>
        ) : availabilityData.length > 0 ? (
          <div className="space-y-2">
            {availabilityData.map((slot) => (
              <div key={slot.day_of_week} className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                <div className="font-medium">{slot.day_of_week}</div>
                <div className="text-muted-foreground">
                  {slot.start_time} - {slot.end_time}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No availability schedule found. Add your first schedule above.
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilitySection;