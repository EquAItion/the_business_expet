import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Calendar, 
    Clock, 
    User, 
    MapPin, 
    Mail, 
    Briefcase, 
    Building,
    GraduationCap,
    Phone,
    Link as LinkIcon
} from 'lucide-react';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';

// Update the SeekerProfile interface to match database schema
interface SeekerProfile {
    id: string;
    user_id: string;
    name: string;
    email: string;
    industry: string;
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
}

// Add Booking type inline
interface Booking {
    id: string;
    expert_id: string;
    expert_name: string;
    date: string;
    start_time: string;
    end_time: string;
    status: string;
    session_type: string;
    amount: number;
    created_at: string;
    expert_designation?: string;
    expert_location?: string;
}

interface AuthData {
    token: string;
    userId: string; // Changed from id to userId
    profile?: SeekerProfile;
}

// Update the API service function
const API_SERVICES = {
    fetchSeekerProfile: async (userId: string, token: string): Promise<SeekerProfile> => {
        const API_BASE_URL = import.meta.env.VITE_API_URL;
        console.log('Fetching profile with userId:', userId); // Updated debug log
        
        const response = await fetch(`${API_BASE_URL}/api/profiles/seeker/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Log response status
        console.log('Profile fetch response status:', response.status);

        if (!response.ok) {
            if (response.status === 401) throw new Error('Session expired');
            if (response.status === 403) throw new Error('Unauthorized access');
            if (response.status === 404) throw new Error('Profile not found');
            throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        console.log('Profile data received:', data); // Debug log

        if (!data.success) throw new Error(data.message);
        return data.profile;
    },

    // Update bookings fetch to use id
    fetchSeekerBookings: async (id: string, token: string): Promise<Booking[]> => {
        const API_BASE_URL = import.meta.env.VITE_API_URL;
        const res = await fetch(`${API_BASE_URL}/api/bookings/seeker/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            if (res.status === 401) throw new Error('Session expired');
            throw new Error('Failed to fetch bookings');
        }

        const data = await res.json();
        return data.success && Array.isArray(data.data) ? data.data : [];
    }
};

