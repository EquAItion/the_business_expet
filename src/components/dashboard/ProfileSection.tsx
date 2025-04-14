import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil } from 'lucide-react';
import { FaBriefcase, FaMapMarkerAlt, FaEnvelope, FaPhone } from 'react-icons/fa';
import { toast } from "@/components/ui/use-toast";

interface ExpertProfile {
  first_name: string;
  last_name: string;
  designation: string;
  expertise: string;
  work_experience: string;
  current_organization: string;
  location: string;
  areas_of_help: string;
  phone_number: string;
  email: string;
  // ... other fields as needed
}

interface ProfileSectionProps {
  profile: ExpertProfile;
  editedProfile: ExpertProfile | null;
  isEditing: { personal: boolean; contact: boolean; pricing: boolean };
  onEdit: (section: keyof Omit<ProfileSectionProps['isEditing'], never>) => void;
  onUpdateField: (field: keyof ExpertProfile, value: string) => void;
  expertId?: string | null;
  onProfileUpdated?: () => void;  // Add this new prop
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  profile,
  editedProfile,
  isEditing,
  onEdit,
  onUpdateField,
  expertId,
  onProfileUpdated,
}) => {
  const [saving, setSaving] = useState<boolean>(false);
  
  const saveProfile = async (section: 'personal' | 'contact') => {
    if (!editedProfile) return;
    setSaving(true);
    
    try {
      const id = expertId || localStorage.getItem('expertId');
      if (!id) {
        throw new Error('Expert ID not found');
      }
      
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('Authentication token not found');
      }
      
      const parsedUserData = JSON.parse(userData);
      const token = parsedUserData.token || parsedUserData.accessToken;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      
      // Create the payload structure that's working for the personal section
      // and apply the same structure for contact
      let payload;
      
      if (section === 'personal') {
        payload = {
          section: 'personal',
          first_name: editedProfile.first_name,
          last_name: editedProfile.last_name,
          designation: editedProfile.designation,
          expertise: editedProfile.expertise
        };
      } else {
        // Use exactly the same structure for contact updates as with personal
        payload = {
          section: 'contact',
          current_organization: editedProfile.current_organization,
          location: editedProfile.location,
          email: editedProfile.email,
          phone_number: editedProfile.phone_number
        };
      }
      
      console.log('Request payload:', payload);
      
      // Use the exact same fetch code for both sections
      const response = await fetch(`${API_BASE_URL}/api/experts/profile/${id}`, {
        method: 'PUT', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.trim()}`
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Response status:', response.status);
      
      // Get response body
      const responseText = await response.text();
      console.log('Response body:', responseText);
      
      if (!response.ok) {
        throw new Error(`Failed to update profile: ${responseText}`);
      }
      
      // Parse JSON if valid
      const result = responseText ? JSON.parse(responseText) : {};
      console.log('Profile update successful:', result);
      
      toast({
        title: "Success",
        description: `${section === 'personal' ? 'Profile' : 'Contact'} information updated successfully`,
      });

      // Call onProfileUpdated to notify parent component
      if (onProfileUpdated) {
        onProfileUpdated();
      }

      // Toggle edit mode off
      onEdit(section);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Left Column - Profile Info */}
      <div className="md:w-1/3">
        <div className="text-center relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0"
            onClick={() => onEdit('personal')}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-semibold text-primary mx-auto">
            {profile.first_name?.[0] || ''}{profile.last_name?.[0] || ''}
          </div>
          <div className="mt-4 space-y-2">
            {isEditing.personal ? (
              <>
                <Input
                  value={editedProfile?.first_name || ''}
                  onChange={(e) => onUpdateField('first_name', e.target.value)}
                  className="mb-2"
                />
                <Input
                  value={editedProfile?.last_name || ''}
                  onChange={(e) => onUpdateField('last_name', e.target.value)}
                  className="mb-2"
                />
                <Input
                  value={editedProfile?.designation || ''}
                  onChange={(e) => onUpdateField('designation', e.target.value)}
                />
                <Button 
                  className="w-full mt-4" 
                  onClick={() => saveProfile('personal')}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold">
                  {profile.first_name} {profile.last_name}
                </h2>
                <p className="text-muted-foreground">{profile.designation}</p>
                <p className="text-sm text-muted-foreground">{profile.expertise}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Contact Details */}
      <div className="md:w-2/3 space-y-4 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0"
          onClick={() => onEdit('contact')}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <FaBriefcase className="w-5 h-5 text-primary" />
              <div className="w-full">
                {isEditing.contact ? (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Organization</p>
                    <Input
                      value={editedProfile?.current_organization || ''}
                      onChange={(e) => onUpdateField('current_organization', e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Organization</p>
                    <p className="font-medium">{profile.current_organization}</p>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FaMapMarkerAlt className="w-5 h-5 text-primary" />
              <div className="w-full">
                {isEditing.contact ? (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Location</p>
                    <Input
                      value={editedProfile?.location || ''}
                      onChange={(e) => onUpdateField('location', e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{profile.location}</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <FaEnvelope className="w-5 h-5 text-primary" />
              <div className="w-full">
                {isEditing.contact ? (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <Input
                      type="email"
                      value={editedProfile?.email || ''}
                      onChange={(e) => onUpdateField('email', e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{profile.email}</p>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FaPhone className="w-5 h-5 text-primary" />
              <div className="w-full">
                {isEditing.contact ? (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <Input
                      value={editedProfile?.phone_number || ''}
                      onChange={(e) => onUpdateField('phone_number', e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{profile.phone_number}</p>
                  </>
                )}
              </div>
            </div>
            {isEditing.contact && (
              <Button 
                className="w-full mt-4" 
                onClick={() => saveProfile('contact')}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;