import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { differenceInYears } from 'date-fns';
import { z } from 'zod';

// Frontend interface is missing these fields
interface ExpertProfileFormData {
  firstName: string;          // maps to first_name varchar(255)
  lastName: string;          // maps to last_name varchar(255)
  designation: string;       // maps to designation varchar(255)
  dateOfBirth: Date;         // maps to date_of_birth date
  phoneNumber: string;       // maps to phone_number varchar(20)
  workExperience: string;    // maps to work_experience int
  currentOrganization: string; // maps to current_organization varchar(255)
  location: string;          // maps to location varchar(255)
  expertise: string;         // maps to expertise text
  areasOfHelp: string;      // maps to areas_of_help text
  audioPricing: string;      // maps to audio_pricing decimal(10,2)
  linkedinUrl: string | null; // maps to linkedin_url varchar(255)
}

// Validation schema
const expertProfileSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    designation: z.string().min(1, 'Designation is required'),
    dateOfBirth: z.date({
        required_error: 'Date of birth is required',
    }),
    phoneNumber: z.string()
        .min(10, 'Phone number must be at least 10 digits')
        .max(15, 'Phone number is too long')
        .regex(/^[0-9]+$/, 'Only numbers are allowed')
        .transform((val) => val.replace(/[^0-9]/g, '')),
    workExperience: z.string()
        .regex(/^\d{1,2}$/, 'Work experience must be 1-2 digits')
        .transform(Number)
        .refine((val) => val >= 0 && val <= 99, {
            message: 'Work experience must be between 0 and 99 years'
        }),
    currentOrganization: z.string().min(1, 'Current organization is required'),
    location: z.string().min(1, 'Location is required'),
    expertise: z.string().min(1, 'Expertise is required'),
    areasOfHelp: z.string().min(1, 'Areas of help is required'),
    audioPricing: z.string().transform(Number),
    linkedinUrl: z.string().url('Invalid URL').nullable().or(z.literal(''))
});

// Add a helper function to format the date
// const formatDateOfBirth = (date: Date | undefined) => {
//   if (!date) return 'Select your date of birth';
//   return format(date, 'MMMM dd, yyyy');
// };

