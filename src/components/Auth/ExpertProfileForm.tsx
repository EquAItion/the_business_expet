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



const ExpertProfileForm: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ExpertProfileFormData>();

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
        dateOfBirth: format(data.dateOfBirth, 'yyyy-MM-dd')
      };
  
      // Make API call to save the expert profile
      const response = await fetch('http://localhost:5000/api/experts/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${signupData.token}`
        },
        body: JSON.stringify(completeProfile)
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create expert profile');
      }
  
      // Show success toast with profile completion message
      toast.success('Your profile has been completed successfully! Redirecting to dashboard...');
      // Add a small delay before navigation to ensure toast is visible
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create profile');
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
                        'w-full justify-start text-left font-normal',
                        !watch('dateOfBirth') && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watch('dateOfBirth') ? format(watch('dateOfBirth'), 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={watch('dateOfBirth')}
                      onSelect={(date) => setValue('dateOfBirth', date)}
                      disabled={(date) =>
                        date > new Date() || date < new Date('1900-01-01')
                      }
                      initialFocus
                    />
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