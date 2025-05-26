import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, MapPin } from 'lucide-react';

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

const SeekerDashboard: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [appointments, setAppointments] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Get user data from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    useEffect(() => {
        if (user && (user.id || user.user_id)) {
            setLoading(true);
            const userId = user.id || user.user_id;
            
            console.log(`Fetching appointments for seeker: ${userId}`);
            
            fetch(`http://localhost:8081/api/bookings/seeker/${userId}`)
                .then(res => {
                    console.log(`Seeker bookings response status: ${res.status}`);
                    return res.json();
                })
                .then(data => {
                    console.log("Seeker bookings data:", data);
                    
                    if (data.success && Array.isArray(data.data)) {
                        console.log(`Found ${data.data.length} bookings for seeker`);
                        setAppointments(data.data.filter((a: Booking) => 
                            a.status === 'confirmed' || a.status === 'pending'
                        ));
                    } else if (Array.isArray(data)) {
                        console.log(`Found ${data.length} bookings for seeker (array format)`);
                        setAppointments(data.filter((a: Booking) => 
                            a.status === 'confirmed' || a.status === 'pending'
                        ));
                    } else {
                        console.warn("Invalid booking data format:", data);
                        setAppointments([]);
                    }
                })
                .catch(err => {
                    console.error("Error fetching appointments:", err);
                    setAppointments([]);
                })
                .finally(() => setLoading(false));
        } else {
            console.log("No user data available to fetch appointments");
        }
    }, [user]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Seeker Dashboard</h1>
                <div className="space-x-4">
                    <Button variant="outline" onClick={handleLogout}>Logout</Button>
                </div>
            </div>
            
            <p className="mb-8">Welcome to your dashboard! Here you can manage your profile, view experts, and track your appointments.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Quick Links Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Links</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/profile" className="text-primary hover:underline flex items-center">
                                    <User className="h-4 w-4 mr-2" />
                                    Edit Profile
                                </Link>
                            </li>
                            <li>
                                <Link to="/network" className="text-primary hover:underline flex items-center">
                                    <User className="h-4 w-4 mr-2" />
                                    View Experts
                                </Link>
                            </li>
                            <li>
                                <Link to="/appointment-log" className="text-primary hover:underline flex items-center">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Appointment Log
                                </Link>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
                
                {/* Appointments Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Appointments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p>Loading...</p>
                        ) : appointments.length === 0 ? (
                            <p className="text-muted-foreground">No upcoming appointments.</p>
                        ) : (
                            <ul className="space-y-4">
                                {appointments.slice(0, 3).map((appt) => (
                                    <li key={appt.id} className="border-b pb-2">
                                        <div className="font-semibold">{appt.expert_name}</div>
                                        {appt.expert_designation && (
                                            <div className="text-sm text-muted-foreground">{appt.expert_designation}</div>
                                        )}
                                        {appt.expert_location && (
                                            <div className="flex items-center text-sm text-muted-foreground"><MapPin className="h-4 w-4 mr-1" />{appt.expert_location}</div>
                                        )}
                                        <div className="flex items-center text-sm"><Calendar className="h-4 w-4 mr-1" />{appt.date}</div>
                                        <div className="flex items-center text-sm"><Clock className="h-4 w-4 mr-1" />{appt.start_time} - {appt.end_time}</div>
                                        <div className="mt-1">
                                            <Link to="/appointment-log" className="text-primary hover:underline text-xs">View Details</Link>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
                
                {/* ...other dashboard cards... */}
            </div>
        </div>
    );
};

export default SeekerDashboard;