const ExpertProfileForm: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ExpertProfileFormData>({
    defaultValues: {
        dateOfBirth: new Date('1990-01-01'),
        workExperience: '0',
        audioPricing: '0',
        linkedinUrl: null
    },
    resolver: zodResolver(expertProfileSchema)
});

  // Add this after the useForm hook
  const [calendarView, setCalendarView] = React.useState<'days' | 'months' | 'years'>('days');
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth());

  // Add these helper functions
  const years = Array.from({ length: 74 }, (_, i) => new Date().getFullYear() - 73 + i);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  React.useEffect(() => {
    // Load expert signup data from localStorage
    const signupData = localStorage.getItem('expertSignupData');
    if (signupData) {
      const { name, email } = JSON.parse(signupData);
      const [firstName, lastName] = name.split(' ');
      setValue('firstName', firstName);
      setValue('lastName', lastName || '');
    }
  }, [setValue]);

  const onSubmit: SubmitHandler<ExpertProfileFormData> = async (data) => {
    try {
        setIsSubmitting(true);
        const signupData = JSON.parse(localStorage.getItem('expertSignupData') || '{}');
        
        if (!signupData.token || !signupData.user_id) {
            throw new Error('Session expired. Please sign in again.');
        }

        // Validate required fields
        if (!data.firstName || !data.lastName || !data.designation || !data.dateOfBirth ||
            !data.phoneNumber || !data.workExperience || !data.currentOrganization ||
            !data.location || !data.expertise || !data.areasOfHelp || !data.audioPricing) {
            throw new Error('All fields except LinkedIn URL are required');
        }

        // Clean and prepare the data with explicit null handling
        const completeProfile = {
            user_id: signupData.user_id,
            first_name: data.firstName.trim(),
            last_name: data.lastName.trim(),
            designation: data.designation.trim(),
            date_of_birth: format(data.dateOfBirth, 'yyyy-MM-dd'),
            phone_number: data.phoneNumber.trim(),
            work_experience: parseInt(data.workExperience) || 0,
            current_organization: data.currentOrganization.trim(),
            location: data.location.trim(),
            expertise: data.expertise.trim(),
            areas_of_help: data.areasOfHelp.trim(),
            audio_pricing: parseFloat(data.audioPricing) || 0,
            linkedin_url: data.linkedinUrl?.trim() || null
        };

        // Log sanitized data for debugging
        console.log('Sending sanitized profile data:', JSON.stringify(completeProfile, null, 2));

        const API_BASE_URL = import.meta.env.VITE_API_URL;
        const response = await fetch(`${API_BASE_URL}/api/experts/profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${signupData.token}`,
            },
            body: JSON.stringify(completeProfile),
        });
        
        const result = await response.json();
        console.log('Server response:', result);

        if (!response.ok) {
            console.error('Server error details:', result);
            throw new Error(result.message || 'Failed to create profile');
        }

        // Update local storage with profile completion status
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        userData.profile_completed = true;
        localStorage.setItem('user', JSON.stringify(userData));

        toast.success('Profile completed successfully!');
        setTimeout(() => navigate('/dashboard'), 1500);

    } catch (error) {
        console.error('Error creating profile:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to create profile');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const age = differenceInYears(new Date(), date);
    if (age < 18) {
      toast.error('You must be at least 18 years old');
      return;
    }

    // Set the date with time set to noon to avoid timezone issues
    const normalizedDate = new Date(date.setHours(12, 0, 0, 0));
    setValue('dateOfBirth', normalizedDate);
    setSelectedYear(normalizedDate.getFullYear());
    setSelectedMonth(normalizedDate.getMonth());
  };
  
  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-20">
        <h1 className="text-3xl font-bold text-center mb-8">Complete Your Expert Profile</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  {...register('firstName', { required: 'First name is required' })}
                  className="w-full"
                  placeholder="Enter your first name"
                />
                {errors.firstName && (
                  <span className="text-red-500 text-sm">{errors.firstName.message}</span>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  {...register('lastName', { required: 'Last name is required' })}
                  className="w-full"
                  placeholder="Enter your last name"
                />
                {errors.lastName && (
                  <span className="text-red-500 text-sm">{errors.lastName.message}</span>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation">Current Designation</Label>
                <Input
                  id="designation"
                  {...register('designation', { required: 'Designation is required' })}
                  className="w-full"
                  placeholder="e.g., Senior Software Engineer, Product Manager"
                />
                {errors.designation && (
                  <span className="text-red-500 text-sm">{errors.designation.message}</span>
                )}
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal hover:bg-secondary/80',
                        'border-2 rounded-md px-4 py-2',
                        !watch('dateOfBirth') && 'text-muted-foreground',
                        'focus:ring-2 focus:ring-primary/20'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                      {watch('dateOfBirth') ? format(watch('dateOfBirth'), 'PPP') : <span>Select your date of birth</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border-2" align="start">
                    <div className="p-2">
                      {/* View Selector */}
                      <div className="flex justify-between mb-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCalendarView('days')}
                          className={cn(
                            'text-sm font-medium',
                            calendarView === 'days' && 'bg-secondary'
                          )}
                        >
                          Day
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCalendarView('months')}
                          className={cn(
                            'text-sm font-medium',
                            calendarView === 'months' && 'bg-secondary'
                          )}
                        >
                          Month
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCalendarView('years')}
                          className={cn(
                            'text-sm font-medium',
                            calendarView === 'years' && 'bg-secondary'
                          )}
                        >
                          Year
                        </Button>
                      </div>

                      {calendarView === 'days' && (
                        <Calendar
                          mode="single"
                          selected={watch('dateOfBirth') || undefined}
                          onSelect={handleDateSelect}
                          month={new Date(selectedYear, selectedMonth)}
                          disabled={(date) =>
                            date > new Date('2005-01-01') || date < new Date('1950-01-01')
                          }
                          initialFocus
                          defaultMonth={new Date(1990, 0)} // Set default visible month
                          fromDate={new Date(1950, 0)} // Set minimum selectable date
                          toDate={new Date(2005, 11, 31)} // Set maximum selectable date
                          className="rounded-md shadow-md"
                          classNames={{
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary",
                            day_today: "bg-accent text-accent-foreground",
                            day_outside: "text-muted-foreground opacity-50",
                            day_disabled: "text-muted-foreground opacity-50",
                            nav_button: "hover:bg-secondary",
                            nav_button_previous: "absolute left-1",
                            nav_button_next: "absolute right-1",
                            caption: "capitalize"
                          }}
                        />
                      )}

                      {calendarView === 'months' && (
                        <div className="grid grid-cols-3 gap-2 p-2">
                          {months.map((month, index) => (
                            <Button
                              key={month}
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedMonth(index);
                                setCalendarView('days');
                              }}
                              className={cn(
                                'text-sm',
                                selectedMonth === index && 'bg-primary text-primary-foreground'
                              )}
                            >
                              {month.slice(0, 3)}
                            </Button>
                          ))}
                        </div>
                      )}

                      {calendarView === 'years' && (
                        <div className="grid grid-cols-4 gap-2 p-2 h-[280px] overflow-y-auto">
                          {years.map((year) => (
                            <Button
                              key={year}
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedYear(year);
                                setCalendarView('months');
                              }}
                              className={cn(
                                'text-sm',
                                selectedYear === year && 'bg-primary text-primary-foreground'
                              )}
                            >
                              {year}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                {errors.dateOfBirth && (
                  <span className="text-red-500 text-sm">{errors.dateOfBirth.message}</span>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Mobile Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  inputMode="numeric"
                  {...register('phoneNumber', {
                    required: 'Mobile number is required',
                    pattern: {
                      value: /^[0-9]+$/,
                      message: 'Please enter only numbers'
                    },
                    minLength: {
                      value: 10,
                      message: 'Phone number must be at least 10 digits'
                    },
                    maxLength: {
                      value: 15,
                      message: 'Phone number cannot exceed 15 digits'
                    },
                    onChange: (e) => {
                      e.target.value = e.target.value.replace(/[^0-9]/g, '');
                    }
                  })}
                  className="w-full"
                  placeholder="Enter 10-digit mobile number"
                />
                {errors.phoneNumber && (
                  <span className="text-red-500 text-sm">{errors.phoneNumber.message}</span>
                )}
              </div>
            </div>
          </div>

          {/* Professional Details Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Professional Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workExperience">Total Work Experience (in years)</Label>
                <Input
                  id="workExperience"
                  type="number"
                  {...register('workExperience', { 
                    required: 'Work experience is required',
                    min: { value: 0, message: 'Work experience cannot be negative' },
                    max: { value: 99, message: 'Work experience cannot exceed 99 years' },
                    onChange: (e) => {
                        // Limit input to 2 digits
                        if (e.target.value.length > 2) {
                            e.target.value = e.target.value.slice(0, 2);
                        }
                        // Remove any non-numeric characters
                        e.target.value = e.target.value.replace(/[^0-9]/g, '');
                    }
                  })}
                  className="w-full"
                  placeholder="Enter years (10-99)"
                />
                {errors.workExperience && (
                  <span className="text-red-500 text-sm">{errors.workExperience.message}</span>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentOrganization">Current Organization</Label>
                <Input
                  id="currentOrganization"
                  {...register('currentOrganization', { required: 'Current organization is required' })}
                  className="w-full"
                  placeholder="e.g., Google, Microsoft, Freelancer"
                />
                {errors.currentOrganization && (
                  <span className="text-red-500 text-sm">{errors.currentOrganization.message}</span>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  {...register('location', { required: 'Location is required' })}
                  className="w-full"
                  placeholder="e.g., Bangalore, India"
                />
                {errors.location && (
                  <span className="text-red-500 text-sm">{errors.location.message}</span>
                )}
              </div>
            </div>
          </div>

          {/* Expertise Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">My Expertise</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expertise">Areas of Expertise</Label>
                <Input
                  id="expertise"
                  {...register('expertise', { required: 'Areas of expertise are required' })}
                  className="w-full"
                  placeholder="e.g., Full Stack Development, Cloud Architecture, AI/ML"
                />
                {errors.expertise && (
                  <span className="text-red-500 text-sm">{errors.expertise.message}</span>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="areasOfHelp">How can you help others?</Label>
                <Input
                  id="areasOfHelp"
                  {...register('areasOfHelp', { required: 'Please describe how you can help others' })}
                  className="w-full"
                  placeholder="e.g., I can help with system design, coding problems, career guidance"
                />
                {errors.areasOfHelp && (
                  <span className="text-red-500 text-sm">{errors.areasOfHelp.message}</span>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Pricing Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="audioPricing">Audio Call (per hour) in INR</Label>
                <Input
                  id="audioPricing"
                  type="number"
                  {...register('audioPricing', { 
                    required: 'Audio call pricing is required',
                    min: { value: 0, message: 'Price cannot be negative' }
                  })}
                  className="w-full"
                  placeholder="Enter amount in INR (e.g., 1000)"
                />
                {errors.audioPricing && (
                  <span className="text-red-500 text-sm">{errors.audioPricing.message}</span>
                )}
              </div>
              {/* <div className="space-y-2">
                <Label htmlFor="videoPricing">Video Call (per hour) in INR</Label>
                <Input
                  id="videoPricing"
                  type="number"
                  {...register('videoPricing', { 
                    required: 'Video call pricing is required',
                    min: { value: 0, message: 'Price cannot be negative' }
                  })}
                  className="w-full"
                  placeholder="Price in INR"
                />
                {errors.videoPricing && (
                  <span className="text-red-500 text-sm">{errors.videoPricing.message}</span>
                )}
              </div> */}
              {/* <div className="space-y-2">
                <Label htmlFor="chatPricing">Chat (per hour) in INR</Label>
                <Input
                  id="chatPricing"
                  type="number"
                  {...register('chatPricing', { 
                    required: 'Chat pricing is required',
                    min: { value: 0, message: 'Price cannot be negative' }
                  })}
                  className="w-full"
                  placeholder="Price in INR"
                />
                {errors.chatPricing && (
                  <span className="text-red-500 text-sm">{errors.chatPricing.message}</span>
                )}
              </div> */}

            </div>
          </div>

          {/* Social Media Links Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Professional Profile</h2>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn Profile</Label>
              <Input
                id="linkedin"
                {...register('linkedinUrl', {
                  pattern: {
                    value: /^https?:\/\/(?:www\.)?linkedin\.com\/in\/[\w\-]+\/?$/,
                    message: 'Please enter a valid LinkedIn profile URL'
                  }
                })}
                className="w-full"
                placeholder="https://www.linkedin.com/in/your-profile"
              />
              {errors.linkedinUrl && (
                <span className="text-red-500 text-sm">{errors.linkedinUrl.message}</span>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                Saving Profile...
              </div>
            ) : (
              'Save Profile'
            )}
          </Button>
        </form>
      </div>
      <Footer />
    </>
  );
};

export default ExpertProfileForm;
