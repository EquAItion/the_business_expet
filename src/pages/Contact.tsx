import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useState } from "react";
import { toast } from "sonner"; // Make sure to add this dependency if not already installed

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '', // Added phone to error state
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Form validation
  const validateForm = () => {
    let isValid = true;
    const newErrors = { name: '', email: '', phone: '', message: '' };
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }
    
    // Add validation for phone field
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    } else if (!/^[\d\s\+\-\(\)]{6,20}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
      isValid = false;
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Example API call - replace with your actual submission endpoint
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      
      // Log for debugging purposes
      console.log('Sending contact form data:', formData);
      
      // Simulate API call with timeout
      // In production, replace with actual fetch call to your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      /* 
      // Uncomment and modify this for actual API integration
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit form');
      }
      
      const data = await response.json();
      */
      
      // On success
      toast.success("Thank you! Your message has been sent successfully.");
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error("There was a problem submitting your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Background decoration - subtle grid */}
          <div className="absolute inset-0 bg-[linear-gradient(#f9fafb_2px,transparent_2px),linear-gradient(90deg,#f9fafb_2px,transparent_2px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none -z-10" />
          
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Get in Touch</h1>
            <p className="mt-4 text-lg text-foreground/70">Have questions? We're here to help!</p>
          </div>

          <div className="mt-12 max-w-lg mx-auto">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground/80">Name</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  value={formData.name}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border ${errors.name ? 'border-red-500' : 'border-foreground/20'} bg-background px-3 py-2 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground/80">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  value={formData.email} 
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border ${errors.email ? 'border-red-500' : 'border-foreground/20'} bg-background px-3 py-2 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground/80">Phone Number</label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border ${errors.phone ? 'border-red-500' : 'border-foreground/20'} bg-background px-3 py-2 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`} 
                />
                {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground/80">Message</label>
                <textarea 
                  id="message" 
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4} 
                  className={`mt-1 block w-full rounded-md border ${errors.message ? 'border-red-500' : 'border-foreground/20'} bg-background px-3 py-2 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
                />
                {errors.message && <p className="mt-1 text-sm text-red-500">{errors.message}</p>}
              </div>
              
              <div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;