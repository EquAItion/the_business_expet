
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const industries = [
  "Technology",
  "Healthcare",
  "Finance",
  "Retail",
  "Manufacturing",
  "Education",
  "Food & Beverage",
  "Real Estate",
  "Entertainment",
  "Transportation"
];

const objectives = [
  "Product Launch",
  "Market Expansion",
  "Funding/Investment",
  "Business Growth",
  "Cost Reduction",
  "Brand Repositioning",
  "Digital Transformation",
  "New Market Entry"
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: '',
    productDescription: '',
    industry: '',
    targetAudience: '',
    objectives: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleObjectiveToggle = (objective: string) => {
    setFormData((prev) => {
      const objectives = [...prev.objectives];
      if (objectives.includes(objective)) {
        return { ...prev, objectives: objectives.filter(obj => obj !== objective) };
      } else {
        return { ...prev, objectives: [...objectives, objective] };
      }
    });
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.businessName || !formData.productDescription) {
        toast({
          title: "Missing Information",
          description: "Please provide your business name and product description.",
          variant: "destructive",
        });
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.industry || !formData.targetAudience) {
        toast({
          title: "Missing Information",
          description: "Please select your industry and describe your target audience.",
          variant: "destructive",
        });
        return false;
      }
    } else if (currentStep === 3) {
      if (formData.objectives.length === 0) {
        toast({
          title: "Missing Information",
          description: "Please select at least one business objective.",
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      console.log("Form Submitted:", formData);
      
      toast({
        title: "Information Submitted",
        description: "Your business information has been received. Redirecting to dashboard.",
      });
      
      // Redirect to dashboard
      setTimeout(() => {
        window.scrollTo({ top:0, behavior:'smooth'});
        navigate('/aidashboard');
      }, 1500);
    }, 2000);
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center space-x-1 mb-10">
        {[1, 2, 3].map((step) => (
          <React.Fragment key={step}>
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === currentStep 
                  ? 'bg-blue-500 text-white' 
                  : step < currentStep 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {step < currentStep ? <CheckCircle size={16} /> : step}
            </div>
            {step < 3 && (
              <div 
                className={`w-12 h-0.5 ${
                  step < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <>
    <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-4">Create Your Business Plan</h1>
            <p className="text-gray-600">Share details about your business to generate a comprehensive strategic plan.</p>
          </div>
          
          {renderStepIndicator()}
          
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass shadow-sm">
              <CardContent className="pt-6">
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-medium text-gray-900 mb-1">Business Information</h2>
                      <p className="text-sm text-gray-500 mb-4">Tell us about your business and product/service.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input 
                          id="businessName"
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleChange}
                          placeholder="Enter your business name"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="productDescription">Product/Service Description</Label>
                        <Textarea 
                          id="productDescription"
                          name="productDescription"
                          value={formData.productDescription}
                          onChange={handleChange}
                          placeholder="Describe your product or service in detail"
                          className="mt-1 min-h-[120px]"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-medium text-gray-900 mb-1">Market & Audience</h2>
                      <p className="text-sm text-gray-500 mb-4">Tell us about your industry and target audience.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="industry">Industry</Label>
                        <Select 
                          value={formData.industry} 
                          onValueChange={(value) => handleSelectChange('industry', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select an industry" />
                          </SelectTrigger>
                          <SelectContent>
                            {industries.map((industry) => (
                              <SelectItem key={industry} value={industry}>
                                {industry}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="targetAudience">Target Audience</Label>
                        <Textarea 
                          id="targetAudience"
                          name="targetAudience"
                          value={formData.targetAudience}
                          onChange={handleChange}
                          placeholder="Describe your target audience, demographics, and market segment"
                          className="mt-1 min-h-[120px]"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-medium text-gray-900 mb-1">Business Objectives</h2>
                      <p className="text-sm text-gray-500 mb-4">Select the primary objectives for your business plan.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {objectives.map((objective) => (
                        <div 
                          key={objective}
                          onClick={() => handleObjectiveToggle(objective)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            formData.objectives.includes(objective)
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center ${
                              formData.objectives.includes(objective) ? 'bg-blue-500' : 'border border-gray-300'
                            }`}>
                              {formData.objectives.includes(objective) && (
                                <CheckCircle className="text-white" size={12} />
                              )}
                            </div>
                            <span className="text-sm">{objective}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 1 || isSubmitting}
                  >
                    Back
                  </Button>
                  
                  <Button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    {isSubmitting ? 'Processing...' : currentStep < 3 ? 'Next' : 'Submit'}
                    {!isSubmitting && currentStep < 3 && <ArrowRight className="ml-1" size={16} />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      <Footer/>
    </>
  );
};

export default Onboarding;