const SeekerDashboard: React.FC = () => {
    const [user, setUser] = useState<AuthData | null>(null);
    const [appointments, setAppointments] = useState<Booking[]>([]);
    const [profile, setProfile] = useState<SeekerProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);

    // Get auth data from localStorage and decode token to get userId
    useEffect(() => {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (token) {
            try {
                // Decode JWT token to extract user_id
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const decodedToken = JSON.parse(jsonPayload);
                const userId = decodedToken.user_id;

                const parsedUser = userData ? JSON.parse(userData) : null;

                setUser({
                    userId: userId,
                    token: token,
                    profile: parsedUser?.profile
                });
            } catch (err) {
                console.error('Error decoding token or parsing user data:', err);
                handleLogout();
            }
        }
    }, []);

    // Fetch profile and bookings
    useEffect(() => {
        const fetchData = async () => {
            if (!user?.userId || !user?.token) return; // Changed from id to userId

            setLoading(true);
            setProfileLoading(true);
            setError(null);

            try {
                // Fetch profile and bookings in parallel
                const [profileData, bookingsData] = await Promise.all([
                    API_SERVICES.fetchSeekerProfile(user.userId, user.token), // Changed from id to userId
                    API_SERVICES.fetchSeekerBookings(user.userId, user.token)  // Changed from id to userId
                ]);

                console.log('Fetched profile data:', profileData); // Added debug log
                setProfile(profileData);
                setAppointments(bookingsData.filter(booking => 
                    booking.status === 'confirmed' || booking.status === 'pending'
                ));
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An error occurred';
                console.error('Error fetching profile or bookings:', errorMessage); // Added error log
                setError(errorMessage);
                if (errorMessage === 'Session expired') {
                    handleLogout();
                }
            } finally {
                setLoading(false);
                setProfileLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/';
    };

    // Add the refreshProfile function after the existing state declarations
    const refreshProfile = async () => {
        try {
            const storedData = localStorage.getItem('user');
            if (!storedData) return;
            
            const parsedData = JSON.parse(storedData);
            const token = parsedData.token;
            const userId = parsedData.userId; // Changed from id to userId
            
            if (!token || !userId) {
                console.error('Missing token or userId');
                return;
            }
            
            console.log('Refreshing profile for userId:', userId); // Updated debug log
            
            const API_BASE_URL = import.meta.env.VITE_API_URL;
            const res = await fetch(`${API_BASE_URL}/api/profiles/seeker/${userId}`, { // Changed from id to userId
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!res.ok) {
                throw new Error(`Failed to fetch profile: ${res.status}`);
            }
            
            const result = await res.json();
            console.log('Refresh result:', result);
            
            if (result.success && result.profile) {
                setProfile(result.profile);
                
                // Update localStorage with new profile data
                const updatedUserData = {
                    ...parsedData,
                    profile: result.profile
                };
                localStorage.setItem('user', JSON.stringify(updatedUserData));
            }
        } catch (error) {
            console.error("Error refreshing profile:", error);
            setError(error instanceof Error ? error.message : 'Failed to refresh profile');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow flex items-center justify-center">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader>
                            <CardTitle className="text-red-600">Error</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">{error}</p>
                            <Button 
                                onClick={() => window.location.reload()} 
                                className="mt-4 w-full"
                            >
                                Retry
                            </Button>
                        </CardContent>
                    </Card>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <Navbar />
            
            <main className="flex-grow container mx-auto py-16 px-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar with User Details */}
                    <aside className="hidden lg:block">
                        <Card className="sticky top-20 shadow-xl border border-gray-200 rounded-lg bg-white">
                            <CardHeader className="bg-primary/10 border-b border-gray-200 p-6">
                                <CardTitle className="text-2xl font-extrabold text-gray-900">
                                    User Details
                                </CardTitle>
                            </CardHeader>
                            {/* Update the sidebar content to match new profile structure */}
                            <CardContent className="p-6 space-y-6">
                                <div className="flex items-center space-x-3">
                                    <User className="h-6 w-6 text-primary" />
                                    <span className="font-semibold text-gray-800">{profile?.name} P Sai Vishnu</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Mail className="h-6 w-6 text-primary" />
                                    <span className="text-gray-700">{profile?.email} Sai@gmail.com</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Building className="h-6 w-6 text-primary" />
                                    <span className="text-gray-700">{profile?.company} Brenstone</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Briefcase className="h-6 w-6 text-primary" />
                                    <div className="flex flex-col">
                                        <span className="text-gray-700">{profile?.industry} Tech</span>
                                        <span className="text-sm text-gray-500">{profile?.position} Intern</span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <GraduationCap className="h-6 w-6 text-primary" />
                                    <span className="text-gray-700">{profile?.experience}4 years</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <MapPin className="h-6 w-6 text-primary" />
                                    <span className="text-gray-700">{profile?.location} Hyderabad</span>
                                </div>
                                {profile?.linkedin_url && (
                                    <div className="flex items-center space-x-3">
                                        <LinkIcon className="h-6 w-6 text-primary" />
                                        <a 
                                            href={profile.linkedin_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                        >
                                            LinkedIn Profile
                                        </a>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                       
                    </aside>

                    {/* Main Content */}
                    <section className="lg:col-span-3 space-y-8">
                        {/* Profile Overview Section */}
                        <Card className="shadow-xl rounded-lg bg-white border border-gray-200">
                            <CardHeader className="bg-primary/10 p-6 rounded-t-lg border-b border-gray-200">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-3xl font-extrabold text-gray-900">
                                            {profile?.name || 'Welcome'}
                                        </CardTitle>
                                        <p className="text-lg text-gray-600 mt-1">{profile?.position}</p>
                                        {profile?.bio && (
                                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                                {profile?.bio}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Button 
                                            variant="outline" 
                                            onClick={refreshProfile}
                                            className="text-primary border-primary hover:bg-primary/10"
                                        >
                                            Refresh
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            onClick={handleLogout} 
                                            className="text-primary border-primary hover:bg-primary/10"
                                        >
                                            Logout
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                          
                        </Card>

                        {/* Quick Links Card */}
                        <Card className="shadow-xl rounded-lg bg-white border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
                            <CardHeader className="bg-gray-50 border-b border-gray-200 p-6 rounded-t-lg">
                                <CardTitle className="text-xl text-gray-800">Quick Links</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <ul className="space-y-3">
                                    <li>
                                        <Link to="/profile" className="text-primary hover:text-primary/80 flex items-center p-2 rounded-md hover:bg-gray-50 transition-colors">
                                            <User className="h-5 w-5 mr-3" />
                                            Edit Profile
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/network" className="text-primary hover:text-primary/80 flex items-center p-2 rounded-md hover:bg-gray-50 transition-colors">
                                            <User className="h-5 w-5 mr-3" />
                                            View Experts
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/appointment-log" className="text-primary hover:text-primary/80 flex items-center p-2 rounded-md hover:bg-gray-50 transition-colors">
                                            <Calendar className="h-5 w-5 mr-3" />
                                            Appointment Log
                                        </Link>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                        
                        {/* Recent Activities Card */}
                        <Card className="shadow-xl rounded-lg bg-white border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
                            <CardHeader className="bg-gray-50 border-b border-gray-200 p-6 rounded-t-lg">
                                <CardTitle className="text-xl text-gray-800">Recent Activities</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {loading ? (
                                    <div className="flex justify-center items-center h-32">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : appointments.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No recent activities.</p>
                                ) : (
                                    <ul className="space-y-4">
                                        {appointments.slice(0, 3).map((appt) => (
                                            <li key={appt.id} className="border-b pb-3 last:border-b-0">
                                                <div className="font-semibold text-gray-900">{appt.expert_name}</div>
                                                <div className="text-sm text-gray-600">{appt.session_type}</div>
                                                <div className="flex items-center text-sm text-gray-600 mt-1">
                                                    <Calendar className="h-4 w-4 mr-1" />
                                                    {appt.date}
                                                </div>
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Clock className="h-4 w-4 mr-1" />
                                                    {appt.start_time} - {appt.end_time}
                                                </div>
                                                <div className="mt-2">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        appt.status === 'confirmed' 
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>

                        {/* Session Analytics Card */}
                        <Card className="shadow-xl rounded-lg bg-white border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
                            <CardHeader className="bg-gray-50 border-b border-gray-200 p-6 rounded-t-lg">
                                <CardTitle className="text-xl text-gray-800">Session Analytics</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                                    <span className="text-gray-600">Total Sessions</span>
                                    <span className="font-semibold text-gray-900">{appointments.length}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                                    <span className="text-gray-600">Upcoming</span>
                                    <span className="font-semibold text-green-600">
                                        {appointments.filter(a => a.status === 'confirmed').length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                                    <span className="text-gray-600">Total Investment</span>
                                    <span className="font-semibold text-primary">
                                        ${appointments.reduce((sum, a) => sum + a.amount, 0).toFixed(2)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </main>
            
            <Footer />
        </div>
    );
};

export default SeekerDashboard;
