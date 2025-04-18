import React from 'react';
import { useForm } from 'react-hook-form';
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

interface ExpertProfileFormData {
  firstName: string;
  lastName: string;
  designation: string;
  dateOfBirth: Date;
  phoneNumber: string;
  workExperience: string;
  currentOrganization: string;
  location: string;
  expertise: string;
  areasOfHelp: string;
  audioPricing: string;
  videoPricing: string;
  chatPricing: string;
  linkedin: string;
  instagram: string;
  youtube: string;
  twitter: string;
}

// Add a helper function to format the date
// const formatDateOfBirth = (date: Date | undefined) => {
//   if (!date) return 'Select your date of birth';
//   return format(date, 'MMMM dd, yyyy');
// };

const ExpertProfileForm: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ExpertProfileFormData>({
    defaultValues: {
      dateOfBirth: undefined,
    },
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

  const onSubmit = async (data: ExpertProfileFormData) => {
    try {
      // Combine signup data with profile data
      const signupData = JSON.parse(localStorage.getItem('expertSignupData') || '{}');
      const completeProfile = {
        ...data,
        dateOfBirth: format(data.dateOfBirth, 'yyyy-MM-dd'),
      };
  
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_BASE_URL}/api/experts/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${signupData.token}`,
        },
        body: JSON.stringify(completeProfile),
      });
      
      if (!response.ok) {
        const errorText = await response.text(); // Read the response as plain text
        throw new Error(errorText);
      }
  
      const result = await response.json();

      window.scrollTo({top:0, behavior: 'smooth'});

      toast.success('Your profile has been completed successfully! Redirecting to dashboard...');
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error(error.message || 'Failed to create profile');
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const age = differenceInYears(new Date(), date);
      if (age < 18) {
        toast.error('You must be at least 18 years old');
        return;
      }
      setValue('dateOfBirth', date);
      setSelectedYear(date.getFullYear());
      setSelectedMonth(date.getMonth());
    }
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
                          selected={watch('dateOfBirth')}
                          onSelect={handleDateSelect}
                          month={new Date(selectedYear, selectedMonth)}
                          disabled={(date) =>
                            date > new Date('2005-01-01') || date < new Date('1950-01-01')
                          }
                          initialFocus
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
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  {...register('phoneNumber', {
                    required: 'Phone number is required',
                    pattern: {
                      value: /^\+?[1-9]\d{1,14}$/,
                      message: 'Please enter a valid phone number'
                    }
                  })}
                  className="w-full"
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
                    min: { value: 0, message: 'Work experience cannot be negative' }
                  })}
                  className="w-full"
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
                  placeholder="City, Country"
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
                  placeholder="e.g., Machine Learning, Web Development"
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
                  placeholder="Describe how you can assist others"
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
                <Label htmlFor="audioPricing">Audio Call (per hour)</Label>
                <Input
                  id="audioPricing"
                  type="number"
                  {...register('audioPricing', { 
                    required: 'Audio call pricing is required',
                    min: { value: 0, message: 'Price cannot be negative' }
                  })}
                  className="w-full"
                  placeholder="Price in USD"
                />
                {errors.audioPricing && (
                  <span className="text-red-500 text-sm">{errors.audioPricing.message}</span>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="videoPricing">Video Call (per hour)</Label>
                <Input
                  id="videoPricing"
                  type="number"
                  {...register('videoPricing', { 
                    required: 'Video call pricing is required',
                    min: { value: 0, message: 'Price cannot be negative' }
                  })}
                  className="w-full"
                  placeholder="Price in USD"
                />
                {errors.videoPricing && (
                  <span className="text-red-500 text-sm">{errors.videoPricing.message}</span>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="chatPricing">Chat (per hour)</Label>
                <Input
                  id="chatPricing"
                  type="number"
                  {...register('chatPricing', { 
                    required: 'Chat pricing is required',
                    min: { value: 0, message: 'Price cannot be negative' }
                  })}
                  className="w-full"
                  placeholder="Price in USD"
                />
                {errors.chatPricing && (
                  <span className="text-red-500 text-sm">{errors.chatPricing.message}</span>
                )}
              </div>
            </div>
          </div>

          {/* Social Media Links Section with URL validation */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Social Media Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn Profile</Label>
                <Input
                  id="linkedin"
                  {...register('linkedin', {
                    pattern: {
                      value: /^https?:\/\/(?:www\.)?linkedin\.com\/in\/[\w\-]+\/?$/,
                      message: 'Please enter a valid LinkedIn profile URL'
                    }
                  })}
                  className="w-full"
                  placeholder="https://linkedin.com/in/username"
                />
                {errors.linkedin && (
                  <span className="text-red-500 text-sm">{errors.linkedin.message}</span>
                )}
              </div>
              {/* Similar validation for other social media links */}
            </div>
          </div>

          <Button type="submit" className="w-full">Save Profile</Button>
        </form>
      </div>
      <Footer />
    </>
  );
};

export default ExpertProfileForm;
