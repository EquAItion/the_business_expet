import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from "@/components/ui/use-toast";
import { Pencil, User, Calendar, BookOpen, MapPin, Briefcase, Mail, Phone, Link as LinkIcon, Globe, TrendingUp, Clock, Star, Activity } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import jwtDecode from "jwt-decode";

// Update the SeekerProfile interface to match database schema
interface SeekerProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  company: string;
  position: string;
  experience: string;
  location: string;
  bio: string;
  interests: string;
  linkedin_url?: string;
  website_url?: string;
  created_at: string;
  updated_at: string;
  // Remove industry field since it's not in the database schema
}

interface EditingState {
  personal: boolean;
  contact: boolean;
}

// Add Booking interface
interface Booking {
  id: string;
  expertName: string;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
}

interface JWTPayload {
    user_id: string;
    role: string;
    iat: number;
    exp: number;
}

const useToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  const validateToken = useCallback((token: string) => {
    try {
      const cleanToken = token.replace(/^[Bb]earer\s+/, '');
      const decoded = jwtDecode<JWTPayload>(cleanToken);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        return false;
      }
      
      if (decoded.role !== 'solution_seeker' && decoded.role !== 'seeker') {
        return false;
      }
      
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  const updateToken = useCallback((newToken: string | null) => {
    if (!newToken) {
      setToken(null);
      setIsValid(false);
      return false;
    }

    const formattedToken = newToken.startsWith('Bearer ') ? newToken : `Bearer ${newToken}`;
    const isValidToken = validateToken(formattedToken);

    setToken(formattedToken);
    setIsValid(isValidToken);
    return isValidToken;
  }, [validateToken]);

  return { token, isValid, updateToken };
};

const SeekerDashboard: React.FC = () => {
    const [profile, setProfile] = useState<SeekerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState<EditingState>({ personal: false, contact: false });

    // Initialize bookings as empty array to prevent undefined errors
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [bookingsLoading, setBookingsLoading] = useState(true);
    const [bookingsError, setBookingsError] = useState<string | null>(null);

    // Use auth token hook
    const { token, isValid, updateToken } = useToken();

    const navigate = useNavigate();    const redirectToLogin = () => {
        navigate('/auth/seeker');
    };

    const redirectToOnboarding = () => {
        navigate('/onboarding');
    };

    // Add dependencies to prevent stale closures
    useEffect(() => {
        const handleTokenExpiry = () => {
            localStorage.clear();
            redirectToLogin();
        };

        window.addEventListener('storage', (e) => {
            if (e.key === 'user' && !e.newValue) {
                handleTokenExpiry();
            }
        });        return () => {
            window.removeEventListener('storage', handleTokenExpiry);
        };
    }, [navigate]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            setProfile(null);
            setBookings([]);
            setError(null);
            setBookingsError(null);
        };
    }, []);// First, simplify the auth check and data fetching
