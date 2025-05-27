import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '../components/ui/use-toast';

interface Notification {
  id: number;
  type: string;
  message: string;
  related_id: string | null;
  read_status: boolean;
  created_at: string;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserId(parsedUser.user_id || parsedUser.id || null);
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL;
        const response = await fetch(`${API_BASE_URL}/api/notifications/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data);
        } else {
          setError('Failed to load notifications');
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [userId]);

  const markAsRead = async (id: number) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
      });
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, read_status: true } : notif))
      );
      toast({
        title: 'Notification marked as read',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-8 px-4 pt-20 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Notifications</h1>
        {loading ? (
          <p>Loading notifications...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : notifications.length === 0 ? (
          <p>No notifications found.</p>
        ) : (
          notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`mb-4 ${notif.read_status ? 'bg-gray-100' : 'bg-white'}`}
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{notif.type.charAt(0).toUpperCase() + notif.type.slice(1)}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={notif.read_status}
                    onClick={() => markAsRead(notif.id)}
                  >
                    {notif.read_status ? 'Read' : 'Mark as Read'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{notif.message}</CardDescription>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Notifications;