const fetchProfileAndBookings = async () => {
  try {
    setLoading(true);
    setBookingsLoading(true);
    
    // Get auth data from localStorage
    const userData = localStorage.getItem('user');
    if (!userData) {
      throw new Error('No user data found');
    }

    const parsedData = JSON.parse(userData);
    const token = parsedData.token || parsedData.accessToken;
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Clean token and verify
    const cleanToken = token.replace(/^[Bb]earer\s+/, '');
    const decodedToken = jwtDecode<JWTPayload>(cleanToken);
    const userId = decodedToken.user_id;

    if (!userId) {
      throw new Error('Invalid user ID');
    }

    // Format token for requests
    const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    // Fetch profile data
    const profileResponse = await fetch(`${API_BASE_URL}/api/profiles/seeker/${userId}`, {
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json'
      }
    });

    if (!profileResponse.ok) {
      if (profileResponse.status === 404) {
        navigate('/auth/SeekerProfileForm');
        return;
      }
      throw new Error(`Failed to fetch profile: ${profileResponse.status}`);
    }

    const profileData = await profileResponse.json();
    // Fix: Access the data property from the response
    if (!profileData.success) {
      throw new Error(profileData.message || 'Failed to load profile data');
    }

    // Fix: Set the correct data from the response
    setProfile(profileData.data); // Changed from profileData.profile

    // Fetch bookings data
    const bookingsResponse = await fetch(`${API_BASE_URL}/api/bookings/seeker/${userId}`, {
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json'
      }
    });

    if (bookingsResponse.ok) {
      const bookingsData = await bookingsResponse.json();
      if (bookingsData.success && Array.isArray(bookingsData.bookings)) {
        setBookings(bookingsData.bookings);
      }
    } else {
      setBookings([]);
      if (bookingsResponse.status !== 404) {
        console.error('Failed to fetch bookings:', bookingsResponse.status);
      }
    }

  } catch (error: any) {
    console.error('Data fetch error:', error);
    setError(error.message);
    // ...existing error handling...
  } finally {
    setLoading(false);
    setBookingsLoading(false);
  }
};

    // Single useEffect for initialization
    useEffect(() => {
      const fetchData = async () => {
        try {
          console.log('Fetching profile data...');
          await fetchProfileAndBookings();
          console.log('Profile data:', profile);
        } catch (error) {
          console.error('Effect error:', error);
        }
      };

      fetchData();
    }, []);    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
          <Navbar />
          
          {/* Hero Section - Light Blue Theme */}
          <div className="bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-500 text-white pt-20 pb-12 shadow-lg">
            <div className="container mx-auto px-4">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4 text-white drop-shadow-md">Welcome to Your Dashboard</h1>
                <p className="text-xl opacity-95 text-blue-50">Manage your profile and track your expert consultations</p>
              </div>
            </div>
          </div>

          {/* Stats Cards - Light Blue Theme */}
          <div className="container mx-auto px-4 -mt-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Total Sessions</p>
                      <p className="text-2xl font-bold text-slate-900">{bookings?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-emerald-50 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Completed</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {bookings?.filter(b => b.status === 'completed').length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <Clock className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Pending</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {bookings?.filter(b => b.status === 'pending').length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-violet-50 rounded-lg">
                      <Star className="w-6 h-6 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Rating</p>
                      <p className="text-2xl font-bold text-slate-900">4.8</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>      {/* Main Content */}
          <main className="container mx-auto px-4 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Profile Section - Light Blue Theme */}
              <Card className="lg:col-span-1 bg-white shadow-xl border-0 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                <div className="bg-gradient-to-r from-blue-400 to-cyan-400 h-20"></div>
                <CardHeader className="relative -mt-10 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className="h-20 w-20 rounded-full bg-white shadow-lg flex items-center justify-center border-4 border-white">
                        <User className="h-10 w-10 text-blue-500" />
                      </div>
                      <div className="pt-6">
                        <CardTitle className="text-2xl font-bold text-slate-900">Profile</CardTitle>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing({ ...isEditing, personal: true })}
                      className="mt-6 hover:bg-blue-50 border-blue-300 text-blue-600 hover:border-blue-400"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                {/* Profile Section */}
                <CardContent className="pt-0">
                  {loading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : error ? (
                    <div className="text-red-600 text-center p-4 bg-red-50 rounded-lg border border-red-200">
                      {error}
                    </div>
                  ) : !profile ? (
                    <div className="text-center py-8">
                      <p className="text-slate-600">Profile not found</p>
                      <Button 
                        onClick={() => navigate('/auth/SeekerProfileForm')}
                        className="mt-4"
                      >
                        Complete Your Profile
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Profile Header */}
                      <div className="text-center">
                        <h3 className="text-2xl font-bold text-slate-900">{profile.name}</h3>
                        <p className="text-lg text-blue-600 font-medium">{profile.position}</p>
                        <p className="text-slate-600 mt-1">{profile.company}</p>
                      </div>
                      
                      {/* Bio Section */}
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <h4 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">About</h4>
                        <p className="text-slate-700 leading-relaxed">{profile.bio}</p>
                      </div>

                      {/* Professional Details */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                          <div className="p-2 bg-emerald-100 rounded-lg">
                            <Calendar className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-emerald-800">Experience</p>
                            <p className="font-semibold text-slate-900">{profile.experience} years</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-violet-50 rounded-lg border border-violet-100">
                          <div className="p-2 bg-violet-100 rounded-lg">
                            <MapPin className="w-5 h-5 text-violet-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-violet-800">Location</p>
                            <p className="font-semibold text-slate-900">{profile.location}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-cyan-50 rounded-lg border border-cyan-100">
                          <div className="p-2 bg-cyan-100 rounded-lg">
                            <Activity className="w-5 h-5 text-cyan-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-cyan-800">Interests</p>
                            <p className="font-semibold text-slate-900">{profile.interests}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="p-2 bg-slate-100 rounded-lg">
                            <Mail className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">Email</p>
                            <p className="font-semibold text-slate-900">{profile.email}</p>
                          </div>
                        </div>

                        {/* Social Links */}
                        {(profile.linkedin_url || profile.website_url) && (
                          <div className="space-y-3 pt-4 border-t border-slate-200">
                            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Links</h4>
                            
                            {profile.linkedin_url && (
                              <a 
                                href={profile.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                              >
                                <LinkIcon className="w-5 h-5 text-blue-600" />
                                <span className="text-blue-700 font-medium">LinkedIn Profile</span>
                              </a>
                            )}
                            
                            {profile.website_url && (
                              <a 
                                href={profile.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-100"
                              >
                                <Globe className="w-5 h-5 text-emerald-600" />
                                <span className="text-emerald-700 font-medium">Personal Website</span>
                              </a>
                            )}
                          </div>
                        )}

                        {/* Profile Meta */}
                        <div className="text-xs text-slate-500 pt-4 border-t border-slate-200 space-y-1">
                          <p className="flex items-center space-x-2">
                            <Calendar className="w-3 h-3" />
                            <span>Member since: {new Date(profile.created_at).toLocaleDateString()}</span>
                          </p>
                          <p className="flex items-center space-x-2">
                            <Clock className="w-3 h-3" />
                            <span>Last updated: {new Date(profile.updated_at).toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bookings Section - Light Blue Theme */}
              <Card className="lg:col-span-2 bg-white shadow-xl border-0 hover:shadow-2xl transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
                  <CardTitle className="text-2xl font-bold flex items-center">
                    <Calendar className="w-6 h-6 mr-3" />
                    My Expert Sessions
                  </CardTitle>
                  <p className="text-blue-100 mt-2">Track your consultations and bookings</p>
                </CardHeader>
                <CardContent className="p-6">
                  {bookingsLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : bookingsError ? (
                    <div className="text-red-600 text-center p-6 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-red-500 mb-2">⚠</div>
                      {bookingsError}
                    </div>
                  ) : !bookings || bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="bg-blue-50 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center border border-blue-100">
                        <BookOpen className="w-12 h-12 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-700 mb-2">No Sessions Yet</h3>
                      <p className="text-slate-500 mb-6">Start your learning journey by booking your first expert session</p>
                      <Link to="/network">
                        <Button className="bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-300">
                          Browse Experts
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((booking, index) => (
                        <div 
                            key={booking.id || `booking-${index}`} 
                            className="border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-slate-50 hover:from-blue-50 hover:to-cyan-50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                                {(booking.expertName || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-slate-900">
                                  {booking.expertName || 'Unknown Expert'}
                                </h3>
                                <div className="flex items-center space-x-2 text-slate-600 mt-1">
                                  <Calendar className="w-4 h-4" />
                                  <p className="font-medium">
                                    {booking.date ? new Date(booking.date).toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    }) : 'Date not set'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  booking.status === 'completed' 
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                  booking.status === 'pending' 
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                    'bg-red-100 text-red-800 border border-red-200'
                              }`}>
                                {booking.status === 'completed' && '✓ '}
                                {booking.status === 'pending' && '⏳ '}
                                {booking.status === 'cancelled' && '✕ '}
                                {(booking.status || 'unknown').charAt(0).toUpperCase() + (booking.status || 'unknown').slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions - Light Blue Theme */}
            <div className="mt-8">
              <Card className="bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white shadow-xl border-0 hover:shadow-2xl transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Quick Actions</CardTitle>
                  <p className="text-blue-100">Take action to enhance your experience</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link to="/network">
                      <Button variant="secondary" className="w-full h-16 text-lg font-semibold bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-md hover:shadow-lg transition-all duration-300">
                        <User className="w-5 h-5 mr-2" />
                        Find Experts
                      </Button>
                    </Link>
                    
                    <Button variant="secondary" className="w-full h-16 text-lg font-semibold bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-md hover:shadow-lg transition-all duration-300">
                      <Calendar className="w-5 h-5 mr-2" />
                      Schedule Session
                    </Button>
                    
                    <Button variant="secondary" className="w-full h-16 text-lg font-semibold bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-md hover:shadow-lg transition-all duration-300">
                      <BookOpen className="w-5 h-5 mr-2" />
                      View Resources
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
          
          <Footer />
        </div>
      );
    };
    
    export default SeekerDashboard;